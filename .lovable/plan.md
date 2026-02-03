
# Plano: Seção Segmentação do Rebanho no Relatório Geral

## Objetivo
Implementar a seção "Segmentação do Rebanho" no Relatório Geral mostrando:
1. **Índice utilizado** (HHP$, TPI, NM$ ou Custom)
2. **Detalhes do índice customizado** (se aplicável) - traits e pesos
3. **Distribuição dos grupos** (Superior/Intermediário/Inferior) com barras visuais
4. **Médias das características por classificação** (14 PTAs)
5. **% de cada categoria dentro de cada classificação** (Bezerras, Novilhas, Primíparas, etc.)

---

## Fonte de Dados

Os dados de segmentação são obtidos da tabela `female_segmentations`:

| Campo | Descrição |
|-------|-----------|
| `class` | 'donor' (Superior), 'inter' (Intermediário), 'recipient' (Inferior) |
| `female_id` | ID da fêmea (join com females_denorm) |
| `farm_id` | ID da fazenda |
| `parameters` | JSON com configurações da segmentação |

Estrutura do campo `parameters`:
```json
{
  "index_type": "TPI" | "HHP$" | "NM$" | "Custom",
  "selected_traits": ["HHP$®", "PTAM", "PTAF"],
  "weights": { "HHP$®": 40, "PTAM": 30, "PTAF": 30 },
  "segmentation_percentages": {
    "superior": 20,
    "intermediario": 60,
    "inferior": 20
  }
}
```

---

## Layout Visual

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  SEGMENTAÇÃO DO REBANHO                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────── CONFIGURAÇÃO UTILIZADA ─────────────────┐          │
│  │  Índice: TPI                                              │          │
│  │  [Se Custom: Mostrar tabela de PTAs + Pesos]              │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌───────────────── DISTRIBUIÇÃO DOS GRUPOS ────────────────┐          │
│  │                                                           │          │
│  │  Superior       ████████░░░░░░░░░░░░░░░░░░░░   54 (19.9%) │          │
│  │  Intermediário  ██████████████████████░░░░░░  162 (59.8%) │          │
│  │  Inferior       ██████░░░░░░░░░░░░░░░░░░░░░░   55 (20.3%) │          │
│  │                                                           │          │
│  │                        Total: 271 ✓                       │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌───────────────── MÉDIAS POR CLASSIFICAÇÃO ───────────────┐          │
│  │                                                           │          │
│  │  ┌──────────────┬───────┬───────┬───────┬───────┬───────┐│          │
│  │  │Classificação │ HHP$  │  TPI  │  NM$  │ PTAM  │  ...  ││          │
│  │  ├──────────────┼───────┼───────┼───────┼───────┼───────┤│          │
│  │  │ Superior     │ 1,450 │ 3,120 │  980  │ 1,620 │  ...  ││          │
│  │  │ Intermediário│ 1,180 │ 2,820 │  780  │ 1,380 │  ...  ││          │
│  │  │ Inferior     │   890 │ 2,450 │  520  │ 1,050 │  ...  ││          │
│  │  └──────────────┴───────┴───────┴───────┴───────┴───────┘│          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌───────────────── CATEGORIAS POR CLASSIFICAÇÃO ───────────┐          │
│  │                                                           │          │
│  │  Superior (54 animais):                                   │          │
│  │  ┌───────────┬───────────┬───────────┬───────────┐       │          │
│  │  │ Bezerras  │ Novilhas  │ Primíparas│ Multíparas│       │          │
│  │  │  15 (28%) │  25 (46%) │  10 (19%) │   4 (7%)  │       │          │
│  │  └───────────┴───────────┴───────────┴───────────┘       │          │
│  │                                                           │          │
│  │  Intermediário (162 animais):                             │          │
│  │  ┌───────────┬───────────┬───────────┬───────────┐       │          │
│  │  │ Bezerras  │ Novilhas  │ Primíparas│ Multíparas│       │          │
│  │  │  40 (25%) │  80 (49%) │  30 (19%) │  12 (7%)  │       │          │
│  │  └───────────┴───────────┴───────────┴───────────┘       │          │
│  │                                                           │          │
│  │  Inferior (55 animais):                                   │          │
│  │  [Similar layout]                                         │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Criar

