-- RORDENS: daily WhatsApp report for the fixed list of 17 ToolSS Beta Tester
-- accounts created 2026-09-28. List is intentionally hardcoded (Diego's request:
-- "apenas dos usuarios que cadastramos hoje os Beta Testers do ToolSS").
create or replace function public.rordens_beta_tester_daily_report()
returns table (
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  farms_count bigint,
  females_total bigint
)
language sql
security definer
set search_path to 'public'
as $$
  with tester_emails(email) as (
    values
      ('hwasmer@wws-bullen.de'),('l.santuari@cosapam.it'),('vpachitanu@genomix.ro'),
      ('supek@holstein-genetika.hu'),('bmamsen@wwsires.com'),('awaymire@wwsires.com'),
      ('BCoyne@selectsires.com'),('lschirm@wwsires.com'),('hvromans@wwsires.com'),
      ('gppaul@iafrica.com'),('joviedo@selectecuador.com'),('dromero@select-debernardi.com'),
      ('emily.middleton@mycentralstar.com'),('lboulet@selectsires.ca'),('jdrury@wwsaustralia.com'),
      ('szilagyi@holstein-genetika.hu'),('zdenek@mtssro.cz')
  )
  select
    te.email,
    p.full_name,
    u.created_at,
    u.last_sign_in_at,
    count(distinct uf.client_id) as farms_count,
    coalesce(sum(fc.n_females), 0)::bigint as females_total
  from tester_emails te
  left join auth.users u on lower(u.email) = lower(te.email)
  left join public.profiles p on p.id = u.id
  left join public.user_farms uf on uf.user_id = u.id
  left join (
    select client_id, count(*) as n_females from public.females where deleted_at is null group by client_id
  ) fc on fc.client_id = uf.client_id
  group by te.email, p.full_name, u.created_at, u.last_sign_in_at
  order by te.email;
$$;

revoke all on function public.rordens_beta_tester_daily_report() from public, anon, authenticated;
grant execute on function public.rordens_beta_tester_daily_report() to service_role;
