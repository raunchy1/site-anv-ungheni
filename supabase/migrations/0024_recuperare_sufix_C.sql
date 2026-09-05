-- 0024 — 878 de anvelope de marfă și-au recăpătat sufixul „C" din diametru.
--
-- DE CE. Titlurile scriu corect „215/65 R16C 109/107T", dar coloana `diameter`
-- păstra „R16": sufixul s-a pierdut la importul din OpenCart. Efectul se vede
-- abia la filtre — anvelopele de marfă cădeau în sertarul de autoturisme. Cine
-- filtra R16C pe site vedea 433 de anvelope; la pandashop, pe aceleași filtre,
-- sunt de trei ori mai multe. Verificarea de paritate a scos 404 de produse
-- care erau pe site, cumpărabile, dar în sertarul greșit.
--
-- Se corectează DOAR rândurile unde titlul și coloana sunt de acord pe numărul
-- diametrului și diferă exclusiv prin litera „C" (878 din 881). Cele 3 unde și
-- numărul diferă rămân pe loc: acolo nu se știe care are dreptate, iar o
-- ghicire în catalog e mai rea decât o eroare vizibilă.
--
-- Titlul e sursa de adevăr aici, nu coloana: el e ce se afișează, el a generat
-- slug-ul, și el e ce scrie și furnizorul.

with candidat as (
  select id, diameter, size_raw,
         (regexp_match(title_ro, 'R\s*([0-9]{2})C\y', 'i'))[1] as nn
  from products
  where category = 'anvelope'
    and title_ro ~* 'R\s*[0-9]{2}C\y'
    and diameter !~ 'C$'
)
update products p set
  diameter      = c.diameter || 'C',
  size_raw      = regexp_replace(c.size_raw, '(R\s*' || c.nn || ')(\s|$)', '\1C\2', 'i'),
  is_commercial = true,
  updated_at    = now()
from candidat c
where p.id = c.id
  and c.diameter = 'R' || c.nn;

select refresh_facet_counts();
select refresh_brand_counts();
