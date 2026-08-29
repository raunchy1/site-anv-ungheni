-- 0013 — numărul de comandă, dintr-o secvență
-- Idempotentă. Rollback: supabase/rollback/0013_numar_comanda.down.sql
--
-- `orders.order_number` e `not null unique` și trebuie cunoscut de aplicație ca
-- să-l poată arăta clientului. Dar `orders` n-are politică de `select` pentru
-- public — comenzile se creează de oricine și nu se citesc de nimeni — deci un
-- `insert ... returning` cu cheia anonimă n-ar întoarce nimic.
--
-- Soluția e o funcție care dă numărul ÎNAINTE de insert. Rămâne `security
-- definer` (secvența nu e expusă direct) și e singura funcție pe care o poate
-- apela publicul, după `revoke`-ul din 0008.
--
-- De ce nu generăm numărul în aplicație: două comenzi simultane ar putea primi
-- același număr, iar constrângerea `unique` ar respinge a doua — clientul ar
-- vedea o eroare pentru o comandă perfect validă. Secvența nu are cursa asta.

create sequence if not exists order_number_seq;

/** `AU-2026-00147`. Anul e cel curent; contorul nu se resetează, ca să nu se
    repete numere între ani. */
create or replace function next_order_number() returns text
language sql security definer set search_path = public as $$
  select 'AU-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
$$;

revoke all on function next_order_number() from public;
grant execute on function next_order_number() to anon, authenticated, service_role;

-- Contorul pornește de după comenzile deja existente, dacă există.
do $$
declare v_max bigint;
begin
  select coalesce(max(nullif(regexp_replace(order_number, '^.*-', ''), '')::bigint), 0)
    into v_max from orders;
  if v_max > 0 then perform setval('order_number_seq', v_max); end if;
exception when others then null;
end $$;
