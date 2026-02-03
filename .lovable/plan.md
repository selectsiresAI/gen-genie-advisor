

# Plano Atualizado: Simplificação das Etapas da Auditoria Genética

## Objetivo
Simplificar quatro etapas da Auditoria Genética, removendo elementos de interação e mantendo apenas os dados relevantes para o relatório.

---

## 1. Quartis Overview (Step3QuartisOverview.tsx)

**Simplificação:** Manter SOMENTE a tabela com os dados relevantes.

**Elementos a Remover:**
- Card de seleção de características (lado esquerdo)
- Botões "Selecionar todas" e "Limpar"
- ScrollArea com checkboxes
- Botão "Atualizar"
- BatchExportBar
- SingleExportButton

**Elementos a Manter:**
- Tabela de resultados com colunas: PTA | N total | Top 25% (N) | Média Top 25% | Bottom 25% (N) | Média Bottom 25%
- Carregamento automático com PTAs padrão

---

## 2. Progressão (Step5Progressao.tsx)

**Simplificação:** Manter SOMENTE os gráficos de linha com tendência.

**Elementos a Remover:**
- Filtros de categoria
- Checkboxes de opções
- Cards de estatísticas por categoria
- Seletor de PTAs
- BatchExportBar
- SingleExportButton

**Elementos a Manter:**
- Gráfico de linha (Média Anual Por Ano De Nascimento) com tendência
- Tabela de médias por ano
- Título e subtítulo
- Valor de R² na legenda

---

## 3. Comparação por Categoria (Step6ProgressCompare.tsx)

**Simplificação:** Manter SOMENTE tabela comparativa e radar chart.

**Elementos a Remover:**
- Painel de informações de debug
- Badges de seleção de grupos
- Badges de seleção de PTAs
- BatchExportBar
- SingleExportButton

**Elementos a Manter:**
- Layout grid: tabela à esquerda + radar à direita
- Tabela com: Grupo | PTAs selecionadas...
- Linhas: Grupo A, Grupo B, Change
- Radar Chart normalizado

---

## 4. Distribuição de PTAs (Step7Distribuicao.tsx)

**Conforme as imagens de referência, manter:**

### Imagem 1 - Cabeçalho com Estatísticas:
```
DPR (n=271)
┌─────────┬─────────┬──────────────┬────────┬──────────────┬───────────┐
│ Média   │ Mediana │ Desvio Padrão│  CV%   │  Mín - Máx   │  Q1 - Q3  │
│  0.25   │  0.20   │    1.14      │ 458.4% │ -3.2 – 2.8   │ -0.4 – 1.1│
└─────────┴─────────┴──────────────┴────────┴──────────────┴───────────┘
⊙ Meta ideal: ≥2.5 (Taxa de prenhez elevada)
```

### Imagem 2 - Histograma com barras pretas:
- Barras sólidas pretas (`fill="#000000"`)
- Eixo Y: "Frequência"
- Eixo X: intervalos de valores
- Altura fixa para visualização adequada

### Imagem 3 - Legenda de categorias:
```
○ Próximo da média (±0.5σ)   ○ Moderado (0.5σ - 1.5σ)   ○ Distante (>1.5σ)
```

**Elementos a Remover:**
- Popover de seleção de PTAs
- Botões "Selecionar todos" e "Limpar"
- Campo de busca
- Badges de PTAs selecionadas
- BatchExportBar
- SingleExportButton (removido conforme solicitado)

**Elementos a Manter:**
- Título da PTA com badge n=total
- Grid de 6 estatísticas (Média, Mediana, Desvio Padrão, CV%, Mín-Máx, Q1-Q3)
- Meta ideal com ícone Target
- Histograma com barras pretas sólidas
- Legenda de categorias (3 níveis)

---

## Modificações Técnicas por Arquivo

### Step7Distribuicao.tsx - Detalhes:

1. **Remover SingleExportButton** (linhas 290-295):
```tsx
// REMOVER:
<SingleExportButton
  targetRef={cardRef}
  step={step}
  title={...}
  slug={...}
/>
```

2. **Manter barras pretas** - Modificar função `getBarColor` para retornar sempre preto:
```tsx
// ANTES:
const getBarColor = (zScore: number) => {
  if (zScore < 0.5) return "hsl(var(--chart-1))";
  if (zScore < 1.5) return "hsl(var(--chart-2))";
  return "hsl(var(--chart-3))";
};

// DEPOIS:
const getBarColor = () => "#000000";
```

3. **Remover controles de seleção** (linhas 504-567):
   - Remover Popover inteiro
   - Remover badges de PTAs selecionadas
   - Usar PTAs padrão fixas

4. **Remover BatchExportBar** (linha 490)

5. **Manter legenda de categorias** - Ela aparece na imagem 3, mantém o layout visual

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/features/auditoria/steps/Step3QuartisOverview.tsx` | Remover painel de seleção, BatchExportBar, SingleExportButton |
| `src/features/auditoria/steps/Step5Progressao.tsx` | Remover filtros e estatísticas extras, BatchExportBar, SingleExportButton |
| `src/features/auditoria/steps/Step6ProgressCompare.tsx` | Remover painel de debug e badges, BatchExportBar, SingleExportButton |
| `src/features/auditoria/steps/Step7Distribuicao.tsx` | Remover Popover de seleção, BatchExportBar, SingleExportButton; usar barras pretas |

---

## Resultado Visual Esperado para Step7

Para cada PTA selecionada:

```
┌────────────────────────────────────────────────────────────────────┐
│ DPR (n=271)                                                        │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────┬────────┬──────────────┬────────┬────────────┬─────────┐│
│ │ Média  │Mediana │Desvio Padrão │  CV%   │ Mín-Máx    │ Q1-Q3   ││
│ │  0.25  │  0.20  │    1.14      │458.4%  │ -3.2 – 2.8 │-0.4–1.1 ││
│ └────────┴────────┴──────────────┴────────┴────────────┴─────────┘│
│                                                                    │
│ ⊙ Meta ideal: ≥2.5 (Taxa de prenhez elevada)                      │
│                                                                    │
│    ■■■■■■                                                          │
│    ■■■■■■    ■■■■■■■■■■■■■■■■                                     │
│    ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                               │
│  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■                         │
│ ──────────────────────────────────────────                         │
│                                                                    │
│ ○ Próximo da média (±0.5σ)  ○ Moderado (0.5-1.5σ)  ○ Distante (>1.5σ)│
└────────────────────────────────────────────────────────────────────┘
```

