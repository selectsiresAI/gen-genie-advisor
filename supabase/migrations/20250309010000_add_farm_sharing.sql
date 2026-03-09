-- ============================================================
-- Farm sharing: invites table, RLS policies, auto-accept trigger
-- ============================================================

-- 1. Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS farm_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role farm_role NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_farm_invites_email_status ON farm_invites(invited_email, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_farm_invites_unique_pending
  ON farm_invites(farm_id, invited_email) WHERE status = 'pending';

-- 2. RLS em farm_invites
ALTER TABLE farm_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY farm_invites_select ON farm_invites FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.farm_id = farm_invites.farm_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner', 'editor')
  )
);

CREATE POLICY farm_invites_insert ON farm_invites FOR INSERT WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.farm_id = farm_invites.farm_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner', 'editor')
  )
);

CREATE POLICY farm_invites_update ON farm_invites FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.farm_id = farm_invites.farm_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner', 'editor')
  )
);

-- 3. RLS de INSERT em user_farms: owner/editor pode adicionar membros
CREATE POLICY user_farms_share_insert ON user_farms FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.farm_id = user_farms.farm_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner', 'editor')
  )
);

-- 4. RLS de DELETE em user_farms
CREATE POLICY user_farms_share_delete ON user_farms FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.farm_id = user_farms.farm_id
      AND uf.user_id = auth.uid()
      AND uf.role = 'owner'
  )
  OR (
    EXISTS (
      SELECT 1 FROM user_farms uf
      WHERE uf.farm_id = user_farms.farm_id
        AND uf.user_id = auth.uid()
        AND uf.role = 'editor'
    )
    AND user_farms.role IN ('viewer', 'technician')
  )
);

-- 5. Função para aceitar convites pendentes
CREATE OR REPLACE FUNCTION accept_pending_invites(p_user_id uuid, p_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  accepted_count integer := 0;
  invite record;
BEGIN
  FOR invite IN
    SELECT id, farm_id, role
    FROM farm_invites
    WHERE invited_email = p_email AND status = 'pending'
  LOOP
    INSERT INTO user_farms (user_id, farm_id, role)
    VALUES (p_user_id, invite.farm_id, invite.role)
    ON CONFLICT (user_id, farm_id) DO NOTHING;

    UPDATE farm_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = invite.id;

    accepted_count := accepted_count + 1;
  END LOOP;

  RETURN accepted_count;
END;
$$;

-- 6. Trigger: auto-aceitar convites quando novo usuário é criado
CREATE OR REPLACE FUNCTION trg_accept_invites_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM accept_pending_invites(NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_accept_invites ON auth.users;
CREATE TRIGGER trg_auto_accept_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION trg_accept_invites_on_signup();
