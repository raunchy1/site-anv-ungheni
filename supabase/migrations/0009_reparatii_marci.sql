-- 0009 — trei reparații de marcă, verificate pe titlurile reale ale fișelor
-- Idempotentă. Rollback: supabase/rollback/0009_reparatii_marci.down.sql
--
-- 1. „West Lake" (4 fișe) și „Goodride-WestLake" (1) nu conțin anvelope Westlake.
--    Titlurile lor sunt „Goodride All Season Elite Z-401", „Goodride Z401",
--    „Goodride Z507" ×2 și „Goodride-WestLake Z-507". Goodride și Westlake sunt
--    două mărci ale aceleiași firme (ZC Rubber), cu logo-uri diferite, deci nu
--    se pot uni. Cele 5 fișe trec sub o marcă nouă, `Goodride`; `Westlake`
--    rămâne cu cele 22 ale ei.
--    Observație: fișa 454 poartă în titlu ambele nume, așa cum a venit din sursă.
--
-- 2. „Premiorri" (1 fișă, „Premiorri Vimero Van 235/65 R16C") nu e marcă, e linia
--    premium a lui Rosava; celelalte 166 de fișe Premiorri/Rosava sunt deja sub
--    Rosava. Fișa trece la Rosava, marca dispare.
--
-- 3. `Roadstone` (51) și `Marshal` (36) rămân neatinse: sunt sub-mărci reale
--    (Nexen, respectiv Kumho), cu logo propriu.

insert into brands (name, slug_ro, slug_ru, meta_title_ro, meta_title_ru)
select 'Goodride', 'goodride', 'goodride', 'Anvelope Goodride - Ungheni', 'Шины Goodride - Унгены'
where not exists (select 1 from brands where slug_ro = 'goodride');

update products p
   set brand_id = (select id from brands where slug_ro = 'goodride'),
       brand_name = 'Goodride'
 where p.brand_id in (select id from brands where slug_ro in ('west-lake', 'goodride-westlake'));

update products p
   set brand_id = (select id from brands where slug_ro = 'rosava'),
       brand_name = 'Rosava'
 where p.brand_id in (select id from brands where slug_ro = 'premiorri');

delete from brands where slug_ro in ('west-lake', 'goodride-westlake', 'premiorri');

select refresh_brand_counts();
