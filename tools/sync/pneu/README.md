# Sincronizare pneu.md

A treia sursă de catalog, după pandashop și pneuexpert. Parteneriat confirmat de
atelier pe 16 septembrie 2026 — la fel ca la celelalte două, nu citim nimic ce
nu ne-au dat voie să citim.

## Ce e altfel față de celelalte două

| | pandashop | pneuexpert | **pneu.md** |
|---|---|---|---|
| De unde | pagini HTML | pagini HTML | **API JSON** |
| Cereri pe rulare | ~8.300 | ~5.500 | **1** |
| Date structurate | `ld+json` | microdate + tabel | **câmpuri separate** |
| Enumerare | listare paginată | sitemap + listare | **n-are — vine tot** |
| Legătura cu furnizorul | `pandashop_id` | `pneuexpert_id` | **`product_sources`** |
| Cod | ~2.000 de linii | ~1.200 | **~700** |

### Site-ul lor nu se poate citi. API-ul lor, da.

pneu.md e o aplicație Angular fără randare pe server: `/search/tires/205/55/16`,
`/brands/...`, orice adresă — toate întorc același HTML de 78 KB, pagina goală a
aplicației. Nu există HTML de parsat, iar sitemap-ul lor n-are niciun produs în
el (569 de pagini de căutare, 9 mărci, 4 oferte).

Aplicația își ia datele dintr-un serviciu declarat deschis în pachetul lor
`main.js`, ca `wo_baseUrl`. `GET /tires` întoarce **tot catalogul**: ~10 MB,
7.260 de anvelope, cu marca, modelul, dimensiunea, indicii, sezonul, prețul și
pozele în câmpuri separate. Paginarea nu există — `?page=` și `?limit=` sunt
ignorate, vine tot de fiecare dată. De aceea cerem o singură dată pe rulare și
ținem răspunsul în cache pe disc.

### ⚠️ `primeCost` — ce NU luăm de la ei

Fiecare rând din răspunsul lor conține `primeCost`, adică **prețul lor de
achiziție**, plus `discount` și `transferLimit`. API-ul n-are autentificare.

Nu e al nostru. `json-source.mjs` copiază câmp cu câmp, dintr-o listă albă
(`CAMPURI`), tocmai ca prețul lor de achiziție să nu poată ajunge nici în
fotografie, nici în baza noastră, nici dintr-o neatenție viitoare. `sources.mjs`
lasă `cost_mdl` NULL din același motiv. Există un test care verifică asta.

Expunerea a fost semnalată atelierului pe 16 septembrie 2026, ca s-o ducă mai
departe la ei.

### Titlul se construiește, ca la pneuexpert

Ei n-au un titlu de catalog, au un șir de factură:
`195/55R 16 87H TL WP-52 KUMHO SOUTH KOREA`. Nu-l întoarcem cu expresii
regulate — luăm câmpurile, care sunt deja separate, și scriem titlul în
convenția noastră: `Kumho WP-52 195/55 R16 87H`. De acolo încolo `parseTitle`
îl citește ca pe oricare altul.

### XL, runflat și omologarea sunt DOAR în șirul de factură

Nu există câmpuri pentru ele. Se citesc din `invoiceName`, de unde ies și
marcajele de omologare (`RO1`, `MO`, `AO`, `N0`–`N4`, `VOL`), puse la coada
titlului fiindcă acolo le caută `parseTitle`.

**La 829 de rânduri `invoiceName` lipsește cu totul.** Nu presupunem „non-XL":
din rândurile care au șir de factură, **peste jumătate sunt XL**, deci
presupunerea ar fi greșită mai des decât corectă — iar o anvelopă XL contopită
peste una non-XL e exact potrivirea falsă pe care cheia naturală există s-o
împiedice. Rândurile alea se refuză la fotografiere și se raportează. Dintre
ele, **una singură are stoc**, deci nu pierdem nimic vandabil.

### Stocul: `isInStock` minte, `stock` nu

`isInStock` e `true` pe toate cele 7.260 de rânduri ale lor — nu e un semnal, e
o constantă. Ce se poate obține se vede în `stock` (ce au în depozit) și
`invoiceStock` (ce pot aduce). Oricare pozitiv → `supplier`, adică „Disponibil ·
livrare 1–3 zile"; niciunul → `out_of_stock`, fișă vizibilă fără o promisiune pe
care nimeni n-o poate onora.

