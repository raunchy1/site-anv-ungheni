-- 0004 — comenzi și jurnalul importurilor
-- Idempotentă. Rollback: supabase/rollback/0004_commerce.down.sql

create table if not exists orders (
  id                bigint generated always as identity primary key,
  order_number      text not null unique,       -- AU-2026-00147
  customer_name     text not null,
  phone             text not null,
  email             text,
  city              text not null,
  address           text,
  delivery          delivery_method not null,
  payment           payment_method not null,
  -- diferențiatorul față de concurență: montajul se cere la checkout
  wants_mounting    boolean not null default false,
  note              text,
  subtotal_mdl      numeric(10,2) not null check (subtotal_mdl >= 0),
  delivery_mdl      numeric(10,2) not null default 0 check (delivery_mdl >= 0),
  total_mdl         numeric(10,2) not null check (total_mdl >= 0),
  status            order_status not null default 'nou',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists order_items (
  id              bigint generated always as identity primary key,
  order_id        bigint not null references orders(id) on delete cascade,
  product_id      bigint references products(id) on delete set null,
  -- instantaneu: comanda nu se schimbă dacă produsul se modifică ulterior
  title_snapshot  text not null,
  slug_snapshot   text not null,
  price_snapshot  numeric(10,2) not null check (price_snapshot > 0),
  qty             int not null check (qty > 0)
);

-- Fără jurnal nu se poate depana un import greșit peste 15.000 de produse.
create table if not exists import_runs (
  id               bigint generated always as identity primary key,
  source           import_source not null,
  actor            text,                    -- email-ul utilizatorului sau numele jobului
  dry_run          boolean not null default false,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  rows_total       int not null default 0,
  rows_created     int not null default 0,
  rows_updated     int not null default 0,
  rows_skipped     int not null default 0,
  rows_deactivated int not null default 0,
  prices_changed   int not null default 0,
  prices_locked    int not null default 0,   -- câte au fost protejate de price_locked
  errors           jsonb not null default '[]'::jsonb,
  diff             jsonb not null default '[]'::jsonb,
  notes            text
);

do $$ begin
  create trigger orders_updated_at before update on orders
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
