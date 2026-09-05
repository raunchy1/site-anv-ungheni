-- 0020 — actualizarea prețului și a stocului din pandashop, pentru produsele
-- pe care le avem deja.
--
-- DE CE EXISTĂ. Mecanismul din 0015 a fost construit ca să IMPORTE anvelope noi
-- și, deliberat, să nu atingă niciun produs existent: `db-write.mjs` refuză orice
-- UPDATE pe `products`. Efectul secundar s-a văzut în producție — prețul și
-- stocul celor 15.008 produse venite din OpenCart au rămas înghețate la ziua
-- exportului. 6.944 dintre ele stau pe `out_of_stock` cu preț NULL, iar catalogul
-- le ascunde (`queries.ts` filtrează pe `stock_status IN ('in_stock','supplier')`),
-- deși la pandashop o parte sunt pe stoc chiar acum. Clientul a văzut exact asta:
-- un singur model pe 275/35 R19 iarna la noi, mai multe la ei.
--
-- CUM. Nu se deschide UPDATE-ul general pe `products` — rămâne interzis. Se adaugă
-- o singură funcție, care poate scrie EXCLUSIV cinci coloane de preț și stoc și
-- nimic altceva. Titlul, slug-ul, dimensiunea, descrierea și imaginile rămân în
-- afara razei ei de acțiune, deci o rulare greșită nu poate rescrie catalogul.
--
-- Idempotentă. Rollback: supabase/rollback/0020_sync_refresh.down.sql

alter table products add column if not exists synced_at timestamptz;

comment on column products.synced_at is
  'Ultima dată când prețul/stocul au fost confruntate cu sursa. NULL = niciodată, adică rândul e încă la valorile din exportul OpenCart.';

create index if not exists products_synced_at_idx on products (synced_at nulls first);

/*
 * Actualizarea în lot, dintr-un singur array JSON.
 *
 * Reguli care NU se pot ocoli din afară, pentru că sunt în corpul funcției:
 *
 *   · `price_locked` — un preț pus cu mâna în admin nu se suprascrie niciodată.
 *     Rândul își primește totuși `source_price_mdl` și stocul, ca să se vadă
 *     marja reală și disponibilitatea, dar cifra afișată rămâne a omului.
 *
 *   · Constrângerea `products_stocked_needs_price` — un produs nu poate deveni
 *     cumpărabil fără preț. Dacă sursa n-a dat preț, sau prețul e blocat pe NULL,
 *     rândul rămâne `out_of_stock` în loc să pice tot lotul.
 *
 *   · Nu se creează și nu se șterge niciun rând. Un `id` care nu există e ignorat.
 */
create or replace function sync_refresh_products(p_rows jsonb)
returns table (actualizate integer, blocate integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actualizate integer;
  v_blocate     integer;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'sync_refresh_products asteapta un array JSON, a primit %', jsonb_typeof(p_rows);
  end if;

  with intrare as (
    select *
    from jsonb_to_recordset(p_rows) as x(
      id               bigint,
      pandashop_id     text,
      source_price_mdl numeric,
      price_mdl        numeric,
      stock_status     text
    )
  ),
  -- Prețul care ajunge efectiv pe rând, o dată, ca să fie folosit și de stoc.
  calcul as (
    select
      i.id,
      i.pandashop_id,
      i.source_price_mdl,
      case when pr.price_locked then pr.price_mdl else i.price_mdl end as pret_final,
      i.stock_status,
      pr.price_locked
    from intrare i
    join products pr on pr.id = i.id
  ),
  scriere as (
    update products pr set
      pandashop_id     = coalesce(c.pandashop_id, pr.pandashop_id),
      source_price_mdl = coalesce(c.source_price_mdl, pr.source_price_mdl),
      price_mdl        = c.pret_final,
      price_source     = case when c.price_locked then pr.price_source else 'api_sync'::price_source end,
      price_updated_at = case when c.price_locked then pr.price_updated_at else now() end,
      -- fără preț nu există stoc: constrângerea bazei, respectată aici ca să nu pice lotul
      stock_status     = case
                           when c.pret_final is null then 'out_of_stock'::stock_status
                           else c.stock_status::stock_status
                         end,
      synced_at        = now(),
      updated_at       = now()
    from calcul c
    where pr.id = c.id
      -- se scrie doar ce chiar se schimbă; altfel `updated_at` minte pe 15.000 de rânduri
      and (pr.price_mdl        is distinct from c.pret_final
        or pr.stock_status     is distinct from case when c.pret_final is null then 'out_of_stock'::stock_status else c.stock_status::stock_status end
        or pr.source_price_mdl is distinct from coalesce(c.source_price_mdl, pr.source_price_mdl)
        or pr.pandashop_id     is distinct from coalesce(c.pandashop_id, pr.pandashop_id)
        or pr.synced_at is null)
    returning pr.id, c.price_locked
  )
  select
    count(*)::integer,
    count(*) filter (where price_locked)::integer
  into v_actualizate, v_blocate
  from scriere;

  return query select v_actualizate, v_blocate;
end;
$$;

comment on function sync_refresh_products(jsonb) is
  'Singura cale prin care sincronizarea poate modifica produse existente. Atinge exclusiv pandashop_id, source_price_mdl, price_mdl, price_source, price_updated_at, stock_status, synced_at.';

-- Nu se apelează din browser. Doar cheia de serviciu, din pipeline-ul de sync.
revoke all on function sync_refresh_products(jsonb) from public, anon, authenticated;
