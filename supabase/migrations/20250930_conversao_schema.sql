create table if not exists canonical_columns (
  id uuid primary key default gen_random_uuid(),
  canonical_key text unique not null,
  label_pt text,
  label_en text,
  datatype text check (datatype in ('number','percent','string','date')),
  unit text,
  category text check (category in ('PTA','indice','meta','sensor')),
  created_at timestamptz default now()
);

create table if not exists column_alias_rules (
  id uuid primary key default gen_random_uuid(),
  canonical_key text references canonical_columns(canonical_key) on delete cascade,
  pattern text not null,
  strategy text not null,
  similarity_threshold numeric,
  priority int default 100,
  locale text,
  created_at timestamptz default now()
);

create table if not exists source_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  farm_id uuid,
  name text not null,
  scope text check (scope in ('global','private')) default 'private',
  owner uuid,
  created_at timestamptz default now()
);

create table if not exists profile_mappings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references source_profiles(id) on delete cascade,
  alias_original text not null,
  canonical_key text not null references canonical_columns(canonical_key) on delete cascade,
  confidence numeric,
  source_hint text,
  created_at timestamptz default now()
);

create table if not exists conversion_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references source_profiles(id) on delete set null,
  dataset_name text,
  mapped_count int default 0,
  ambiguous_count int default 0,
  ignored_count int default 0,
  inventory jsonb,
  mappings jsonb,
  created_by uuid,
  created_at timestamptz default now()
);
