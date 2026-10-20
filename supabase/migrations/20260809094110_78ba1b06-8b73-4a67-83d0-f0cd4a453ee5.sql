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