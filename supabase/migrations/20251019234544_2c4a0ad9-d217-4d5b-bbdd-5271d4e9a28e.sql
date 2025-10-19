-- Tornar daniel.moreira admin temporariamente para executar a migração
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'daniel.moreira@selectsires.com.br';