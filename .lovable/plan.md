

# Plano: Restaurar Auditoria Genética e Criar Versões para Relatório

## ✅ CONCLUÍDO

### Problema Identificado

Os componentes originais da Auditoria Genética foram modificados incorretamente:
- `Step3QuartisOverview.tsx` - Removido painel de seleção de PTAs
- `Step5Progressao.tsx` - Removidos filtros de categoria e opções
- `Step6ProgressCompare.tsx` - Removido painel de debug e badges de seleção
- `Step7Distribuicao.tsx` - Removido Popover de seleção e alterado visual

---

## Solução Implementada

### 1. Componentes Interativos Restaurados (`src/features/auditoria/steps/`)

| Arquivo | Status |
|---------|--------|
| `Step3QuartisOverview.tsx` | ✅ Restaurado - Painel de seleção, checkboxes, BatchExportBar, SingleExportButton |
| `Step5Progressao.tsx` | ✅ Restaurado - Badges PTAs, checkboxes trend/mean, BatchExportBar, SingleExportButton |
| `Step6ProgressCompare.tsx` | ✅ Restaurado - Debug info, seleção grupos/traits, BatchExportBar, SingleExportButton |
| `Step7Distribuicao.tsx` | ✅ Restaurado - Popover seleção, cores z-score, BatchExportBar, SingleExportButton |

### 2. Componentes Simplificados Criados (`src/components/reports/sections/`)

| Arquivo | Status |
|---------|--------|
| `AuditoriaStep3Section.tsx` | ✅ Criado - Somente tabela, PTAs fixas |
| `AuditoriaStep5Section.tsx` | ✅ Criado - Gráficos + tabela, PTAs fixas |
| `AuditoriaStep6Section.tsx` | ✅ Criado - Tabela + radar, grupos fixos |
| `AuditoriaStep7Section.tsx` | ✅ Criado - Barras pretas, sem seletor |

### 3. ReportSectionRenderer Atualizado

O `ReportSectionRenderer.tsx` agora usa os componentes simplificados para o relatório:
- `auditoria_step3` → `AuditoriaStep3Section`
- `auditoria_step4` → `AuditoriaStep5Section` (progressão)
- `auditoria_step5` → `AuditoriaStep6Section` (comparação)
- `auditoria_step7` → `AuditoriaStep7Section` (distribuição)

---

## Estrutura Final

```text
src/features/auditoria/steps/
├── Step3QuartisOverview.tsx    ← INTERATIVO (com seleção)
├── Step5Progressao.tsx         ← INTERATIVO (com filtros)
├── Step6ProgressCompare.tsx    ← INTERATIVO (com debug)
├── Step7Distribuicao.tsx       ← INTERATIVO (com seleção + cores)
└── ...

src/components/reports/sections/
├── HerdSummarySection.tsx
├── SegmentationSection.tsx
├── AuditoriaStep3Section.tsx   ← RELATÓRIO (só tabela)
├── AuditoriaStep5Section.tsx   ← RELATÓRIO (só gráficos)
├── AuditoriaStep6Section.tsx   ← RELATÓRIO (tabela + radar)
└── AuditoriaStep7Section.tsx   ← RELATÓRIO (barras pretas)
```
