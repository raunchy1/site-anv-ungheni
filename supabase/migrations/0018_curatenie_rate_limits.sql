-- 0018 — adresele IP chiar se șterg după 24 de ore
-- Idempotentă. Rollback: supabase/rollback/0018_curatenie_rate_limits.down.sql
--
-- `prune_rate_limits()` există din 0007, dar nu o apela nimic: nici aplicația
-- (zero `.rpc(` în `src/`), nici cronul, nici un job programat. Adresele IP din
-- `rate_limits` se strângeau, deci, la nesfârșit.
--
-- A ieșit la iveală când s-a scris politica de confidențialitate: textul promite
-- ștergerea după 24 de ore, iar o politică pe care baza de date n-o respectă e
-- mai rea decât lipsa ei.
--
-- Curățenia se face aici, nu într-un cron: un job programat e încă o piesă care
-- poate fi ștearsă, dezactivată sau uitată la o migrare de proiect, iar dacă
-- tace, nimeni nu observă. Legată de însuși traficul care creează rândurile,
-- regula nu poate fi ocolită — cine scrie un rând nou șterge rândurile vechi.
-- Costul e un `delete` pe indexul `rate_limits_window_idx`, la un formular
-- trimis; la volumul acestui site, sub o milisecundă.

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

  -- Contoarele mai vechi de o zi nu mai servesc la nimic, iar `ip` e dată cu
  -- caracter personal: se șterg la fiecare cerere care ajunge până aici.
  perform prune_rate_limits();

  insert into rate_limits (ip, action) values (v_ip, p_action)
  on conflict (ip, action, window_start) do update set n = rate_limits.n + 1
  returning n into v_n;

  if v_n > p_max then
    raise exception 'prea multe cereri: maximum % pe oră pentru %', p_max, p_action
      using errcode = 'check_violation';
  end if;
end $$;

-- `create or replace` resetează drepturile la implicit, deci retragerea din 0008
-- se repetă. Fără linia asta, funcția redevine apelabilă de oricine.
revoke execute on function public.enforce_rate_limit(text, int) from public, anon, authenticated;

-- Curățenie unică a rândurilor adunate până azi.
select prune_rate_limits();
