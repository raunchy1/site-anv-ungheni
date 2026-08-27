---
title: "Audit tehnic complet — anvelope-ungheni.md"
subtitle: "Starea site-ului la 27 august 2026"
author: "Raport de sesiune"
lang: ro
---

# Audit tehnic complet — anvelope-ungheni.md

**Data:** 27 august 2026 · **Ramura:** `master`, 15 commit-uri · **Ultimul commit auditat:** `e4a2136`
**Obiectul auditului:** tot ce s-a construit până acum — baza de date, aplicația Next.js, uneltele de migrare, conținutul, configurația de livrare.

Acest raport nu descrie intenții. Fiecare cifră din el vine dintr-o comandă rulată astăzi pe codul și pe baza reală, iar comenzile sunt listate în Anexa A ca să poată fi repetate.

---

## 1. Rezumat executiv

Site-ul este, tehnic, într-o stare bună: se construiește curat, are 19 teste care trec, zero erori de tipuri, performanță de 90–100 la Lighthouse pe toate cele trei tipuri de pagină și zero coliziuni de rutare pe 15.157 de slug-uri per limbă. Catalogul de 15.010 produse e migrat integral, în ambele limbi, cu imagini în Storage și cu rute identice cu ale site-ului vechi.

Ce nu e gata ține de **comerț și de conținut**, nu de infrastructură: nu există coș, nu există checkout, nu există căutare liberă și nu există panou de administrare. Din conținut lipsesc programul de duminică, textele celor 9 servicii, textele celor 4 pagini legale, descrierile celor 134 de mărci și logo-urile lor.

### Verdictul pe scurt

| Zonă | Stare | Notă |
|---|---|---|
| Baza de date și migrarea | **Gata** | 15.010 produse, 134 mărci, 8 migrări, RLS activ |
| Randare și rutare | **Gata** | 1.223 pagini pre-generate, ISR, zero coliziuni |
| Performanță | **Gata** | 90–100 Lighthouse; LCP mobil 2,5–3,4 s |
| Accesibilitate | **Aproape** | 96–100; două defecte găsite și reparate azi |
| SEO tehnic | **Gata** | sitemap 8.362 URL, hreflang reciproc, noindex corect |
| Securitate | **Reparată azi** | o breșă P1 găsită și închisă (vezi §9.2) |
| Coș / comandă | **Absent** | schema există, interfața nu |
| Căutare liberă | **Absent** | indexurile există și nu sunt folosite niciodată |
| Administrare | **Absent** | tot conținutul se scrie azi din SQL sau din unelte |
| Conținut editorial | **Lipsă** | 9 servicii, 4 pagini legale, 134 descrieri de marcă |

### Cele mai importante zece constatări

| # | Severitate | Constatare | Stare |
|---|---|---|---|
| 1 | **P1** | Patru funcții `security definer` erau apelabile public prin API; una dezarma protecția anti-spam | **Reparat azi** |
| 2 | **P1** | Breadcrumb-ul de marcă ducea în 404 pe 2.370 de fișe de produs (15,8%) | **Reparat azi** |
| 3 | **P1** | Antetul are trei legături — coș, favorite, comparare — către pagini care nu există (404) | Deschis |
| 4 | **P2** | Legătura de telefon din fișa de produs n-avea nume accesibil sub 640 px | **Reparat azi** |
| 5 | **P2** | Contorul mărcilor din panoul de filtre avea contrast 2,98:1, sub pragul AA | **Reparat azi** |
| 6 | **P2** | Catalogul se randează dinamic la fiecare cerere, deși 190 de rute sunt pre-generabile | Deschis |
| 7 | **P2** | Programul de duminică apare ca `TODO(cristian)` **vizibil pe site** | Deschis |
| 8 | **P2** | `/design-system` e livrat public în producție (doar `Disallow` în robots) | Deschis |
| 9 | **P3** | Patru dependențe instalate și nefolosite: `resend`, `zod`, `react-hook-form`, `@hookform/resolvers` | Deschis |
| 10 | **P3** | O imagine de 21 MB servește 16 produse; 18 fișiere depășesc 2 MB | Deschis |

---

## 2. Metodologia auditului

Auditul a rulat pe versiunea de producție a aplicației (`next build` + `next start`), nu pe serverul de dezvoltare, pentru ca măsurătorile de performanță să reflecte codul livrat.

