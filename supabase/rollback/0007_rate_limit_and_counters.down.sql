drop trigger if exists orders_guard on orders;
drop trigger if exists bookings_guard on service_bookings;
drop function if exists guard_public_insert(), enforce_rate_limit(text, int), client_ip(),
  refresh_facet_counts(), refresh_brand_counts(), prune_rate_limits();
alter table orders drop column if exists hp;
alter table service_bookings drop column if exists hp;
drop table if exists rate_limits;
