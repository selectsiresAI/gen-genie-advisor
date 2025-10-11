# Validação de Dados da View females_denorm

## ⚠️ CRÍTICO: Não Exigir created_at/updated_at

### Problema

A view `females_denorm` no Supabase pode retornar campos `created_at` e `updated_at` como **null** mesmo quando esses valores existem na tabela base `females`. Isso ocorre porque:

1. A view é uma agregação de múltiplas tabelas
2. O Postgres pode não propagar corretamente campos de timestamp em views complexas
3. Campos calculados ou derivados podem resultar em nulls

### Solução Implementada

A função `isCompleteFemaleRow` em `src/supabase/queries/females.ts` valida **APENAS** os campos essenciais:

```typescript
export function isCompleteFemaleRow(row: FemaleDenormRow | null | undefined): row is CompleteFemaleDenormRow {
  return Boolean(
    row &&
      row.id &&
      row.name &&
      row.farm_id
  );
}
```

### ❌ NÃO FAÇA ISSO

```typescript
// ERRADO - Isso filtrará incorretamente dados válidos!
export function isCompleteFemaleRow(row: FemaleDenormRow | null | undefined): row is CompleteFemaleDenormRow {
  return Boolean(
    row &&
      row.id &&
      row.name &&
      row.farm_id &&
      row.created_at  // ❌ NÃO ADICIONE ISSO!
  );
}
```

### Por Que Isso Importa

Ao adicionar validação de `created_at`:
- ✅ 242 animais retornados pela view
- ❌ 0 animais exibidos na UI (todos filtrados)
- 🔥 Perda total de dados para o usuário

### Evidência nos Logs

```json
{
  "id": "4087eb0f-a8ec-414f-b4d9-17c985e4cec3",
  "name": "1052",
  "farm_id": "801c075f-0a56-4d4e-8ea7-176090de7d68",
  "created_at": null  // ← Campo null mesmo com dados válidos
}
```

### Regra para Manutenção

**Validar APENAS**:
1. `id` - Identificador único (obrigatório para operações)
2. `name` - Nome do animal (obrigatório para UI)
3. `farm_id` - Vínculo com fazenda (obrigatório para RLS e segurança)

**NUNCA validar**:
- `created_at` - Pode ser null na view
- `updated_at` - Pode ser null na view
- Campos de PTA/índices genéticos - São opcionais por natureza
- Campos de pedigree - Nem todos animais têm pedigree completo

### Como Testar

```bash
# 1. Query direta ao Supabase (deve retornar dados)
curl "https://gzvweejdtycxzxrjplpc.supabase.co/rest/v1/females_denorm?select=id,name,farm_id,created_at&farm_id=eq.801c075f-0a56-4d4e-8ea7-176090de7d68" \
  -H "apikey: YOUR_KEY"

# 2. Verificar console logs na aplicação
# Deve mostrar: "Loaded N females from females_denorm"
# NÃO deve mostrar: "Ignored female rows missing..."
```

### Páginas Afetadas

Esta validação impacta diretamente:
- ✅ **Rebanho** (`src/components/HerdPage.tsx`)
- ✅ **Segmentação** (`src/components/SegmentationPage.tsx`)
- ✅ **Auditoria Genética** (`src/features/auditoria/hooks.ts`)

### Histórico

- **2025-10-11**: Problema identificado - 242 animais retornados mas 0 exibidos
- **2025-10-11**: Correção aplicada - removida validação de `created_at`
- **Resultado**: Dados agora carregam corretamente na UI

### Checklist para Atualizações Futuras

Ao atualizar o schema ou tipos do Supabase:

- [ ] Verificar se `isCompleteFemaleRow` continua validando apenas `id`, `name`, `farm_id`
- [ ] NÃO adicionar validação de campos timestamp
- [ ] Testar com dados reais que ambas páginas carregam
- [ ] Verificar console logs para warnings de "Ignored female rows"