**Verificări automate rulate astăzi:**

- `pnpm build` — construcție completă, 1.223 de pagini pre-generate
- `pnpm test` — 19 teste, toate trec (parser de dimensiuni, determinismul reparsării)
- `npx tsc --noEmit` — zero erori de tipuri
- `pnpm lint` — zero erori, 9 avertismente (variabile nefolosite în unelte)
- `pnpm check:tokens` — 163 de tokeni, 72 de fișiere, zero abateri
- `pnpm check:routes` — 15.157 slug-uri/limbă, zero coliziuni
- `tools/perf/run-all.sh` — 6 rapoarte Lighthouse (3 pagini × mobil/desktop)
- Linterul de securitate și de performanță al Supabase
- Interogări SQL directe pe baza de producție pentru toate cifrele de conținut

**Verificări manuale:** parcurgerea rutelor cheie în ambele limbi, inspecția codului HTML livrat, verificarea drepturilor de execuție pe funcțiile bazei, test de inserare publică cu cheia anonimă (rând de test șters după).

---

## 3. Ce s-a construit

### 3.1 Dimensiunea proiectului

| Măsură | Valoare |
|---|---|
| Cod de aplicație (`src/`) | 9.455 linii |
| Componente React | 59 fișiere `.tsx` |
| Unelte de migrare și verificare (`tools/`) | 2.499 linii |
| Migrări SQL | 8 fișiere, toate cu rollback |
| Tokeni de design | 163, verificați automat |
| Chei de traducere | 112 în RO, 112 în RU, paritate completă |
| Pagini pre-generate la build | 1.223 |
| URL-uri în sitemap | 8.362 |

### 3.2 Rutele existente

| Rută | Randare | Revalidare |
|---|---|---|
| `/` și `/ru` | pre-generată | 1 h |
| `/[slug]` — produs, marcă, serviciu, pagină legală | pre-generată (1.091 căi) + la cerere | 15 min |
| `/catalog-anvelope` și `/ru/katalog-shin` | dinamică | — |
| `/catalog-anvelope/[...filtre]` | dinamică | — |
| `/contact`, `/servicii`, `/tpms` (ambele limbi) | pre-generate | 1 h |
| `/api/facets` | dinamică | cache 1 h la margine |
| `/sitemap.xml`, `/robots.txt` | statice | 1 zi |
| `/design-system` | statică | — |

Rezolvarea rădăcinii — un singur segment `/[slug]` care poate fi produs, marcă, serviciu sau pagină legală — funcționează în ordinea fixă: pagină legală → serviciu → marcă → produs → 404, cu zero coliziuni verificate automat.

### 3.3 Ce s-a adăugat în sesiunea de astăzi

- Panoul de căutare cu cinci liste (lățime, înălțime, diametru, sezon, marcă), după referința cerută de client, cu contoare reale pe fiecare opțiune
- Ruta `/api/facets` — sezonul și marca numărate pe dimensiunea aleasă, cu încrucișare sezon × marcă
- Lanțul complet pentru logo-urile de marcă: coloană, bucket, încărcător, afișare pe card, pe fișă și pe pagina de marcă, cu rezervă tipografică
- Iconițe noi: anvelopă cu sezon, XL, Run Flat, C
- Trei reparații găsite chiar de acest audit (§1, pozițiile 1, 2, 4, 5)

---

## 4. Datele

### 4.1 Catalogul

| Măsură | Valoare | Observație |
|---|---|---|
| Produse totale | 15.010 | 15.007 anvelope + 2 senzori TPMS + 1 inactiv |
| Disponibile | 8.066 | 53,7% din catalog |
| Indisponibile | 6.943 | 46,3% — regim special, vezi §4.3 |
| Cu preț | 8.067 | exact produsele disponibile |
| Fără preț | 6.943 | toate indisponibile — constrângerea din bază ține |
| Cu slug rusesc | 15.010 | acoperire 100% |
| Cu titlu rusesc | 15.010 | acoperire 100% |
| Fără sezon | 7 | 5 anvelope + 2 senzori |
| Fără diametru | 2 | dezactivate automat la import |
| Dimensiuni imperiale | 20 | în afara arborelui metric, se caută separat |
| XL | 5.556 | 37% din catalog |
| Run Flat | 11 | |
| Comerciale (C) | 340 | |
| Relații între produse | 35.070 | |

