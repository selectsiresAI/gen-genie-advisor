

## Problema

A tabela `bulls` tem 44.062 registros e a view `bulls_denorm` retorna todos eles. Porém, o frontend mostra apenas 998 porque usa `supabase.rpc('get_bulls_denorm')` com `.range()`. O PostgREST aplica um limite padrão de 1.000 linhas nas chamadas RPC, e o `.range()` nem sempre funciona corretamente com RPCs (diferente de queries diretas a views/tabelas).

## Solução

Trocar a chamada de `supabase.rpc('get_bulls_denorm')` por `supabase.from('bulls_denorm')` no `BullSearchPage.tsx`. Queries diretas a views respeitam o `.range()` corretamente, permitindo a paginação real.

### Alteração em `src/components/BullSearchPage.tsx`

Na função `loadBulls`, substituir:
```typescript
const { data: page, error } = await supabase
  .rpc('get_bulls_denorm')
  .order('tpi', { ascending: false })
  .range(from, from + pageSize - 1);
```

Por:
```typescript
const { data: page, error } = await supabase
  .from('bulls_denorm')
  .select('*')
  .order('tpi', { ascending: false })
  .range(from, from + pageSize - 1);
```

Isso é a única mudança necessária. A view `bulls_denorm` já mapeia os nomes de colunas para o formato esperado pelo frontend, e as RLS policies da tabela base `bulls` permitem leitura para usuários autenticados.