### 1. SegmentationSection (Principal)
Componente container que busca dados e renderiza as subseções.

### 2. SegmentationConfigCard
Exibe o índice utilizado e, se Custom, mostra:
- Lista de traits selecionadas
- Pesos de cada trait (com barra visual)

### 3. GroupDistributionCard
Exibe a distribuição dos grupos com barras de progresso coloridas:
- Superior (verde)
- Intermediário (amarelo)
- Inferior (vermelho)

### 4. ClassificationAveragesTable
Tabela com médias das 14 PTAs por classificação.

### 5. CategoryBreakdownCard
Mostra a composição por categoria dentro de cada classificação.

---

## Lógica de Busca de Dados

```typescript
// 1. Buscar segmentação salva da farm
const { data: segmentations } = await supabase
  .from('female_segmentations')
  .select('female_id, class, parameters')
  .eq('farm_id', farmId);

// 2. Extrair parâmetros (todos iguais por farm)
const parameters = segmentations[0]?.parameters;

// 3. Buscar dados completos das fêmeas
const females = await fetchFemalesDenormByFarm(farmId);

// 4. Juntar segmentação com dados das fêmeas
const femalesWithClass = females.map(f => ({
  ...f,
  classification: segmentations.find(s => s.female_id === f.id)?.class
}));

// 5. Calcular estatísticas por classificação
```

---

## Mapeamento de Classes

| DB Class | Label Display | Cor |
|----------|---------------|-----|
| `donor` | Superior | Verde (#10B981) |
| `inter` | Intermediário | Amarelo (#F59E0B) |
| `recipient` | Inferior | Vermelho (#EF4444) |

---

## PTAs a Exibir

Utilizar a mesma configuração do HerdSummarySection:

| PTA | Campo | Inversão |
|-----|-------|----------|
| HHP$ | hhp_dollar | Não |
| TPI | tpi | Não |
| NM$ | nm_dollar | Não |
| PTAM | ptam | Não |
| CFP | cfp | Não |
| PTAF% | ptaf_pct | Não |
| PTAP% | ptap_pct | Não |
| PL | pl | Não |
| DPR | dpr | Não |
| SCS | scs | Sim (menor é melhor) |
| Mast | mast | Sim (menor é melhor) |
| PTAT | ptat | Não |
| UDC | udc | Não |
| FLC | flc | Não |

---

## Tratamento de Caso Sem Segmentação

Se não houver dados de segmentação salvos para a fazenda, exibir mensagem:

> "Nenhuma segmentação foi salva para esta fazenda. Execute a segmentação na página de Segmentação e salve os resultados."

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/components/reports/sections/SegmentationSection.tsx` | **Criar** - Novo componente com toda a lógica |
| `src/components/reports/ReportSectionRenderer.tsx` | **Modificar** - Substituir placeholder |

---

## Dependências a Utilizar

```typescript
import { supabase } from '@/integrations/supabase/client';
import { fetchFemalesDenormByFarm, FemaleDenormRow } from '@/supabase/queries/females';
import { getAutomaticCategory, type FemaleCategory } from '@/utils/femaleCategories';
import { formatPtaValue } from '@/utils/ptaFormat';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

---

## Estrutura de Tipos

```typescript
type SegmentationClass = 'donor' | 'inter' | 'recipient';

interface SegmentationParams {
  index_type: 'HHP$' | 'TPI' | 'NM$' | 'Custom';
  selected_traits?: string[];
  weights?: Record<string, number>;
  segmentation_percentages: {
    superior: number;
    intermediario: number;
    inferior: number;
  };
}

interface ClassificationStats {
  class: SegmentationClass;
  label: string;
  count: number;
  percentage: number;
  color: string;
  categoryBreakdown: Record<FemaleCategory, { count: number; percentage: number }>;
  ptaAverages: Record<string, number>;
}
```

---

## Resultado Esperado

1. **Cabeçalho de Configuração**: Mostra qual índice foi usado e, se Custom, exibe traits/pesos
2. **Barras de Distribuição**: Visualização clara de Superior/Intermediário/Inferior com cores
3. **Tabela de Médias**: 14 PTAs formatadas por classificação
4. **Breakdown por Categoria**: % de cada categoria dentro de cada classificação
5. **Tratamento de Erro**: Mensagem amigável se não houver segmentação salva