### 4.2 Conținutul editorial

| Element | Total | Completat | Lipsă |
|---|---|---|---|
| Descrieri de produs | 15.010 | **1** | 15.009 |
| Descrieri de marcă | 134 | **0** | 134 |
| Logo-uri de marcă | 134 | **0** | 134 |
| Texte de serviciu (`body_ro`) | 9 | **0** | 9 |
| Texte legale (`body_ro`) | 4 | **0** | 4 |
| Programul de duminică | 1 | **0** | 1 |

Acesta e cel mai mare gol al proiectului și **nu e un defect tehnic**: nimic din ce lipsește nu a existat în sursă. Regula asumată de la început — zero conținut inventat — face ca golurile să fie vizibile, nu mascate cu text generic.

Layout-urile au fost proiectate să arate intenționat fără aceste texte: fișa de produs n-are secțiune „Descriere", pagina de marcă e tipografică, pagina de serviciu funcționează cu corpul gol. Singura excepție este programul de duminică, care apare literal ca `TODO(cristian)` în subsol și pe `/contact` (§10.3).

### 4.3 Regimul produselor indisponibile

46,3% din catalog e indisponibil, iar tratamentul lor e implementat conform deciziei B.1:

- URL-ul întoarce mereu 200, niciodată 404 și niciodată redirect
- Se afișează „Preț la cerere" plus buton de telefon și WhatsApp, fără preț inventat
- Butonul de coș lipsește, nu e dezactivat
- Sunt excluse din `sitemap.xml` (8.362 URL față de 15.010 produse) și primesc `noindex, follow`
- Sub fișă apar alternative reale: aceeași dimensiune, în stoc, sortate după preț

### 4.4 Imaginile

| Măsură | Valoare |
|---|---|
| Fișiere în Storage | 1.749 |
| Spațiu ocupat | 656 MB |
| Dimensiune medie | 384 kB |
| Cel mai mare fișier | **21 MB** |
| Fișiere peste 2 MB | 18 |
| Fișiere peste 5 MB | 3 |
| Hash-uri unice în bază | 1.740 |
| Produse active fără imagine | 10 |

Deduplicarea pe SHA-1 a funcționat: 1.749 de fișiere acoperă 15.000 de legături produs–imagine. Fișierul de 21 MB (27614×5592 px, catalogul Lassa Greenways) servește 16 produse și e o eroare în sursă, nu în migrare; `next/image` îl redimensionează la livrare, dar procesarea inițială e costisitoare.

---

## 5. Arhitectura și randarea

### 5.1 Strategia de randare

Pre-generarea e selectivă și motivată: cele 134 de mărci, 9 servicii, 4 pagini legale și primele 400 de produse disponibile cele mai ieftine — adică exact ce caută cineva care compară prețuri. Restul de ~14.600 de fișe se randează la prima cerere și rămân în cache 15 minute. Pre-generarea tuturor ar fi dus build-ul la zeci de minute pentru pagini pe care nu le cere nimeni.

### 5.2 Catalogul se randează dinamic — P2

`/catalog-anvelope/[...filtre]` declară `generateStaticParams` pentru 190 de combinații indexate istoric, dar citește `searchParams` (paginare, sortare, comutatorul de indisponibile), ceea ce forțează randarea dinamică pentru **toate** rutele, inclusiv pentru cele 190 pre-generabile.

Costul: fiecare vizită pe catalog execută trei interogări (două contoare `head` + rândurile). La trafic de campanie, asta se vede în factura Supabase și în TTFB, măsurat astăzi la 366–559 ms pe catalog, față de 6–21 ms pe paginile statice.

**Recomandare:** mutarea paginării și a sortării în segmente de cale, sau izolarea părții dependente de `searchParams` într-o graniță `Suspense`, ca scheletul paginii să rămână static.

### 5.3 Contoarele din panoul de căutare

Arborele de dimensiuni e un fișier generat (`src/lib/size-tree.ts`) cu numărătoarea reală pe fiecare nod, deci primele trei liste răspund instantaneu, fără rețea. Sezonul și marca nu pot fi preîncărcate — ar însemna 134 de mărci × 3 sezoane pentru fiecare dintre cele ~900 de dimensiuni — deci se cer de la `/api/facets`, care numără o singură dimensiune (sub 400 de rânduri) și se ține în cache o oră. Măsurat astăzi: 198 ms la prima cerere.

