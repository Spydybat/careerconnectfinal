-- ============ AUDIT LOGGING ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'info',
  outcome text NOT NULL DEFAULT 'success',
  entity_type text,
  entity_id text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  request_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE INDEX audit_logs_occurred_idx ON public.audit_logs(occurred_at DESC);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs(actor_id, occurred_at DESC);
CREATE INDEX audit_logs_action_idx ON public.audit_logs(action, occurred_at DESC);
CREATE INDEX audit_logs_category_idx ON public.audit_logs(category, occurred_at DESC);
CREATE INDEX audit_logs_company_idx ON public.audit_logs(company_id, occurred_at DESC);

-- ============ PERFORMANCE INDEXES ============
CREATE INDEX IF NOT EXISTS students_college_idx ON public.students(college);
CREATE INDEX IF NOT EXISTS students_grad_year_idx ON public.students(graduation_year);
CREATE INDEX IF NOT EXISTS students_open_to_work_idx ON public.students(open_to_work);

CREATE INDEX IF NOT EXISTS jobs_company_status_idx ON public.jobs(company_id, status);
CREATE INDEX IF NOT EXISTS jobs_created_idx ON public.jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications(status);
CREATE INDEX IF NOT EXISTS applications_applied_idx ON public.applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS applications_student_status_idx ON public.applications(student_id, status);

CREATE INDEX IF NOT EXISTS interviews_application_idx ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS interviews_scheduled_idx ON public.interviews(scheduled_at);

CREATE INDEX IF NOT EXISTS placements_company_idx ON public.placements(company_id);
CREATE INDEX IF NOT EXISTS placements_student_idx ON public.placements(student_id);
CREATE INDEX IF NOT EXISTS placements_date_idx ON public.placements(placement_date DESC);
CREATE INDEX IF NOT EXISTS placements_verification_idx ON public.placements(verification_status);

CREATE INDEX IF NOT EXISTS resumes_student_idx ON public.resumes(student_id);
CREATE INDEX IF NOT EXISTS recruiters_company_idx ON public.recruiters(company_id);
CREATE INDEX IF NOT EXISTS skills_category_idx ON public.skills(category_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_idx ON public.student_skills(skill_id);

-- ============ FUNCTION EXECUTE HARDENING ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_student(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.job_is_mine(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_conversation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_interview_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.student_applied_to_me(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;