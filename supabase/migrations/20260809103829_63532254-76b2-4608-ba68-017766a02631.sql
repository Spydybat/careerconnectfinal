INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'admin.gate@careerconnect.test'
ON CONFLICT DO NOTHING;