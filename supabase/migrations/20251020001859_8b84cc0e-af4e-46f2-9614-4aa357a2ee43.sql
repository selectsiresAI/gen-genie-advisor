
-- Atualizar emails de profiles que têm match único no staging
-- e cujo email ainda não está em uso
WITH profile_email_match AS (
  SELECT 
    p.id as profile_id,
    MIN(sp.email) as new_email
  FROM profiles p
  JOIN staging_profiles sp ON sp.full_name = p.full_name
  WHERE (p.email IS NULL OR p.email = '')
    AND sp.imported_at IS NOT NULL
    AND sp.email IS NOT NULL
    AND sp.email != ''
  GROUP BY p.id
  HAVING COUNT(DISTINCT sp.email) = 1  -- Apenas casos com email único
)
UPDATE public.profiles p
SET email = pem.new_email
FROM profile_email_match pem
WHERE p.id = pem.profile_id
  AND NOT EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.email = pem.new_email
  );

-- Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as profiles_com_email,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '') as profiles_sem_email,
  COUNT(*) as total_profiles
FROM profiles;
