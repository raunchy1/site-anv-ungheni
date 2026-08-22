-- 0005 — căutare full-text, trigram și indexuri
-- Idempotentă. Rollback: supabase/rollback/0005_search_and_indexes.down.sql

-- Configurația se dă ca literal, altfel coloana generată nu e imutabilă.
-- 'simple' și nu 'romanian'/'russian': titlurile sunt nume proprii și cifre,
-- stemming-ul ar strica „Primacy" -> „primaci".
alter table products
  add column if not exists search_ro tsvector
    generated always as (
      to_tsvector('simple',
        coalesce(title_ro, '') || ' ' ||
        coalesce(brand_name, '') || ' ' ||
        coalesce(model, '') || ' ' ||
        coalesce(size_raw, ''))
    ) stored;

alter table products
  add column if not exists search_ru tsvector
    generated always as (
      to_tsvector('simple',
        coalesce(title_ru, title_ro, '') || ' ' ||
        coalesce(brand_name, '') || ' ' ||
        coalesce(model, '') || ' ' ||
        coalesce(size_raw, ''))
    ) stored;

create index if not exists products_search_ro_idx on products using gin (search_ro);
create index if not exists products_search_ru_idx on products using gin (search_ru);

-- Trigram pentru autocomplete tolerant la greșeli de tastare.
create index if not exists products_title_trgm_idx on products using gin (title_ro gin_trgm_ops);
create index if not exists brands_name_trgm_idx    on brands   using gin (name gin_trgm_ops);

-- Selectorul de dimensiune: cel mai frecvent drum al utilizatorului.
create index if not exists products_size_idx
  on products (width, aspect, diameter) where is_active;

-- Catalogul filtrat pe sezon + disponibilitate.
create index if not exists products_season_stock_idx
  on products (season, stock_status) where is_active;

-- Pagina de brand, sortată după preț.
create index if not exists products_brand_price_idx
  on products (brand_id, price_mdl) where is_active;

-- Paginare keyset: ordinea stabilă (preț, id) trebuie să fie indexată.
create index if not exists products_price_keyset_idx
  on products (price_mdl nulls last, id) where is_active;

create index if not exists products_stock_idx    on products (stock_status) where is_active;
create index if not exists products_category_idx on products (category) where is_active;
create index if not exists products_slug_ru_idx  on products (slug_ru) where slug_ru is not null;

create index if not exists product_images_product_idx on product_images (product_id, sort_order);
create index if not exists product_images_hash_idx    on product_images (content_hash);
create index if not exists reviews_product_idx        on reviews (product_id) where is_approved;
create index if not exists orders_status_idx          on orders (status, created_at desc);
create index if not exists order_items_order_idx      on order_items (order_id);
create index if not exists bookings_status_idx        on service_bookings (status, created_at desc);
create index if not exists import_runs_started_idx    on import_runs (started_at desc);

-- Contoarele de facete se citesc dintr-o vedere materializată, nu prin COUNT(*)
-- pe 15.010 rânduri la fiecare tastă.
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
