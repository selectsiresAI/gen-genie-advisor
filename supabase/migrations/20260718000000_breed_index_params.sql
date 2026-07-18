-- ============================================================================
-- Breed-parameterized HHP$ (Holstein + Jersey) — Platform layer
-- ----------------------------------------------------------------------------
-- Turns the HHP$ index into a per-breed CONFIGURATION (data) instead of a
-- Holstein-hardcoded formula. Shared by ToolSS, ACC ToolSS and SSGEN Client.
--
-- Holstein and Jersey use DIFFERENT trait sets, so the params table holds the
-- UNION of every trait either breed uses (18 traits). A trait a breed does not
-- use has weight 0. The NULL-guard is per breed: only traits with a NON-ZERO
-- weight are required — so Jersey is not forced to have RFI/STA/etc. and
-- Holstein is not forced to have Type/DA/HeiferLivability.
--
-- HO : exact official 2025 weights → Holstein output byte-identical.
-- JE : official Jersey HHP$ weights (shared by Diego, 2026-07-18).
--      Fat 3.99 · Prot 7.44 · PL 19.46 · Liv 8.69 · SCS -206.13*(scs-3) ·
--      DPR 24.40 · CCR 20.02 · Type 16.03 · UdderDepth 20.04 · Mast 41.23 ·
--      DA 24.05 · HeiferLivability 39.00   (no RFI/STA/DF/RUW/RTP/TL, no abs-opt)
--
-- Rollout: sections 1-3 and 5 are ADDITIVE. Section 4 (trigger swap) is the
-- only behavior-changing step; apply after HO byte-equivalence is re-proven.
-- ============================================================================

-- 1) breed_index_params (union of all traits used by any breed) ---------------
create table if not exists public.breed_index_params (
  breed        text primary key,                 -- 'HO' | 'JE'
  label        text not null,                     -- 'Holstein' | 'Jersey'
  -- shared traits
  w_ptaf numeric not null default 0, w_ptap numeric not null default 0,
  w_pl   numeric not null default 0, w_liv  numeric not null default 0,
  w_scs  numeric not null default 0, w_dpr  numeric not null default 0,
  w_ccr  numeric not null default 0, w_udp  numeric not null default 0,
  w_mast numeric not null default 0,
  -- Holstein-only traits
  w_rfi  numeric not null default 0, w_sta  numeric not null default 0,
  w_dfm  numeric not null default 0, w_ruw  numeric not null default 0,
  w_rtp  numeric not null default 0, w_ftl  numeric not null default 0,
  -- Jersey-only traits
  w_ptat numeric not null default 0, w_da   numeric not null default 0,
  w_hliv numeric not null default 0,
  -- optimums / baselines (rtp & ftl use the abs-optimum transform; HO only)
  scs_base numeric not null default 3.0,
  rtp_opt  numeric not null default 0.65,
  ftl_opt  numeric not null default 0.50,
  -- frontend reference package (benchmarks + trend + labels) — ToolSS/SSGEN
  reference jsonb not null default '{}'::jsonb,
  is_placeholder boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.breed_index_params enable row level security;
drop policy if exists breed_index_params_read on public.breed_index_params;
create policy breed_index_params_read on public.breed_index_params
  for select to authenticated using (true);   -- read-only reference data

-- HO — exact official 2025 weights. DO NOT edit: keeps Holstein identical.
insert into public.breed_index_params
  (breed,label,
   w_ptaf,w_ptap,w_pl,w_liv,w_scs,w_dpr,w_ccr,w_udp,w_mast,
   w_rfi,w_sta,w_dfm,w_ruw,w_rtp,w_ftl,
   w_ptat,w_da,w_hliv,
   scs_base,rtp_opt,ftl_opt, is_placeholder,notes)
values
  ('HO','Holstein',
   4.91, 6.01, 12.83, 10.69, -158.56, 19.30, 15.84, 13.32, 25.37,
   -0.19, -13.32, -8.88, 8.88, -14.80, -26.64,
   0, 0, 0,
   3.0, 0.65, 0.50, false, 'Official HHP$ 2025 (HHP_Index_auto).')
on conflict (breed) do update set
   w_ptaf=excluded.w_ptaf, w_ptap=excluded.w_ptap, w_pl=excluded.w_pl, w_liv=excluded.w_liv,
   w_scs=excluded.w_scs, w_dpr=excluded.w_dpr, w_ccr=excluded.w_ccr, w_udp=excluded.w_udp,
   w_mast=excluded.w_mast, w_rfi=excluded.w_rfi, w_sta=excluded.w_sta, w_dfm=excluded.w_dfm,
   w_ruw=excluded.w_ruw, w_rtp=excluded.w_rtp, w_ftl=excluded.w_ftl,
   w_ptat=excluded.w_ptat, w_da=excluded.w_da, w_hliv=excluded.w_hliv,
   scs_base=excluded.scs_base, rtp_opt=excluded.rtp_opt, ftl_opt=excluded.ftl_opt,
   is_placeholder=excluded.is_placeholder, notes=excluded.notes, updated_at=now();

-- JE — official Jersey weights (Diego, 2026-07-18).
insert into public.breed_index_params
  (breed,label,
   w_ptaf,w_ptap,w_pl,w_liv,w_scs,w_dpr,w_ccr,w_udp,w_mast,
   w_rfi,w_sta,w_dfm,w_ruw,w_rtp,w_ftl,
   w_ptat,w_da,w_hliv,
   scs_base,rtp_opt,ftl_opt, is_placeholder,notes)
values
  ('JE','Jersey',
   3.99, 7.44, 19.46, 8.69, -206.13, 24.40, 20.02, 20.04, 41.23,
   0, 0, 0, 0, 0, 0,
   16.03, 24.05, 39.00,
   3.0, 0.65, 0.50, false, 'Official Jersey HHP$ (Diego 2026-07-18). Type/DA/HeiferLiv; no RFI/STA/DF/RUW/RTP/TL.')
on conflict (breed) do update set
   w_ptaf=excluded.w_ptaf, w_ptap=excluded.w_ptap, w_pl=excluded.w_pl, w_liv=excluded.w_liv,
   w_scs=excluded.w_scs, w_dpr=excluded.w_dpr, w_ccr=excluded.w_ccr, w_udp=excluded.w_udp,
   w_mast=excluded.w_mast, w_rfi=excluded.w_rfi, w_sta=excluded.w_sta, w_dfm=excluded.w_dfm,
   w_ruw=excluded.w_ruw, w_rtp=excluded.w_rtp, w_ftl=excluded.w_ftl,
   w_ptat=excluded.w_ptat, w_da=excluded.w_da, w_hliv=excluded.w_hliv,
   scs_base=excluded.scs_base, rtp_opt=excluded.rtp_opt, ftl_opt=excluded.ftl_opt,
   is_placeholder=excluded.is_placeholder, notes=excluded.notes, updated_at=now();

-- 2) breed normalizer (variants / null / garbage -> HO | JE) ------------------
create or replace function public.normalize_breed(p_breed text)
returns text language sql immutable as $$
  select case
    when p_breed is null then 'HO'
    when upper(btrim(p_breed)) in ('HO','HOL','HOLSTEIN') then 'HO'
    when upper(btrim(p_breed)) in ('JE','JER','JERSEY')   then 'JE'
    else 'HO'   -- unknown / dirty value -> Holstein (dominant breed)
  end;
