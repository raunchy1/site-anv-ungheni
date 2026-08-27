-- 0010 — bucketul `marci` pentru logo-urile de marcă
-- Idempotentă. Rollback: supabase/rollback/0010_bucket_marci.down.sql
--
-- Public la citire, ca și `produse`: logo-urile se servesc din `next/image`.
-- Scrierea rămâne exclusiv pe service role — singurul care încarcă e
-- `tools/logos/import-logos.mjs`. Limita de 2 MB e generoasă pentru un logo:
-- fișierele reale sunt între 2 kB (SVG) și 200 kB (PNG).
--
-- `import-logos.mjs` creează bucketul prin API dacă lipsește, deci această
-- migrare e pentru mediile unde se aplică SQL-ul direct (local, staging).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marci', 'marci', true, 2097152,
        array['image/svg+xml','image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