---

## 6. Performanța

### 6.1 Lighthouse, 27 august 2026, pe build de producție

| Pagină | Perf. | A11y | Bune practici | SEO | LCP | CLS | TBT | TTFB | JS |
|---|---|---|---|---|---|---|---|---|---|
| Prima pagină — desktop | 100 | 100 | 100 | 92 | 795 ms | 0,000 | 0 ms | 14 ms | 188 KB |
| Prima pagină — mobil | 93 | 100 | 96 | 92 | 3,22 s | 0,000 | 36 ms | 21 ms | 179 KB |
| Catalog — desktop | 100 | 96 | 100 | 92 | 788 ms | 0,002 | 0 ms | 366 ms | 201 KB |
| Catalog — mobil | 97 | 100 | 100 | 92 | 2,46 s | 0,000 | 64 ms | 559 ms | 192 KB |
| Produs — desktop | 100 | 100 | 100 | 92 | 639 ms | 0,000 | 0 ms | 6 ms | 264 KB |
| Produs — mobil | 90 | 96 | 100 | 92 | 3,43 s | 0,000 | 32 ms | 9 ms | 256 KB |

**CLS zero peste tot.** Asta nu e noroc: fotografiile stau în containere cu proporție fixă, cardurile au titlul limitat la două rânduri, iar contoarele din panou nu schimbă lățimea la actualizare.

### 6.2 Comparație cu măsurătoarea din 23 august

| Pagină | 23 aug | 27 aug | Diferență |
|---|---|---|---|
| Catalog mobil — performanță | 93 | 97 | +4 |
| Catalog mobil — LCP | 2,87 s | 2,46 s | −0,41 s |
| Prima pagină mobil — performanță | 90 | 93 | +3 |
| Prima pagină mobil — accesibilitate | 96 | 100 | +4 |
| Produs desktop — LCP | 821 ms | 639 ms | −182 ms |

Prima pagină a fost rescrisă complet astăzi (panou nou, plăci de sezon, șase produse în capul paginii) și **nu a pierdut** nimic la performanță.

### 6.3 Punctul slab: LCP pe mobil

3,2–3,4 s pe mobil, cu simulare de rețea lentă. Pragul „bun" al Core Web Vitals este 2,5 s. Cauza principală e fotografia produsului — singurul element mare deasupra pliului. Măsurile deja luate: `priority` pe primele imagini, AVIF/WebP, listă restrânsă de dimensiuni. Ce ar mai ajuta: derivate mai mici pentru cardurile din grilă și înlocuirea celor 18 fișiere peste 2 MB.

### 6.4 Nota SEO de 92 este un artefact local

Singurul audit SEO picat, pe toate paginile, este `canonical`: eticheta indică `https://anvelope-ungheni.md`, iar testul a rulat pe `localhost:3100`, deci Lighthouse o consideră „către altă locație". În producție, pe domeniul propriu, nota devine 100. Nu e o problemă de reparat.

---

## 7. Accesibilitatea

Nota Lighthouse: 96–100. Două defecte reale găsite astăzi, ambele reparate:

**7.1 Legătura de telefon fără nume accesibil (P2, reparat).** În caseta de cumpărare, sub 640 px numărul de telefon e ascuns și rămâne doar iconița. Legătura devenea astfel un element focalizabil fără nume — WCAG 2.4.4 și 4.1.2. Un cititor de ecran anunța „legătură" și atât. Reparat cu `aria-label` care poartă numărul.

**7.2 Contrast insuficient la contoare (P2, reparat).** Numărul de produse de lângă fiecare marcă din panoul de filtre folosea `opacity: 0.7` peste `--ink-muted`, ceea ce dă `#989591` pe alb, adică **2,98:1** la 11 px — sub pragul AA de 4,5:1. Opacitatea rămâne acum doar pe fundal închis, unde raportul se păstrează.

**Ce funcționează deja bine:** zonele de atingere respectă minimul de 44 px, focusul e vizibil, toate iconițele-buton din antet au `aria-label`, contoarele au text pentru cititoarele de ecran (`sr-only`), starea filtrelor se anunță prin `aria-live`, iar structura de titluri e corectă pe toate paginile verificate.

