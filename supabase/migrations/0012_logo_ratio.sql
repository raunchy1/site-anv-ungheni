-- 0012 — proporția logo-ului, ca banda să nu mai fie o bară goală
-- Idempotentă. Rollback: supabase/rollback/0012_logo_ratio.down.sql
--
-- Banda avea lățime fixă. Pentru un wordmark lat (CONTINENTAL) e exact bine;
-- pentru o emblemă aproape pătrată (Joyroad, Nexen) însemna o placă de 96×26 cu
-- un desen de 26×26 în mijloc — adică o bară, cu logo-ul ca accident.
--
-- Cu proporția cunoscută, lățimea benzii se calculează din înălțime și rămâne
-- între 26 și 96 px. Înălțimea rămâne fixă, deci grila nu se mișcă și CLS-ul
-- rămâne zero.

alter table brands add column if not exists logo_ratio numeric(6,3);

comment on column brands.logo_ratio is
  'Lățime/înălțime a fișierului de logo. Setat din măsurătoarea de randare, nu manual.';
