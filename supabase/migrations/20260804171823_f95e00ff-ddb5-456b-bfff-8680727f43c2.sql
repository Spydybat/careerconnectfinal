-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('student','recruiter','placement_officer','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('placement_officer','admin'))
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  headline text,
  location text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'recruiter'));
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role,'student'))
  ON CONFLICT DO NOTHING;
  IF COALESCE(NEW.raw_user_meta_data->>'role','student') = 'student' THEN
    INSERT INTO public.students (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

-- ============ REFERENCE / CAREER DOMAIN ============
CREATE TABLE public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.skill_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  summary text NOT NULL DEFAULT '',
  description text,
  avg_salary_min integer,
  avg_salary_max integer,
  demand_score integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.career_skills (
  career_id uuid NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  importance smallint NOT NULL DEFAULT 3,
  PRIMARY KEY (career_id, skill_id)
);
GRANT SELECT ON public.skill_categories, public.skills, public.careers, public.career_skills TO authenticated, anon;
GRANT ALL ON public.skill_categories, public.skills, public.careers, public.career_skills TO service_role;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.skill_categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public read skills" ON public.skills FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public read careers" ON public.careers FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "public read career skills" ON public.career_skills FOR SELECT TO authenticated, anon USING (true);

-- ============ STUDENT DOMAIN ============
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  college text,
  degree text,
  branch text,
  graduation_year integer,
  cgpa numeric(4,2),
  about text,
  target_career_id uuid REFERENCES public.careers(id) ON DELETE SET NULL,
  open_to_work boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students self read" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'recruiter'));
CREATE POLICY "students self insert" ON public.students FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "students self update" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  tech_stack text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.student_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency smallint NOT NULL DEFAULT 3,
  source text NOT NULL DEFAULT 'self',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education, public.projects, public.student_skills TO authenticated;
GRANT ALL ON public.education, public.projects, public.student_skills TO service_role;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.students s WHERE s.id = _student_id AND s.user_id = auth.uid())
$$;

CREATE POLICY "education owner" ON public.education FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));
CREATE POLICY "education staff read" ON public.education FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "projects owner" ON public.projects FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));
CREATE POLICY "projects staff read" ON public.projects FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "student skills owner" ON public.student_skills FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));
CREATE POLICY "student skills staff read" ON public.student_skills FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'recruiter'));

-- ============ RESUME DOMAIN ============
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Resume',
  file_path text,
  raw_text text,
  version integer NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  ai_score integer,
  ai_summary text,
  ai_recommendations jsonb,
  analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes owner" ON public.resumes FOR ALL TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));
CREATE POLICY "resumes staff read" ON public.resumes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER resumes_updated BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMPANY DOMAIN ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  industry text,
  website text,
  logo_url text,
  description text,
  headquarters text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO authenticated, anon;
GRANT INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read companies" ON public.companies FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "recruiters create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  job_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.recruiters TO authenticated;
GRANT ALL ON public.recruiters TO service_role;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recruiter self" ON public.recruiters FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "recruiter staff read" ON public.recruiters FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.recruiters WHERE user_id = auth.uid() LIMIT 1
$$;

-- ============ JOB DOMAIN ============
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text,
  employment_type text NOT NULL DEFAULT 'full_time',
  experience_level text NOT NULL DEFAULT 'entry',
  work_mode text NOT NULL DEFAULT 'onsite',
  salary_min integer,
  salary_max integer,
  openings integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',
  closes_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_company_idx ON public.jobs(company_id);
CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE TABLE public.job_skills (
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  importance smallint NOT NULL DEFAULT 3,
  PRIMARY KEY (job_id, skill_id)
);
GRANT SELECT ON public.jobs, public.job_skills TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.jobs, public.job_skills TO authenticated;
GRANT ALL ON public.jobs, public.job_skills TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read open jobs" ON public.jobs FOR SELECT TO authenticated, anon USING (status = 'open' OR company_id = public.my_company_id() OR public.is_staff(auth.uid()));
CREATE POLICY "recruiters manage own jobs" ON public.jobs FOR ALL TO authenticated USING (company_id = public.my_company_id()) WITH CHECK (company_id = public.my_company_id());
CREATE POLICY "public read job skills" ON public.job_skills FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "recruiters manage job skills" ON public.job_skills FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.company_id = public.my_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.company_id = public.my_company_id()));
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RECRUITMENT DOMAIN ============
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'applied',
  cover_note text,
  match_score integer,
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, student_id)
);
CREATE INDEX applications_student_idx ON public.applications(student_id);
CREATE INDEX applications_job_idx ON public.applications(job_id);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.job_is_mine(_job_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.company_id = public.my_company_id())
$$;

CREATE POLICY "applications student read" ON public.applications FOR SELECT TO authenticated
  USING (public.owns_student(student_id) OR public.job_is_mine(job_id) OR public.is_staff(auth.uid()));
CREATE POLICY "applications student insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (public.owns_student(student_id));
CREATE POLICY "applications student update" ON public.applications FOR UPDATE TO authenticated USING (public.owns_student(student_id)) WITH CHECK (public.owns_student(student_id));
CREATE POLICY "applications recruiter update" ON public.applications FOR UPDATE TO authenticated USING (public.job_is_mine(job_id)) WITH CHECK (public.job_is_mine(job_id));
CREATE TRIGGER applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_events TO authenticated;
GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events visible with application" ON public.application_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (public.owns_student(a.student_id) OR public.job_is_mine(a.job_id) OR public.is_staff(auth.uid()))));
CREATE POLICY "events insert by participants" ON public.application_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (public.owns_student(a.student_id) OR public.job_is_mine(a.job_id))));

CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  round_name text NOT NULL DEFAULT 'Round 1',
  scheduled_at timestamptz,
  mode text NOT NULL DEFAULT 'online',
  status text NOT NULL DEFAULT 'scheduled',
  feedback text,
  rating smallint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interviews visible with application" ON public.interviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (public.owns_student(a.student_id) OR public.job_is_mine(a.job_id) OR public.is_staff(auth.uid()))));
CREATE POLICY "interviews recruiter manage" ON public.interviews FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND public.job_is_mine(a.job_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND public.job_is_mine(a.job_id)));

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  ctc integer,
  role_title text,
  joining_date date,
  status text NOT NULL DEFAULT 'extended',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers visible with application" ON public.offers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (public.owns_student(a.student_id) OR public.job_is_mine(a.job_id) OR public.is_staff(auth.uid()))));
CREATE POLICY "offers recruiter manage" ON public.offers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND public.job_is_mine(a.job_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND public.job_is_mine(a.job_id)));

-- ============ PLACEMENT DOMAIN ============
CREATE TABLE public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  role_title text NOT NULL,
  ctc integer,
  placement_date date NOT NULL DEFAULT current_date,
  academic_year text,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.placements TO authenticated;
GRANT ALL ON public.placements TO service_role;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placements read" ON public.placements FOR SELECT TO authenticated USING (public.owns_student(student_id) OR public.is_staff(auth.uid()));
CREATE POLICY "placements staff manage" ON public.placements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ SEED REFERENCE DATA ============
INSERT INTO public.skill_categories (name) VALUES
 ('Programming'),('Frontend'),('Backend'),('Data'),('Cloud & DevOps'),('AI & ML'),('Professional');

