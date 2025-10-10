-- Harden is_member_of_farm to avoid permission errors when evaluating RLS
create or replace function public.is_member_of_farm(_farm_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
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

grant execute on function public.is_member_of_farm(uuid) to authenticated;
