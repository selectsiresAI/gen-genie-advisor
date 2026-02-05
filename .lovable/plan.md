

# Plano: Simplificar Parentesco para Duas Categorias

## Objetivo
Mostrar apenas se a fazenda informou ou não o ancestral na planilha, removendo a complexidade sobre dados genéticos da plataforma.

---

## Mudanças

### `src/features/auditoria/steps/Step1Parentesco.tsx`

**Tipos atualizados:**
```typescript
type ParentStatus = "Informado" | "Não Informado";
```

**Mapeamento dos dados recebidos do RPC:**
- `"Desconhecido"` → `"Não Informado"`
- `"Incompleto"` → `"Informado"` (fazenda forneceu o NAAB)
- `"Completo"` → `"Informado"`

**Nova configuração de status:**
```typescript
const STATUS_INFO = {
  "Não Informado": {
    icon: <AlertTriangle />,
    color: "text-destructive",
    description: "O código NAAB do ancestral não foi informado na planilha de importação.",
    action: "Atualize a planilha de fêmeas incluindo o código NAAB do ancestral e reimporte os dados.",
  },
  "Informado": {
    icon: <CheckCircle2 />,
    color: "text-emerald-500",
    description: "O código NAAB do ancestral foi fornecido na planilha de importação.",
    action: "Nenhuma ação necessária.",
  },
};
```

**Consolidação dos dados:**
- Agrupar "Incompleto" + "Completo" em "Informado"
- Manter "Desconhecido" como "Não Informado"

**Legenda simplificada:**
```text
Como interpretar os dados de parentesco?

• Não Informado: O código NAAB do ancestral não consta na planilha de importação.
• Informado: O código NAAB do ancestral foi fornecido pela fazenda.
```

---

## Resultado Visual

| Antes | Depois |
|-------|--------|
| Desconhecido (vermelho) | Não Informado (vermelho) |
| Incompleto (amarelo) | → Agrupa em "Informado" |
| Completo (verde) | Informado (verde) |

---

## Lógica de Consolidação

```typescript
const consolidatedRows = useMemo(() => {
  const consolidated: Record<ParentRole, { informed: number; notInformed: number }> = {
    sire: { informed: 0, notInformed: 0 },
    mgs: { informed: 0, notInformed: 0 },
    mmgs: { informed: 0, notInformed: 0 },
  };
  
  rows.forEach((row) => {
    if (row.status === "Desconhecido") {
      consolidated[row.role].notInformed += row.n;
    } else {
      // "Incompleto" ou "Completo" = fazenda informou
      consolidated[row.role].informed += row.n;
    }
  });
  
  return consolidated;
}, [rows]);
```

---

## Arquivo Modificado

| Arquivo | Alteração |
|---------|-----------|
| `src/features/auditoria/steps/Step1Parentesco.tsx` | Simplificar para 2 categorias, consolidar dados |