---

## 8. SEO

| Element | Stare |
|---|---|
| `sitemap.xml` | 8.362 URL, cu `xhtml:link` reciproc RO/RU, `changefreq`, `priority` |
| Produse indisponibile în sitemap | excluse corect |
| `robots.txt` | blochează `/admin`, `/api/`, coșul, checkout-ul, favoritele, compararea, `/design-system` |
| `hreflang` | reciproc, din perechea de slug-uri din bază |
| `/ru-ru` | nu există și nu se generează — 404, conform deciziei A.4 |
| Canonical | prezent pe toate paginile |
| Date structurate | `Product` cu `offers` și `availability` corectă pe fișe |
| Indexarea filtrelor | dimensiune completă, sezon, marcă și combinații de maximum 3; restul `noindex, follow` |
| Titluri și descrieri | prezente pe toate produsele (0 lipsă) |

Strategia de indexare a filtrelor este singura decizie SEO cu risc: limita de trei filtre active previne indexarea a sute de mii de combinații, dar taie și cozi lungi care ar putea aduce trafic. Se poate relaxa după primele date din Search Console.

---

## 9. Securitatea

### 9.1 Ce era deja corect

- RLS activ pe toate cele 12 tabele publice; citire publică doar pe catalog și conținut
- Comenzile și programările se pot **insera**, dar nu se pot **citi** fără service role
- Recenziile se inserează doar nemoderate (`is_approved = false`)
- Cheia de service role nu apare în niciun fișier client; `adminDb()` există separat și e folosit doar din unelte
- Limitare de rată în bază (3 cereri/oră/IP pe comenzi și programări) plus honeypot, ambele ca declanșatoare — o rută nouă adăugată din greșeală nu le poate ocoli
- Antete de securitate complete în `vercel.json`: CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

### 9.2 Breșa găsită și închisă astăzi (P1)

Linterul de securitate al Supabase a semnalat, iar verificarea prin `has_function_privilege` a confirmat, că **patru funcții `security definer` erau executabile de oricine, fără cont**, prin `/rest/v1/rpc/<nume>`. Cauza: `create function` acordă implicit `EXECUTE` rolului `PUBLIC`, iar migrarea 0007 nu retrăgea acest drept.

Ce se putea face cu ele, în ordinea gravității:

1. **`prune_rate_limits()`** — șterge rândurile de limitare de rată. Un apel repetat dezarmează complet protecția anti-spam de pe comenzi și programări, adică exact apărarea construită în 0007.
2. **`refresh_facet_counts()`** — execută `refresh materialized view concurrently` pe o vedere calculată din 15.010 rânduri, la fiecare apel, fără nicio limită. Un mijloc ieftin de a încărca baza.
3. **`refresh_brand_counts()`** — două `UPDATE` pe toată tabela `brands`.
4. **`enforce_rate_limit()`** — permite umflarea contorului altui IP.

**Reparat:** migrarea `0008_revoke_public_rpc.sql` retrage `EXECUTE` de la `PUBLIC`, `anon` și `authenticated` pe toate cinci funcțiile și fixează `search_path` la `set_updated_at` și `client_ip`. Aplicată în producție și verificată:

- inserarea publică a unei programări **funcționează în continuare** (test cu cheia anonimă, rândul de test șters);
- apelul `rpc('prune_rate_limits')` din anon primește acum `permission denied for function prune_rate_limits`;
- `service_role` păstrează dreptul, deci seed-ul și importul nu sunt afectate.

### 9.3 Rămâne de decis

- **`facet_counts` e citibilă public.** Vederea materializată e expusă prin API. Conținutul ei nu e sensibil (contoare de catalog), iar panoul de căutare o folosește, dar Supabase o semnalează pentru că vederile materializate nu respectă RLS. Alternativa: o funcție `security invoker` care întoarce doar agregatul necesar.
- **Extensiile `pg_trgm` și `unaccent` sunt în schema `public`.** Recomandarea Supabase e o schemă separată. Impact practic: mic.
- **CSP conține `'unsafe-inline'` și `'unsafe-eval'` la `script-src`.** Sunt cerute de Next.js fără nonce. Se pot elimina cu o strategie de nonce în middleware — merită după lansare.
- **SVG-urile de marcă sunt permise în `next/image`** (`dangerouslyAllowSVG`). Riscul e limitat: în bucket scrie exclusiv uneltea de încărcare, cu service role, din fișiere puse manual; peste asta, imaginile sunt servite cu CSP `script-src 'none'; sandbox`.

