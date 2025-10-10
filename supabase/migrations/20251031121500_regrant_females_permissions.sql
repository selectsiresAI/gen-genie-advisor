-- Restore females table grants and ensure farm helper functions run with the right privileges
set check_function_bodies = off;

create or replace function public.is_farm_member(farm_uuid uuid)
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
     where uf.farm_id = farm_uuid
       and uf.user_id = v_uid
  );
end;
$$;

create or replace function public.can_edit_farm(farm_uuid uuid)
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
     where uf.farm_id = farm_uuid
       and uf.user_id = v_uid
       and uf.role in ('owner', 'editor')
  );
end;
$$;

create or replace function public.is_farm_owner(farm_uuid uuid)
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
     where uf.farm_id = farm_uuid
       and uf.user_id = v_uid
       and uf.role = 'owner'
  );
end;
$$;

grant execute on function public.is_farm_member(uuid) to authenticated;
grant execute on function public.can_edit_farm(uuid) to authenticated;
grant execute on function public.is_farm_owner(uuid) to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.females to authenticated;

