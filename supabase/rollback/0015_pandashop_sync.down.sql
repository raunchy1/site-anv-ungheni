-- Rollback 0015. Nu atinge datele existente din `products`.
drop table if exists sync_quarantine;
drop table if exists pandashop_seen;

drop index if exists products_pandashop_id_uidx;
drop index if exists products_source_idx;

alter table products drop column if exists pandashop_id;
alter table products drop column if exists source;
alter table products drop column if exists source_price_mdl;
alter table products drop column if exists imported_at;

alter table settings drop column if exists pricing_rules;
alter table settings drop column if exists sync_enabled;

drop type if exists product_source;
-- valorile de enum nu se pot scoate din import_source; rămâne 'pandashop_sync'
