
# Plano: Gerador de Relatório Geral Consolidado

## Objetivo
Criar uma funcionalidade no Painel Principal de cada fazenda que permita ao usuário:
1. Visualizar todos os tipos de relatórios disponíveis na plataforma
2. Selecionar quais relatórios deseja incluir
3. Configurar parâmetros específicos de cada relatório (opcional)
4. Gerar um PDF consolidado único com capa, índice e todos os relatórios selecionados
5. Baixar o PDF para entregar ao cliente

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    PAINEL DA FAZENDA                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  [Novo Botão] 📄 Gerar Relatório Geral                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │           MODAL: Gerador de Relatório Geral                  │    │
│  │  ┌─────────────────────────────────────────────────────┐     │    │
│  │  │ ☑ Segmentação do Rebanho                            │     │    │
│  │  │   └─ Configurar: [Índice] [Categorias]              │     │    │
│  │  │ ☑ Auditoria Genética (7 Steps)                      │     │    │
│  │  │   └─ Selecionar Steps: [1] [2] [3] [4] [5] [6] [7]  │     │    │
│  │  │ ☐ Botijão Virtual                                   │     │    │
│  │  │ ☑ Projeção Genética                                 │     │    │
│  │  │ ☐ Gráficos de Tendência                             │     │    │
│  │  │ ☐ Nexus - Predições                                 │     │    │
│  │  └─────────────────────────────────────────────────────┘     │    │
│  │                                                              │    │
│  │  [Orientação: ◉ Paisagem ○ Retrato]                          │    │
│  │  [Incluir Capa: ☑]  [Incluir Índice: ☑]                      │    │
│  │                                                              │    │
│  │  [Cancelar]                     [Gerar PDF Consolidado]      │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Relatórios Disponíveis para Inclusão

| # | Relatório | Descrição | Fonte de Dados |
|---|-----------|-----------|----------------|
| 1 | **Resumo do Rebanho** | Estatísticas gerais, total de animais por categoria | HerdPage |
| 2 | **Segmentação** | Distribuição Superior/Intermediário/Inferior com gráficos | SegmentationPage |
| 3 | **Auditoria Genética** | 7 Steps de análise (selecionáveis individualmente) | AuditoriaGeneticaPage |
| 4 | **Botijão Virtual** | Inventário de doses, touros selecionados | BotijaoVirtual |
| 5 | **Projeção Genética** | Plano de acasalamento, ROI, gráficos | ProjecaoGenetica |
| 6 | **Gráficos de Tendência** | Evolução de PTAs ao longo do tempo | ChartsPage |
| 7 | **Metas Genéticas** | Metas definidas vs valores atuais | Metas |
| 8 | **Nexus Predições** | Predições genômicas/pedigree | NexusApp |

---

## Estrutura do PDF Gerado

