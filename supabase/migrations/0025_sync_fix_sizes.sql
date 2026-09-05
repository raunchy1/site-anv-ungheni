-- 0025 — corectarea dimensiunilor greșite din importul vechi, sub aceleași
-- restricții ca `sync_refresh_products`: o singură funcție, cu o listă fixă de
-- coloane pe care are voie să le atingă.
--
-- DE CE. Verificarea de paritate a găsit fișe unde titlul nostru și titlul
-- furnizorului spun aceeași dimensiune, iar coloanele spun altceva —
-- „Vredestein Quatrac Pro+ 245/35 R18" cu `diameter = 'R19'`, „Petlas
-- Snowmaster 2 Sport 255/55 R20" cu coloanele „235/50 R18". Sunt erori venite
-- din exportul OpenCart. Produsul e pe site, cumpărabil, cu prețul corect — dar
-- stă în alt sertar de filtru, deci nu-l găsește nimeni care caută după
-- dimensiunea reală.
--
-- Selecția rândurilor se face în `tools/sync/pandashop/fix-sizes.mjs` și e mai
-- strictă decât pare necesar: se scrie DOAR când titlul nostru și titlul
-- furnizorului spun același lucru împotriva coloanei. Titlul nostru singur n-ar
-- fi de ajuns — 1.896 de fișe au titlul în dezacord cu coloanele și nu de
-- fiecare dată titlul are dreptate. Doi martori care nu s-au vorbit între ei
-- bat un registru.
--
-- Nota despre `coalesce`: conversia la enum se face pe argumentul text, ÎNAINTE
-- de coalesce. Invers — `coalesce(text, enum)::enum` — Postgres refuză, fiindcă
-- nu există tip comun între cele două argumente.

create or replace function sync_fix_sizes(p_rows jsonb)
returns table (actualizate integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'sync_fix_sizes asteapta un array JSON, a primit %', jsonb_typeof(p_rows);
  end if;

  with intrare as (
    select * from jsonb_to_recordset(p_rows) as x(
      id            bigint,
      width         int,
      aspect        int,
      diameter      text,
      size_raw      text,
      size_system   text,
      is_commercial boolean
    )
  ),
  scriere as (
    update products p set
      width         = i.width,
      aspect        = i.aspect,
      diameter      = i.diameter,
      size_raw      = i.size_raw,
      size_system   = coalesce(i.size_system::size_system, p.size_system),
      is_commercial = coalesce(i.is_commercial, p.is_commercial),
      size_source   = 'title'::size_source,
      updated_at    = now()
    from intrare i
    where p.id = i.id
      and (p.width    is distinct from i.width
        or p.aspect   is distinct from i.aspect
        or p.diameter is distinct from i.diameter)
    returning p.id
  )
  select count(*)::integer into v_n from scriere;

  return query select v_n;
end;
$$;

comment on function sync_fix_sizes(jsonb) is
  'Corecteaza dimensiunea unui produs. Atinge exclusiv width, aspect, diameter, size_raw, size_system, is_commercial si size_source. Se apeleaza din tools/sync/pandashop/fix-sizes.mjs.';

revoke all on function sync_fix_sizes(jsonb) from public, anon, authenticated;
