

# Plano: Correção Completa de Escalas (Eixo Y e Eixo X)

## Problema Central
Os gráficos de tendência temporal não evidenciam as diferenças entre anos devido a dois fatores:
1. **Eixo Y muito amplo** — escala fixa que "achata" variações pequenas
2. **Eixo X inconsistente** — falta de configuração uniforme entre componentes

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/chart-utils.ts` | Aprimorar algoritmo adaptativo do eixo Y + nova função para eixo X |
| `src/features/auditoria/steps/Step5Progressao.tsx` | Usar domain adaptativo no YAxis |
| `src/components/reports/sections/AuditoriaStep5Section.tsx` | Adicionar domain calculado ao YAxis |
| `src/components/ChartsPage.tsx` | Adicionar domain ao YAxis e padronizar XAxis |
| `src/components/charts/trends/TrendsChart.tsx` | Adicionar `type="number"` ao XAxis + domain calculado |

---

## Parte 1: Melhorias no Eixo Y

### 1.1 Aprimorar `getAdaptiveYAxisDomain` em `src/lib/chart-utils.ts`

Algoritmo mais inteligente baseado no **range dos dados**:

```typescript
export function getAdaptiveYAxisDomain(
  data: Array<any>,
  valueKey: string
): [number, number] {
  // ... extrair valores finitos ...
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  let range = max - min;
  
  // Se range for zero, criar margem mínima
  if (range === 0) {
    range = Math.max(Math.abs(max) * 0.02, 0.1);
  }
  
  // Padding proporcional ao range para garantir ~70% de ocupação visual
  let padding: number;
  
  if (range < 0.5) {
    // PTAs decimais com variação muito pequena (SCS, DPR, etc.)
    padding = range * 0.3;
  } else if (range < 5) {
    // PTAs decimais com variação moderada
    padding = range * 0.25;
  } else if (range < 50) {
    // PTAs intermediárias
    padding = range * 0.15;
  } else {
    // PTAs grandes (NM$, TPI, HHP$, PTAM)
    padding = range * 0.10;
  }
  
  // Garantir padding mínimo
  padding = Math.max(padding, range * 0.1);
  
  return [min - padding, max + padding];
}
```

### 1.2 Remover inclusão forçada do zero

Em `Step5Progressao.tsx`, a função `buildAxisDomain` força inclusão do zero:
```typescript
const includeZero = [...finiteValues, 0]; // ← Problema
```

Será substituída por `getAdaptiveYAxisDomain` que foca apenas nos dados reais.

---

## Parte 2: Padronização do Eixo X

### 2.1 Nova função helper para eixo X temporal

```typescript
export function getYearAxisConfig(years: number[]): {
  domain: [number, number];
  ticks: number[];
  tickFormatter: (value: number) => string;
} {
  if (!years.length) {
    const currentYear = new Date().getFullYear();
    return {
      domain: [currentYear, currentYear],
      ticks: [currentYear],
      tickFormatter: (v) => String(Math.round(v)),
    };
  }
  
  const sorted = [...years].sort((a, b) => a - b);
  const minYear = sorted[0];
  const maxYear = sorted[sorted.length - 1];
  const span = maxYear - minYear;
  
  // Gerar ticks: todos os anos se span <= 10, senão intervalos
  let ticks: number[];
  if (span <= 10) {
    // Mostrar todos os anos
    ticks = [];
    for (let y = minYear; y <= maxYear; y++) {
      ticks.push(y);
    }
  } else {
    // Intervalos de 2 ou 5 anos
    const step = span <= 20 ? 2 : 5;
    const alignedStart = Math.ceil(minYear / step) * step;
    ticks = [minYear];
    for (let y = alignedStart; y <= maxYear; y += step) {
      if (y !== minYear) ticks.push(y);
    }
    if (!ticks.includes(maxYear)) ticks.push(maxYear);
  }
  
  return {
    domain: [minYear, maxYear],
    ticks,
    tickFormatter: (v) => String(Math.round(v)),
  };
}
```

### 2.2 Padronizar XAxis em todos os gráficos

Garantir que todos os gráficos de tendência usem:
```tsx
<XAxis
  type="number"            // Obrigatório para interpolação correta
  dataKey="year"
  domain={xAxisConfig.domain}
  ticks={xAxisConfig.ticks}
  tickFormatter={(v) => String(Math.round(v))}
  allowDecimals={false}    // Nunca mostrar 2019.5
/>
```

---

## Mudanças por Arquivo

### `src/lib/chart-utils.ts`
- Aprimorar `getAdaptiveYAxisDomain` com padding proporcional
- Adicionar `getYearAxisConfig` para eixo X

### `src/features/auditoria/steps/Step5Progressao.tsx`
- Remover `buildAxisDomain` (inclui zero forçadamente)
- Usar `getAdaptiveYAxisDomain` no YAxis
- Manter XAxis como está (já configurado corretamente)

### `src/components/reports/sections/AuditoriaStep5Section.tsx`
- Adicionar domain calculado ao YAxis
- Garantir formatação correta

### `src/components/ChartsPage.tsx`
- No componente `TraitCard`: adicionar YAxis domain calculado
- Garantir XAxis com `type="number"`

### `src/components/charts/trends/TrendsChart.tsx`
- Adicionar `type="number"` ao XAxis
- Calcular domain e ticks para anos
- YAxis já usa `getAdaptiveYAxisDomainMultiple` (manter)

---

## Exemplo Visual do Resultado

### Antes (SCS variando de 2.85 a 2.91)
```text
Y: 5.0 ┤
   4.0 ┤
   3.0 ┤─────────────────────  ← Linha quase plana
   2.0 ┤
   1.0 ┤
   0.0 ┤
       └───────────────────────
   X:  2019  2020  2021  2022  2023
```

### Depois (escala focada nos dados)
```text
Y: 2.95 ┤                    ╭──
   2.92 ┤              ╭────╯
   2.89 ┤         ╭───╯
   2.86 ┤    ╭───╯
   2.83 ┤───╯
   2.80 ┤
        └───────────────────────
   X:   2019  2020  2021  2022  2023
```

---

## Tabela de Comportamento Esperado

| Característica | Variação | Escala Y Antes | Escala Y Depois |
|---------------|----------|----------------|-----------------|
| SCS | 2.85 - 2.91 | 0 - 5 | 2.80 - 2.95 |
| DPR | 1.2 - 1.8 | 0 - 5 | 1.0 - 2.0 |
| PL | 3.5 - 4.2 | 0 - 10 | 3.2 - 4.5 |
| HHP$ | 2650 - 2850 | 0 - 3000 | 2550 - 2950 |
| TPI | 2800 - 2950 | 0 - 3500 | 2700 - 3050 |

---

## Notas Técnicas

- O zero será visível apenas se os dados passarem por ele (não mais forçado)
- Z-scores no TrendsChart mantêm 2 casas decimais (convenção estatística)
- Anos serão sempre inteiros, sem decimais
- Quando há muitos anos (>10), ticks serão espaçados para evitar sobreposição
- Alterações afetam frontend interativo E relatórios PDF

