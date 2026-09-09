-- 0028 — faceta de sezon în `facet_counts`
-- Idempotentă. Rollback: supabase/rollback/0028_faceta_sezon.down.sql

/*
 * DE CE. Contoarele celor trei sezoane — placa de pe prima pagină și pasul 4 al
 * selectorului — se citeau până acum prin trei `COUNT(*)` pe 15.000 de rânduri,
 * la fiecare randare. Pe 8 septembrie 2026 alea au însemnat 472.000 din cele
 * ~1.000.000 de interogări pe care le-a primit baza în 24 de ore, pentru trei
 * cifre care se schimbă o dată pe zi, la import. Au fost mutate pe
 * `facet_counts`, adică o singură cerere care se poate ține în cache.
 *
 * Numai că vederea n-avea o faceta de sezon, așa că se însuma faceta de LĂȚIME
 * pe sezon. Aproape corect, dar nu corect: `facet='width'` cere `width is not
 * null`, iar 16 anvelope imperiale (31x10.5 R15 și rudele lor) n-au lățime
 * metrică. Ele dispăreau din contor — 2 la vară, 14 la all season — deși pe
 * paginile de sezon apar, fiindcă `getCatalog` filtrează după `category`, nu
 * după lățime. Contorul spunea 4.892 acolo unde lista arăta 4.894.
 *
 * Un rând per sezon rezolvă exact asta, fără să adauge nici o interogare:
 * aceeași vedere, reîmprospătată de același `refresh_facet_counts()` la finalul
 * fiecărei sincronizări.
 *
 * `season is not null` ține senzorii TPMS afară din construcție — ei n-au sezon.
 */

drop materialized view if exists facet_counts;
create materialized view facet_counts as
  select 'width'  as facet, width::text  as value, season, stock_status, count(*) as n
    from products where is_active and width is not null group by 2,3,4
  union all
  select 'aspect', aspect::text, season, stock_status, count(*)
    from products where is_active and aspect is not null group by 2,3,4
  union all
  select 'diameter', diameter, season, stock_status, count(*)
    from products where is_active and diameter is not null group by 2,3,4
  union all
  select 'brand', brand_name, season, stock_status, count(*)
    from products where is_active and brand_name is not null group by 2,3,4
  union all
  /* Valoarea și coloana `season` sunt același lucru aici. E redundant, dar
     păstrează forma vederii — cine citește o facetă cere `facet=eq.<nume>` și
     citește `value`, la fel pentru toate cele cinci. */
  select 'season', season::text, season, stock_status, count(*)
    from products where is_active and season is not null group by 2,3,4;

create index if not exists facet_counts_idx on facet_counts (facet, value, season, stock_status);
