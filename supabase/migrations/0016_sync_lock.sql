-- 0016 — blocaj de execuție și pulsul sincronizării
-- Idempotentă. Rollback: supabase/rollback/0016_sync_lock.down.sql

/*
 * BLOCAJUL. Două rulări simultane nu trebuie să existe niciodată: cronul la 3 ore
 * și cel săptămânal se pot suprapune, o rulare lentă se poate încăleca peste
 * următoarea, iar două procese care importă în paralel același ID ar crea două
 * produse înainte ca indexul unic să apuce să le oprească.
 *
 * Nu se folosește `pg_advisory_lock`: peste PostgREST fiecare cerere e altă
 * sesiune, deci lacătul ar cădea imediat. Aici lacătul e un rând cu termen de
 * expirare — o rulare care moare fără să elibereze nu blochează sistemul pe veci.
 */
create table if not exists sync_lock (
  id          boolean primary key default true check (id),
  locked_at   timestamptz,
  locked_by   text,
  expires_at  timestamptz
);
insert into sync_lock (id) values (true) on conflict (id) do nothing;

/*
 * Ia lacătul dacă e liber sau expirat. Întoarce true dacă l-a luat.
 * `update ... where` e atomic: două apeluri simultane, unul singur câștigă.
 */
create or replace function sync_lock_acquire(p_by text, p_minutes int default 20)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  update sync_lock
     set locked_at = now(), locked_by = p_by, expires_at = now() + make_interval(mins => p_minutes)
   where id = true
     and (locked_at is null or expires_at < now())
  returning true into v_ok;
  return coalesce(v_ok, false);
end $$;

create or replace function sync_lock_release()
returns void language sql security definer set search_path = public as $$
  update sync_lock set locked_at = null, locked_by = null, expires_at = null where id = true;
$$;

/*
 * PULSUL. Tăcerea e cel mai periculos mod de eșec: un sistem oprit arată exact
 * ca un sistem fără produse noi. Funcția spune de cât timp n-a mai reușit nimic.
 */
create or replace function sync_last_success()
returns timestamptz language sql stable security definer set search_path = public as $$
  select max(finished_at) from import_runs
   where source = 'pandashop_sync' and dry_run = false and finished_at is not null;
$$;

alter table sync_lock enable row level security;

-- Funcțiile nu se apelează din browser.
revoke all on function sync_lock_acquire(text, int) from public, anon, authenticated;
revoke all on function sync_lock_release() from public, anon, authenticated;
revoke all on function sync_last_success() from public, anon, authenticated;
