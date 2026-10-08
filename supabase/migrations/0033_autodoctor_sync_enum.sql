-- autodoctor.md, a patra sursă de catalog.
--
-- Ambele etichete dintr-o dată: `products.source` (enum `product_source`) și
-- `import_runs.source` (enum `import_source`) sunt două enumerări diferite.
-- La pneu.md a lipsit a doua, iar importul a picat la ultima linie (vezi 0032).
--
-- Legătura cu furnizorul stă în `product_sources` (0030), deci nu e nevoie de
-- nicio coloană nouă. Adăugarea unei etichete de enum nu atinge niciun rând.
alter type product_source add value if not exists 'autodoctor_sync';
alter type import_source add value if not exists 'autodoctor_sync';
