drop function if exists set_updated_at() cascade;
drop type if exists payment_method, delivery_method, booking_status, order_status,
  related_source, product_category, import_source, price_source, size_source,
  stock_status, season cascade;
