-- Adicionar política RLS para permitir DELETE em bulls_import_staging
CREATE POLICY "staging_delete_own"
ON bulls_import_staging
FOR DELETE
TO authenticated
USING (uploader_user_id = auth.uid());

-- Adicionar comentário explicativo
COMMENT ON POLICY "staging_delete_own" ON bulls_import_staging IS 
'Permite que usuários deletem seus próprios registros de staging após processamento';