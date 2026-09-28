# Onde ficam os módulos Nexus no projeto

Este documento mostra, passo a passo, onde estão os arquivos que compõem o **Nexus 1**, **Nexus 2** e **Nexus 3** e como a tela inicial escolhe qual deles será exibida.

---

## 1. Ponto de entrada — escolha do Nexus

**Arquivo:** [`src/components/NexusApp.tsx`](src/components/NexusApp.tsx)

Esse é o "portão" dos três módulos. Ele guarda um estado simples (`currentView`) que pode valer:

- `'entry'` → mostra o menu inicial
- `'nexus1'` → abre o Nexus 1
- `'nexus2'` → abre o Nexus 2
- `'nexus3'` → abre o Nexus 3

```tsx
{currentView === 'nexus1' ? (
  <Nexus1GenomicPrediction onBack={handleBack} />
) : currentView === 'nexus2' ? (
  <Nexus2PedigreePrediction onBack={handleBack} selectedFarmId={selectedFarmId} />
) : currentView === 'nexus3' ? (
  <Nexus3Groups onBack={handleBack} selectedFarmId={selectedFarmId} />
) : (
  <NexusEntryPage onSelectMethod={handleMethodSelection} />
)}
```

**Resumo do fluxo:**

```text
Usuário clica em um card no menu
        ↓
NexusEntryPage chama onSelectMethod('nexus1' | 'nexus2' | 'nexus3')
        ↓
NexusApp muda currentView
        ↓
Renderiza o componente correspondente
```

---

## 2. Menu inicial (cards de seleção)

**Arquivo:** [`src/components/NexusEntryPage.tsx`](src/components/NexusEntryPage.tsx)

Aqui são desenhados os três cards que o usuário vê:

- **Nexus 1 — Predição Genômica**
- **Nexus 2 — Predição por Pedigree**
- **Nexus 3 — Acasalamento em Grupos**

Cada botão chama `onSelectMethod('nexus1')`, `onSelectMethod('nexus2')` ou `onSelectMethod('nexus3')`, fazendo a aplicação trocar de tela.

---

## 3. Nexus 1 — Predição Genômica

### Tela principal

**Arquivo:** [`src/components/Nexus1GenomicPrediction.tsx`](src/components/Nexus1GenomicPrediction.tsx)

É o arquivo mais importante do Nexus 1. Nele acontecem:

- Escolha da origem dos dados:
  - **Upload** de planilha com fêmeas e/ou touros
  - **Busca no banco** de fêmeas da fazenda selecionada
- Escolha de 1, 2 ou 3 touros para cruzamento
- Cálculo da predição genômica
- Download dos resultados em Excel

### Fórmula usada

**Local no código:** [`src/components/Nexus1GenomicPrediction.tsx`](src/components/Nexus1GenomicPrediction.tsx) — função `calculateGenomicPrediction` (aproximadamente linha 98)

```ts
const calculateGenomicPrediction = (femalePTA: number, bullPTA: number, traitKey?: string): number => {
  return (femalePTA + bullPTA) / 2;
};
```

**Em português:**

> Para cada característica, soma-se o PTA da fêmea com o PTA do touro e divide por 2. O fator de correção de regressão 0,93 foi removido em 28/09/2026 (decisão do Diego) — a fórmula não distingue mais SCS das demais características, já que não há mais fator a excluir.

### Características esperadas

**Lista:** [`src/components/Nexus1GenomicPrediction.tsx`](src/components/Nexus1GenomicPrediction.tsx) — constante `NEXUS1_COLUMNS` (linha 29)

As colunas de PTA começam a partir da terceira posição (`HHP$®`, `TPI`, `NM$`, `CM$`, `FM$`, `GM$`, `F SAV`, `PTAM`, `CFP`, `PTAF`, `PTAF%`, `PTAP`, `PTAP%`, `PL`, `DPR`, `LIV`, `SCS`, `MAST`, `MET`, `RP`, `DA`, `KET`, `MF`, `PTAT`, `UDC`, `FLC`, `SCE`, `DCE`, `SSB`, `DSB`, `H LIV`, `CCR`, `HCR`, `FI`, `GL`, `EFC`, `BWC`, `STA`, `STR`, `DFM`, `RUA`, `RLS`, `RTP`, `FTL`, `RW`, `RLR`, `FTA`, `FLS`, `FUA`, `RUH`, `RUW`, `UCL`, `UDP`, `FTP`, `RFI`).

### Parser de planilhas

O upload de arquivos utiliza o parser universal:

**Arquivo:** [`src/utils/headerNormalizer.ts`](src/utils/headerNormalizer.ts)

```ts
import { parseUniversalSpreadsheet } from '@/utils/headerNormalizer';
```

### Busca de touros no banco

**Arquivo:** [`src/supabase/queries/bulls.ts`](src/supabase/queries/bulls.ts) — função `searchBulls`

---

## 4. Nexus 2 — Predição por Pedigree

### Container de escolha (individual ou lote)

**Arquivo:** [`src/components/Nexus2PedigreePrediction.tsx`](src/components/Nexus2PedigreePrediction.tsx)

Esse componente só decide se o usuário quer:

- **Individual** — digitar um animal de cada vez
- **Lote** — subir uma planilha

### Predição individual

