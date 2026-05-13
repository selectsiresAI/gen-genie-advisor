## Objetivo

Criar dois touros "fantasma" no `bulls` que substituem MGS / MGGS quando o usuário deixa o NAAB em branco no Nexus 2:

- **007HO00001** — substitui MGS ausente → médias dos touros nascidos em **2020**
- **007HO00002** — substitui MGGS ausente → médias dos touros nascidos em **2017**

Ambos ocultos do catálogo (`ativo = false`) e recalculados automaticamente quando novos touros forem importados.

---

## 1. Banco de dados (migration)

### 1a. Função SQL `recalc_placeholder_bulls()`
- `SECURITY DEFINER`, `SET search_path = public`.
- Para cada par (NAAB, ano):
  - Calcula `AVG(coluna)` em todos os `bulls` com `EXTRACT(YEAR FROM birth_date) = <ano>` AND `ativo = true` (todas as raças, conforme escolha).
  - Faz `UPDATE bulls SET pta_*, nm_dollar, hhp_dollar, ... = avg(...)` para o registro com aquele `naab_code`.
  - Cobre todas as colunas numéricas de PTA usadas em `PREDICTION_TRAITS` (mapeadas para colunas reais: `pta_milk`, `pta_fat`, `pta_protein`, `pta_pl`, `pta_scs`, `pta_dpr`, `pta_hcr`, `pta_ccr`, `pta_livability`, `pta_sce`, `pta_sire_sce`, `pta_type`, `pta_udc`, `pta_flc`, `pta_bdc`, `tpi`, `nmpf`, `cheese_merit`, `fluid_merit`, `grazing_merit`, `hhp_dollar`, `nm_dollar`, `cm_dollar`, `fm_dollar`, `gm_dollar`, `f_sav`, `cfp`, `mast`, `met`, `rp`, `da`, `ket`, `mf_num`, `h_liv`, `ccr_num`, `hcr_num`, `fi`, `gl`, `bwc`, `sta`, `str_num`, `dfm`, `rua`, `rls`, `rtp`, `ftl`, `rw`, `rlr`, `fta`, `fls`, `fua`, `ruh`, `ruw`, `ucl`, `udp`, `ftp`, `rfi`, `gfi`, `ssb`, `dsb`).

### 1b. Inserir os dois touros (idempotente)
```
INSERT INTO bulls (naab_code, name, short_name, breed, birth_date, ativo, company)
VALUES
  ('007HO00001', 'Média Geração 2020 (MGS Placeholder)', 'AVG2020', 'HO', '2020-01-01', false, 'SSB Internal'),
  ('007HO00002', 'Média Geração 2017 (MGGS Placeholder)', 'AVG2017', 'HO', '2017-01-01', false, 'SSB Internal')
ON CONFLICT DO NOTHING;

SELECT recalc_placeholder_bulls();
```

### 1c. Trigger de recálculo
- Trigger `AFTER INSERT OR UPDATE OF birth_date, pta_milk, ... ON bulls` que dispara `recalc_placeholder_bulls()` quando `NEW.birth_date` cai em 2017 ou 2020 e `NEW.naab_code NOT IN ('007HO00001','007HO00002')`. Para evitar custo em importações grandes, usar `STATEMENT`-level trigger com flag/condição.
- Alternativa mais barata e suficiente: apenas o cron diário (1d). Recomendado: **só cron** (mais simples, não trava import). Confirmar no item de questão.

### 1d. Cron job (pg_cron + pg_net)
- Executa `SELECT public.recalc_placeholder_bulls();` diariamente (ex.: 03:00 UTC). Inserido via tool `insert` (não via migration, conforme política de cron com chaves).

---

## 2. Frontend — Nexus 2

### 2a. `src/services/prediction.service.ts`
Sem mudança lógica na fórmula. Adicionar constantes:
```ts
export const MGS_PLACEHOLDER_NAAB = '007HO00001';
export const MGGS_PLACEHOLDER_NAAB = '007HO00002';
```

### 2b. `src/components/nexus2/Nexus2PredictionBatch.tsx` (linhas 619-644) e `Nexus2PredictionIndividual.tsx`
Quando o NAAB de MGS / MGGS está **vazio** (não inválido — apenas em branco), buscar o placeholder e usar no lugar:

```ts
// Pré-carregar uma vez no início de processRows()
const [mgsPlaceholder, mggsPlaceholder] = await Promise.all([
  getBullByNaab(MGS_PLACEHOLDER_NAAB).then(mapBullRecord),
  getBullByNaab(MGGS_PLACEHOLDER_NAAB).then(mapBullRecord),
]);

// Na composição da linha:
const mgs = row.naabAvoMaterno
  ? (bullCache.get(row.naabAvoMaterno) ?? null)
  : mgsPlaceholder;

const mmgs = row.naabBisavoMaterno
  ? (bullCache.get(row.naabBisavoMaterno) ?? null)
  : mggsPlaceholder;
```

- Não emitir erro `mgsNotFound` / `mmgsNotFound` quando o campo veio em branco.
- Marcar a linha (`row.usedPlaceholder = { mgs: bool, mmgs: bool }`) para exibir badge "MGS médio 2020" / "MGGS médio 2017" na tabela de resultados.
- Na exportação (`buildResultExportRows`) e insert (`buildResultInsertRows`), continuar gravando `mgs_naab`/`mmgs_naab` como string vazia (não persistir o NAAB do placeholder na fêmea — ele é só um auxiliar de cálculo).

### 2c. UI
- Adicionar nota informativa no topo do Nexus 2 explicando que campos MGS/MGGS em branco usarão a média geracional 2020/2017.
- Pequeno badge na coluna correspondente quando placeholder foi usado.

---

## 3. Escopo intencionalmente fora

- Plano de Acasalamento, Auditoria, ROI etc. **não** consultam esses placeholders (conforme escolha "Apenas no Nexus 2").
- Os touros não aparecem no catálogo / busca porque `ativo = false` e os componentes de listagem já filtram por `ativo = true` (validar no `BullSearchPage` rapidamente; se não filtrar, adicionar filtro).

---

## 4. Memória do projeto

Atualizar `mem://features/nexus/nexus2-pedigree-calculation`:
- Quando MGS está em branco → usa 007HO00001 (média 2020).
- Quando MGGS está em branco → usa 007HO00002 (média 2017).
- Recalculado por cron diário via `recalc_placeholder_bulls()`.
- Substitui a regra antiga de "redistribuir pesos quando vazio".

---

## 5. Validação

1. Após migration, rodar `SELECT naab_code, tpi, nm_dollar, hhp_dollar FROM bulls WHERE naab_code IN ('007HO00001','007HO00002');` e comparar com `SELECT AVG(tpi), AVG(nm_dollar), AVG(hhp_dollar) FROM bulls WHERE EXTRACT(YEAR FROM birth_date) IN (2017,2020) GROUP BY EXTRACT(YEAR FROM birth_date);`.
2. Subir uma planilha de teste no Nexus 2 com MGS vazio → conferir que predição é gerada e badge aparece.
3. Confirmar que `BullSearchPage` não exibe os dois NAABs.
