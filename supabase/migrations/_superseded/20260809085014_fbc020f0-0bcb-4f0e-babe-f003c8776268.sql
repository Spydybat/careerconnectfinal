ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS ats_score integer,
  ADD COLUMN IF NOT EXISTS extracted_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS missing_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS improvements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parent_resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL;

ALTER TABLE public.careers
  ADD COLUMN IF NOT EXISTS learning_path jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, job_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their saved jobs"
ON public.saved_jobs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = saved_jobs.student_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = saved_jobs.student_id AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.student_applied_to_me(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.student_id = _student_id AND j.company_id = public.my_company_id()
  )
$$;

CREATE POLICY "recruiters update own company" ON public.companies
FOR UPDATE TO authenticated
USING (id = public.my_company_id() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (id = public.my_company_id() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "recruiters read company mates" ON public.recruiters
FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND company_id = public.my_company_id());

CREATE POLICY "recruiters read applicant resumes" ON public.resumes
FOR SELECT TO authenticated
USING (public.student_applied_to_me(student_id));

CREATE POLICY "recruiters read applicant education" ON public.education
FOR SELECT TO authenticated
USING (public.student_applied_to_me(student_id));

CREATE POLICY "recruiters read applicant projects" ON public.projects
FOR SELECT TO authenticated
USING (public.student_applied_to_me(student_id));

CREATE POLICY "Users read own resume files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own resume files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own resume files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own resume files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "recruiters read applicant resume files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM public.resumes r
    WHERE r.file_path = storage.objects.name
      AND public.student_applied_to_me(r.student_id)
  )
);