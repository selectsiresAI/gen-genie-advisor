# HHP$ Holstein: correção de Heifer Livability e RFI (29/10/2026)

## Problema
O HHP$ de touros Holstein no ToolSS diferia do site da Select Sires (ex.: 007HO18254: 987 vs 1053).
A fórmula 2026 (`breed_index_params`, HO) usa 16 traits, incluindo `h_liv` (Heifer Livability, peso 24,60) e `rfi` (Residual Feed Intake, peso -0,12).
Só 40.038 de 299.482 touros tinham `h_liv`/`rfi`. `calculate_hhp_dollar_breed` devolve NULL sem esses traits e o trigger preserva o valor antigo, então o HHP$ ficou desatualizado (MAE ~28 contra o oficial).

## Validação
Com `h_liv`/`rfi` reais, a fórmula do banco reproduz o oficial (MAE 0,2). Colunas: UD = `udp`, DF = `dfm`, TL = `ftl`, CCR = `coalesce(pta_ccr, ccr_num)`.

## O que foi feito na Platform (`odactdxpecpiyiyaqfgi`)
1. **Valor oficial (29.585 touros):** `PtaHeiferLivability` e `PtaResidualFeedIntake` lidos do bull-search (`ss_pull.mjs` com `Filters: []`), gravados em `bulls.h_liv`/`bulls.rfi`, HHP$ recalculado. MAE contra o oficial: 32,26 -> 0,17.
2. **Aproximação (108.023 touros Holstein nascidos de 2000 a 2026 sem HLiv/RFI oficial):** HHP$ recalculado com a média de HLiv/RFI oficial da geração (ano de nascimento). `h_liv`/`rfi` continuam NULL (o estimado não se passa por oficial). Erro esperado ~±15 (desvio de HLiv ~0,5 e de RFI ~80-90 não é recuperável).
3. Teste em 46 touros: valor antigo MAE 27,9; zero 15,7; média da coorte 15,8; regressão 15,2.

## Tabelas de apoio (Platform)
- `_bk_bulls_hhp_20261029`: backup completo de `hhp_dollar`/`h_liv`/`rfi` antes da mudança. Reverter = update de `bulls` a partir dela.
- `_aprox_hhp_20261029`: auditoria de cada touro aproximado (`hhp_antigo`, `hhp_novo`, `hl_aprox`, `rfi_aprox`).
- `_cohort_hliv_rfi_20261029`: médias oficiais de HLiv/RFI por ano de nascimento (2000-2026), para aproximar touros novos.

## Fora do escopo (mantêm o valor antigo)
- 81.949 Holstein nascidos antes de 2000, 92 sem data de nascimento e 3.238 com data 2027+ (provável data errada).
- Touros de outras raças.
- Tabela `females` (mesmo problema de HLiv/RFI vazios, não tocada).
- Touros novos sem HLiv/RFI: o trigger não calcula e preserva o valor da carga. Rodar de novo o bull-search periodicamente ou aproximar pela coorte.
