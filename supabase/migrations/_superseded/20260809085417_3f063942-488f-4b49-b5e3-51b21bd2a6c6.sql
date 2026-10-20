-- Revoke public/anon EXECUTE on SECURITY DEFINER helpers; keep them callable by
-- signed-in users because RLS policies invoke them as the current role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_student(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.job_is_mine(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_conversation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_interview_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.student_applied_to_me(uuid) FROM PUBLIC, anon;

-- The signup trigger must never be callable through the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;