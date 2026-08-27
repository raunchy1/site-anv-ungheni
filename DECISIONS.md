# Decizii client — anvelope-ungheni.md

Registru al deciziilor luate de Cristian. Sursă de adevăr; nu se renegociază.
Actualizat: 21 august 2026 (promptul nr. 3).

## Proces
- Faze secvențiale cu STOP GATE. Nu se trece mai departe fără aprobare explicită.
- Zero conținut inventat. Ce lipsește → `TODO(cristian)`.
- Cache-ul de HTML brut (`data/raw/html-cache/`) **nu se șterge până la lansare**.

## A — proprietate și acces
- Site-ul aparține familiei clientului. Migrarea e legitimă. Crawling civilizat obligatoriu.

## A.2 / B.8 — program
- `Ln–Sm 9:00–20:00` (de pe `/contact`) + `TODO(cristian): confirmare duminica`.
- O singură valoare, în `settings`, editabilă din admin. Nu se hardcodează.

## A.3 / B.4 / B.5 — conținut absent
- **Servicii:** import 1:1. `body_ro`/`body_ru`/`price_from_mdl` = **NULL** (nu string gol).
  Layout-ul trebuie să arate intenționat cu `body = NULL`. Fără secțiune „Descriere" goală.
- **Produse:** 5 din 3.107 au descriere ⇒ **pagina de produs nu are tab „Descriere"**.
  Câmpul rămâne în DB, se randează doar dacă are conținut.
  **Tabelul de specificații devine conținutul principal al paginii.**
- **Branduri:** fără descriere, fără logo **în sursă**. `description_*` = NULL.
  Nu se descarcă logo-uri de pe site-urile producătorilor și nici de pe site-uri
  concurente (drepturi de autor).
  Identitatea de brand pe site rămâne **tipografică** cât timp `logo_url` e NULL.

### A.3.1 — logo-uri de marcă (revizuit 27 august 2026, la cererea lui Cristian)
- Referința cerută: `tireo.ro`, unde fiecare card are logo-ul mărcii sub fotografie.
- Site-ul **afișează logo-ul când există**, cu rezervă tipografică când nu.
  Grila nu se mișcă între cele două stări (`BrandLogo`, bandă de înălțime fixă).
- Fișierele se pun în `logos-sursa/`, **din surse oficiale sau din Wikimedia Commons**,
  și se urcă cu `pnpm logos --apply` în bucket-ul `marci`. Nimic de pe agregatoare
  (seeklogo, brandsoftheworld, worldvectorlogo) și nimic de la concurență.
- Fiecare fișier are proveniența scrisă în `logos-sursa/manifest.json` și se verifică
  pe planșa de contact (`pnpm logos:sheet`), pe fundal alb și pe fundal închis.
- Un logo desenat în alb, pentru antet închis, **se respinge**: pe placa deschisă a
  cardului ar fi invizibil (cazul Grenlander).
- `brands.logo_url` ține URL-ul public complet, nu o cale de Storage.

## A.4 — rutare bilingvă
- RO la `/{slug_ro}`, RU la `/ru/{slug_ru}`. **`/ru-ru` nu există** — nu se generează.
- `slug_ro` și `slug_ru` — coloane separate, ambele UNIQUE și indexate (products, services, brands).
- `hreflang` reciproc din perechea din DB. Comutatorul de limbă face lookup în DB.
- Fallback fără `slug_ru`: `/ru/{slug_ro}` + log în raport.

## A.5 — stoc
- RO e sursa de adevăr. Bug-ul de traducere RU din OpenCart nu se migrează.
- Enum: `in_stock` · `supplier` · `out_of_stock`.

## B.1 — produse indisponibile (~40% din catalog) — REGULĂ DE BUSINESS
- **Catalog:** filtrul implicit exclude `out_of_stock`. Toggle vizibil
  „Arată și produsele momentan indisponibile" + contor. Intră în facete doar când e activ.
- **Pagină produs:** URL **200 mereu** — niciodată 404, niciodată redirect.
  „Preț la cerere" + CTA telefon. Fără „0 MDL", fără preț barat inventat.
  Butonul „Adaugă în coș" **absent**, nu dezactivat.
  Sub fișă: **alternative reale** — aceeași dimensiune exactă, în stoc, sortate după preț.
  Fără alternative exacte → același diametru, ±10 la lățime, marcate „dimensiune apropiată".
- **SEO:** `noindex, follow`, `availability: OutOfStock`, excluse din `sitemap.xml`
  și din calculele „de la X MDL".
- **Admin:** vizibile, filtrabile, coloană dedicată. Revin automat în circuit la reactivare.

## B.2 — produse fără dimensiune (`size_source='none'`)
- `is_active = false` automat la import. URL 200 + `noindex`, excluse din sitemap și catalog.
- Listate nominal în `MIGRATION-REPORT.md`.
- **Dacă sunt > 50: oprire și raportare înainte de seed.**