INSERT INTO public.skills (name, slug, category_id) VALUES
 ('Python','python',(SELECT id FROM public.skill_categories WHERE name='Programming')),
 ('JavaScript','javascript',(SELECT id FROM public.skill_categories WHERE name='Programming')),
 ('TypeScript','typescript',(SELECT id FROM public.skill_categories WHERE name='Programming')),
 ('Java','java',(SELECT id FROM public.skill_categories WHERE name='Programming')),
 ('C++','cpp',(SELECT id FROM public.skill_categories WHERE name='Programming')),
 ('React','react',(SELECT id FROM public.skill_categories WHERE name='Frontend')),
 ('Next.js','nextjs',(SELECT id FROM public.skill_categories WHERE name='Frontend')),
 ('HTML & CSS','html-css',(SELECT id FROM public.skill_categories WHERE name='Frontend')),
 ('Tailwind CSS','tailwind',(SELECT id FROM public.skill_categories WHERE name='Frontend')),
 ('Node.js','nodejs',(SELECT id FROM public.skill_categories WHERE name='Backend')),
 ('REST APIs','rest-apis',(SELECT id FROM public.skill_categories WHERE name='Backend')),
 ('PostgreSQL','postgresql',(SELECT id FROM public.skill_categories WHERE name='Backend')),
 ('MongoDB','mongodb',(SELECT id FROM public.skill_categories WHERE name='Backend')),
 ('SQL','sql',(SELECT id FROM public.skill_categories WHERE name='Data')),
 ('Data Modelling','data-modelling',(SELECT id FROM public.skill_categories WHERE name='Data')),
 ('ETL','etl',(SELECT id FROM public.skill_categories WHERE name='Data')),
 ('Power BI','power-bi',(SELECT id FROM public.skill_categories WHERE name='Data')),
 ('Apache Airflow','airflow',(SELECT id FROM public.skill_categories WHERE name='Data')),
 ('AWS','aws',(SELECT id FROM public.skill_categories WHERE name='Cloud & DevOps')),
 ('Docker','docker',(SELECT id FROM public.skill_categories WHERE name='Cloud & DevOps')),
 ('Kubernetes','kubernetes',(SELECT id FROM public.skill_categories WHERE name='Cloud & DevOps')),
 ('CI/CD','ci-cd',(SELECT id FROM public.skill_categories WHERE name='Cloud & DevOps')),
 ('Machine Learning','machine-learning',(SELECT id FROM public.skill_categories WHERE name='AI & ML')),
 ('Deep Learning','deep-learning',(SELECT id FROM public.skill_categories WHERE name='AI & ML')),
 ('NLP','nlp',(SELECT id FROM public.skill_categories WHERE name='AI & ML')),
 ('Pandas','pandas',(SELECT id FROM public.skill_categories WHERE name='AI & ML')),
 ('Statistics','statistics',(SELECT id FROM public.skill_categories WHERE name='AI & ML')),
 ('Communication','communication',(SELECT id FROM public.skill_categories WHERE name='Professional')),
 ('Problem Solving','problem-solving',(SELECT id FROM public.skill_categories WHERE name='Professional')),
 ('System Design','system-design',(SELECT id FROM public.skill_categories WHERE name='Professional'));

INSERT INTO public.careers (title, slug, summary, description, avg_salary_min, avg_salary_max, demand_score) VALUES
 ('Frontend Engineer','frontend-engineer','Build accessible, high-performance user interfaces for web products.','Frontend engineers own the user-facing layer: component architecture, state management, accessibility and performance.',600000,2200000,84),
 ('Backend Engineer','backend-engineer','Design APIs, data models and services that power products at scale.','Backend engineers build reliable services, model data and own reliability, security and performance of APIs.',700000,2600000,88),
 ('Full Stack Engineer','full-stack-engineer','Ship end-to-end features across UI, API and database.','Full stack engineers move across the whole product surface and are highly valued in early-stage teams.',650000,2400000,86),
 ('Data Engineer','data-engineer','Build pipelines and warehouses that make data usable and trustworthy.','Data engineers own ingestion, transformation, data quality and the analytical warehouse layer.',800000,2800000,90),
 ('Data Analyst','data-analyst','Turn raw data into decisions with SQL, dashboards and storytelling.','Data analysts define metrics, build dashboards and answer business questions with data.',500000,1600000,78),
 ('Machine Learning Engineer','machine-learning-engineer','Train, evaluate and deploy models into production systems.','ML engineers combine software engineering with modelling to ship intelligent features.',900000,3200000,87),
 ('DevOps Engineer','devops-engineer','Automate delivery, infrastructure and reliability.','DevOps engineers own CI/CD, infrastructure as code, observability and deployment safety.',750000,2500000,82),
 ('Business Intelligence Analyst','bi-analyst','Own the semantic layer and executive reporting.','BI analysts translate warehouse models into governed metrics and executive dashboards.',550000,1800000,74);

