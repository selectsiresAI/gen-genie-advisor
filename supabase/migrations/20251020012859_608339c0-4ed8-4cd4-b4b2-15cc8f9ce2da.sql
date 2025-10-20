-- Limpar TODOS os vínculos de técnicos existentes
DELETE FROM public.user_farms WHERE role = 'technician';