---

## 10. Defectele funcționale

### 10.1 Breadcrumb-ul de marcă ducea în 404 (P1, reparat)

Firul Ariadnei de pe fișa de produs construia legătura către marcă din **primul cuvânt al slug-ului de produs**. Verificat pe toate cele 15.010 fișe: pentru **2.370 dintre ele (15,8%)** acel cuvânt nu e slug de marcă — sunt fișele care încep cu „anvelope-" (`anvelope-goodyear-...`, `anvelope-petlas-...`) sau cu o formă care nu e rută (`tracmaxx-...`). Toate trimiteau în 404.

Reparat: slug-ul vine acum din tabela `brands`, pe limba curentă, iar dacă marca n-are pagină, eticheta rămâne text, fără legătură.

### 10.2 Antetul trimite către trei pagini inexistente (P1, deschis)

`/cos`, `/favorite` și `/comparare` întorc **404**. Legăturile sunt vizibile în antet pe ecrane peste 640 px. Efecte:

- utilizatorul care apasă pe coș ajunge într-o pagină de eroare;
- Next.js pre-încarcă `/cos` la afișarea antetului, ceea ce produce o eroare 404 în consolă pe **fiecare pagină** — de aici nota de 96 la „bune practici" pe prima pagină în mobil.

Sunt două ieșiri: fie se construiesc paginile (coșul e oricum următorul pas major), fie iconițele se ascund până atunci. Este o decizie de produs, deci nu am luat-o eu.

### 10.3 Programul de duminică e vizibil ca `TODO(cristian)` (P2, deschis)

`settings.opening_hours.sun` e `null`, iar interfața afișează literal `TODO(cristian): program duminică` în subsol, pe toate paginile, și pe `/contact`. E corect ca disciplină internă — golul se vede — dar **nu poate rămâne așa la lansare**. E o singură valoare de completat.

### 10.4 `/design-system` e public în producție (P2, deschis)

Pagina de sistem de design se construiește ca rută statică și e accesibilă oricui o ghicește. `robots.txt` o exclude din indexare, dar asta nu o ascunde. Recomandare: excludere din build în producție sau protejare, ca să nu devină o hartă a componentelor pentru cine se uită.

---

## 11. Calitatea codului

| Verificare | Rezultat |
|---|---|
| `tsc --noEmit` | zero erori |
| `pnpm lint` | zero erori, 9 avertismente (variabile nefolosite, toate în `tools/`) |
| `pnpm test` | 19/19 trec |
| `pnpm check:tokens` | 163 tokeni, zero valori brute, zero variabile inexistente |
| `pnpm check:routes` | zero coliziuni pe 15.157 slug-uri/limbă |
| Paritate RO/RU | 112 chei în ambele fișiere, zero diferențe |

**Ce merită subliniat.** Verificatorul de tokeni și cel de coliziuni sunt neobișnuite pentru un proiect de această dimensiune și acoperă exact cele două clase de defecte care nu dau eroare la rulare: o variabilă CSS inexistentă nu aplică nimic, iar două slug-uri identice se rezolvă tăcut la primul găsit. Ambele rulează în CI.

**Dependențe instalate și nefolosite (P3).** `resend`, `zod`, `react-hook-form` și `@hookform/resolvers` nu apar în niciun fișier din `src/` sau `tools/`. Au fost adăugate în avans pentru checkout și pentru e-mailurile de confirmare. Nu ajung în pachetul livrat, dar încarcă instalarea și dau impresia falsă că validarea de formulare e deja implementată. Fie se folosesc la coș, fie se scot.

---

## 12. Bilingvismul

Acoperirea RU este completă acolo unde depinde de date: 15.010 slug-uri și 15.010 titluri rusești, plus paritate totală pe cheile de interfață. Comutatorul de limbă face lookup în bază pentru perechea de slug-uri, iar produsele fără slug rusesc s-ar servi sub cel românesc — situație care în practică nu apare, pentru că acoperirea e 100%.

Ce rămâne netradus e ce nu există în nicio limbă: textele serviciilor, ale paginilor legale și descrierile de marcă.

