# Conflito em `Step9Distribuicao.tsx`

## Versão do branch atual (`work`)
O arquivo atual passou a:

- Normalizar a lista de PTAs disponíveis e garantir que `hhp_dollar` seja a PTA principal quando estiver disponível, sincronizando a seleção local com o estado global do filtro.【F:src/features/auditoria-genetica/steps/Step9Distribuicao.tsx†L29-L107】
- Consultar o histograma diretamente na função RPC `ag_trait_histogram` do Supabase, em vez de calcular os buckets no cliente.【F:src/features/auditoria-genetica/steps/Step9Distribuicao.tsx†L109-L158】
- Renderizar selects extras para escolher/remover PTAs e mostrar `loading` enquanto o histograma não chega.【F:src/features/auditoria-genetica/steps/Step9Distribuicao.tsx†L175-L238】

## Versão anterior (`a31ad5b`)
A versão merge-base calculava tudo localmente com base nas fêmeas carregadas via hook, como mostrado abaixo:

```tsx
function buildBuckets(values: number[], bucketCount: number) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [
      {
        range: `${min.toFixed(1)}`,
        count: values.length,
        percentage: 100,
      },
    ];
  }
  const size = (max - min) / bucketCount;
  const result = Array.from({ length: bucketCount }, (_, index) => ({
    range: `${(min + index * size).toFixed(1)} - ${(min + (index + 1) * size).toFixed(1)}`,
    count: 0,
    percentage: 0,
  }));
  values.forEach((value) => {
    const bucketIndex = Math.min(Math.floor((value - min) / size), bucketCount - 1);
    result[bucketIndex].count++;
  });
  result.forEach((bucket) => {
    bucket.percentage = (bucket.count / values.length) * 100;
  });
  return result;
}

const { farmId, ptasSelecionadas } = useAGFilters();
const { data: females = [] } = useFemales(farmId);
const series = useMemo(() => {
  const output: Record<string, Array<{ range: string; count: number; percentage: number }>> = {};
  ptasSelecionadas.forEach((key) => {
    const values = females
      .map((female: any) => Number(female?.[key]))
      .filter((value: number) => Number.isFinite(value));
    output[key] = buildBuckets(values, bucketCount);
  });
  return output;
}, [ptasSelecionadas, females, bucketCount]);
```

## Onde o conflito aparece
Ao tentar mesclar as duas histórias, os blocos acima entram em conflito direto, porque a versão atual removeu `useFemales`, `buildBuckets` e `series` calculado no cliente, substituindo tudo pela busca assíncrona no Supabase e pelos novos controles de seleção. A resolução exige decidir se os dados devem continuar vindo do hook local ou se devem ser buscados via RPC e qual UX de seleção de PTA deve permanecer.
