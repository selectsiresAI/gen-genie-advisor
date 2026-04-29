-- Add INSERT/DELETE policies on user_farms so owners/editors can share farms
-- Add INSERT/UPDATE policies on farm_invites so owners/editors can invite users

-- USER_FARMS: allow owner/editor of a client to add/remove members
CREATE POLICY "user_farms_owner_insert"
ON public.user_farms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_farms uf
    WHERE uf.client_id = user_farms.client_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner','editor')
  )
);

CREATE POLICY "user_farms_owner_delete"
ON public.user_farms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_farms uf
    WHERE uf.client_id = user_farms.client_id
      AND uf.user_id = auth.uid()
      AND uf.role = 'owner'
  )
  AND user_farms.role <> 'owner'
);

-- FARM_INVITES: allow owner/editor of a client to create/update invites
CREATE POLICY "farm_invites_owner_insert"
ON public.farm_invites
FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.user_farms uf
    WHERE uf.client_id = farm_invites.client_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner','editor')
  )
);

CREATE POLICY "farm_invites_owner_update"
ON public.farm_invites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_farms uf
    WHERE uf.client_id = farm_invites.client_id
      AND uf.user_id = auth.uid()
      AND uf.role IN ('owner','editor')
  )
);
