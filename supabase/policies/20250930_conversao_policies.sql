alter table canonical_columns enable row level security;
alter table column_alias_rules enable row level security;
alter table source_profiles enable row level security;
alter table profile_mappings enable row level security;
alter table conversion_runs enable row level security;

create policy "read canonical_columns"
on canonical_columns for select
to authenticated using (true);

create policy "write canonical_columns admin only"
on canonical_columns for all
to authenticated using (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

create policy "read source_profiles by owner"
on source_profiles for select
to authenticated using (owner = auth.uid());

create policy "insert source_profiles by owner"
on source_profiles for insert
to authenticated with check (owner = auth.uid());

create policy "read profile_mappings by profile"
on profile_mappings for select
to authenticated using (exists (
  select 1 from source_profiles
  where source_profiles.id = profile_mappings.profile_id
    and source_profiles.owner = auth.uid()
));

create policy "insert profile_mappings by profile"
on profile_mappings for insert
to authenticated with check (exists (
  select 1 from source_profiles
  where source_profiles.id = profile_mappings.profile_id
    and source_profiles.owner = auth.uid()
));

create policy "read conversion_runs by profile"
on conversion_runs for select
to authenticated using (profile_id is null or exists (
  select 1 from source_profiles
  where source_profiles.id = conversion_runs.profile_id
    and source_profiles.owner = auth.uid()
));

create policy "insert conversion_runs by profile"
on conversion_runs for insert
to authenticated with check (profile_id is null or exists (
  select 1 from source_profiles
  where source_profiles.id = conversion_runs.profile_id
    and source_profiles.owner = auth.uid()
));
