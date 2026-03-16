

## Problema

O frontend não abre porque a reconexão do Supabase regenerou `src/integrations/supabase/client.ts` e `src/integrations/supabase/types.ts`, causando ~20 erros de build. Duas categorias principais:

### 1. Exports removidos do client.ts
O arquivo regenerado exporta apenas `supabase`, mas o código importa:
- `supabaseAnonKey` e `getImportBullsFunctionUrlCandidates` (em `BullSearchPage.tsx`)
- `supabaseUrl` (em `src/lib/edge.ts`)

### 2. Types.ts dessincronizado com o código
O schema gerado não inclui todas as tabelas/colunas/RPCs que o código referencia:
- `bulls_denorm` falta `sire_name`, `mgs_name`, `mmgs_name`
- Tabelas ausentes do types: `app.economic_values`, `admin_notes`
- RPCs ausentes: `admin_ticket_stats`, `ag_im5_bull_value`
- `support_tickets` insert falta `email`/`name`
- `support_ticket_responses` → `profiles` relation não encontrada
- `Nexus2PredictionBatch` referencia `client_id` e colunas extras em `bulls_denorm`

### Plano de correção

**Arquivo 1: `src/integrations/supabase/client.ts`**
Adicionar os exports que faltam (sem editar a parte auto-gerada, apenas acrescentar ao final):
```ts
export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_PUBLISHABLE_KEY;

export function getImportBullsFunctionUrlCandidates() {
  return [`${SUPABASE_URL}/functions/v1/import-bulls`];
}
```

**Arquivo 2: `src/lib/edge.ts`**
Já vai funcionar com o export de `supabaseUrl` acima.

**Arquivo 3: `src/components/BullSearchPage.tsx`** (linhas 578-580)
Adicionar `as any` cast ao bull para contornar campos ausentes do type gerado, ou acessar via indexação dinâmica.

**Arquivo 4: `src/hooks/useHasRole.ts`** (linha 77)
Cast `functionName as any` para contornar o tipo estrito da RPC.

**Arquivo 5: `src/components/ShareFarmDialog.tsx`** (linhas 140, 154)
Cast os objetos de insert `as any` para contornar discrepâncias de tipo.

**Arquivo 6: `src/components/admin/SupportTicketDetail.tsx`** (linha 70)
Cast `as any` no resultado da query com join de profiles.

**Arquivo 7: `src/components/nexus2/Nexus2PredictionBatch.tsx`** (linhas 258, 600)
Cast `as any` nos objetos que referenciam colunas ausentes.

**Arquivo 8: `src/components/plano-genetico/IM5Configurator.tsx`** (linha 61-62)
Cast table name `as any`.

**Arquivo 9: `src/components/plano-genetico/IM5Results.tsx`** (linha 47)
Cast RPC name `as any`.

**Arquivo 10: `src/components/support/UserSupportTickets.tsx`** (linha 261)
Cast insert object `as any`.

**Arquivo 11: `src/features/auditoria/steps/Step8Benchmark.tsx`** (linhas 57, 62, 163)
Cast table name e valores `as any`.

**Arquivo 12: `src/hooks/usePlanBulls.ts`** (linha 37)
Cast query `as any` para evitar deep instantiation.

**Arquivo 13: `src/pages/admin/AdminDashboard.tsx`** (linhas 79, 88, 252-253)
Cast RPC name e insert `as any`.

### Resumo
São ~13 arquivos com correções de tipo (`as any` casts) para contornar a dessincronização entre o types.ts gerado e o código existente, mais a restauração dos exports removidos do client.ts. Isso desbloqueará o build imediatamente.

