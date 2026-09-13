/*
 * STOCUL DIN ATELIER NU SE ȘTERGE DE LA FURNIZOR.
 *
 * `price_locked` proteja prețul pus cu mâna, dar nu și starea stocului: linia
 * `stock_status = c.stock_status` din migrarea 0020 scria întotdeauna ce zicea
 * pandashop. Prima rulare de după ar fi întors pe `supplier` fiecare anvelopă
 * pe care atelierul o are fizic pe raft — adică exact eticheta „În stoc · la
 * magazin", ștearsă tăcut la 03:00, fără ca cineva să observe.
 *
 * `in_stock` înseamnă „marfa e la noi, în Ungheni". Furnizorul nu poate ști
 * asta și nu are cum să o contrazică: ce are el pe stoc e o afirmație despre
 * depozitul lui, nu despre raftul nostru.
 *
 * Deci `in_stock` se păstrează. Iese din el doar când îl scoate un om — când
 * s-au vândut ultimele bucăți. Până când sincronizarea va citi direct
 * cantitățile din aplicația de fișe, asta rămâne o operație manuală, și e bine
 * să se știe.
 *
 * Prețul și `source_price_mdl` continuă să se scrie ca înainte, ca marja reală
 * să rămână vizibilă și pe rândurile blocate.
 */
create or replace function sync_refresh_products(p_rows jsonb)
returns table (actualizate integer, blocate integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with intrare as (
    select * from jsonb_to_recordset(p_rows) as x(
      id               bigint,
      pandashop_id     text,
      source_price_mdl numeric,
      price_mdl        numeric,
      stock_status     text
    )
  ),
  calcul as (
    select
      i.id,
      i.pandashop_id,
      i.source_price_mdl,
      case when pr.price_locked then pr.price_mdl else i.price_mdl end as pret_final,
      /* Aici e schimbarea față de 0020: marfa noastră rămâne a noastră. */
      case when pr.stock_status = 'in_stock' then 'in_stock' else i.stock_status end as stoc_final,
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
      stock_status     = case
                           when c.pret_final is null then 'out_of_stock'::stock_status
                           else c.stoc_final::stock_status
                         end,
      synced_at        = now(),
      updated_at       = now()
    from calcul c
    where pr.id = c.id
      and (pr.price_mdl        is distinct from c.pret_final
        or pr.stock_status     is distinct from case when c.pret_final is null then 'out_of_stock'::stock_status else c.stoc_final::stock_status end
        or pr.source_price_mdl is distinct from coalesce(c.source_price_mdl, pr.source_price_mdl)
        or pr.pandashop_id     is distinct from coalesce(c.pandashop_id, pr.pandashop_id)
        or pr.synced_at is null)
    returning pr.id, c.price_locked
  )
  select count(*)::integer, count(*) filter (where price_locked)::integer
  from scriere;
end;
$$;

comment on function sync_refresh_products(jsonb) is
  'Singura cale prin care sincronizarea poate modifica produse existente. Atinge exclusiv pandashop_id, source_price_mdl, price_mdl, price_source, price_updated_at, stock_status, synced_at. Nu scoate niciodata un rand din in_stock: acela e stocul fizic al atelierului, despre care furnizorul nu are ce sa spuna.';

revoke all on function sync_refresh_products(jsonb) from public, anon, authenticated;
