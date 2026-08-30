-- 0015 — detectarea anvelopelor noi de la pandashop.md
-- Idempotentă. Rollback: supabase/rollback/0015_pandashop_sync.down.sql
--
-- Migrarea e strict ADITIVĂ. Nu modifică niciun rând existent din `products`:
-- coloanele noi sunt toate nullable sau au implicit, iar `source` primește
-- 'legacy' pe tot ce există deja — exact ce erau înainte, doar spus explicit.

do $$ begin
  -- de unde vine rândul: importul vechi din OpenCart, sincronizarea, sau mâna omului
  create type product_source as enum ('legacy', 'pandashop_sync', 'manual');
exception when duplicate_object then null; end $$;

alter table products add column if not exists pandashop_id     text;
alter table products add column if not exists source           product_source not null default 'legacy';
alter table products add column if not exists source_price_mdl numeric(10,2);
alter table products add column if not exists imported_at      timestamptz;

comment on column products.pandashop_id is
  'ID-ul produsului la pandashop. TEXT, niciodată numeric: „00170643" are zerouri în față care contează, iar o parte din catalogul lor folosește UUID-uri. Rămâne NULL pe cele 15.008 importate din OpenCart.';
comment on column products.source_price_mdl is
  'Prețul lor, înainte de marjă. Se păstrează ca să se vadă oricând marja reală.';

-- Unicitatea contează doar acolo unde ID-ul există; NULL-urile nu se ciocnesc.
create unique index if not exists products_pandashop_id_uidx on products (pandashop_id) where pandashop_id is not null;
create index if not exists products_source_idx on products (source) where source <> 'legacy';

-- Marja și comutatorul de oprire, editabile din admin fără deploy.
alter table settings add column if not exists pricing_rules jsonb not null default '{
  "default_margin_pct": 15,
  "rounding": "end_9",
  "by_price_range": [],
  "by_brand": {}
}'::jsonb;
alter table settings add column if not exists sync_enabled boolean not null default true;

/*
 * INIMA MECANISMULUI.
 *
 * Nu potrivim produsele lor cu ale noastre și n-avem nevoie. Ținem minte doar ce
 * ID-uri existau la pandashop în ziua înghețării; orice ID care apare mai târziu
 * și nu e aici e produs nou. O comparație de mulțimi, fără nicio potrivire
 * aproximativă și fără să atingem catalogul existent.
 */
create table if not exists pandashop_seen (
  pandashop_id  text primary key,
  first_seen_at timestamptz not null default now(),
  -- true = exista la fotografia inițială, deci e trecut și nu se importă
  baseline      boolean not null default false,
  imported      boolean not null default false,
  product_id    bigint references products(id) on delete set null,
  -- 'imported' | 'quarantined' | 'no_price' | 'skipped'
  status        text not null default 'skipped',
  last_checked_at timestamptz,
  note          text,
  constraint pandashop_seen_status_ok check (status in ('imported', 'quarantined', 'no_price', 'skipped')),
  -- dacă zice că e importat, trebuie să arate și produsul
  constraint pandashop_seen_imported_has_product check (imported = false or product_id is not null)
);

create index if not exists pandashop_seen_status_idx on pandashop_seen (status) where status <> 'skipped';
create index if not exists pandashop_seen_first_seen_idx on pandashop_seen (first_seen_at desc);

/*
 * Carantina. Un produs care nu trece toate verificările NU intră în catalog pe
 * jumătate și nu se completează cu valori ghicite: se oprește aici, cu datele
 * brute și motivul, până se uită un om peste el.
 */
create table if not exists sync_quarantine (
  id            bigint generated always as identity primary key,
  pandashop_id  text not null,
  reason        text not null,
  raw           jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolution    text,      -- 'approved' | 'rejected' | 'ignored'
  constraint sync_quarantine_resolution_ok check (resolution is null or resolution in ('approved', 'rejected', 'ignored')),
  unique (pandashop_id, reason)
);

create index if not exists sync_quarantine_open_idx on sync_quarantine (created_at desc) where resolved_at is null;

-- Fără politici publice: tabelele astea nu se citesc din browser.
alter table pandashop_seen  enable row level security;
alter table sync_quarantine enable row level security;

-- 'pandashop_sync' ca sursă de import, pentru jurnalul din import_runs.
-- Deliberat în afara unui bloc `do $$`: `alter type ... add value` nu poate rula
-- dintr-o funcție, iar `if not exists` îl face oricum idempotent.
alter type import_source add value if not exists 'pandashop_sync';
