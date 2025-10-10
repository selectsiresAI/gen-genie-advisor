-- Harden farm membership helpers and restore client permissions for females writes
create or replace function public.has_farm_membership()
returns boolean
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  return exists (
    select 1
      from public.user_farms uf
     where uf.user_id = v_uid
  );
end;
$$;

create or replace function public.is_member_of_farm(_farm_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  return exists (
    select 1
      from public.user_farms uf
     where uf.farm_id = _farm_id
       and uf.user_id = v_uid
  );
end;
$$;

grant execute on function public.has_farm_membership() to authenticated;
grant execute on function public.is_member_of_farm(uuid) to authenticated;

grant select, insert, update, delete on table public.females to authenticated;
