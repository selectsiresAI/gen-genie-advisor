-- Técnico (role='technician' em user_farms) ganha os mesmos poderes de compartilhamento
-- que 'editor' já tinha: convidar outro usuário para a fazenda (user_farms insert) e
-- criar/gerenciar convites (farm_invites). Rótulo 'technician' é mantido — só a permissão
-- é equiparada a 'editor'. Escrita em females/clients já era liberada pra qualquer membro
-- de user_farms independente da role, então não precisa mudar.

ALTER POLICY "user_farms_owner_insert" ON public.user_farms
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.client_id = user_farms.client_id
      AND uf.user_id = auth.uid()
      AND uf.role = ANY (ARRAY['owner'::text, 'editor'::text, 'technician'::text])
  )
);

ALTER POLICY "farm_invites_owner_insert" ON public.farm_invites
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.client_id = farm_invites.client_id
      AND uf.user_id = auth.uid()
      AND uf.role = ANY (ARRAY['owner'::text, 'editor'::text, 'technician'::text])
  )
);

ALTER POLICY "farm_invites_owner_update" ON public.farm_invites
USING (
  EXISTS (
    SELECT 1 FROM user_farms uf
    WHERE uf.client_id = farm_invites.client_id
      AND uf.user_id = auth.uid()
      AND uf.role = ANY (ARRAY['owner'::text, 'editor'::text, 'technician'::text])
  )
);
