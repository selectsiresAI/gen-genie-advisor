-- 1) Function: claim pending farm invites for a profile
CREATE OR REPLACE FUNCTION public.claim_pending_farm_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_farms (user_id, client_id, role)
  SELECT NEW.id, fi.client_id, fi.role
  FROM public.farm_invites fi
  WHERE fi.status = 'pending'
    AND lower(fi.invited_email) = lower(NEW.email)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_farms uf
      WHERE uf.user_id = NEW.id AND uf.client_id = fi.client_id
    );

  UPDATE public.farm_invites
     SET status = 'accepted', accepted_at = now()
   WHERE status = 'pending'
     AND lower(invited_email) = lower(NEW.email);

  RETURN NEW;
END;
$$;

-- 2) Trigger on profiles insert / email update
DROP TRIGGER IF EXISTS trg_claim_invites_on_profile_insert ON public.profiles;
CREATE TRIGGER trg_claim_invites_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.claim_pending_farm_invites();

DROP TRIGGER IF EXISTS trg_claim_invites_on_profile_email_update ON public.profiles;
CREATE TRIGGER trg_claim_invites_on_profile_email_update
AFTER UPDATE OF email ON public.profiles
FOR EACH ROW
WHEN (NEW.email IS DISTINCT FROM OLD.email)
EXECUTE FUNCTION public.claim_pending_farm_invites();

-- 3) Resolve the currently stuck invite for Thiago
INSERT INTO public.user_farms (user_id, client_id, role)
SELECT p.id, fi.client_id, fi.role
FROM public.farm_invites fi
JOIN public.profiles p ON lower(p.email) = lower(fi.invited_email)
WHERE fi.status = 'pending'
  AND lower(fi.invited_email) = 'thiago.castro@selectsires.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_farms uf
    WHERE uf.user_id = p.id AND uf.client_id = fi.client_id
  );

UPDATE public.farm_invites
   SET status = 'accepted', accepted_at = now()
 WHERE status = 'pending'
   AND lower(invited_email) = 'thiago.castro@selectsires.com.br';