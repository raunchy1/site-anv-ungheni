-- 0027 — legarea produselor existente de ID-ul lor de la pneuexpert.
--
-- DE CE E NEVOIE DE O FUNCȚIE ȘI NU DE UN UPDATE. `db-write.mjs` refuză orice
-- UPDATE pe `products`, iar regula aia nu se slăbește: e singurul lucru care stă
-- între un script de sincronizare și 15.933 de fișe. 0020 a rezolvat aceeași
-- problemă pentru preț și stoc, cu o funcție care poate atinge cinci coloane și
-- nimic altceva. Aici e la fel, dar cu o singură coloană.
--
-- CE FACE. Aproape jumătate din anvelopele de la pneuexpert le avem deja în
-- catalog, venite de la pandashop sau din OpenCart. Potrivirea pe cheia naturală
-- le recunoaște; funcția asta scrie legătura, ca produsul să nu mai depindă de
-- cum își scriu ei titlurile și ca o rulare viitoare să nu-l importe a doua oară.
--
-- NU SUPRASCRIE o legătură existentă: dacă rândul are deja `pneuexpert_id`,
-- rămâne al lui. O potrivire greșită nu poate fura un produs de la alt ID.
--
-- Idempotentă.

create or replace function sync_link_pneuexpert(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_legate integer;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'sync_link_pneuexpert asteapta un array JSON, a primit %', jsonb_typeof(p_rows);
  end if;

  with intrare as (
    select * from jsonb_to_recordset(p_rows) as x(id bigint, pneuexpert_id text)
  ),
  scriere as (
    update products pr set
      pneuexpert_id = i.pneuexpert_id,
      updated_at    = now()
    from intrare i
    where pr.id = i.id
      and i.pneuexpert_id is not null
      and pr.pneuexpert_id is null   -- niciodată peste o legătură deja făcută
    returning pr.id
  )
  select count(*)::integer into v_legate from scriere;

  return v_legate;
end;
$$;

comment on function sync_link_pneuexpert(jsonb) is
  'Singura cale prin care sincronizarea poate scrie pneuexpert_id pe un produs existent. Atinge exclusiv coloana aia, și doar cand e NULL.';

revoke all on function sync_link_pneuexpert(jsonb) from public, anon, authenticated;
