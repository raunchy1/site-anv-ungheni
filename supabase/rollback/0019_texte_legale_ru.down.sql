-- Golește doar traducerile ruse scrise de 0019. Textele românești din 0017 rămân.
update legal_pages set body_ru = null, meta_desc_ru = null
 where slug_ro in ('politica-de-confidentialitate', 'politica-cookie');
