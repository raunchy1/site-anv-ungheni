-- Anulează 0009. Recreează cele trei mărci și pune fișele înapoi sub ele.
-- Nu se poate reface repartiția exactă a celor 5 fișe Goodride între
-- „West Lake" (4) și „Goodride-WestLake" (1) decât după slug: fișa 454 e cea
-- care poartă ambele nume în titlu.
insert into brands (name, slug_ro, slug_ru) values
  ('West Lake', 'west-lake', 'west-lake'),
  ('Goodride-WestLake', 'goodride-westlake', 'goodride-westlake'),
  ('Premiorri', 'premiorri', 'premiorri')
on conflict (slug_ro) do nothing;

update products set brand_id = (select id from brands where slug_ro='goodride-westlake'), brand_name='Goodride-WestLake'
 where slug_ro = 'anvelope-goodride-westlake-z-507-215-55-r18-99v-xl';
update products set brand_id = (select id from brands where slug_ro='west-lake'), brand_name='West Lake'
 where slug_ro in ('goodride-all-season-elite-z-401-225-55-r1898v','goodride-z401-225-50-r18-95w',
                   'goodride-z507-215-60-r17-100v-xl','goodride-z507-225-65-r17-102h');
update products set brand_id = (select id from brands where slug_ro='premiorri'), brand_name='Premiorri'
 where slug_ro = 'premiorri-vimero-van-235-65-r16c-115-113r';
delete from brands where slug_ro = 'goodride' and product_count = 0;
select refresh_brand_counts();
