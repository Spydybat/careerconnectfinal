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