### Catalogul lor are dubluri în el

225 de anvelope apar de două ori, cu două `id`-uri și două prețuri
(„Kumho Solus 4S HA32 225/45 R19 96W XL": 2.800 și 2.950 de lei). Se alege un
singur rând înainte de import — stocul bate prețul, prețul bate vechimea — altfel
am sparge chiar regula pentru care există `product_sources`: o anvelopă, un
produs, un preț, un furnizor.

## Cele două rulări

```bash
# 1. Fotografia catalogului lor. Singura care atinge API-ul lor. ~70 de secunde.
node --env-file=.env.local tools/sync/pneu/snapshot.mjs

# 2. Potrivirea și importul, din fotografie. Dry-run implicit.
node --env-file=.env.local tools/sync/pneu/import.mjs
node --env-file=.env.local tools/sync/pneu/import.mjs --branduri
node --env-file=.env.local tools/sync/pneu/import.mjs --apply --branduri
```

Fotografia se scrie în `data/sync/pneu/catalog.ndjson`, iar răspunsul lor rămâne
în cache pe disc. O schimbare de parser se aplică peste tot dintr-o repornire
offline, fără să-i mai deranjăm.

## Ce se importă, și ce nu

**Nu se importă tot ce au.** Măsurat pe catalogul lor întreg, între 24% și 48%
din anvelopele lor le avem deja, de la pandashop, de la pneuexpert sau din
OpenCart. „Importul total" înseamnă acoperirea completă a gamei lor, nu numărul
lor de rânduri: ce avem se leagă printr-un rând în `product_sources`, ce n-avem
intră ca produs nou cu `primary_source = 'pneu'`.

Aceleași **șase verificări** ca la celelalte două surse: dimensiune parsată ·
brand cunoscut · preț pozitiv · cel puțin o imagine · titlu în ambele limbi ·
slug fără coliziune.

### Ce NU atinge, niciodată

- **prețul unui produs care are deja alt `primary_source`** — rămâne al lui;
- **`price_locked`** — prețul pus de om nu se rescrie de nicio sincronizare;
- **`in_stock`** — stocul fizic al atelierului, protejat de migrarea 0029;
- **`primary_source`-ul produselor existente** — promovarea altui furnizor e o
  decizie separată, nu efectul secundar al unui import.

O abatere de la pneuexpert, deliberată: acolo, un produs fără preț intra în
catalog ca `out_of_stock` cu preț NULL, pentru că ~23% din fișele lor vechi
n-aveau preț. Aici **toate cele 7.260 de rânduri au preț pozitiv**, deci un rând
fără preț ar însemna că s-a schimbat ceva la ei — merge în carantină, nu în
catalog.

## Două lucruri care ar sta mai bine în fișierele comune

Amândouă sunt scrise aici ca să nu se uite, și amândouă au fost ocolite —
nu rezolvate — ca să nu se atingă cod care rulează în producție în fiecare noapte
(regula 3 a planului).

1. **`pandashop/http.mjs` trimite `Accept: text/html`.** Spring Boot-ul lor
   răspunde la asta cu 406. Aici e nevoie de o singură cerere pe rulare, deci
   `json-source.mjs` are clientul lui. Locul curat e un `accept` opțional în
   `http.mjs`, cu `text/html` implicit.
2. **`pandashop/db-write.mjs` n-are `product_sources` în lista albă.**
   `sources.mjs` are propria listă albă, cu exact un tabel în ea. Când vine a
   doua sursă nouă, merită mutat în lista comună, o dată, cu ochii pe pandashop.

O a treia, mai mică: `pandashop/images.mjs` nu ține pozele în cache pe disc, deci
un dry-run și un apply descarcă de două ori aceleași fotografii din bucket-ul
lor. Nu e grav — e un CDN, nu serverul lor de aplicație — dar e de știut înainte
de a rula dry-run-ul de trei ori la rând.

## Ce NU face încă

Nu există cron. Prețurile și stocul de la pneu.md se scriu o dată, la import, și
nu se mai confruntă cu sursa. Când se scrie echivalentul lui `refresh.mjs`,
prima întrebare de răspuns e care furnizor are prioritate pe prețul unui produs
pe care îl au mai mulți — iar la ei asta nu mai e o excepție, e cazul obișnuit.

## Teste

```bash
node --test tools/sync/pneu/*.test.mjs
```
