# Sincronizare pandashop.md

## Partea A — sursa

### A.1 Feed oficial: NU există (încă)

`data/source/` nu există în repo, deci nu avem nici XML, nici CSV, nici
documentație de API de la ei. **Cere-l la pandashop pe baza parteneriatului** —
ce trebuie să conțină e scris în `feed-source.mjs`, în capul fișierului.

Până atunci merge sursa HTML de mai jos. Când feed-ul apare, se schimbă
`PANDASHOP_SOURCE=feed` și se implementează cele două metode din `feed-source.mjs`.
Restul pipeline-ului nu se atinge.

### A.2 Ce oferă totuși site-ul lor

Vestea bună: **nu e scraping fragil.** pandashop publică date structurate pe care
le citim ca atare, nu ghicite din markup de prezentare:

| Ce | Unde | De ce contează |
|---|---|---|
| `application/ld+json` tip `Product` pe fiecare pagină | sku, nume, model, brand, descriere, imagini, preț, disponibilitate, GTIN | structură declarată, nu dedusă |
| tabel `oneProd-paramsTbl` | anotimp, lățime, profil, diametru, indice sarcină, indice viteză, pivoți, XL | atributele care nu încap în titlu |
| `sitemap.xml` → `products-instock-*` / `products-outofstock-*` | toate URL-urile, separate pe stoc | detectarea `delisted` fără crawl |
| listare `?page_=page_N` | 60 de carduri/pagină, cu titlu, preț, preț vechi, disponibilitate | enumerare completă în 138 de cereri |

Categoria de anvelope: `/ro/catalog/auto_electronics/tires_and_wheels/tyres/`.
Perechea RU e același slug cu `/ru/` în loc de `/ro/` (confirmat prin `hreflang`).

**`?sort_=` NU se folosește** — robots.txt-ul lor îl interzice explicit. Nu e
nevoie: ordinea implicită a catalogului e deja descrescătoare după ID, adică
exact „cele mai noi întâi".

### Regim de crawl

Concurență 4, pauză 400–800 ms, retry exponențial doar pe 429/5xx, User-Agent
care spune cine suntem și pe cine să sune. Fiecare răspuns se salvează în
`data/sync/cache/`, deci o rulare întreruptă se reia fără să mai atingă sursa.

## Partea B — Gate 1: raportul de potrivire

```bash
node --env-file=.env.local tools/sync/pandashop/report-match.mjs            # tot catalogul
node --env-file=.env.local tools/sync/pandashop/report-match.mjs --limit 200 # eșantion
```

**Nu scrie nimic.** `db.mjs` n-are nicio funcție de scriere — nu e o convenție,
e o imposibilitate. Rezultatul ajunge în `reports/sync/gate1-*.{md,json}`.

Cheia de potrivire (`natural-key.mjs`):

```
brand · model · lățime · profil · diametru · indice sarcină · indice viteză · XL · runflat
```

Ce NU intră în cheie: anotimpul (îl scriu inconsistent), prețul și stocul (se
schimbă), titlul (formulare liberă), slug-ul (al nostru, nu al lor).

## Ce a ieșit la Gate 1 (rulare pe 2026-08-30)

| | |
|---|---|
| Anvelope la noi | 15.008 |
| Anvelope în stoc la ei | 8.221 (enumerate 8.221 din 8.221 declarate) |
| Anvelope fără stoc la ei, din sitemap | 16.811 |
| **Potrivite exact** | **6.996 — 85,1%** |
| Ambigue | 36 |
| Candidați de import | 1.158 (1.087 complet noi, 71 variante) |
| La ei, dar fără stoc — NU se marchează `delisted` | 3.074 |
| Candidați reali de `delisted` | 4.940 |
| Branduri necunoscute | 22 |

### Trei lucruri de știut înainte de Gate 2

**1. Titlurile noastre își contrazic propriile coloane — 1.959 de produse.**
`#12379` are titlul „Rockblade Rock 555 185/60 R15 **84H**" și coloanele
`load_index=86`. Importul vechi a luat indicii din atributele OpenCart, care nu
sunt de acord cu titlul aceluiași rând. Pandashop scrie indicii în titlu, deci
potrivirea se face pe DOUĂ chei: una din coloanele noastre, una din titlul nostru
parsat cu exact aceeași funcție ca al lor. Fără a doua cheie, potrivirea scade de
la 85,1% la 74,6% și ~900 de produse pe care le avem deja ar fi importate din nou.
De decis separat: care sursă are dreptate, titlul sau coloana.

**2. Listarea lor arată doar ce au în stoc.** De aceea descoperirea trece și prin
`products-outofstock-*`. Fără pasul ăsta, „doar la noi" ar fi fost 8.014 în loc de
4.940 — adică 3.074 de produse marcate `delisted` degeaba.

**3. Cele 36 de ambiguități sunt, în bună parte, duplicate deja existente la noi.**
Exemplu: `#990 anvelope-lassa-driveways-sport-235-45-r18-98y` și
`#8485 lassa-driveways-sport-235-45-r18-98y` sunt același produs, intrat de două
ori la importul vechi. Sincronizarea nu le repară singură — merg în carantină.

## Teste

