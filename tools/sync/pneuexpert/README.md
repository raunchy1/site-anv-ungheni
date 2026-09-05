# Sincronizare pneuexpert.md

A doua sursă de catalog, după pandashop. Parteneriat confirmat de atelier pe
5 septembrie 2026 — la fel ca la pandashop, nu citim nimic ce nu ne-au dat voie
să citim.

## Ce e altfel față de pandashop

| | pandashop | pneuexpert |
|---|---|---|
| Date structurate | `application/ld+json` tip Product | microdate schema.org + tabel „Caracteristici" |
| Titlul | „Marcă Model Dimensiune Indici" — ca al nostru | „MARCĂ Dimensiune Indici MODEL" — se reconstruiește |
| Pagina RU | text rusesc, trebuie adusă | același șir latin; **nu se cere** |
| Descriere | are | n-are (doar meta-text care le numește magazinul) |
| Enumerare | listare paginată, 138 de pagini | sitemap **din 2023** + listare paginată |

### Titlul se reconstruiește, nu se rescrie

Ei scriu „MINERVA 255/35 R18 94V FROSTRACK UHP XL (rear)". Catalogul nostru scrie
„Marcă Model Dimensiune Indici". Nu încercăm să întoarcem șirul lor cu expresii
regulate: luăm câmpurile din tabelul de caracteristici, care sunt deja separate,
și construim titlul în convenția noastră — „Minerva Frostrack UHP 255/35 R18 94V
XL (rear)". De acolo încolo, `parseTitle` îl citește ca pe oricare altul.

La ~7% din fișe lipsește rândul „Model" din tabel, dar modelul e în numele lor,
după indici. `modelDinNume` îl culege scoțând marca, dimensiunea, indicii și
steagurile; ce rămâne e modelul. Fără pasul ăsta, 19 din primele 277 de anvelope
citite ajungeau în carantină cu „model lipsă", deși modelul era scris pe pagină.

### Enumerarea merge pe două căi, pentru că niciuna nu e completă

- **Sitemap-ul lor e din noiembrie 2023.** Cele mai noi anvelope nu sunt în el, iar
  ~65% din adresele care sunt răspund 404 — produse scoase de atunci.
- **Listarea paginată arată doar ce au pe stoc azi** — 546 de anvelope.

Reuniunea: **5.608 adrese**, din care rămân vii vreo 1.900.

Paginarea lor nu se termină cu o pagină goală: o pagină peste ultima întoarce
din nou pagina 1, cu 200 OK. Regula de oprire e „setul de produse se repetă" —
singurul semn cinstit că am trecut de capăt.

## Cele trei rulări

```bash
# 1. Fotografia catalogului lor. Singura care atinge rețeaua. ~90 de minute.
node --env-file=.env.local tools/sync/pneuexpert/snapshot.mjs

# 2. Potrivirea și importul, din fotografie. Dry-run implicit.
node --env-file=.env.local tools/sync/pneuexpert/import.mjs
node --env-file=.env.local tools/sync/pneuexpert/import.mjs --branduri
node --env-file=.env.local tools/sync/pneuexpert/import.mjs --apply --branduri
```

Fotografia se scrie în `data/sync/pneuexpert/catalog.ndjson`, iar fiecare pagină
rămâne în cache pe disc. O rulare întreruptă se reia fără să mai atingă sursa, iar
o schimbare de parser se aplică peste tot dintr-o repornire offline.

## Ce se importă, și ce nu

**Nu se importă tot ce au.** Aproape jumătate din anvelopele lor le avem deja, de
la pandashop sau din OpenCart. Importate a doua oară ar însemna două fișe pentru
aceeași anvelopă, cu două prețuri și două adrese — exact ce strică un catalog.
„Tot catalogul lor" înseamnă acoperire completă a gamei, nu numărul lor de
rânduri: ce avem se leagă prin `pneuexpert_id`, ce n-avem intră.

Legătura se scrie prin `sync_link_pneuexpert` (migrarea 0027), o funcție care
poate atinge exact o coloană și doar când e NULL. `db-write.mjs` refuză în
continuare orice UPDATE pe `products`.

Aceleași **șase verificări** ca la pandashop: dimensiune parsată · brand cunoscut ·
preț pozitiv · cel puțin o imagine · titlu în ambele limbi · slug fără coliziune.

Două abateri deliberate de la regulile pandashop:

1. **Fără preț nu înseamnă fără fișă.** La pandashop, un produs fără preț intra pe
   listă de așteptare, pentru că a doua zi cronul îl verifica din nou. Aici nu
   există încă un cron, iar ~23% din fișele lor vechi n-au preț. Intră în catalog
   ca `out_of_stock` cu preț NULL: se găsesc după dimensiune și marcă, iar pagina
   spune cinstit că nu sunt disponibile.

2. **Stocul lor devine stocul nostru.** Ce e pe stoc la ei intră ca `supplier` —
   „Disponibil · livrare 1–3 zile". Ce nu e, intră `out_of_stock`. Nu promitem o
   livrare pe care nimeni n-o poate onora.

Mărcile din `config.brands.excluse` (aceeași listă ca la pandashop) nu se importă
și nu se creează, nici cu `--branduri`.

## Ce NU face încă

Nu există cron. Prețurile și stocul de la pneuexpert se scriu o dată, la import,
și nu se mai confruntă cu sursa. Pandashop are `refresh.mjs` și o rulare zilnică;
echivalentul de aici se scrie când se decide care furnizor are prioritate pe
prețul unui produs pe care îl au amândoi.

## Teste

```bash
node --test tools/sync/pneuexpert/*.test.mjs
```
