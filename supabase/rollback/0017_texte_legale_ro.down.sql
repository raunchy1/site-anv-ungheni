-- Golește textele scrise de 0017 și șterge pagina de cookie.
-- Paginile rămân, fără text, exact ca înainte: pe `noindex`, cu blocul „Textul
-- este în pregătire". Scheletele celorlalte trei nu se ating.
update legal_pages set body_ro = null, meta_desc_ro = null
 where slug_ro = 'politica-de-confidentialitate';
delete from legal_pages where slug_ro = 'politica-cookie';
