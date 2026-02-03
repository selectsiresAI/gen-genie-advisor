

# Plano: Restaurar Auditoria Genética e Criar Versões para Relatório

## Problema Identificado

Eu modifiquei incorretamente os componentes originais da Auditoria Genética:
- `Step3QuartisOverview.tsx` - Removido painel de seleção de PTAs
- `Step5Progressao.tsx` - Removidos filtros de categoria e opções
- `Step6ProgressCompare.tsx` - Removido painel de debug e badges de seleção
- `Step7Distribuicao.tsx` - Removido Popover de seleção e alterado visual

As simplificações deveriam aparecer **apenas no Relatório Geral**, não na interface interativa da Auditoria.

---

## Solução

### Estratégia: Dois Conjuntos de Componentes

1. **Componentes Interativos** (para Auditoria Genética)
   - Restaurar funcionalidades completas
   - Manter em `src/features/auditoria/steps/`

2. **Componentes Simplificados** (para Relatório Geral)
   - Criar versões novas em `src/components/reports/sections/`
   - Usar no `ReportSectionRenderer.tsx`

---

## Arquivos a Modificar/Criar

### 1. Restaurar Componentes Originais

| Arquivo | Ação |
|---------|------|
| `Step3QuartisOverview.tsx` | **Restaurar** - Adicionar painel de seleção de PTAs, botões, BatchExportBar |
| `Step5Progressao.tsx` | **Restaurar** - Adicionar filtros de categoria, checkboxes, cards de estatísticas |
| `Step6ProgressCompare.tsx` | **Restaurar** - Adicionar painel de debug, badges de seleção de grupos/PTAs |
| `Step7Distribuicao.tsx` | **Restaurar** - Adicionar Popover de seleção de PTAs, cores por z-score |

### 2. Criar Componentes para Relatório

| Arquivo | Ação |
|---------|------|
| `src/components/reports/sections/AuditoriaStep3Section.tsx` | **Criar** - Versão simplificada (só tabela) |
| `src/components/reports/sections/AuditoriaStep4Section.tsx` | **Criar** - Versão simplificada (só gráficos + tabela) |
| `src/components/reports/sections/AuditoriaStep5Section.tsx` | **Criar** - Versão simplificada (tabela + radar) |
| `src/components/reports/sections/AuditoriaStep7Section.tsx` | **Criar** - Versão simplificada (barras pretas, sem seletor) |

### 3. Atualizar ReportSectionRenderer

| Arquivo | Ação |
|---------|------|
| `ReportSectionRenderer.tsx` | **Modificar** - Usar novos componentes simplificados em vez dos originais |

---

## Detalhes da Restauração

### Step3QuartisOverview (Restaurar)
Funcionalidades a adicionar:
- Grid de 2 colunas: seleção à esquerda, tabela à direita
- Card de seleção com ScrollArea de checkboxes
- Botões "Selecionar todas" e "Limpar"
- Botão "Atualizar" para recarregar
- BatchExportBar e SingleExportButton

### Step5Progressao (Restaurar)
Funcionalidades a adicionar:
- Seletor de PTAs
- Filtros de categoria (Bezerra, Novilha, Primípara, etc.)
- Checkboxes "Mostrar média geral" e "Mostrar tendência"
- Cards de estatísticas por categoria
- BatchExportBar e SingleExportButton

### Step6ProgressCompare (Restaurar)
Funcionalidades a adicionar:
- Painel de debug (Fonte, Categoria, ID, Registros, etc.)
- Badges de seleção de grupos (A e B)
- Badges de seleção de PTAs para tabela
- Badges de seleção de PTAs para gráfico
- BatchExportBar e SingleExportButton

### Step7Distribuicao (Restaurar)
Funcionalidades a adicionar:
- Popover de seleção de PTAs com busca
- Botões "Todas" e "Limpar"
- Badges de PTAs selecionadas
- Cores dinâmicas por z-score
- BatchExportBar e SingleExportButton

---

## Estrutura Final

```text
src/features/auditoria/steps/
├── Step3QuartisOverview.tsx    ← INTERATIVO (com seleção)
├── Step5Progressao.tsx         ← INTERATIVO (com filtros)
├── Step6ProgressCompare.tsx    ← INTERATIVO (com debug)
├── Step7Distribuicao.tsx       ← INTERATIVO (com seleção)
└── ...

src/components/reports/sections/
├── HerdSummarySection.tsx
├── SegmentationSection.tsx
├── AuditoriaStep3Section.tsx   ← RELATÓRIO (só tabela)
├── AuditoriaStep4Section.tsx   ← RELATÓRIO (só gráficos)
├── AuditoriaStep5Section.tsx   ← RELATÓRIO (tabela + radar)
└── AuditoriaStep7Section.tsx   ← RELATÓRIO (barras pretas)
```

---

## ReportSectionRenderer Atualizado

```typescript
// Usar componentes simplificados para o relatório
import AuditoriaStep3Section from './sections/AuditoriaStep3Section';
import AuditoriaStep4Section from './sections/AuditoriaStep4Section';
import AuditoriaStep5Section from './sections/AuditoriaStep5Section';
import AuditoriaStep7Section from './sections/AuditoriaStep7Section';

// Map atualizado
const SECTION_COMPONENTS: Record<ReportType, ...> = {
  // ...outros
  auditoria_step3: AuditoriaStep3Section,  // ← Nova versão simplificada
  auditoria_step4: AuditoriaStep4Section,  // ← Nova versão simplificada
  auditoria_step5: AuditoriaStep5Section,  // ← Nova versão simplificada
  auditoria_step7: AuditoriaStep7Section,  // ← Nova versão simplificada
};
```

---

## Próximos Passos

Para restaurar os componentes originais, preciso acessar o histórico de versões. Você pode:

1. **Usar o histórico do Lovable**: Clicar em "History" no topo do chat e restaurar uma versão anterior dos arquivos
2. **Ou eu posso recriar**: Baseado no que sei dos arquivos originais, posso reconstruir as funcionalidades que foram removidas

Qual opção você prefere?

