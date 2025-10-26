-- Insert admin role for user f15852e1-c540-4f1a-a716-4611fc2e2dbb
INSERT INTO public.user_roles (user_id, role)
VALUES ('f15852e1-c540-4f1a-a716-4611fc2e2dbb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;