**Arquivo:** [`src/components/nexus2/Nexus2PredictionIndividual.tsx`](src/components/nexus2/Nexus2PredictionIndividual.tsx)

### Predição em lote

**Arquivo:** [`src/components/nexus2/Nexus2PredictionBatch.tsx`](src/components/nexus2/Nexus2PredictionBatch.tsx)

### Fórmula central

**Arquivo:** [`src/services/prediction.service.ts`](src/services/prediction.service.ts)

```ts
const PREDICTION_WEIGHTS = {
  sire: 0.57,
  maternalGrandsire: 0.28,
  maternalGreatGrandsire: 0.15,
};
```

> A predição por pedigree combina o PTA do **pai** (57%), do **avô materno** (28%) e do **bisavô materno** (15%).

### Importador de planilha nativa

**Arquivos:**

- [`src/components/nexus2/NativeSheetImporter.tsx`](src/components/nexus2/NativeSheetImporter.tsx)
- [`src/components/nexus2/nativeSheetMapping.ts`](src/components/nexus2/nativeSheetMapping.ts)

São responsáveis por detectar colunas automaticamente (auto-detecção) e mapear os nomes para os campos esperados.

---

## 5. Nexus 3 — Acasalamento em Grupos / Projeção de Rebanho

### Tela principal

**Arquivo:** [`src/components/nexus/Nexus3Groups.tsx`](src/components/nexus/Nexus3Groups.tsx)

Esse é o componente principal do Nexus 3. Nele o usuário:

- Escolhe uma fazenda
- Seleciona características (traits) para analisar
- Busca touros e monta um "pacote" de acasalamento
- Visualiza a média histórica das mães por ano de nascimento
- Exporta gráficos em PDF

### Médias históricas das mães

**Chamada RPC no código:**

```ts
const { data, error } = await supabase.rpc("nx3_mothers_yearly_avg", {
  p_trait: trait,
  p_farm: farmId,
});
```

**Local no front:** [`src/components/nexus/Nexus3Groups.tsx`](src/components/nexus/Nexus3Groups.tsx) — por volta da linha 86

**Função SQL:**

As definições das funções `nx3_mothers_yearly_avg` e `nx3_bulls_lookup` estão nas migrations do Supabase, por exemplo:

- `supabase/migrations/20251119143544_3936b3c5-*.sql`
- `supabase/migrations/20251119193854_9df524aa-*.sql`
- `supabase/migrations/20251119193539_4c028948-*.sql`

### Pacotes salvos

**Tabela:** `public.nexus3_user_packages`

**Migration de referência:** `supabase/migrations/20260603184359_d60c8341-*.sql`

Essa tabela guarda pacotes de touros que o usuário montou para reutilizar depois.

---

## 6. Como os três Nexus são montados no dashboard

`NexusApp` é inserido em telas maiores do sistema. Os principais pontos de montagem são:

- [`src/components/MainDashboard.tsx`](src/components/MainDashboard.tsx)
- [`src/components/ToolSSApp.tsx`](src/components/ToolSSApp.tsx)

Em ambos, o componente `<NexusApp />` é renderizado quando o usuário navega para a seção "Nexus".

---

## 7. Resumo visual do fluxo completo

```text
┌─────────────────────────────────────┐
│  src/components/MainDashboard.tsx   │
│  ou src/components/ToolSSApp.tsx    │
│         renderiza <NexusApp />      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│     src/components/NexusApp.tsx       │
│    controla currentView ('entry',    │
│   'nexus1', 'nexus2', 'nexus3')      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  src/components/NexusEntryPage.tsx    │
│      menu com 3 cards                │
└──────────────┬──────────────────────┘
               ↓ (escolha do usuário)
   ┌───────────┼───────────┐
   ↓           ↓           ↓
Nexus 1    Nexus 2    Nexus 3
   │           │           │
   ↓           ↓           ↓
src/      src/         src/
components/ components/   components/
Nexus1-   Nexus2-        nexus/
Genomic   Pedigree       Nexus3Groups.tsx
Prediction.tsx Prediction.tsx
          │
          ├── nexus2/Nexus2PredictionIndividual.tsx
          └── nexus2/Nexus2PredictionBatch.tsx
```

---

## 8. Arquivos de apoio comuns

| Função | Arquivo |
|--------|---------|
| Busca de touros no banco | [`src/supabase/queries/bulls.ts`](src/supabase/queries/bulls.ts) |
| Busca de fêmeas no banco | [`src/supabase/queries/females.ts`](src/supabase/queries/females.ts) |
| Parser universal de planilhas | [`src/utils/headerNormalizer.ts`](src/utils/headerNormalizer.ts) |
| Métricas/características disponíveis | [`src/constants/animalMetrics.ts`](src/constants/animalMetrics.ts) |
| Formatação de valores PTA | [`src/utils/ptaFormat.ts`](src/utils/ptaFormat.ts) |
| Cálculo de predição por pedigree | [`src/services/prediction.service.ts`](src/services/prediction.service.ts) |

---

## 9. Dica rápida para lembrar

- **Nexus 1** → prediz filhos a partir de **fêmea + touro**.
- **Nexus 2** → prediz a partir de **pai, avô materno e bisavô materno**.
- **Nexus 3** → projeta o **rebanho inteiro** no tempo, comparando médias das mães com pacotes de touros.
