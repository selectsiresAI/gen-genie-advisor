-- Secure bulls_denorm by enforcing row level security for farm members only
-- Addressing security report about public readability

-- Ensure the view/table enforces RLS for every query
alter table if exists public.bulls_denorm enable row level security;
alter table if exists public.bulls_denorm force row level security;

-- Remove any permissive grants that could bypass RLS
revoke all on table public.bulls_denorm from anon;
revoke all on table public.bulls_denorm from public;

-- Make sure authenticated users keep the minimum required privileges
grant select on table public.bulls_denorm to authenticated;

do $$
begin
  if exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'bulls_denorm'
  ) then
    execute (
      select string_agg(
        format('drop policy if exists %I on public.bulls_denorm;', polname),
        ' '
      )
      from pg_policies
     where schemaname = 'public'
       and tablename = 'bulls_denorm'
    );
  end if;
end;
$$;

-- Allow only authenticated farm members (or admins) to read the data
create policy "Authenticated farm members can read bulls_denorm"
on public.bulls_denorm
for select
using (
  auth.uid() is not null
  and (
    public.is_admin()
    or (
      farm_id is not null
      and public.is_farm_member(farm_id)
    )
  )
);
