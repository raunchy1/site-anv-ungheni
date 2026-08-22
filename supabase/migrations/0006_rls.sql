-- 0006 — Row Level Security
-- Citire publică pe catalog și conținut; scriere doar cu service role.
-- Idempotentă. Rollback: supabase/rollback/0006_rls.down.sql

alter table products        enable row level security;
alter table brands          enable row level security;
alter table product_images  enable row level security;
alter table product_related enable row level security;
alter table services        enable row level security;
alter table legal_pages     enable row level security;
alter table settings        enable row level security;
alter table reviews         enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table service_bookings enable row level security;
alter table import_runs     enable row level security;

do $$
declare t text;
begin
  -- catalog și conținut: oricine citește, nimeni nu scrie fără service role
  foreach t in array array['products','brands','product_images','product_related','services','legal_pages','settings']
  loop
    execute format('drop policy if exists %I on %I', t || '_public_read', t);
    execute format('create policy %I on %I for select using (true)', t || '_public_read', t);
  end loop;
end $$;

-- recenziile: publicul vede doar ce e aprobat
drop policy if exists reviews_public_read on reviews;
create policy reviews_public_read on reviews for select using (is_approved = true);

-- oricine poate propune o recenzie, dar nemoderată
drop policy if exists reviews_public_insert on reviews;
create policy reviews_public_insert on reviews for insert with check (is_approved = false);

-- comenzile și programările: se pot crea de oricine, dar nu se citesc de nimeni
-- fără service role. Confirmarea comenzii se randează server-side, nu din client.
drop policy if exists orders_public_insert on orders;
create policy orders_public_insert on orders for insert with check (true);

drop policy if exists order_items_public_insert on order_items;
create policy order_items_public_insert on order_items for insert with check (true);

drop policy if exists bookings_public_insert on service_bookings;
create policy bookings_public_insert on service_bookings for insert with check (true);

-- import_runs: nicio politică publică. Doar service role.
