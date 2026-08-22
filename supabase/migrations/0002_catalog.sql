-- 0002 — catalogul: setări, branduri, produse, imagini, relații
-- Idempotentă. Rollback: supabase/rollback/0002_catalog.down.sql

-- Datele de contact și programul stau într-un singur loc, editabile din admin.
-- Nicio pagină nu le hardcodează.
create table if not exists settings (
  id               boolean primary key default true check (id),
  phone_display    text not null default '068 263 644',
  phone_e164       text not null default '+37368263644',
  email            text not null default 'info@anvelope-ungheni.md',
  address          text not null default 'Strada Decebal 62/1, Ungheni, Republica Moldova',
  city             text not null default 'Ungheni',
  -- TODO(cristian): confirmare program duminică. Sursa curentă: pagina /contact a site-ului vechi.
  opening_hours    jsonb not null default
    '{"mon_sat":"9:00-20:00","sun":null,"note":"TODO(cristian): confirmare duminica"}'::jsonb,
  maps_url         text not null default 'https://maps.app.goo.gl/VzhbUSn4YYBnr4fx7',
  lat              numeric(9,6) not null default 47.221074,
  lng              numeric(9,6) not null default 27.790778,
  warranty_years   int not null default 2,
  credit_badge_ro  text default 'Credit 0% | 6 luni',
  credit_badge_ru  text default 'Кредит 0% | 6 мес.',
  updated_at       timestamptz not null default now()
);
insert into settings (id) values (true) on conflict (id) do nothing;

create table if not exists brands (
  id              bigint generated always as identity primary key,
  slug_ro         text not null unique,
  slug_ru         text unique,
  name            text not null,
  -- nu există în sursă; se completează din admin, nu se inventează
  description_ro  text,
  description_ru  text,
  logo_url        text,
  meta_title_ro   text,
  meta_title_ru   text,
  meta_desc_ro    text,
  meta_desc_ru    text,
  product_count   int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists products (
  id                 bigint generated always as identity primary key,
  -- cheia de reconciliere cu OpenCart; fără ea nu putem compara importurile
  legacy_product_id  int not null unique,
  slug_ro            text not null unique,
  slug_ru            text unique,
  category           product_category not null default 'anvelope',
  brand_id           bigint references brands(id) on delete set null,
  brand_name         text,                 -- denormalizat pentru căutare și sortare
  attr_manufacturer  text,                 -- atributul „Producator" din sursă, pentru reconciliere
  model              text,

  -- Două sisteme de dimensionare: metric (245/40 R20) și imperial (31x10.50 R15,
  -- 20 de anvelope off-road din catalog). Coloanele metrice rămân NULL la cele imperiale.
  size_system        size_system,
  width              int,
  aspect             int,
  overall_diameter_in numeric(4,1),
  section_width_in    numeric(4,2),
  diameter           text,
  size_raw           text,
  size_source        size_source not null default 'attribute',
  load_index         text,
  speed_index        text,
  season             season,
  is_xl              boolean not null default false,
  is_runflat         boolean not null default false,
  is_studded         boolean not null default false,
  is_commercial      boolean not null default false,

  price_mdl          numeric(10,2),
  old_price_mdl      numeric(10,2),
  price_source       price_source not null default 'legacy_import',
  price_updated_at   timestamptz,
  -- un preț pus manual din admin nu se suprascrie la următorul import
  price_locked       boolean not null default false,

  stock_status       stock_status not null default 'out_of_stock',
  stock_qty          int,

  title_ro           text not null,
  title_ru           text,
  description_ro     text,                 -- 5 produse din 15.010 au conținut aici
  description_ru     text,
  meta_title_ro      text,
  meta_title_ru      text,
  meta_desc_ro       text,
  meta_desc_ru       text,

  attributes         jsonb not null default '{}'::jsonb,
  in_catalog         boolean not null default true,   -- breadcrumb „Anvelope" prezent în sursă
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Constrângeri hard: baza refuză datele degradate, nu aplicația le loghează.
  -- Senzorii TPMS n-au dimensiune de anvelopă; nu se dezactivează pentru asta.
  constraint products_active_needs_size    check (is_active = false or size_source <> 'none' or category = 'tpms'),
  constraint products_stocked_needs_price  check (stock_status = 'out_of_stock' or price_mdl is not null),
  constraint products_price_positive       check (price_mdl is null or price_mdl > 0),
  constraint products_old_price_positive   check (old_price_mdl is null or old_price_mdl > 0)
);

create table if not exists product_images (
  id             bigint generated always as identity primary key,
  product_id     bigint not null references products(id) on delete cascade,
  storage_path   text not null,            -- calea normalizată din Supabase Storage
  original_path  text not null,            -- calea din OpenCart, pentru trasabilitate
  content_hash   text,                     -- SHA-1: aceeași fotografie poate servi mai multe SKU-uri
  width          int,
  height         int,
  alt_ro         text,
  alt_ru         text,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  unique (product_id, storage_path)
);

-- Recomandările curatoriate de sistemul vechi. Se rezolvă slug -> id într-o a doua
-- trecere, după ce toate produsele sunt importate; slug-urile nerezolvate se loghează.
create table if not exists product_related (
  product_id          bigint not null references products(id) on delete cascade,
  related_product_id  bigint not null references products(id) on delete cascade,
  source              related_source not null default 'legacy',
  sort_order          int not null default 0,
  primary key (product_id, related_product_id),
  constraint product_related_not_self check (product_id <> related_product_id)
);

do $$ begin
  create trigger brands_updated_at before update on brands
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger products_updated_at before update on products
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger settings_updated_at before update on settings
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
