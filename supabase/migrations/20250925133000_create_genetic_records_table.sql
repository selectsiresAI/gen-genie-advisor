-- Genetic records canonical storage for PTA importer
-- Ensures Supabase has the table/indices/policies referenced by the uploader UI.

create table if not exists public.genetic_records (
  herd_id uuid not null,
  entity_id uuid,
  profile_id uuid,
  import_batch_id text,
  animal_id text not null,
  farm_name text,
  cdcb_id text not null,
  naab text not null,
  bull_name text,
  reg text,
  dob date,
  "hhp$" numeric,
  tpi numeric,
  "nm$" numeric,
  "cm$" numeric,
  "fm$" numeric,
  "gm$" numeric,
  f_sav numeric,
  ptam numeric,
  cfp numeric,
  ptaf numeric,
  ptaf_pct numeric,
  ptap numeric,
  ptap_pct numeric,
  pl numeric,
  dpr numeric,
  liv numeric,
  scs numeric,
  mast numeric,
  met numeric,
  rp numeric,
  da numeric,
  ket numeric,
  mf numeric,
  ptat numeric,
  udc numeric,
  flc numeric,
  sce numeric,
  dce numeric,
  ssb numeric,
  dsb numeric,
  h_liv numeric,
  ccr numeric,
  hcr numeric,
  fi numeric,
  gl numeric,
  efc numeric,
  bwc numeric,
  sta numeric,
  str numeric,
  dfm numeric,
  rua numeric,
  rls numeric,
  rtp numeric,
  ftl numeric,
  rw numeric,
  rlr numeric,
  fta numeric,
  fls numeric,
  fua numeric,
  ruh numeric,
  ruw numeric,
  ucl numeric,
  udp numeric,
  ftp numeric,
  rfi numeric,
  beta_casein numeric,
  kappa_casein numeric,
  gfi numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (herd_id, animal_id, cdcb_id, naab)
);

create index if not exists idx_genetic_records_herd on public.genetic_records (herd_id);
create index if not exists idx_genetic_records_cdcb on public.genetic_records (cdcb_id);
create index if not exists idx_genetic_records_naab on public.genetic_records (naab);
create index if not exists idx_genetic_records_import_batch on public.genetic_records (import_batch_id);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

alter table public.genetic_records enable row level security;

drop policy if exists "genetic_records_tenant_select" on public.genetic_records;

create policy "genetic_records_tenant_select" on public.genetic_records
  for select
  using (
    auth.uid() in (
      select user_id from public.user_herd_access where herd_id = genetic_records.herd_id
    )
  );

drop policy if exists "genetic_records_tenant_insert" on public.genetic_records;

create policy "genetic_records_tenant_insert" on public.genetic_records
  for insert
  with check (
    auth.uid() in (
      select user_id from public.user_herd_access where herd_id = genetic_records.herd_id
    )
  );

drop policy if exists "genetic_records_tenant_update" on public.genetic_records;

create policy "genetic_records_tenant_update" on public.genetic_records
  for update
  using (
    auth.uid() in (
      select user_id from public.user_herd_access where herd_id = genetic_records.herd_id
    )
  )
  with check (
    auth.uid() in (
      select user_id from public.user_herd_access where herd_id = genetic_records.herd_id
    )
  );

drop trigger if exists genetic_records_set_updated_at on public.genetic_records;

create trigger genetic_records_set_updated_at
  before update on public.genetic_records
  for each row
  execute procedure public.set_current_timestamp_updated_at();