## B.3 — produse orfane (fără breadcrumb `Anvelope`)
- Același regim ca B.2. Nu se importă în catalog.

## B.6 — atributul `Producator`
- Link-ul de brand din pagină e **sursa primară**. `attr_manufacturer` e rezervă.
- Discrepanțele se raportează **nominal**. Nu se alege tacit.

## B.7 / 3B.2–3B.4 — imagini
- **Patru** directoare sursă, nu două: `/image/catalog/product/`, `/image/catalog/pics/`,
  `/image/catalog/produse noi/` (spațiu în cale), `/image/catalog/111/1111/`.
  Toate se normalizează într-o schemă unică în Supabase Storage.
- La normalizare, **numele de fișier se slugifică** — zero spații în Supabase Storage.
- `product_images.original_path` păstrat pentru trasabilitate. Distribuția pe directoare se raportează.
- **Imaginile sunt per MODEL de anvelopă, nu per SKU.** Dimensiunea din numele fișierului
  **nu e sursă de adevăr** și o nepotrivire față de titlu **nu e defect de date** — se raportează
  ca statistică, nu ca eroare.
- **Eroare reală** doar când numele fișierului indică alt **brand sau model** decât produsul.
- Deduplicarea se face pe **SHA-1 al conținutului**, nu pe nume. Fiecare fișier se descarcă o singură dată.
- `/image/catalog/111/1111/` e director de test rămas în producție, dar produsul care îl
  referențiază (`aptany-rw611-205-55-r16-91t`) e legitim: în catalog, brand APTANY, preț 1.236 MDL,
  `Stoc furnizor`. **Nu se dezactivează.**

## B.9 — feed de prețuri (nedeterminat)
- **Nu se proiectează importul** până nu răspunde dezvoltatorul actual la cele 5 întrebări.
- Schema trebuie să suporte ambele scenarii fără migrație distructivă:
  - `import_runs.source ENUM('manual_csv','scheduled_feed','api_sync','admin_edit')`
  - `products.price_source`, `products.price_updated_at`
  - `products.price_locked BOOLEAN` — **cerință de schemă, nu opțiune**.
    Un preț editat manual din admin **nu** se suprascrie la următorul import.

## A.7 — pagini legale (doar schelet)
`/termeni-si-conditii` · `/livrare-si-plata` · `/retur-si-garantie` · `/politica-de-confidentialitate`
+ banner cookies minimal, fără dark patterns. Fiecare cu `TODO(cristian): text juridic`.
**Nu se scriu clauze legale.**

## C — schema (completări)
```sql
size_source        ENUM('attribute','title','none') NOT NULL
in_catalog         BOOLEAN NOT NULL DEFAULT true
is_active          BOOLEAN NOT NULL DEFAULT true
price_source       ENUM('manual_csv','scheduled_feed','api_sync','admin_edit','legacy_import')
price_updated_at   TIMESTAMPTZ
price_locked       BOOLEAN NOT NULL DEFAULT false
attr_manufacturer  TEXT
legacy_product_id  INT UNIQUE NOT NULL
```
Constrângeri — **hard, la nivel de bază de date**, nu validare de aplicație.
Un import care încalcă regula trebuie respins de Postgres, nu logat ca warning:
```sql
CHECK (is_active = false OR size_source <> 'none')
CHECK (stock_status = 'out_of_stock' OR price_mdl IS NOT NULL)
CHECK (price_mdl IS NULL OR price_mdl > 0)
```
`product_related(product_id, related_product_id, source ENUM('legacy','computed'), sort_order)`
— populat din `related_slugs` într-o a doua trecere; slug-urile nerezolvate se **loghează**.

Fără coloane pentru date inexistente (eticheta EU: consum/aderență/zgomot — **nu există în sursă**).

## ARCHITECTURE.md — 10 secțiuni obligatorii
1. Diagrama schemei (Mermaid) · 2. Harta rutelor, ambele limbi · 3. Resolver rădăcină + test coliziuni
4. Redirects + nr. reguli · 5. Strategia de indexare a filtrelor · 6. Actualizarea recurentă preț/stoc
7. Decizii deschise · 8. **Regimul produselor indisponibile** · 9. **Ciclul de viață al prețului**
10. **Ce se întâmplă când feed-ul șterge un produs** (recomandare: niciodată `DELETE`)

## D — input pentru briefingul de design (Faza 2)
- Pagina de produs n-are text: titlu, o poză, 4 specificații, preț, CTA. Specificațiile sunt eroul.
- O singură imagine per produs, calitate variabilă, catalog extern ⇒ container cu proporție fixă.
- Brandurile n-au logo în sursă ⇒ tratament tipografic, cu logo real când e încărcat (A.3.1).
- 40% din catalog e indisponibil ⇒ starea „indisponibil" se proiectează ca ecran principal.
- Selectorul de dimensiune rămâne piesa centrală.
