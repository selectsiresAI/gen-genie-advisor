

## Revisao das PTAs com duas casas decimais

### Problema encontrado

A lista `DECIMAL_PTA_NAMES` em `src/utils/ptaFormat.ts` esta desatualizada em relacao aos labels reais usados no sistema (`animalMetrics.ts` e `usePTAStore.ts`). Isso faz com que algumas PTAs nao sejam formatadas com 2 casas decimais como deveriam.

### Inconsistencias identificadas

| PTA | Situacao |
|-----|----------|
| LIV | Falta na lista decimal - precisa adicionar |
| PTAT | Falta na lista decimal (existe "PTA Tipo" que nao bate apos normalizacao) |
| EFC | Falta na lista decimal - precisa adicionar |
| FUA | Na lista como "FA" mas label real e "FUA" - precisa corrigir |
| RUW | Falta na lista decimal - precisa adicionar |
| UDP | Na lista como "UD" mas label real e "UDP" - precisa corrigir |
| BD | Na lista decimal mas nao existe em animalMetrics (campo obsoleto?) |
| TW | Na lista decimal mas nao existe em animalMetrics (campo obsoleto?) |

### Plano de implementacao

**Arquivo**: `src/utils/ptaFormat.ts`

1. **Adicionar PTAs faltantes** a `DECIMAL_PTA_NAMES`:
   - `LIV`
   - `PTAT`
   - `EFC`
   - `RUW`

2. **Corrigir labels desatualizados**:
   - `"FA"` -> manter `"FA"` e adicionar tambem `"FUA"`
   - `"UD"` -> manter `"UD"` e adicionar tambem `"UDP"`
   - `"PTA Tipo"` -> manter e adicionar tambem `"PTAT"`

3. **Manter campos legados** (`BD`, `TW`) na lista para compatibilidade retroativa com dados antigos

### Detalhes tecnicos

A normalizacao `normalizePtaKey` remove espacos, `$` e `%` e converte para uppercase. Portanto:
- "PTA Tipo" normaliza para "PTATIPO" - nao bate com "PTAT" que normaliza para "PTAT"
- "FA" normaliza para "FA" - nao bate com "FUA"
- "UD" normaliza para "UD" - nao bate com "UDP"

A correcao e simples: adicionar os aliases corretos na lista `DECIMAL_PTA_NAMES`.

