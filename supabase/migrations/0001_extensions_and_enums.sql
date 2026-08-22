-- 0001 — extensii și tipuri enumerate
-- Idempotentă. Rollback: supabase/rollback/0001_extensions_and_enums.down.sql

create extension if not exists pg_trgm;
create extension if not exists unaccent;

do $$ begin
  create type season as enum ('vara', 'iarna', 'all_season');
exception when duplicate_object then null; end $$;

do $$ begin
  -- trei stări confirmate în sursă: „În stoc", „Stoc furnizor", „Stoc epuizat"
  create type stock_status as enum ('in_stock', 'supplier', 'out_of_stock');
exception when duplicate_object then null; end $$;

do $$ begin
  -- de unde știm dimensiunea: din atributul OpenCart, dedusă din titlu, sau deloc
  create type size_source as enum ('attribute', 'title', 'none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type size_system as enum ('metric', 'imperial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type price_source as enum ('legacy_import', 'manual_csv', 'scheduled_feed', 'api_sync', 'admin_edit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type import_source as enum ('manual_csv', 'scheduled_feed', 'api_sync', 'admin_edit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_category as enum ('anvelope', 'tpms');
exception when duplicate_object then null; end $$;

do $$ begin
  create type related_source as enum ('legacy', 'computed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('nou', 'confirmat', 'in_livrare', 'finalizat', 'anulat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('nou', 'confirmat', 'finalizat', 'anulat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_method as enum ('ridicare_magazin', 'curier_ungheni', 'curier_moldova');
exception when duplicate_object then null; end $$;

do $$ begin
  -- v1 fără gateway online; hook-ul pentru card rămâne pentru mai târziu
  create type payment_method as enum ('numerar_livrare', 'numerar_magazin', 'transfer_bancar');
exception when duplicate_object then null; end $$;

-- trigger comun pentru updated_at
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
