-- Onboarding expansion (international signup): profiles gains phone/country/job_title/
-- role_function, populated from auth signup metadata via handle_new_user(). Naming
-- avoids "role" to not collide with the admin RBAC concept (user_roles.role / app_role).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS role_function text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, country, job_title, role_function)
  VALUES (
    NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'job_title', NEW.raw_user_meta_data->>'role_function'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- create_farm_basic gains optional city/state, written into clients.cidade/clients.estado
-- (columns already existed, unused by this RPC until now).
CREATE OR REPLACE FUNCTION public.create_farm_basic(
  farm_name text, owner_name text, farm_metadata jsonb DEFAULT '{}'::jsonb,
  p_city text DEFAULT NULL, p_state text DEFAULT NULL
)
RETURNS TABLE(farm_id uuid, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_farm_id UUID; current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Usuário não autenticado'::TEXT; RETURN;
  END IF;
  IF farm_name IS NULL OR TRIM(farm_name) = '' THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Nome da fazenda é obrigatório'::TEXT; RETURN;
  END IF;
  IF owner_name IS NULL OR TRIM(owner_name) = '' THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Nome do proprietário é obrigatório'::TEXT; RETURN;
  END IF;
  INSERT INTO public.clients (farm_name, owner_name, nome, metadata, cidade, estado)
  VALUES (TRIM(farm_name), TRIM(owner_name), TRIM(farm_name), COALESCE(farm_metadata, '{}'),
          NULLIF(TRIM(COALESCE(p_city, '')), ''), NULLIF(TRIM(COALESCE(p_state, '')), ''))
  RETURNING id INTO new_farm_id;
  INSERT INTO public.user_farms (user_id, client_id, role)
  VALUES (current_user_id, new_farm_id, 'owner');
  UPDATE public.profiles SET default_farm_id = new_farm_id
  WHERE id = current_user_id AND default_farm_id IS NULL;
  RETURN QUERY SELECT new_farm_id, TRUE, 'Fazenda criada com sucesso'::TEXT;
END; $function$;
