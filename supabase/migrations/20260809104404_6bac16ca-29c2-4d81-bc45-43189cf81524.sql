DELETE FROM public.user_roles
WHERE role = 'admin'::public.app_role
  AND user_id IN (SELECT id FROM auth.users WHERE email LIKE 'placement%@example.com');