INSERT INTO public.career_skills (career_id, skill_id, importance)
SELECT c.id, s.id, v.importance FROM (VALUES
 ('frontend-engineer','javascript',5),('frontend-engineer','typescript',5),('frontend-engineer','react',5),('frontend-engineer','html-css',4),('frontend-engineer','tailwind',3),('frontend-engineer','problem-solving',4),
 ('backend-engineer','nodejs',5),('backend-engineer','rest-apis',5),('backend-engineer','postgresql',5),('backend-engineer','system-design',4),('backend-engineer','docker',3),('backend-engineer','java',3),
 ('full-stack-engineer','react',5),('full-stack-engineer','nodejs',5),('full-stack-engineer','typescript',4),('full-stack-engineer','postgresql',4),('full-stack-engineer','rest-apis',4),
 ('data-engineer','python',5),('data-engineer','sql',5),('data-engineer','etl',5),('data-engineer','airflow',4),('data-engineer','data-modelling',4),('data-engineer','aws',3),
 ('data-analyst','sql',5),('data-analyst','power-bi',4),('data-analyst','statistics',4),('data-analyst','pandas',3),('data-analyst','communication',4),
 ('machine-learning-engineer','python',5),('machine-learning-engineer','machine-learning',5),('machine-learning-engineer','deep-learning',4),('machine-learning-engineer','nlp',3),('machine-learning-engineer','statistics',4),('machine-learning-engineer','docker',3),
 ('devops-engineer','docker',5),('devops-engineer','kubernetes',4),('devops-engineer','ci-cd',5),('devops-engineer','aws',5),('devops-engineer','problem-solving',3),
 ('bi-analyst','sql',5),('bi-analyst','power-bi',5),('bi-analyst','data-modelling',4),('bi-analyst','communication',4)
) AS v(career_slug, skill_slug, importance)
JOIN public.careers c ON c.slug = v.career_slug
JOIN public.skills s ON s.slug = v.skill_slug;

INSERT INTO public.companies (name, slug, industry, website, headquarters, description) VALUES
 ('Northwind Technologies','northwind-technologies','Software Products','https://northwind.example.com','Bengaluru, India','Product engineering company building developer tooling for global teams.'),
 ('Vertex Analytics','vertex-analytics','Data & Analytics','https://vertex.example.com','Hyderabad, India','Analytics consultancy delivering warehouses and BI platforms for enterprises.'),
 ('Skyline Cloud Labs','skyline-cloud-labs','Cloud Infrastructure','https://skyline.example.com','Pune, India','Cloud-native infrastructure and platform engineering services.'),
 ('Meridian FinTech','meridian-fintech','Financial Services','https://meridian.example.com','Mumbai, India','Digital lending and payments platform serving 4M+ customers.'),
 ('Aurora AI','aurora-ai','Artificial Intelligence','https://aurora.example.com','Chennai, India','Applied AI studio building document intelligence products.');

