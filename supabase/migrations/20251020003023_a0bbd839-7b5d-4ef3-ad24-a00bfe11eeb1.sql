
-- Adicionar coluna para senha temporária
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS temporary_password text;

-- Função para gerar senha baseada em ssb2025*
CREATE OR REPLACE FUNCTION generate_temp_password(profile_index bigint)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  letters text[] := ARRAY['s', 's', 'b'];
  numbers text[] := ARRAY['2', '0', '2', '5'];
  symbol text := '*';
  pattern_index integer;
  upper_index integer;
  result text;
  idx integer;
BEGIN
  idx := profile_index::integer;
  pattern_index := idx % 6;
  upper_index := idx % 3;
  
  -- Aplicar letra maiúscula
  letters[upper_index + 1] := upper(letters[upper_index + 1]);
  
  -- Diferentes padrões
  CASE pattern_index
    WHEN 0 THEN -- ssb2025*
      result := array_to_string(letters, '') || array_to_string(numbers, '') || symbol;
    WHEN 1 THEN -- 2025ssb*
      result := array_to_string(numbers, '') || array_to_string(letters, '') || symbol;
    WHEN 2 THEN -- s2s0b25*
      result := letters[1] || numbers[1] || letters[2] || numbers[2] || letters[3] || numbers[3] || numbers[4] || symbol;
    WHEN 3 THEN -- *ssb2025
      result := symbol || array_to_string(letters, '') || array_to_string(numbers, '');
    WHEN 4 THEN -- ssb*2025
      result := array_to_string(letters, '') || symbol || array_to_string(numbers, '');
    ELSE -- *5202bss (invertido)
      result := symbol || array_to_string(ARRAY[numbers[4], numbers[3], numbers[2], numbers[1]], '') || 
                array_to_string(ARRAY[letters[3], letters[2], letters[1]], '');
  END CASE;
  
  RETURN result;
END;
$$;

-- Gerar senhas temporárias para profiles existentes com email
WITH numbered_profiles AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as idx
  FROM public.profiles
  WHERE email IS NOT NULL AND email != ''
)
UPDATE public.profiles p
SET temporary_password = generate_temp_password(np.idx)
FROM numbered_profiles np
WHERE p.id = np.id;

-- Comentário na coluna
COMMENT ON COLUMN public.profiles.temporary_password IS 'Senha temporária gerada automaticamente. Usuário deve alterá-la no primeiro login.';
