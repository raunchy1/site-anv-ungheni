/*
 * O ANVELOPĂ, MAI MULȚI FURNIZORI.
 *
 * Până acum fiecare sursă își primea coloana ei: `pandashop_id`, apoi
 * `pneuexpert_id`. Merge pentru două. Pentru șapte ar însemna șapte coloane,
 * șapte funcții de legare și șapte locuri de uitat câte una.
 *
 * Aici legăturile trec într-un tabel. Un rând = „produsul X există la
 * furnizorul Y sub codul Z". Adăugarea unui furnizor nou nu mai schimbă schema.
 *
 * DE CE CONTEAZĂ, DINCOLO DE ELEGANȚĂ. Cele 329 de produse legate azi și de
 * pandashop, și de pneuexpert dovedesc că potrivirea pe cheia naturală
 * recunoaște aceeași anvelopă la surse diferite. Cu cinci furnizori, fiecare
 * anvelopă de marcă va fi la mai mulți. Fără evidența asta, fie o importăm de
 * cinci ori, fie nu știm pe cine să întrebăm când cel care ne-o dădea n-o mai
 * are.
 *
 * `primary_source` spune cine dictează prețul ACUM. Regula cerută de atelier e
 * simplă: o anvelopă se ia de la un singur furnizor, cu un singur preț. Când
 * acela n-o mai are, importul poate promova altul — fără ca produsul să moară
 * pe site deși trei furnizori îl au pe raft.
 *
 * `cost_mdl` e prețul LOR, nu al nostru. Se ține ca să se vadă marja reală și
 * ca promovarea să se poată face în cunoștință de cauză.
 *
 * Coloanele vechi rămân. Conductele de import care rulează azi le citesc, iar
 * o migrare care le scoate acum ar opri sincronizarea în aceeași noapte.
 */
create table if not exists product_sources (
  product_id  bigint      not null references products(id) on delete cascade,
  source      text        not null,
  external_id text        not null,
  cost_mdl    numeric,
  available   boolean     not null default false,
  seen_at     timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  primary key (product_id, source),
  unique (source, external_id),
  constraint product_sources_source_nevid check (length(trim(source)) > 0),
  constraint product_sources_extern_nevid check (length(trim(external_id)) > 0)
);

comment on table product_sources is
  'Legatura dintre un produs din catalog si codul lui la fiecare furnizor. Un rand per (produs, furnizor). Inlocuieste coloanele pandashop_id / pneuexpert_id, care raman pana cand conductele vechi sunt mutate.';
comment on column product_sources.cost_mdl is
  'Pretul furnizorului, nu al nostru. Comercial sensibil: tabelul nu e lizibil public.';

create index if not exists product_sources_source_idx on product_sources (source, available);
create index if not exists product_sources_seen_idx   on product_sources (source, seen_at);

/*
 * COSTURILE FURNIZORILOR NU SE CITESC DIN BROWSER.
 *
 * Catalogul public se citeste cu cheia anonima. Tabelul asta contine cat platim
 * noi pe fiecare anvelopa — exact cifra pe care un concurent ar vrea-o. RLS
 * pornit si nicio politica: doar cheia de serviciu ajunge la el.
 */
alter table product_sources enable row level security;
revoke all on table product_sources from anon, authenticated;

/* Cine dicteaza pretul si stocul acum. NULL = produs fara furnizor extern
   (stocul propriu al atelierului, sau ramasitele din OpenCart). */
alter table products add column if not exists primary_source text;
comment on column products.primary_source is
  'Furnizorul care dicteaza pretul si disponibilitatea acestui produs. NULL pentru stocul propriu si pentru randurile mostenite fara furnizor.';

/* ------------------------------------------------- mutarea legaturilor vechi */
insert into product_sources (product_id, source, external_id, available, seen_at)
select id, 'pandashop', pandashop_id, stock_status <> 'out_of_stock', coalesce(synced_at, now())
from products where pandashop_id is not null
on conflict do nothing;

insert into product_sources (product_id, source, external_id, available, seen_at)
select id, 'pneuexpert', pneuexpert_id, stock_status <> 'out_of_stock', coalesce(synced_at, now())
from products where pneuexpert_id is not null
on conflict do nothing;

update products set primary_source = 'pandashop'  where pandashop_id  is not null and primary_source is null;
update products set primary_source = 'pneuexpert' where pneuexpert_id is not null and primary_source is null;
