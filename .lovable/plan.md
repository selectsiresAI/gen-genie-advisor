

# Plano: Corrigir 6 Erros e 8 Warnings de Seguranca

## Resumo dos Problemas Encontrados

### ERROS (6)
1. **admin_temp_passwords** - View sem `security_invoker`, expoe senhas temporarias
2. **ag_pta_tables_no_rls** - Views/tabelas de analytics sem protecao RLS
3. **password_reset_log** - Tabela de log de senhas sem RLS
4. **Security Definer Views** (2 instancias no linter) - Views sem `security_invoker=on`
5. **jspdf vulnerabilidade critica** - Dependencia com CVE conhecida
6. **function_search_path_mutable** - Ja ignorado (funcoes C de extensao fuzzystrmatch)

### WARNINGS (8 - nao ignorados)
1. **admin_role_on_profiles** - is_admin no profiles (remediacao dificil, adiar)
2. **console_logs_sensitive_data** - console.error expoe dados sensiveis
3. **genetic_records_no_delete_policy** - Falta DELETE policy
4. **RLS Policy Always True** (3 instancias) - INSERT com `WITH CHECK (true)` em clients, satisfaction_surveys, support_tickets
5. **RLS Enabled No Policy** - Tabela(s) com RLS ativado mas sem policies

---

## Etapa 1: Migration SQL - Corrigir Views e RLS

Uma unica migration para:

### 1.1 Converter views para SECURITY INVOKER
Views sem `security_invoker=on`:
- `admin_temp_passwords`
- `ag_pta_media_anual`
- `ag_pta_ponderada_anual`
- `farm_technicians`
- `females_public_by_farm_view`
- `user_engagement_metrics`
- `v_map_orders`

```sql
ALTER VIEW admin_temp_passwords SET (security_invoker = on);
ALTER VIEW ag_pta_media_anual SET (security_invoker = on);
ALTER VIEW ag_pta_ponderada_anual SET (security_invoker = on);
ALTER VIEW farm_technicians SET (security_invoker = on);
ALTER VIEW females_public_by_farm_view SET (security_invoker = on);
ALTER VIEW user_engagement_metrics SET (security_invoker = on);
ALTER VIEW v_map_orders SET (security_invoker = on);
```

### 1.2 Ativar RLS em tabelas expostas

```sql
-- password_reset_log - apenas admins podem ler
ALTER TABLE password_reset_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_reset_log" ON password_reset_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_reset_log" ON password_reset_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- audit_step3_pta_yearly - farm membership
ALTER TABLE audit_step3_pta_yearly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farm_members_read" ON audit_step3_pta_yearly
  FOR SELECT USING (public.is_farm_member(farm_id));
CREATE POLICY "farm_editors_write" ON audit_step3_pta_yearly
  FOR INSERT WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "farm_editors_update" ON audit_step3_pta_yearly
  FOR UPDATE USING (public.is_farm_member(farm_id));
```

### 1.3 Adicionar DELETE policy em genetic_records

```sql
CREATE POLICY "genrec_delete" ON genetic_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_farms uf
      WHERE uf.user_id = auth.uid()
        AND uf.farm_id = genetic_records.herd_id
        AND uf.role IN ('owner', 'editor')
    )
  );
```

### 1.4 Corrigir INSERT policies com `WITH CHECK (true)`

```sql
-- clients: restringir insert a usuarios autenticados (ja esta, mas precisa check)
DROP POLICY "clients_insert_any" ON clients;
CREATE POLICY "clients_insert_authenticated" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (true);
-- Nota: clients nao tem user_id, entao manter true mas restringir ao role authenticated

-- satisfaction_surveys: remover policy duplicada permissiva
DROP POLICY "Users can create satisfaction surveys" ON satisfaction_surveys;
-- Manter apenas "Usuarios podem criar avaliacoes" que ja tem check correto

-- support_tickets: restringir insert
DROP POLICY "tickets_insert_policy" ON support_tickets;
CREATE POLICY "tickets_insert_authenticated" ON support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
```

### 1.5 Corrigir funcoes com search_path incluindo 'auth'

As 4 funcoes (`can_access_farm`, `is_farm_editor`, `is_farm_member`, `is_farm_owner`) ja tem `SET search_path TO 'public', 'auth'`. O linter exige apenas `public`. Porem, precisam de `auth` para `auth.uid()`. Vamos alterar para usar apenas `public` e qualificar as chamadas:

```sql
ALTER FUNCTION can_access_farm(uuid) SET search_path = public;
ALTER FUNCTION is_farm_editor(uuid) SET search_path = public;
ALTER FUNCTION is_farm_member(uuid) SET search_path = public;
ALTER FUNCTION is_farm_owner(uuid) SET search_path = public;
```

---

## Etapa 2: Atualizar jspdf

Atualizar `jspdf` para a versao mais recente que corrige a vulnerabilidade de Path Traversal (GHSA-f8cm-6447-x5h2).

---

## Etapa 3: Reduzir console.error em producao

No `AuthPage.tsx`, substituir `console.error` detalhado por mensagens genericas em producao.

---

## Etapa 4: Atualizar findings de seguranca

Marcar como resolvidos os findings corrigidos e atualizar os que nao podem ser corrigidos neste momento (como `admin_role_on_profiles`).

---

## Impacto

- **Views**: Passarao a usar as permissoes do usuario que consulta (nao do criador da view)
- **Tabelas**: password_reset_log e audit_step3_pta_yearly terao acesso restrito
- **Funcionalidade**: Nenhuma quebra esperada, pois as views ja sao acessadas via funcoes RPC que verificam permissoes
- **Console**: Menos dados sensiveis expostos no navegador