```text
┌──────────────────────────────────────┐
│            CAPA                      │
│   Logo ToolSS / Select Sires         │
│   "Relatório Geral - [Fazenda]"      │
│   Data: DD/MM/YYYY                   │
│   Preparado por: [Usuário]           │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│           ÍNDICE                     │
│  1. Resumo do Rebanho ........... 3  │
│  2. Segmentação ................. 5  │
│  3. Auditoria Genética .......... 8  │
│     3.1 Parentesco .............. 8  │
│     3.2 Top Parents ............. 9  │
│     ...                              │
│  4. Projeção Genética .......... 15  │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│    SEÇÕES (cada relatório)           │
│  ┌────────────────────────────────┐  │
│  │ Título da Seção                │  │
│  │ Gráficos capturados            │  │
│  │ Tabelas de dados               │  │
│  │ Estatísticas resumidas         │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## Arquivos a Criar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/reports/GeneralReportModal.tsx` | Modal principal com seleção de relatórios |
| `src/components/reports/ReportSection.tsx` | Componente para renderizar cada seção do relatório |
| `src/components/reports/ReportCover.tsx` | Componente da capa do PDF |
| `src/components/reports/ReportIndex.tsx` | Componente do índice |
| `src/hooks/useGeneralReport.ts` | Hook para gerenciar estado e lógica de geração |
| `src/lib/pdf/generateGeneralReport.ts` | Função para consolidar múltiplos relatórios em um PDF |

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/MainDashboard.tsx` | Adicionar botão "Gerar Relatório Geral" no painel da fazenda |
| `src/hooks/useFileStore.ts` | Adicionar tipo `general_report` para salvar relatórios consolidados |

---

## Implementação Detalhada

### Fase 1: Estrutura Base

1. **Criar o Modal de Seleção** (`GeneralReportModal.tsx`)
   - Lista de checkboxes para cada tipo de relatório
   - Opções expandíveis para configurar parâmetros
   - Seletores para orientação (paisagem/retrato)
   - Opções de incluir capa e índice
   - Preview de páginas estimadas
   - Botão de geração com estado de loading

2. **Criar Hook de Gerenciamento** (`useGeneralReport.ts`)
   - Estado dos relatórios selecionados
   - Configurações por relatório
   - Função para buscar dados necessários
   - Função para gerar o PDF consolidado

### Fase 2: Geração de Conteúdo

3. **Criar Componentes Renderizáveis para PDF**
   - Cada seção do relatório precisa de um componente que possa ser capturado via `html2canvas`
   - Componentes otimizados para impressão (cores de alto contraste, fontes legíveis)

4. **Função de Geração do PDF** (`generateGeneralReport.ts`)
   - Renderizar capa com logo e informações
   - Gerar índice dinâmico com números de página
   - Iterar pelos relatórios selecionados
   - Capturar cada seção e adicionar ao PDF
   - Numerar páginas automaticamente

### Fase 3: Integração

5. **Integrar no MainDashboard**
   - Adicionar botão no painel da fazenda (seção de módulos ou header)
   - Abrir modal ao clicar
   - Passar dados da fazenda selecionada

6. **Salvar Relatórios Gerados**
   - Adicionar ao `useFileStore` com tipo `general_report`
   - Aparecer automaticamente em Pasta de Arquivos

---

## Interface do Usuário

### Modal de Seleção

```text
╔═══════════════════════════════════════════════════════════════╗
║  📄 Gerar Relatório Geral - Fazenda Laranja                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Selecione os relatórios para incluir:                        ║
║                                                               ║
║  ☑ Resumo do Rebanho                                          ║
║      Total de animais, distribuição por categoria             ║
║                                                               ║
║  ☑ Segmentação                                    [Configurar]║
║      Classificação Superior/Intermediário/Inferior            ║
║      └─ Índice: [TPI ▾]  Categorias: [Todas ▾]                ║
║                                                               ║
║  ☑ Auditoria Genética                             [Configurar]║
║      Análise completa em 7 passos                             ║
║      └─ Steps: [☑1] [☑2] [☑3] [☑4] [☑5] [☑6] [☑7]             ║
║                                                               ║
║  ☐ Botijão Virtual                                            ║
║      Inventário de doses e touros                             ║
║                                                               ║
║  ☑ Projeção Genética                                          ║
║      Plano de acasalamento e ROI                              ║
║                                                               ║
║  ☐ Gráficos de Tendência                                      ║
║      Evolução temporal das PTAs                               ║
║                                                               ║
║  ☐ Metas Genéticas                                            ║
║      Metas vs valores atuais                                  ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Opções do PDF:                                               ║
║                                                               ║
║  Orientação: (●) Paisagem  ( ) Retrato                        ║
║  [☑] Incluir Capa    [☑] Incluir Índice                       ║
║  [☑] Numerar Páginas [☑] Incluir Data/Hora                    ║
║                                                               ║
║  Páginas estimadas: ~18 páginas                               ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  [Cancelar]                      [📥 Gerar PDF Consolidado]   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Fluxo de Execução

1. Usuário clica em "Gerar Relatório Geral" no painel da fazenda
2. Modal abre com lista de relatórios disponíveis
3. Usuário marca os relatórios desejados e configura opções
4. Usuário clica em "Gerar PDF Consolidado"
5. Sistema exibe loading com progresso (ex: "Gerando Segmentação... 2/5")
6. Para cada relatório selecionado:
   - Busca dados do Supabase
   - Renderiza componente invisível
   - Captura via html2canvas
   - Adiciona ao jsPDF
7. Gera capa e índice
8. Salva no useFileStore
9. Inicia download automático
10. Exibe toast de sucesso com link para Pasta de Arquivos

---

## Considerações Técnicas

### Performance
- Renderizar componentes em um container invisível (`position: fixed; left: -9999px`)
- Usar `requestAnimationFrame` entre capturas para não travar UI
- Mostrar progresso durante geração

### Qualidade do PDF
- Usar DPI 300 para capturas de alta qualidade
- Otimizar cores para impressão
- Garantir que gráficos Recharts renderizem corretamente

### Memória
- Limpar canvas após cada captura
- Usar streams para PDFs grandes
- Implementar timeout para evitar travamentos

---

## Resumo das Modificações

| Tipo | Arquivo | Ação |
|------|---------|------|
| Criar | `src/components/reports/GeneralReportModal.tsx` | Modal principal |
| Criar | `src/components/reports/ReportSectionRenderer.tsx` | Renderizador de seções |
| Criar | `src/hooks/useGeneralReport.ts` | Hook de gerenciamento |
| Criar | `src/lib/pdf/generateGeneralReport.ts` | Gerador do PDF consolidado |
| Modificar | `src/components/MainDashboard.tsx` | Adicionar botão |
| Modificar | `src/hooks/useFileStore.ts` | Adicionar tipo `general_report` |

---

## Próximos Passos (Pós-Implementação)

1. Adicionar templates de relatório pré-definidos (ex: "Relatório Mensal", "Relatório para Técnico")
2. Permitir salvar configurações de relatório como preset
3. Agendamento de geração automática (ex: todo dia 1 do mês)
4. Envio por email direto do sistema
5. Versão em outros idiomas (inglês)
