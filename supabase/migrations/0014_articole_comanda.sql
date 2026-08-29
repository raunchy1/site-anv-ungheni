-- 0014 — articolele comenzii, fără service role
-- Idempotentă. Rollback: supabase/rollback/0014_articole_comanda.down.sql
--
-- `order_items` are nevoie de `order_id`, dar publicul nu poate CITI `orders`
-- (politica din 0006: comenzile se creează de oricine, nu se citesc de nimeni).
-- Prima versiune citea id-ul cu service role — și exact asta a cedat la primul
-- test pe producție: cheia de service nu era în variabilele de mediu, apelul a
-- aruncat DUPĂ ce comanda fusese salvată, iar rezultatul a fost o comandă în
-- bază fără niciun articol și un mesaj de eroare pe ecranul clientului.
--
-- Funcția de mai jos face legătura într-un singur apel, cu cheia anonimă:
-- găsește comanda după număr și îi inserează articolele. `security definer`
-- pentru că trebuie să citească `orders`, dar nu expune nimic — primește un
-- număr de comandă și scrie articole, atât.
--
-- Reluarea e sigură: dacă articolele există deja, întoarce 0 fără să le
-- dubleze. O re-trimitere din client nu poate strica o comandă.

create or replace function add_order_items(p_order_number text, p_items jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_order_id bigint;
  v_n int;
begin
  select id into v_order_id from orders where order_number = p_order_number;
  if v_order_id is null then
    raise exception 'comanda % nu exista', p_order_number using errcode = 'no_data_found';
  end if;

  if exists (select 1 from order_items where order_id = v_order_id) then
    return 0;
  end if;

  insert into order_items (order_id, product_id, title_snapshot, slug_snapshot, price_snapshot, qty)
  select v_order_id,
         (i->>'product_id')::bigint,
         i->>'title_snapshot',
         i->>'slug_snapshot',
         (i->>'price_snapshot')::numeric,
         (i->>'qty')::int
  from jsonb_array_elements(p_items) as i;

  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function add_order_items(text, jsonb) from public;
grant execute on function add_order_items(text, jsonb) to anon, authenticated, service_role;
