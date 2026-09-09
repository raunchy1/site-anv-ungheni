-- Revenire la vederea fără faceta de sezon (starea de dinainte de 0028).
-- Contoarele de sezon redevin o însumare a facetei de lățime, deci pierd din
-- nou cele 16 anvelope imperiale fără lățime metrică.

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
    from products where is_active and brand_name is not null group by 2,3,4;

create index if not exists facet_counts_idx on facet_counts (facet, value, season, stock_status);
