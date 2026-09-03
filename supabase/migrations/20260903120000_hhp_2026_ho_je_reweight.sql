-- ============================================================================
-- HHP$ 2026 reweight (Holstein + Jersey) — updates breed_index_params only.
-- ----------------------------------------------------------------------------
-- Source: "HHP 2026 HO+JE.xlsx" (Select Sires, provided by Diego 2026-09-03).
-- No schema change: w_hliv and w_da columns already existed in breed_index_params
-- (unused, weight 0) — this migration only changes the weight values.
--
-- HOLSTEIN: 15 -> 16 traits. Gains Heifer Livability (w_hliv 0 -> 24.60), now a
-- REQUIRED trait for HO (calculate_hhp_dollar_breed's per-breed null-guard only
-- requires non-zero-weight traits). Rows missing pta_livability's sibling h_liv
-- will keep their previously-computed hhp_dollar (recompute_hhp_batch preserves
-- existing values when the new result is NULL) until that data arrives.
--
-- JERSEY: 12 -> 11 traits. Drops DA/Displaced Abomasum (w_da 24.05 -> 0) — no
-- longer required to compute Jersey HHP$. All other Jersey weights recalculated.
-- ============================================================================

update public.breed_index_params set
  w_ptaf = 3.97, w_ptap = 8.61, w_pl = 8.31, w_liv = 11.63, w_scs = -136.62,
  w_dpr = 24.00, w_ccr = 17.20, w_udp = 8.88, w_mast = 23.68,
  w_rfi = -0.12, w_sta = -13.32, w_dfm = -13.32, w_ruw = 8.88,
  w_rtp = -14.80, w_ftl = -26.64,
  w_ptat = 0, w_da = 0, w_hliv = 24.60,
  notes = 'HHP$ 2026 (HHP 2026 HO+JE.xlsx, Select Sires, 2026-09-03). Adds Heifer Livability; all weights recalculated.',
  updated_at = now()
where breed = 'HO';

update public.breed_index_params set
  w_ptaf = 3.99, w_ptap = 8.06, w_pl = 13.90, w_liv = 8.69, w_scs = -274.84,
  w_dpr = 20.91, w_ccr = 17.16, w_udp = 20.04, w_mast = 42.09,
  w_rfi = 0, w_sta = 0, w_dfm = 0, w_ruw = 0, w_rtp = 0, w_ftl = 0,
  w_ptat = 20.61, w_da = 0, w_hliv = 39.00,
  notes = 'HHP$ 2026 Jersey (HHP 2026 HO+JE.xlsx, Select Sires, 2026-09-03). Drops DA (Displaced Abomasum); all other weights recalculated.',
  updated_at = now()
where breed = 'JE';
