-- 0023 — brandul „Comfoser" era scris greșit; se corectează în „Comforser".
--
-- DE CE CONTEAZĂ. Toate cele 38 de titluri din catalog scriu corect
-- „Comforser CF930 …", dar rândul din `brands` avea „Comfoser", fără `r`.
-- `parseTitle` caută brandul printre numele pe care le avem, deci nu-l găsea
-- niciodată: cele 38 de anvelope erau invizibile pentru potrivire. Recuperarea
-- din 5 septembrie 2026 a creat, în consecință, un al doilea brand — „Comforser"
-- — și a încercat să le importe a doua oară. Verificarea de coliziune pe slug a
-- prins-o și le-a trimis în carantină; corect, dar cauza era aici.
--
-- Ordinea contează: brandul duplicat se șterge ÎNAINTE de redenumire, altfel
-- slug-ul „comforser" e ocupat și `brands_slug_ro_key` refuză.

update products set brand_id = 23, brand_name = 'Comforser' where brand_id = 270;

delete from brands where id = 270;

update brands set
  name = 'Comforser',
  slug_ro = 'comforser',
  slug_ru = 'comforser',
  updated_at = now()
where id = 23;

update products set brand_name = 'Comforser' where brand_id = 23;
