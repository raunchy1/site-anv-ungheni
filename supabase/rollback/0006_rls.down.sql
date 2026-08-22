do $$
declare t text;
begin
  foreach t in array array['products','brands','product_images','product_related','services',
                           'legal_pages','settings','reviews','orders','order_items',
                           'service_bookings','import_runs']
  loop
    execute format('alter table %I disable row level security', t);
  end loop;
end $$;
