-- Criar tabela de registros genéticos
create table if not exists public.genetic_records (
  herd_id uuid not null references public.farms(id) on delete cascade,
  animal_id text,
  cdcb_id text,
  naab text,
  bull_name text,
  reg text,
  dob date,
  -- índices econômicos
  "hhp$" numeric, tpi numeric, "nm$" numeric, "cm$" numeric, "fm$" numeric, "gm$" numeric, f_sav numeric,
  -- produção
  ptam numeric, cfp numeric, ptaf numeric, "ptaf_pct" numeric,
  ptap numeric, "ptap_pct" numeric,
  -- saúde/fertilidade
  pl numeric, dpr numeric, liv numeric, scs numeric,
  mast numeric, met numeric, rp numeric, da numeric, ket numeric, mf numeric,
  -- tipo/lineares
  ptat numeric, udc numeric, flc numeric, sce numeric, dce numeric,
  ssb numeric, dsb numeric, "h_liv" numeric, ccr numeric, hcr numeric,
  fi numeric, gl numeric, efc numeric, bwc numeric, sta numeric, str numeric,
  dfm numeric, rua numeric, rls numeric,
  -- adicionais
  rtp numeric, ftl numeric, rw numeric, rlr numeric,
  fta numeric, fls numeric, fua numeric, ruh numeric, ruw numeric,
  ucl numeric, udp numeric, ftp numeric, rfi numeric,
  beta_casein text, "kappa_casein" text, gfi numeric,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (herd_id, animal_id, cdcb_id)
);

-- Trigger para updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_genrec_updated_at on public.genetic_records;
create trigger trg_genrec_updated_at
before update on public.genetic_records
for each row execute function public.set_updated_at();

-- Índices
create index if not exists idx_genrec_herd on public.genetic_records(herd_id);
create index if not exists idx_genrec_cdcb on public.genetic_records(cdcb_id);
create index if not exists idx_genrec_naab on public.genetic_records(naab);

-- RLS por fazenda
alter table public.genetic_records enable row level security;

drop policy if exists genrec_select on public.genetic_records;
create policy genrec_select on public.genetic_records
  for select using (
    exists(select 1 from public.user_farms uf
           where uf.user_id = auth.uid() and uf.farm_id = genetic_records.herd_id)
  );

drop policy if exists genrec_insert on public.genetic_records;
create policy genrec_insert on public.genetic_records
  for insert with check (
    exists(select 1 from public.user_farms uf
           where uf.user_id = auth.uid() and uf.farm_id = genetic_records.herd_id)
  );

drop policy if exists genrec_update on public.genetic_records;
create policy genrec_update on public.genetic_records
  for update using (
    exists(select 1 from public.user_farms uf
           where uf.user_id = auth.uid() and uf.farm_id = genetic_records.herd_id)
  );