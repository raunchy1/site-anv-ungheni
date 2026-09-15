-- pneu.md, a treia sursă de catalog.
--
-- Doar eticheta de enum. Legătura cu furnizorul NU mai are nevoie de o coloană
-- proprie: din migrarea 0030 încoace ea stă în `product_sources`, un rând per
-- (produs, furnizor). Aici se adaugă strict valoarea pe care o scrie
-- `products.source` la rândurile create de sincronizarea cu ei.
--
-- Adăugarea unei etichete de enum nu atinge niciun rând existent.
alter type product_source add value if not exists 'pneu_sync';
