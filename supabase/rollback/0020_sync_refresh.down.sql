-- Rollback 0020. Coloana `synced_at` se păstrează: e istoric, nu structură.
drop function if exists sync_refresh_products(jsonb);