$$;

-- 3) breed-aware HHP$ (STABLE: reads the params table) ------------------------
--    18 trait params (union). NULL only if a trait with NON-ZERO weight for the
--    breed is missing. Zero-weight traits contribute nothing and may be NULL.
create or replace function public.calculate_hhp_dollar_breed(
  p_breed text,
  p_ptaf numeric, p_ptap numeric, p_pl numeric, p_liv numeric,
  p_scs numeric, p_dpr numeric, p_ccr numeric, p_udp numeric, p_mast numeric,
  p_rfi numeric, p_sta numeric, p_dfm numeric, p_ruw numeric,
  p_rtp numeric, p_ftl numeric,
  p_ptat numeric, p_da numeric, p_hliv numeric
) returns numeric language plpgsql stable set search_path to 'public' as $function$
declare w public.breed_index_params%rowtype; result numeric;
begin
  select * into w from public.breed_index_params where breed = public.normalize_breed(p_breed);
  if not found then
    select * into w from public.breed_index_params where breed = 'HO';
  end if;

  -- Per-breed required-trait guard: only non-zero-weight traits are required.
  if (w.w_ptaf <> 0 and p_ptaf is null) or (w.w_ptap <> 0 and p_ptap is null)
     or (w.w_pl <> 0 and p_pl is null) or (w.w_liv <> 0 and p_liv is null)
     or (w.w_scs <> 0 and p_scs is null) or (w.w_dpr <> 0 and p_dpr is null)
     or (w.w_ccr <> 0 and p_ccr is null) or (w.w_udp <> 0 and p_udp is null)
     or (w.w_mast <> 0 and p_mast is null) or (w.w_rfi <> 0 and p_rfi is null)
     or (w.w_sta <> 0 and p_sta is null) or (w.w_dfm <> 0 and p_dfm is null)
     or (w.w_ruw <> 0 and p_ruw is null) or (w.w_rtp <> 0 and p_rtp is null)
     or (w.w_ftl <> 0 and p_ftl is null) or (w.w_ptat <> 0 and p_ptat is null)
     or (w.w_da <> 0 and p_da is null) or (w.w_hliv <> 0 and p_hliv is null) then
    return null;
  end if;

  result :=
      w.w_ptaf * coalesce(p_ptaf, 0)
    + w.w_ptap * coalesce(p_ptap, 0)
    + w.w_pl   * coalesce(p_pl, 0)
    + w.w_liv  * coalesce(p_liv, 0)
    + w.w_scs  * (coalesce(p_scs, 0) - w.scs_base)
    + w.w_dpr  * coalesce(p_dpr, 0)
    + w.w_ccr  * coalesce(p_ccr, 0)
    + w.w_udp  * coalesce(p_udp, 0)
    + w.w_mast * coalesce(p_mast, 0)
    + w.w_rfi  * coalesce(p_rfi, 0)
    + w.w_sta  * coalesce(p_sta, 0)
    + w.w_dfm  * coalesce(p_dfm, 0)
    + w.w_ruw  * coalesce(p_ruw, 0)
    + w.w_rtp  * (abs(coalesce(p_rtp, 0)) - w.rtp_opt)
    + w.w_ftl  * (abs(coalesce(p_ftl, 0)) - w.ftl_opt)
    + w.w_ptat * coalesce(p_ptat, 0)
    + w.w_da   * coalesce(p_da, 0)
    + w.w_hliv * coalesce(p_hliv, 0);

  return round(result, 0);
