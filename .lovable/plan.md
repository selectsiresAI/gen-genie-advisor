
## Diagnóstico

A função SQL `public.calculate_hhp_dollar` que alimenta `females.hhp_dollar` e `bulls.hhp_dollar` está com coeficientes diferentes da planilha oficial enviada (`HHP_Index_auto_2.xlsx`). Isso explica os valores estranhos (ex.: HHP$ −1397 com NM$ 120, +2366 com NM$ 264). O culpado dominante é o peso do RFI (atual −16,67; correto −0,19 — quase 90× maior do que deveria).

### Comparação coeficiente a coeficiente

| Trait (col Excel) | Fórmula correta (planilha) | Fórmula atual (banco) | Ação |
|---|---|---|---|
| PTA Fat (B) | `4,91 · ptaf` | `3,80 · ptaf` | trocar |
| PTA Pro (C) | `6,01 · ptap` | `6,44 · ptap` | trocar |
| PTA PL (D) | `12,83 · pl` | `13,80 · pl` | trocar |
| PTA Livability (E) | `10,69 · liv` | `7,41 · liv` | trocar |
| PTA SCS (F) | `−158,56 · (scs − 3)` (sinal mantido) | `30,20 · clamp(−(scs−2,5), 0)` | trocar fórmula e centro (2,5→3) |
| PTA DPR (G) | `19,30 · dpr` | `6,82 · dpr` | trocar |
| CCR (H) | `15,84 · ccr` | `3,50 · ccr` | trocar |
| RFI (I) | `−0,19 · rfi` | `−16,67 · rfi` | **trocar (principal causa)** |
| STA (J) | `−13,32 · sta` | `+7,69 · sta` | trocar sinal e magnitude |
| DF / DFM (K) | `−8,88 · dfm` | `+3,85 · dfm` | trocar sinal e magnitude |
| RUW (L) | `8,88 · ruw` | `3,85 · ruw` | trocar |
| UD / UDP (M) | `13,32 · udp` | `11,54 · udp` | trocar |
| RTP (N) | `−14,80 · (ABS(rtp) − 0,65)` | `−7,69 · ABS(rtp − 2,30)` | trocar (centro 0, não 2,3) |
| TL / FTL (O) | `−26,64 · (ABS(ftl) − 0,5)` | `−7,69 · ABS(ftl − 0,5)` | trocar (centro 0, não 0,5) |
| Mastitis (P) | `+25,37 · mast` | `−4,00 · mast` | trocar sinal e magnitude |

### Tratamento de traits ausentes

O card "Traits requeridos para cálculo do HHP$" já diz: *"Traits ausentes resultam em HHP$ vazio."* Hoje o SQL usa `COALESCE(..., 0)` → trata ausente como zero, o que distorce o índice. Vai passar a retornar **NULL** se qualquer um dos 15 traits estiver ausente.

## Mudanças

1. **Recriar `public.calculate_hhp_dollar(...)`** com:
   - Os 15 coeficientes corretos exatamente como na planilha.
   - SCS: `−158,56 · (scs − 3)` (sem clamp, sem abs).
   - RTP: `−14,8 · (ABS(rtp) − 0,65)`.
   - FTL: `−26,64 · (ABS(ftl) − 0,5)`.
   - Retorno `NULL` se qualquer um dos 15 parâmetros for `NULL` (sem `COALESCE`).
   - `ROUND(result, 0)` no fim, mantendo `SECURITY DEFINER` + `search_path = public`.

2. **Manter triggers existentes** `trg_females_hhp_dollar` e `trg_bulls_hhp_dollar` (já leem das colunas top-level corretas). Eles passam a chamar automaticamente a função corrigida; nenhuma mudança de trigger necessária.

3. **Backfill** em `public.females` e `public.bulls`:
   - `UPDATE … SET hhp_dollar = NULL`
   - `UPDATE … SET updated_at = now()` → reativa o trigger e recalcula todos os HHP$ com a nova fórmula. Linhas sem os 15 traits ficarão com HHP$ vazio (esperado).

4. **Memória do projeto** `mem://infrastructure/hhp-dollar-auto-calculation-v2025` atualizada com os coeficientes oficiais para referência futura.

## Validação após aplicar

- Conferir 3 fêmeas onde temos todos os 15 traits — recalcular HHP$ manualmente com a planilha e comparar.
- Conferir distribuição: spread de HHP$ deve ficar muito mais próximo de NM$ (não mais ±1500 puxado pelo RFI).
- Fêmeas sem algum dos 15 traits devem aparecer com HHP$ vazio na tabela do rebanho.

## Fora do escopo

- Front-end (formatação, gráficos, filtros) — sem mudanças, já consome `hhp_dollar` direto.
- Pesos do TPI, NM$ ou outros índices — não tocar.
