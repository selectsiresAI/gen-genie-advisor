
# Plano: Histogramas em Páginas Separadas (Modo Paisagem)

## Objetivo
Modificar apenas a geração do **Relatório Geral** para que:
1. Cada gráfico de histograma do Step 7 (Distribuição de PTAs) apareça em uma **página separada**
2. Esses gráficos sejam sempre gerados no formato **Paisagem**, mesmo se o usuário selecionar Retrato

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/reports/sections/AuditoriaStep7Section.tsx` | Adicionar atributo `data-chart-page` em cada `HistogramCard` para identificação individual |
| `src/lib/pdf/generateGeneralReport.ts` | Lógica para capturar histogramas individualmente e inserir em páginas separadas no modo Paisagem |

---

## Detalhes Técnicos

### 1. `AuditoriaStep7Section.tsx` — Marcação Individual

Adicionar um atributo `data-chart-page="histogram"` em cada `HistogramCard` para que o gerador de PDF possa identificar e capturar cada gráfico separadamente:

```tsx
// Antes
<div className="space-y-6">
  {series.map((s) => (
    <HistogramCard key={s.traitKey} series={s} />
  ))}
</div>

// Depois
<div className="space-y-6" data-report-charts="histogram-container">
  {series.map((s) => (
    <div key={s.traitKey} data-chart-page="histogram" data-chart-label={s.label}>
      <HistogramCard series={s} />
    </div>
  ))}
</div>
```

### 2. `generateGeneralReport.ts` — Lógica Especial para Histogramas

Ao processar o relatório `auditoria_step7`, em vez de capturar a seção inteira:
1. Buscar todos os elementos com `data-chart-page="histogram"`
2. Para cada histograma:
   - Mudar temporariamente a orientação do documento para Paisagem (`'l'`)
   - Adicionar nova página
   - Capturar e inserir o gráfico individual
   - Adicionar título com nome da PTA

**Pseudocódigo:**
```typescript
if (report.type === 'auditoria_step7') {
  const histogramCards = sectionEl.querySelectorAll('[data-chart-page="histogram"]');
  
  for (const [idx, card] of histogramCards.entries()) {
    // Adicionar página em paisagem
    doc.addPage('a4', 'l');  // 'l' = landscape
    currentPage++;
    
    // Capturar gráfico individual
    const canvas = await captureElement(card as HTMLElement, 2);
    
    // Calcular dimensões para página paisagem
    const pageWidth = 297; // A4 landscape width in mm
    const pageHeight = 210; // A4 landscape height in mm
    
    // Inserir título e imagem
    const chartLabel = card.getAttribute('data-chart-label') || `Histograma ${idx + 1}`;
    addSectionTitle(doc, `Distribuição - ${chartLabel}`);
    
    // Adicionar imagem centralizada
    doc.addImage(...);
    
    // Registrar no índice
    pageTracker.push({
      title: `Distribuição - ${chartLabel}`,
      pageNumber: currentPage,
    });
  }
  continue; // Pular processamento padrão da seção
}
```

---

## Comportamento Esperado

### Antes
- Todos os histogramas aparecem em sequência na mesma página
- Orientação segue a escolha do usuário

### Depois
- Cada histograma ocupa uma página inteira
- Todos os histogramas são gerados em **Paisagem**
- Outras seções respeitam a orientação escolhida pelo usuário
- Índice lista cada histograma com seu nome de PTA

---

## Exemplo Visual no PDF

```text
[Página 5 - Paisagem]
┌─────────────────────────────────────────────────────────────────────────┐
│ Distribuição - HHP$                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────┬────────┬──────────────┬────────┬────────────┬─────────┐     │
│  │ Média  │Mediana │Desvio Padrão │  CV%   │ Mín-Máx    │ Q1-Q3   │     │
│  │2680.92 │2704.00 │   200.21     │ 7.5%   │2025 – 3183 │2568–2828│     │
│  └────────┴────────┴──────────────┴────────┴────────────┴─────────┘     │
│                                                                          │
│  ⊙ Meta ideal: ≥600 (Valor econômico para alta lucratividade)           │
│                                                                          │
│     ████████████████████████████████████████████████████████████        │
│     ██████████████████████████████████████████████████████████████      │
│     ████████████████████████████████████████████████████████████████    │
│    ───────────────────────────────────────────────────────────────      │
│                                                                          │
│  ○ Próximo da média  ○ Moderado  ○ Distante                             │
│                                                                          │
│                                                 Página 5 de 12          │
└─────────────────────────────────────────────────────────────────────────┘

[Página 6 - Paisagem]
┌─────────────────────────────────────────────────────────────────────────┐
│ Distribuição - TPI                                                       │
...
```

---

## Notas Importantes

- A mudança é **exclusiva para o Relatório Geral** — não afeta o front-end interativo
- O jsPDF suporta orientação por página com `doc.addPage('a4', 'l')`
- Mantém-se compatibilidade com o índice e numeração de páginas