```bash
node --test tools/sync/pandashop/*.test.mjs
```

## Fișiere

| Fișier | Rol |
|---|---|
| `source.mjs` | contractul `CatalogSource`; nimic altceva nu-l cunoaște pe pandashop |
| `html-source.mjs` | implementarea de azi: JSON-LD + tabel de caracteristici |
| `feed-source.mjs` | schelet gol + ce trebuie cerut de la ei |
| `http.mjs` | client civilizat, cache, checkpoint |
| `natural-key.mjs` | normalizarea și cheia de deduplicare |
| `parse-title.mjs` | titlul lor → câmpurile cheii, prin `parseSize` existent |
| `db.mjs` | citirea catalogului nostru. Doar citire |
| `config.mjs` | pragurile întrerupătorului, în configurare, nu în cod |
| `report-match.mjs` | rularea de la Gate 1 |

## Etapa 0 — pregătirea (Gate 0)

```bash
node --env-file=.env.local tools/sync/pandashop/report-mismatch.mjs    # 0.1 titlu vs coloane
node --env-file=.env.local tools/sync/pandashop/report-duplicates.mjs  # 0.2 duplicate interne
node --env-file=.env.local tools/sync/pandashop/fix-columns.mjs        # corectia, DRY-RUN
```

`fix-columns.mjs` fara `--apply` nu scrie nimic. Scrierea nici nu e implementata
inca — se activeaza dupa aprobarea rapoartelor.

## Detectorul de produse noi (scopul final)

Nu potrivim produsele lor cu ale noastre — n-avem nevoie. `pandashop_seen` ține
minte ce ID-uri existau la ei în ziua înghețării; orice ID care apare mai târziu
și nu e acolo e produs nou. O comparație de mulțimi.

```bash
node --env-file=.env.local tools/sync/pandashop/baseline.mjs --apply  # o singură dată
node --env-file=.env.local tools/sync/pandashop/detect.mjs            # rapid, la 3 ore
node --env-file=.env.local tools/sync/pandashop/detect.mjs --full     # complet, săptămânal
```

### Gate A — făcut

Fotografia inițială: **8.221 ID-uri** în `pandashop_seen`, toate `baseline`,
niciunul importat. `products` neatins — 15.010 rânduri, zero cu `pandashop_id`,
zero cu `source <> 'legacy'`, iar cel mai recent `updated_at` din tabel e din
27 august, adică dinaintea acestei lucrări.

Zero-detecție: după fotografie, detectorul găsește **0 produse noi**, și în
rularea rapidă, și în enumerarea completă a celor 138 de pagini.

`db-write.mjs` are o listă albă de tabele în care `products` nu figurează. O
scriere greșită eșuează înainte să atingă rețeaua, nu după.

### Gate B — făcut

```bash
node --env-file=.env.local tools/sync/pandashop/import.mjs                  # dry-run
node --env-file=.env.local tools/sync/pandashop/import.mjs --simuleaza 40   # dry-run pe produse simulate
node --env-file=.env.local tools/sync/pandashop/import.mjs --limit 3 --apply
```

Șase verificări, toate obligatorii: dimensiune parsată · brand existent · preț
pozitiv · cel puțin o imagine · titlu în ambele limbi · slug fără coliziune.
Orice eșec trimite produsul întreg în carantină; nu există import parțial.

Trei produse importate real și verificate pe producție (200 pe RO și pe RU,
preț cu marjă, „Disponibil · livrare 1–3 zile", imagine din Supabase Storage).
`products` a rămas cu 15.010 rânduri `legacy`, cu `updated_at` neschimbat.

#### Convenția de slug, dedusă din catalog și verificată pe el

| | |
|---|---|
| RO | titlul fără cuvântul de categorie, minuscule, cratime — `crosswind-comfort-peak-165-65-r15-81h` |
| RU | la fel, dar lățimea se lipește de profil — `crosswind-comfort-peak-16565-r15-81h` |

Generatorul reproduce **12.430 din 15.010** slug-uri RO existente exact. Restul
sunt din valuri de import mai vechi: 2.446 cu prefixul `anvelope-` și 134 cu
sufix numeric. Convenția dominantă e cea fără prefix, deci aia se folosește.

La coliziune, produsul merge în carantină. Nu se adaugă niciodată sufix `-1` și
nu se suprascrie un slug existent — e singura protecție împotriva creării unui
duplicat al unui produs pe care îl avem deja sub alt ID.

#### Marja

`settings.pricing_rules`, editabile din admin. Se evaluează în ordine și câștigă
prima care se potrivește: **brand → interval de preț → implicit**. Rotunjire
`end_9`: următorul multiplu de 10, minus 1, fără să coboare sub marja calculată.

#### Imaginile

Cerute direct la 900×900 de la CDN-ul lor, care acceptă `w`/`h` în query — nu
instalăm o bibliotecă de procesare ca să facem ce face deja serverul lor.
Numele fișierului e SHA-1-ul conținutului, ca la cele 1.749 existente, deci
aceeași fotografie nu se urcă de două ori.

### Ce urmează

Gate C: Vercel Cron la 3 ore, blocaj de execuție, alerte pe e-mail prin Resend.
