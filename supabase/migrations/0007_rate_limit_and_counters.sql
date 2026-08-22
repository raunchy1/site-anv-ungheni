-- 0007 — limitare de rată, honeypot, contoare
-- Idempotentă. Rollback: supabase/rollback/0007_rate_limit_and_counters.down.sql
--
-- `orders` și `service_bookings` acceptă insert public (guest checkout, fără cont).
-- Fără protecție, oricine poate insera zece mii de comenzi false. Garda stă în bază,
-- nu în aplicație: o rută nouă adăugată din greșeală nu poate ocoli regula.

create table if not exists rate_limits (
  id           bigint generated always as identity primary key,
  ip           text not null,
  action       text not null,
  window_start timestamptz not null default date_trunc('hour', now()),
  n            int not null default 1,
  unique (ip, action, window_start)
);

create index if not exists rate_limits_window_idx on rate_limits (window_start);

/** IP-ul clientului, din anteturile pe care le pune PostgREST. Necunoscut => 'unknown'. */
create or replace function client_ip() returns text
language plpgsql stable as $$
declare h text;
begin
  h := coalesce(
    nullif(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), ''),
    current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
    'unknown');
  return trim(h);
exception when others then
  return 'unknown';
end $$;

/** Ridică excepție dacă IP-ul a depășit pragul în ora curentă. */
create or replace function enforce_rate_limit(p_action text, p_max int) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ip text := client_ip();
  v_n  int;
begin
  -- service_role (import, admin, seed) nu e limitat
  if coalesce(current_setting('request.jwt.claim.role', true), current_user) in ('service_role', 'postgres') then
    return;
  end if;

  insert into rate_limits (ip, action) values (v_ip, p_action)
  on conflict (ip, action, window_start) do update set n = rate_limits.n + 1
  returning n into v_n;

  if v_n > p_max then
    raise exception 'prea multe cereri: maximum % pe oră pentru %', p_max, p_action
      using errcode = 'check_violation';
  end if;
end $$;

/* ---------------------------------------------------------------- honeypot */
-- Un câmp pe care un om nu-l completează niciodată, pentru că nu-l vede.
-- Dacă vine plin, cererea e a unui bot: o respingem tăcut, ca la orice altă validare.
alter table orders           add column if not exists hp text;
alter table service_bookings add column if not exists hp text;

create or replace function guard_public_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.hp, '') <> '' then
    raise exception 'cerere respinsă' using errcode = 'check_violation';
  end if;
  perform enforce_rate_limit(tg_table_name, 3);
  return new;
end $$;

drop trigger if exists orders_guard on orders;
create trigger orders_guard before insert on orders
  for each row execute function guard_public_insert();

drop trigger if exists bookings_guard on service_bookings;
create trigger bookings_guard before insert on service_bookings
  for each row execute function guard_public_insert();

/* -------------------------------------------------------- contoare și facete */

/** Reîmprospătează contoarele de filtre. Se apelează la finalul fiecărui import.
    Un contor care minte tăcut e mai rău decât unul absent. */
create or replace function refresh_facet_counts() returns void
language plpgsql security definer set search_path = public as $$
begin
  refresh materialized view concurrently facet_counts;
end $$;

/** Numărul de produse active pe brand, folosit pe paginile de brand. */
create or replace function refresh_brand_counts() returns void
language plpgsql security definer set search_path = public as $$
begin
  update brands b set product_count = coalesce(c.n, 0)
  from (select brand_id, count(*)::int as n from products
        where is_active and brand_id is not null group by brand_id) c
  where b.id = c.brand_id;
  update brands set product_count = 0
  where id not in (select brand_id from products where is_active and brand_id is not null);
end $$;

/* ------------------------------------------------------------ curățenie */

/** Rândurile de rate limit mai vechi de o zi nu mai servesc la nimic. */
create or replace function prune_rate_limits() returns void
language sql security definer set search_path = public as $$
  delete from rate_limits where window_start < now() - interval '1 day';
$$;

alter table rate_limits enable row level security;
-- nicio politică publică: tabelul e vizibil doar cu service role
