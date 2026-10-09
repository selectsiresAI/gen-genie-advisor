-- 2026-10-09: adds Sophie Eaglen (Select Sires) to the Beta Tester list at Laura Gordon's request (WhatsApp 13:23).
-- Body taken from the LIVE function (production already returns active_seconds; the 20260928 file in this repo is behind).
CREATE OR REPLACE FUNCTION public.rordens_beta_tester_daily_report()
 RETURNS TABLE(email text, full_name text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, farms_count bigint, females_total bigint, active_seconds bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with tester_emails(email) as (
    values
      ('hwasmer@wws-bullen.de'),('l.santuari@cosapam.it'),('vpachitanu@genomix.ro'),
      ('supek@holstein-genetika.hu'),('bmamsen@wwsires.com'),('awaymire@wwsires.com'),
      ('BCoyne@selectsires.com'),('lschirm@wwsires.com'),('hvromans@wwsires.com'),
      ('gppaul@iafrica.com'),('joviedo@selectecuador.com'),('dromero@select-debernardi.com'),
      ('emily.middleton@mycentralstar.com'),('lboulet@selectsires.ca'),('jdrury@wwsaustralia.com'),
      ('szilagyi@holstein-genetika.hu'),('zdenek@mtssro.cz'),(
      'seaglen@selectsires.com')
  )
  select
    te.email,
    p.full_name,
    u.created_at,
    u.last_sign_in_at,
    coalesce((select count(distinct client_id) from public.user_farms where user_id = u.id), 0)::bigint as farms_count,
    coalesce((
      select sum(fcount.n) from (
        select f.client_id, count(*) as n from public.females f
        where f.client_id in (select client_id from public.user_farms where user_id = u.id)
          and f.deleted_at is null
        group by f.client_id
      ) fcount
    ), 0)::bigint as females_total,
    (
      select max(total_session_time_seconds) from public.user_activity_tracking
      where user_id = u.id and session_start::date = current_date
    )::bigint as active_seconds
  from tester_emails te
  left join auth.users u on lower(u.email) = lower(te.email)
  left join public.profiles p on p.id = u.id
  order by te.email;
$function$
;