---

## 13. Ce lipsește ca produs

| Funcție | Stare | Ce există deja |
|---|---|---|
| Coș | absent | butonul „Adaugă în coș" nu face nimic |
| Checkout | absent | `orders`, `order_items`, numerotare, montaj la comandă — toate în schemă |
| Căutare liberă | absent | indexuri GIN + trigram construite, **niciodată folosite** (confirmat de linterul de performanță) |
| Favorite, comparare | absente | doar iconițele din antet |
| Panou de administrare | absent | tot se scrie din SQL sau din unelte |
| Actualizarea prețurilor | neproiectată | schema suportă ambele scenarii; blocată de cele 5 întrebări către dezvoltatorul actual |
| Recenzii | schemă gata | zero rânduri, nicio interfață |
| Confirmări pe e-mail | absente | `resend` instalat, nefolosit |

Programările la servicii sunt singura funcție de comerț **funcțională**: formularul scrie direct în `service_bookings`, cu honeypot și limitare de rată. Zero programări până acum, pentru că site-ul nu e public.

---

## 14. Plan de acțiune

### Valul 1 — înainte de lansare (blocante)

1. **Programul de duminică** — o valoare, elimină `TODO` vizibil de pe toate paginile
2. **Coșul și checkout-ul**, sau ascunderea celor trei iconițe din antet — nu se poate lansa cu 404 în antet
3. **Textele celor 4 pagini legale** — obligatorii legal pentru un magazin
4. **Decizia despre eticheta de stoc** — „Stoc furnizor" fidel sursei sau „În stoc" (ARCHITECTURE.md §12, decizia 2)
5. **Excluderea `/design-system`** din build-ul de producție

### Valul 2 — imediat după lansare

6. Căutarea liberă — indexurile există, e cel mai bun raport efort/efect din listă
7. Textele celor 9 servicii
8. Logo-urile de marcă (`pnpm logos --apply` după ce ai fișierele)
9. Catalogul cu schelet static, ca să scadă TTFB și costul pe cerere
10. Înlocuirea celor 18 imagini peste 2 MB, începând cu cea de 21 MB

### Valul 3 — consolidare

11. Panou de administrare pentru conținut și comenzi
12. Nonce în CSP, eliminarea `unsafe-inline` și `unsafe-eval`
13. Închiderea observațiilor rămase din linterul Supabase (`facet_counts`, extensii în `public`)
14. Migrarea `middleware.ts` la `proxy.ts` (Next.js 16 avertizează la fiecare build)
15. Curățarea celor patru dependențe nefolosite

---

## Anexa A — comenzile de verificare

```bash
pnpm build                 # construcție de producție
pnpm test                  # 19 teste pe parserul de dimensiuni
npx tsc --noEmit           # tipuri
pnpm lint                  # ESLint
pnpm check:tokens          # tokeni CSS folosiți vs. definiți
pnpm check:routes          # coliziuni de rutare pe ambele limbi
bash tools/perf/run-all.sh # 6 rapoarte Lighthouse
node tools/perf/summary.mjs # tabelul de mai sus
pnpm logos                 # ce logo-uri s-ar urca (rulare seacă)
```

## Anexa B — fișierele modificate în auditul de astăzi

| Fișier | Motiv |
|---|---|
| `supabase/migrations/0008_revoke_public_rpc.sql` | retragerea dreptului public de execuție (P1) |
| `supabase/rollback/0008_revoke_public_rpc.down.sql` | anularea migrării |
| `src/components/product/ProductPage.tsx` | breadcrumb-ul de marcă din `brands`, nu din slug |
| `src/lib/db/queries.ts`, `src/lib/types.ts` | slug-ul de marcă adus la citire |
| `src/components/product/BuyBox.tsx` | nume accesibil pe legătura de telefon |
| `src/components/catalog/FilterPanel.tsx` | contrastul contorului de mărci |

## Anexa C — documentele de referință ale proiectului

`ARCHITECTURE.md` (schema, rutele, regimul indisponibilelor, deciziile deschise) · `DECISIONS.md` (deciziile clientului, sursă de adevăr) · `DESIGN.md` (sistemul vizual) · `TODO-CRISTIAN.md` (ce lipsește din sursă) · `data/raw/REPORT.md` (raportul de migrare)
