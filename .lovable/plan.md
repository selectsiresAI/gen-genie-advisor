

# Plano: Resumo do Rebanho com Explicação do Percentil

## Objetivo
Implementar a seção "Resumo do Rebanho" com KPI Cards modernos e incluir uma **legenda explicativa** sobre o significado da porcentagem.

---

## Texto Explicativo a Adicionar

Incluir uma nota abaixo do título da seção de KPI Cards:

> **Percentil Interno:** A porcentagem indica a posição relativa da média do rebanho. Um valor de 70% significa que a média está entre os 30% melhores animais do próprio rebanho para aquela característica.

---

## Layout Visual com Legenda

```text
┌──────────────────────────────────────────────────────────────────────┐
│  RESUMO DO REBANHO                                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────── CONTAGEM POR CATEGORIA ───────────┐                   │
│  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ... │                   │
│  │ │ TOTAL │ │BEZERR.│ │NOVILH.│ │PRIMÍP.│     │                   │
│  │ │  271  │ │   71  │ │  143  │ │   57  │     │                   │
│  │ └───────┘ └───────┘ └───────┘ └───────┘     │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                      │
│  ┌─────────── MÉDIAS GERAIS DO REBANHO ─────────┐                   │
│  │                                               │                   │
│  │  ℹ️ Percentil Interno: A % indica a posição  │  ← LEGENDA        │
│  │     da média em relação ao próprio rebanho.  │                   │
│  │     70% = média entre os 30% melhores.       │                   │
│  │                                               │                   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ...  │                   │
│  │  │  ╭──╮   │  │  ╭──╮   │  │  ╭──╮   │       │                   │
│  │  │ │65%│   │  │ │72%│   │  │ │48%│   │       │                   │
│  │  │  ╰──╯   │  │  ╰──╯   │  │  ╰──╯   │       │                   │
│  │  │  HHP$   │  │   TPI   │  │   NM$   │       │                   │
│  │  │  1,250  │  │  2,890  │  │   850   │       │                   │
│  │  └─────────┘  └─────────┘  └─────────┘       │                   │
│  │                                               │                   │
│  └───────────────────────────────────────────────┘                   │
│                                                                      │
│  ┌─────────── MÉDIAS POR CATEGORIA ─────────────┐                   │
│  │  Tabela com valores reais formatados          │                   │
│  └───────────────────────────────────────────────┘                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Componente de Legenda

```tsx
function PercentileExplanation() {
  return (
    <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">Percentil Interno:</span>{' '}
        A porcentagem indica a posição da média do rebanho em relação aos próprios animais. 
        Um valor de 70% significa que a média está entre os 30% melhores do rebanho para aquela característica.
      </p>
    </div>
  );
}
```

---

## Estrutura Completa da Seção

1. **Título**: "Resumo do Rebanho"
2. **Cards de Contagem**: Total, Bezerras, Novilhas, Primíparas, Secundíparas, Multíparas
3. **Subtítulo**: "Médias Gerais do Rebanho"
4. **Legenda Explicativa**: Texto sobre o percentil interno
5. **Grid de KPI Cards**: Até 14 cards com RadialBarChart
6. **Subtítulo**: "Médias por Categoria"
7. **Tabela de Médias**: Valores formatados por categoria

---

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/reports/ReportSectionRenderer.tsx` | Substituir `HerdSummarySection` pelo componente completo com legenda explicativa, KPI cards e tabela de médias |

---

## Resultado Esperado

O leitor do relatório PDF verá:
- Uma explicação clara do que significa a porcentagem
- Cards visuais modernos com gráficos radiais
- Valores reais formatados para referência
- Contagem e médias por categoria

