-- 0003 — conținut editorial: servicii, pagini legale, recenzii, programări
-- Idempotentă. Rollback: supabase/rollback/0003_content.down.sql

create table if not exists services (
  id               bigint generated always as identity primary key,
  slug_ro          text not null unique,
  slug_ru          text unique,
  title_ro         text not null,
  title_ru         text,
  -- NULL e stare validă: sursa nu are niciun text descriptiv. Nu se pune string gol.
  body_ro          text,
  body_ru          text,
  excerpt_ro       text,
  excerpt_ru       text,
  image_url        text,
  price_from_mdl   numeric(10,2),
  meta_title_ro    text,
  meta_title_ru    text,
  meta_desc_ro     text,
  meta_desc_ru     text,
  sort_order       int not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Paginile legale nu există pe site-ul vechi. Se creează scheletele; textul juridic
-- îl scrie clientul din admin. body_* rămâne NULL până atunci.
create table if not exists legal_pages (
  id            bigint generated always as identity primary key,
  slug_ro       text not null unique,
  slug_ru       text unique,
  title_ro      text not null,
  title_ru      text,
  body_ro       text,
  body_ru       text,
  meta_desc_ro  text,
  meta_desc_ru  text,
  sort_order    int not null default 0,
  updated_at    timestamptz not null default now()
);

create table if not exists reviews (
  id           bigint generated always as identity primary key,
  product_id   bigint references products(id) on delete cascade,
  service_id   bigint references services(id) on delete cascade,
  author       text not null,
  rating       int not null check (rating between 1 and 5),
  body         text not null,
  pros         text,
  cons         text,
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint reviews_one_target check (num_nonnulls(product_id, service_id) = 1)
);

create table if not exists service_bookings (
  id              bigint generated always as identity primary key,
  service_id      bigint references services(id) on delete set null,
  name            text not null,
  phone           text not null,
  car_model       text,
  preferred_date  date,
  note            text,
  status          booking_status not null default 'nou',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

do $$ begin
  create trigger services_updated_at before update on services
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger legal_pages_updated_at before update on legal_pages
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger service_bookings_updated_at before update on service_bookings
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Scheletele paginilor legale, fără text.
insert into legal_pages (slug_ro, slug_ru, title_ro, title_ru, sort_order) values
  ('termeni-si-conditii',          'usloviya-ispolzovaniya', 'Termeni și condiții',           'Условия использования', 1),
  ('livrare-si-plata',             'dostavka-i-oplata',      'Livrare și plată',              'Доставка и оплата',     2),
  ('retur-si-garantie',            'vozvrat-i-garantiya',    'Retur și garanție',             'Возврат и гарантия',    3),
  ('politica-de-confidentialitate','politika-konfidencialnosti', 'Politica de confidențialitate', 'Политика конфиденциальности', 4)
on conflict (slug_ro) do nothing;