INSERT INTO public.jobs (company_id, title, description, location, employment_type, experience_level, work_mode, salary_min, salary_max, openings, status) VALUES
 ((SELECT id FROM public.companies WHERE slug='northwind-technologies'),'Frontend Engineer (Graduate)','Join the product UI team building our design system and customer dashboards in React and TypeScript. You will pair with senior engineers, ship weekly and own accessibility.','Bengaluru, India','full_time','entry','hybrid',800000,1200000,4,'open'),
 ((SELECT id FROM public.companies WHERE slug='northwind-technologies'),'Backend Engineer I','Design and ship REST APIs on Node.js and PostgreSQL. Own service reliability, schema design and performance for a product used by thousands of teams.','Bengaluru, India','full_time','entry','onsite',900000,1400000,3,'open'),
 ((SELECT id FROM public.companies WHERE slug='vertex-analytics'),'Data Engineer Trainee','Build ingestion pipelines, transformations and data quality checks feeding an enterprise warehouse. Python and SQL heavy role with strong mentorship.','Hyderabad, India','full_time','entry','onsite',700000,1100000,6,'open'),
 ((SELECT id FROM public.companies WHERE slug='vertex-analytics'),'Business Intelligence Analyst','Own metric definitions and executive dashboards. Work directly with client stakeholders to translate questions into governed reporting.','Remote','full_time','entry','remote',600000,950000,2,'open'),
 ((SELECT id FROM public.companies WHERE slug='skyline-cloud-labs'),'DevOps Engineer (Junior)','Automate delivery pipelines, containerize services and improve observability across customer platforms.','Pune, India','full_time','entry','hybrid',850000,1300000,2,'open'),
 ((SELECT id FROM public.companies WHERE slug='meridian-fintech'),'Full Stack Engineer','Ship end-to-end features across our lending platform — React frontends, Node services and PostgreSQL data models.','Mumbai, India','full_time','mid','hybrid',1400000,2100000,3,'open'),
 ((SELECT id FROM public.companies WHERE slug='meridian-fintech'),'Data Analyst Intern','Six-month internship analysing customer funnels and building SQL-backed dashboards for product teams.','Mumbai, India','internship','entry','onsite',300000,420000,5,'open'),
 ((SELECT id FROM public.companies WHERE slug='aurora-ai'),'Machine Learning Engineer','Train and deploy document understanding models. Strong Python, ML fundamentals and a bias for evaluation.','Chennai, India','full_time','mid','remote',1600000,2600000,2,'open'),
 ((SELECT id FROM public.companies WHERE slug='aurora-ai'),'NLP Research Intern','Work on information extraction from resumes and job descriptions. Publish internal evaluation reports.','Remote','internship','entry','remote',360000,480000,3,'open');

INSERT INTO public.job_skills (job_id, skill_id, importance)
SELECT j.id, s.id, v.importance FROM (VALUES
 ('Frontend Engineer (Graduate)','react',5),('Frontend Engineer (Graduate)','typescript',4),('Frontend Engineer (Graduate)','html-css',4),('Frontend Engineer (Graduate)','tailwind',3),
 ('Backend Engineer I','nodejs',5),('Backend Engineer I','postgresql',5),('Backend Engineer I','rest-apis',4),('Backend Engineer I','docker',3),
 ('Data Engineer Trainee','python',5),('Data Engineer Trainee','sql',5),('Data Engineer Trainee','etl',4),('Data Engineer Trainee','airflow',3),
 ('Business Intelligence Analyst','sql',5),('Business Intelligence Analyst','power-bi',5),('Business Intelligence Analyst','data-modelling',3),
 ('DevOps Engineer (Junior)','docker',5),('DevOps Engineer (Junior)','ci-cd',4),('DevOps Engineer (Junior)','aws',4),('DevOps Engineer (Junior)','kubernetes',3),
 ('Full Stack Engineer','react',5),('Full Stack Engineer','nodejs',5),('Full Stack Engineer','postgresql',4),('Full Stack Engineer','typescript',4),
 ('Data Analyst Intern','sql',5),('Data Analyst Intern','statistics',3),('Data Analyst Intern','power-bi',3),
 ('Machine Learning Engineer','python',5),('Machine Learning Engineer','machine-learning',5),('Machine Learning Engineer','deep-learning',4),('Machine Learning Engineer','docker',3),
 ('NLP Research Intern','python',5),('NLP Research Intern','nlp',5),('NLP Research Intern','pandas',3)
) AS v(job_title, skill_slug, importance)
JOIN public.jobs j ON j.title = v.job_title
JOIN public.skills s ON s.slug = v.skill_slug;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();