end;
$function$;

-- Legacy Holstein wrapper (backward compat for recompute-hhp & direct callers):
-- delegates to the breed engine as HO, with the Jersey-only traits absent.
create or replace function public.calculate_hhp_dollar(
  p_ptaf numeric, p_ptap numeric, p_pl numeric, p_liv numeric,
  p_scs numeric, p_dpr numeric, p_ccr numeric, p_rfi numeric,
  p_sta numeric, p_dfm numeric, p_ruw numeric, p_udp numeric,
  p_rtp numeric, p_ftl numeric, p_mast numeric
) returns numeric language sql stable set search_path to 'public' as $function$
  select public.calculate_hhp_dollar_breed(
    'HO',
    p_ptaf, p_ptap, p_pl, p_liv, p_scs, p_dpr, p_ccr, p_udp, p_mast,
    p_rfi, p_sta, p_dfm, p_ruw, p_rtp, p_ftl,
    null, null, null);
$function$;

-- ============================================================================
-- 4) TRIGGER SWAP — behavior-changing. Apply after HO byte-equivalence proof.
--    Same column mapping + null-preserve logic; adds NEW.breed and the three
--    Jersey traits (pta_ptat = Type, da = C_DA, h_liv = C_HeiferLivability).
-- ============================================================================
create or replace function public.trg_females_calc_hhp_dollar()
returns trigger language plpgsql set search_path to 'public' as $function$
declare v_calc numeric;
begin
  if NEW.hhp_dollar is null then
    v_calc := public.calculate_hhp_dollar_breed(
      NEW.breed,
      NEW.pta_fat, NEW.pta_protein, NEW.pta_pl, NEW.pta_livability, NEW.pta_scs,
      NEW.pta_dpr, NEW.pta_ccr, NEW.udp, NEW.mast,
      NEW.rfi, NEW.sta, NEW.dfm, NEW.ruw, NEW.rtp, NEW.ftl,
      NEW.pta_ptat, NEW.da, NEW.h_liv
    );
    if v_calc is null and TG_OP = 'UPDATE' and OLD.hhp_dollar is not null then
      NEW.hhp_dollar := OLD.hhp_dollar;
    else
      NEW.hhp_dollar := v_calc;
    end if;
  end if;
  return NEW;
end;
$function$;

create or replace function public.trg_bulls_calc_hhp_dollar()
returns trigger language plpgsql set search_path to 'public' as $function$
declare v_calc numeric;
begin
  if NEW.hhp_dollar is null then
    -- liv keeps the legacy COALESCE(pta_livability, h_liv) to preserve HO bull
    -- output. NOTE (Jersey edge): when a Jersey bull has pta_livability NULL,
    -- h_liv would feed both the liv slot (via coalesce) and the hliv slot.
    -- Flagged for domain review before enabling Jersey bull scoring.
    v_calc := public.calculate_hhp_dollar_breed(
      NEW.breed,
      NEW.pta_fat, NEW.pta_protein, NEW.pta_pl,
      COALESCE(NEW.pta_livability, NEW.h_liv), NEW.pta_scs,
      NEW.pta_dpr, COALESCE(NEW.pta_ccr, NEW.ccr_num), NEW.udp, NEW.mast,
      NEW.rfi, NEW.sta, NEW.dfm, NEW.ruw, NEW.rtp, NEW.ftl,
      NEW.pta_ptat, NEW.da, NEW.h_liv
    );
    if v_calc is null and TG_OP = 'UPDATE' and OLD.hhp_dollar is not null then
      NEW.hhp_dollar := OLD.hhp_dollar;
    else
      NEW.hhp_dollar := v_calc;
    end if;
  end if;
  return NEW;
end;
$function$;

-- 5) client-level default breed (onboarding flag) ----------------------------
-- Frontend onboarding sets this; per-animal females.breed remains the source of
-- truth for HHP$ computation and for reference-table selection.
alter table public.clients add column if not exists default_breed text;
