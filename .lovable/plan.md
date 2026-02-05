
# Plano: Adicionar Nome do Touro ao Ranking de Top Parents (Passo 2)

## Objetivo
Mostrar o nome do touro ao lado do código NAAB na lista de ranking, facilitando a identificação visual pelos usuários.

---

## Abordagem Escolhida: Buscar nomes no Frontend

A RPC `ag_top_parents` retorna `parent_label` (código NAAB). Após receber os dados, faremos uma busca adicional na view `bulls_denorm` para enriquecer cada registro com o nome correspondente.

### Vantagens
- Não requer alteração no banco de dados (migrations)
- Implementação mais rápida
- Funciona mesmo se a RPC não puder ser modificada

---

## Mudanças no Arquivo

### `src/features/auditoria/steps/Step2TopParents.tsx`

**1. Atualizar tipo `Row` para incluir nome:**
```typescript
type Row = {
  parent_label: string;
  parent_name: string | null; // ← Novo campo
  daughters_count: number;
  trait_mean: number | null;
};
```

**2. Adicionar função para buscar nomes dos touros:**
```typescript
async function fetchBullNames(naabCodes: string[]): Promise<Map<string, string>> {
  if (naabCodes.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('bulls_denorm')
    .select('code, name')
    .in('code', naabCodes);
  
  if (error || !data) return new Map();
  
  return new Map(data.map(b => [b.code, b.name]));
}
```

**3. Modificar `fetchData` para enriquecer dados:**
```typescript
const fetchData = useCallback(async () => {
  if (!farmId) { ... }
  setLoading(true);
  
  const [sireRaw, mgsRaw] = await Promise.all([fetchTop("sire"), fetchTop("mgs")]);
  
  // Coletar todos os NAABs únicos
  const allNaabs = [...new Set([
    ...sireRaw.map(r => r.parent_label),
    ...mgsRaw.map(r => r.parent_label)
  ])];
  
  // Buscar nomes correspondentes
  const namesMap = await fetchBullNames(allNaabs);
  
  // Enriquecer dados com nomes
  const enrichRow = (row: RawRow): Row => ({
    ...row,
    parent_name: namesMap.get(row.parent_label) || null
  });
  
  setRowsSire(sireRaw.map(enrichRow));
  setRowsMgs(mgsRaw.map(enrichRow));
  setLoading(false);
}, [farmId, fetchTop]);
```

**4. Atualizar `RankingList` para exibir nome:**
```tsx
<div className="w-56 text-right flex-shrink-0">
  <span className="font-medium">{row.parent_label}</span>
  {row.parent_name && (
    <span className="text-xs text-muted-foreground ml-1">
      {row.parent_name}
    </span>
  )}
</div>
```

---

## Resultado Visual

| Antes | Depois |
|-------|--------|
| `007HO15937` | `007HO15937` ALADDIN |
| `551HO03797` | `551HO03797` TARRINO |
| `551HO04034` | `551HO04034` LEGACY |

---

## Layout Alternativo (Duas Linhas)

Se o espaço horizontal for limitado:
```tsx
<div className="w-56 text-right flex-shrink-0">
  <div className="font-medium text-sm">{row.parent_label}</div>
  {row.parent_name && (
    <div className="text-xs text-muted-foreground truncate">
      {row.parent_name}
    </div>
  )}
</div>
```

---

## Notas Técnicas

- A busca de nomes é feita em uma única query para todos os NAABs (eficiente)
- Se o touro não existir no banco, apenas o código NAAB será exibido
- O componente `RankingList` receberá o tipo `Row` atualizado com `parent_name`
- A largura da coluna pode precisar de ajuste (de `w-56` para `w-64` ou `w-72`)
