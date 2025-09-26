# Trend Chart Data Fix Reference

A correção que garante a exibição dos dados do rebanho selecionado no gráfico de Tendência está concentrada na geração do `processedTrendData` dentro do componente `ChartsPage`.

O trecho chave encontra-se em [`src/components/ChartsPage.tsx`](../src/components/ChartsPage.tsx) nas linhas 251-304, logo abaixo do comentário `// Processar dados para gráficos de tendência - VERSÃO DEFENSIVA`. Ele reconstrói as séries anuais a partir do ano real de nascimento das fêmeas carregadas e calcula as médias por PTA apenas com valores numéricos válidos.

```tsx
const processedTrendData = useMemo(() => {
  if (!females || !Array.isArray(females) || females.length === 0) return [];

  let processedData: any[] = [];

  if (groupBy === 'year') {
    const byYear = new Map<number, {
      year: number;
      count: number;
      perPta: Record<string, { sum: number; count: number }>;
    }>();

    females.forEach((female) => {
      if (!female) return;

      const birthYear = coerceYear(
        female.birth_date ? new Date(female.birth_date).getFullYear() : null
      );
      if (birthYear === null) return;

      if (!byYear.has(birthYear)) {
        byYear.set(birthYear, { year: birthYear, count: 0, perPta: {} });
      }

      const yearData = byYear.get(birthYear)!;
      yearData.count += 1;

      selectedPTAs.forEach((pta) => {
        const value = pickNumber(female, [pta], NaN);
        if (!Number.isFinite(value)) return;

        if (!yearData.perPta[pta]) {
          yearData.perPta[pta] = { sum: 0, count: 0 };
        }

        yearData.perPta[pta].sum += value;
        yearData.perPta[pta].count += 1;
      });
    });

    const sortedEntries = Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, entry]) => entry);

    processedData = sortedEntries
      .map((entry) => {
        const result: any = { year: entry.year, count: entry.count };
        selectedPTAs.forEach((pta) => {
          const stats = entry.perPta[pta];
          result[pta] = stats && stats.count > 0 ? stats.sum / stats.count : null;
        });
        return result;
      })
      .filter((d) => d && typeof d === 'object' && (d.count || 0) > 0);
  }

  // ...
}, [females, selectedPTAs, groupBy]);
```

Esse bloco substitui a lógica anterior baseada em um intervalo de anos fixo, garantindo que cada rebanho utilize exatamente os anos presentes no conjunto de dados, evitando a ausência dos pontos no gráfico.
