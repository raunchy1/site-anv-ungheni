# Sincronizare autodoctor.md

A patra sursă de catalog, după pandashop, pneuexpert și pneu.md. Cerută de
atelier pe 8 octombrie 2026: „import complet, toate anvelopele și toate pozele,
la fel ca pe celelalte platforme".

## De unde citim

Magazinul lor e o aplicație Angular. API-ul ei (`POST /api/products`) răspunde
**403 oricui**, inclusiv unui browser adevărat, deci nu e o cale. Paginile de
listare vin însă randate pe server, iar în ele, în
`<script id="autodoctor-state" type="application/json">`, stă exact lista pe
care o afișează aplicația: dimensiune, sezon, indici, preț, stoc, marcă, poză.
Toată categoria „Anvelope" înseamnă **134 de pagini** (16 anvelope pe pagină),
nu 2.100 de pagini de produs.

Trei capcane, toate verificate:

| | |
|---|---|
| User-Agent cu „bot" sau „sync" | serverul dă coaja goală (`x-ssr-mode: CSR`), fără date. Trimitem `AnvelopeUngheni/1.0` și adresa în antetul `From`. |
| `?limit=` sau filtre în adresă | tot coaja goală. Merg doar `page` și `sort`. |
| `sort` implicit | depinde de stoc și popularitate, deci produsele se mută între pagini. Citim cu `sort=name_asc`. |

Poza din listare e `wc` (400×400); aceeași cale cu `wd` e 800×800 și pe aia o
luăm.

## Modelul se ia din `application`, nu din `sku`

Fiecare anvelopă are trei nume: `name` („GY-215/55R16 UG PERF+"), `sku`
(„215/55R16 UG PERF +") și `application` („215/55R16 93H UG PERF 3 зима").
Catalogul nostru are deja majoritatea anvelopelor lor — Joyroad, Hilo,
Habilead, Crosswind — scrise ca în `application`: „Winter RX808", „Arctic S8",
„Genesys XP1". Luat din `sku` („RX808", „S8"), modelul n-ar mai recunoaște
fișele noastre și s-ar dubla ~1.500 de anvelope.

Indicele de sarcină stă aproape doar în `application`, uneori lipit de XL
(„98XLV", „107TXL") sau cu „Т" chirilic („88Т").

## Potrivirea tolerantă

Peste cheia strictă și cea relaxată (comune cu pandashop), importul are o a
treia trecere: aceeași marcă, aceeași dimensiune, indici care nu se contrazic și
același model după ce scrierea e adusă la o formă comună — „SUV RX706" = „RX706
SUV", „ARCTIC S-8" = „Arctic S8", „UG PERF +" = „UltraGrip Performance+". Se
acceptă doar un candidat unic. „Quatrac Pro" și „Quatrac Pro+" rămân diferite.

## Rulările

```bash
# 1. Fotografia: ~134 de pagini, ~8 minute. Fără --proaspat citește din cache.
node --env-file=.env.local tools/sync/autodoctor/snapshot.mjs --proaspat

# 2. Potrivirea și importul. Dry-run implicit.
node --env-file=.env.local tools/sync/autodoctor/import.mjs --branduri
node --env-file=.env.local tools/sync/autodoctor/import.mjs --apply --branduri

# 3. Prețul și stocul fișelor care le aparțin (primary_source = autodoctor).
node --env-file=.env.local tools/sync/refresh-surse.mjs --sursa autodoctor --apply
```

Pe server, toate trei rulează împreună prin `/api/cron/sync?mode=autodoctor`.

## Teste

```bash
node --test tools/sync/autodoctor/*.test.mjs
```
