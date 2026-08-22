# REPORT — Faza 0, achiziția datelor de pe anvelope-ungheni.md

Generat: **2026-08-21T21:30:44.721Z**
Sursă: scraping propriu (nu a existat export OpenCart în `data/source/`).
Crawl complet: **NU — vezi §9**

---

## 1. Totaluri și reconciliere

| | Valoare |
|---|---|
| URL-uri produs în sitemap | **15010** |
| Produse numărate de filtrele catalogului | **15002** |
| Produse extrase cu succes | **2102** |
| Eșecuri de crawl | **0** |
| Acoperire față de sitemap | **14.00%** |
| Branduri în sitemap | 134 |
| Pagini de serviciu | 10 |
| Imagini unice descărcate | încă nedescărcate |

### 1.1 Explicația diferenței 15010 (sitemap) vs. 15002 (catalog)

Produse extrase care **nu** au breadcrumb-ul `Anvelope` (deci nu intră în contorul catalogului): **1**

| Slug | Titlu | Breadcrumb | Preț | Stoc |
|---|---|---|---|---|
| `michelin-latitude-sport-3-255-60-r17-106v` | Michelin Latitude Sport 3 255/60 R17 106V | Acasă › Michelin Latitude Sport 3 255/60 R17 106V | — | Stoc epuizat |

## 2. Distribuție pe sezon

| Sezon | Așteptat (filtru live) | Extras | Δ |
|---|---|---|---|
| all_season | 1858 | 201 | -1657 |
| iarna | 5805 | 441 | -5364 |
| vara | 7339 | 1460 | -5879 |

## 3. Disponibilitate

Etichete brute găsite în sursă (RO):

| Etichetă sursă | Nr. | → enum |
|---|---|---|
| Stoc furnizor | 1304 | `supplier` |
| Stoc epuizat | 798 | `out_of_stock` |

| Enum | Nr. |
|---|---|
| `supplier` | 1304 |
| `out_of_stock` | 798 |

Contor live „In stoc" în catalog: **8060** · extras `in_stock`: **0** · Δ **-8060**

## 4. Integritate a câmpurilor

| Verificare | Nr. | % | Exemple |
|---|---|---|---|
| fără preț | **798** | 37.96% | `joyroad-winter-rx826-235-65-r18-106t`, `matador-mp93-nordicca-195-55-r16-91h`, `tracmax-x-privilo-s330-225-60-r18-104v-xl` |
| fără imagine | **1** | 0.05% | `kormoran-snow-205-60-r16-92h` |
| fără brand | **0** | 0.00% | — |
| fără dimensiune parsabilă | **3** | 0.14% | `grenlander-drak-m-t-31x10-50-r15lt-109q`, `grenlander-drak-m-t33x12-50-r15lt-108q`, `anvelope-accelera-badak-x-treme-lt-31x10-50-r15-110n` |
| fără înălțime (profil) | **22** | 1.05% | `lassa-multiways-c-195-r14c`, `grenlander-l-strong36-195-r14c-106-104r`, `lassa-multiways-c-185-r14c` |
| fără sezon | **0** | 0.00% | — |
| fără indice de sarcină | **18** | 0.86% | `lassa-multiways-2-225-50-r17`, `michelin-primacy-4-225-50-r17-98v`, `lassa-competus-winter-2-225-45-r19` |
| fără indice de viteză | **19** | 0.90% | `lassa-multiways-2-225-50-r17`, `michelin-primacy-4-225-50-r17-98v`, `lassa-competus-winter-2-225-45-r19` |
| fără versiune RU | **0** | 0.00% | — |
| fără slug_ru | **0** | 0.00% | — |
| fără meta description RO | **0** | 0.00% | — |
| fără meta description RU | **0** | 0.00% | — |
| cu descriere proprie (description_html) | **2** | 0.10% | `michelin-latitude-sport-3-255-60-r17-106v`, `grenlander-drak-m-t33x12-50-r15lt-108q` |

Sursa dimensiunii: `attribute`=2101 · `title`=1

### 4.1 Prețuri suspecte (< 200 MDL sau > 30.000 MDL)

**0** produse.

Niciunul.

### 4.2 Valori în afara enum-urilor

- Sezon nemapat: **0** 
- Stoc nemapat: **0** 
- Indice de viteză neconform: **0** 
- Indici de viteză întâlniți: `H` `L` `M` `N` `Q` `R` `S` `T` `V` `W` `Y`

### 4.3 Atribute nemapate în schema propusă

Niciunul — toate atributele din sursă au corespondent în schemă.

Atribute mapate: Sezon (2102) · Dimensiune (2101) · Producator (2101) · Indice de sarcina (2084) · Indice de viteza (2083)

## 5. Branduri

Găsite în produse: **83** · în sitemap: **134** · în filtrul catalogului: **134** · în briefing §2.4: **134**

### 5.1 Diferențe față de contorul filtrului (doar cele care nu se potrivesc)

| Brand | Așteptat | Extras | Δ |
|---|---|---|---|
| ACCELERA | 118 | 9 | -109 |
| Achilles | 1 | 0 | -1 |
| Anchee | 6 | 0 | -6 |
| Annaite | 32 | 6 | -26 |
| Aoteli | 1 | 0 | -1 |
| Aplus | 204 | 0 | -204 |
| Aptany | 3 | 0 | -3 |
| APTANY | 0 | 1 | +1 |
| Arivo | 331 | 39 | -292 |
| Atlas | 2 | 0 | -2 |
| Atturo | 3 | 0 | -3 |
| Austone | 6 | 0 | -6 |
| Avon | 25 | 0 | -25 |
| Barum | 166 | 33 | -133 |
| Bearway | 2 | 0 | -2 |
| BFGoodrich | 23 | 1 | -22 |
| Brics | 1 | 0 | -1 |
| Bridgestone | 237 | 10 | -227 |
| Ceat | 70 | 0 | -70 |
| Centara | 146 | 2 | -144 |
| Charmhoo | 32 | 30 | -2 |
| Comfoser | 38 | 3 | -35 |
| Compasal | 8 | 0 | -8 |
| Continental | 410 | 43 | -367 |
| Cooper | 66 | 0 | -66 |
| Crosswind | 220 | 0 | -220 |
| Davanti | 100 | 26 | -74 |
| Debica | 61 | 26 | -35 |
| Delinte | 1 | 0 | -1 |
| Diplomat | 12 | 4 | -8 |
| Doublestar | 2 | 0 | -2 |
| Dovroad | 2 | 0 | -2 |
| Dunlop | 112 | 19 | -93 |
| Duraturn | 73 | 13 | -60 |
| Falken | 30 | 1 | -29 |
| Federal | 1 | 0 | -1 |
| Firemax | 159 | 33 | -126 |
| Firestone | 16 | 2 | -14 |
| Fortuna | 5 | 0 | -5 |
| Fortune | 132 | 4 | -128 |
| Fronway | 271 | 0 | -271 |
| Fulda | 55 | 23 | -32 |
| Gislaved | 17 | 8 | -9 |
| GiTi | 5 | 0 | -5 |
| Goodyear | 399 | 45 | -354 |
| Grenlander | 456 | 91 | -365 |
| Gripmax | 17 | 10 | -7 |
| GT Radial | 99 | 30 | -69 |
| Habilead | 152 | 0 | -152 |
| Haida | 278 | 41 | -237 |
| Hankook | 635 | 74 | -561 |
| Hilo | 177 | 27 | -150 |
| ILINK | 91 | 1 | -90 |
| Imperial | 9 | 0 | -9 |
| Joyroad | 328 | 72 | -256 |
| Kapsen | 197 | 0 | -197 |
| Kelly | 21 | 7 | -14 |
| Kinforest | 13 | 0 | -13 |
| Kleber | 127 | 0 | -127 |
| Kormoran | 18 | 0 | -18 |
| KORMORAN | 0 | 1 | +1 |
| Kpatos | 126 | 0 | -126 |
| Kumho | 357 | 24 | -333 |
| Kustone | 14 | 0 | -14 |
| Landspider | 200 | 0 | -200 |
| Lanvigator | 102 | 0 | -102 |
| Lassa | 365 | 130 | -235 |
| Laufenn | 107 | 13 | -94 |
| Leao | 113 | 7 | -106 |
| LingLong | 486 | 69 | -417 |
| Marshal | 36 | 29 | -7 |
| Matador | 173 | 56 | -117 |
| Maxxis | 358 | 35 | -323 |
| Michelin | 483 | 71 | -412 |
| Mileking | 34 | 3 | -31 |
| Minerva | 18 | 0 | -18 |
| Motrio | 8 | 0 | -8 |
| Nankang | 66 | 0 | -66 |
| Neolin | 20 | 1 | -19 |
| Nereus | 60 | 2 | -58 |
| Nexen | 624 | 113 | -511 |
| Nokian | 39 | 3 | -36 |
| Nordexx | 69 | 4 | -65 |
| ONYX | 27 | 0 | -27 |
| Orium | 4 | 0 | -4 |
| Otani | 108 | 39 | -69 |
| Ovation | 114 | 0 | -114 |
| Petlas | 348 | 100 | -248 |
| Pirelli | 207 | 10 | -197 |
| Platin | 273 | 15 | -258 |
| Point S | 94 | 10 | -84 |
| POWERTRAC | 1 | 0 | -1 |
| Prinx | 59 | 0 | -59 |
| Rapid | 2 | 0 | -2 |
| Riken | 149 | 23 | -126 |
| Roadboss | 4 | 0 | -4 |
| Roadstone | 51 | 15 | -36 |
| Roadx | 302 | 51 | -251 |
| Rockblade | 35 | 0 | -35 |
| Rosava | 166 | 42 | -124 |
| Rovelo | 73 | 0 | -73 |
| Royal Black | 22 | 0 | -22 |
| Rydanz | 60 | 0 | -60 |
| Sailun | 284 | 2 | -282 |
| Sava | 27 | 9 | -18 |
| Semperit | 13 | 0 | -13 |
| Starmaxx | 154 | 70 | -84 |
| Strial | 1 | 0 | -1 |
| Sunny | 98 | 0 | -98 |
| Superia | 40 | 4 | -36 |
| Three-A | 11 | 9 | -2 |
| Tigar | 84 | 33 | -51 |
| Toledo | 2 | 1 | -1 |
| Torque | 243 | 83 | -160 |
| Tourador | 128 | 21 | -107 |
| Toyo | 7 | 2 | -5 |
| TRACMAX | 713 | 136 | -577 |
| TRIANGLE | 200 | 0 | -200 |
| TRISTAR | 42 | 1 | -41 |
| Unigrip | 10 | 7 | -3 |
| Uniroyal | 114 | 30 | -84 |
| Viking | 93 | 24 | -69 |
| Voyager | 4 | 2 | -2 |
| Vredestein | 191 | 3 | -188 |
| Waterfall | 9 | 2 | -7 |
| West Lake | 4 | 0 | -4 |
| Westlake | 22 | 0 | -22 |
| Yokohama | 201 | 18 | -183 |
| Zmax | 86 | 0 | -86 |

### 5.2 Diferențe față de lista din briefing

- În briefing, absente din filtru: —
- În filtru, absente din briefing: —

## 6. Dimensiuni

### 6.1 Diametru
| Diametru | Așteptat | Extras | Δ |
|---|---|---|---|
| R10 | 4 | 0 | -4 |
| R12 | 13 | 1 | -12 |
| R12C | 1 | 1 | ✅ |
| R13 | 254 | 35 | -219 |
| R13C | 4 | 0 | -4 |
| R14 | 777 | 114 | -663 |
| R14C | 12 | 16 | +4 |
| R15 | 1631 | 231 | -1400 |
| R15C | 32 | 48 | +16 |
| R16 | 2705 | 341 | -2364 |
| R16C | 61 | 91 | +30 |
| R17 | 2817 | 431 | -2386 |
| R17C | 3 | 1 | -2 |
| R18 | 2500 | 373 | -2127 |
| R19 | 1831 | 222 | -1609 |
| R20 | 1456 | 137 | -1319 |
| R21 | 592 | 38 | -554 |
| R22 | 284 | 18 | -266 |
| R23 | 25 | 1 | -24 |

### 6.2 Lățime (doar diferențele)
| Lățime | Așteptat | Extras | Δ |
|---|---|---|---|
| 135 | 5 | 0 | -5 |
| 145 | 23 | 1 | -22 |
| 155 | 149 | 14 | -135 |
| 165 | 183 | 37 | -146 |
| 175 | 424 | 67 | -357 |
| 185 | 820 | 128 | -692 |
| 195 | 1157 | 193 | -964 |
| 205 | 1329 | 184 | -1145 |
| 215 | 1965 | 312 | -1653 |
| 225 | 2246 | 336 | -1910 |
| 235 | 2053 | 282 | -1771 |
| 245 | 1240 | 168 | -1072 |
| 255 | 1135 | 142 | -993 |
| 265 | 629 | 73 | -556 |
| 275 | 811 | 100 | -711 |
| 285 | 414 | 32 | -382 |
| 295 | 132 | 11 | -121 |
| 305 | 46 | 6 | -40 |
| 315 | 187 | 10 | -177 |
| 325 | 34 | 3 | -31 |

### 6.3 Înălțime (doar diferențele)
| Înălțime | Așteptat | Extras | Δ |
|---|---|---|---|
| 25 | 3 | 0 | -3 |
| 30 | 172 | 14 | -158 |
| 35 | 838 | 79 | -759 |
| 40 | 1467 | 172 | -1295 |
| 45 | 2151 | 287 | -1864 |
| 50 | 1515 | 205 | -1310 |
| 55 | 2747 | 414 | -2333 |
| 60 | 1966 | 277 | -1689 |
| 65 | 2311 | 353 | -1958 |
| 70 | 1150 | 186 | -964 |
| 75 | 443 | 84 | -359 |
| 80 | 67 | 8 | -59 |
| 85 | 12 | 1 | -11 |

## 7. Servicii

| Slug RO | Slug RU | Titlu RO | Titlu RU | Conținut RO (car.) | Conținut RU (car.) | Imagini |
|---|---|---|---|---|---|---|
| `schimbul-rotilor` | `zamena-koles` | Schimbul rotilor | Замена колес | **0** | **0** | 2 |
| `reparatia-discurilor` | `rihtovka-diskov` | Reparatia discurilor auto | Рихтовка дисков | **0** | **0** | 4 |
| `reparatia-anvelopelor` | `remont-shin` | Reparatia anvelopelor | Ремонт шин | **0** | **0** | 2 |
| `balansarea-rotilor` | `balansirovka-kolyos` | Balansarea Rotilor | Балансировка колёс | **0** | **0** | 2 |
| `sudura-cu-argon` | `argonnaya-svarka` | Sudarea discurilor auto cu argon | Аргонная сварка дисков | **0** | **0** | 4 |
| `vopsirea-discurilor` | `pokraska-diskov` | Vopsirea discurilor auto cu pulbere | Покраска дисков | **0** | **0** | 4 |
| `slefuirea-discurilor-de-frana` | `protochka-tormoznyh-diskov` | Indreptare / Slefuirea discurilor de frana | Проточка тормозных дисков без снятия | **0** | **0** | 4 |
| `hotel-anvelope` | `hranenie-shin` | Hotel anvelope | Хранение шин | **0** | **0** | 2 |
| `incarcare-conditionere-auto-cu-freon` | `zapravka-avtokondicionera` | Incarcare conditionere auto cu freon R134a, R1234yf | Заправка автомобильных кондиционеров фреоном R134a, R1234yf | **0** | **0** | 1 |
| `servicii` | `uslugi` | Serviciile noastre | Наши услуги | **0** | **0** | 9 |

Tabul „Descriere" al fiecărei pagini de serviciu este literalmente gol în HTML-ul sursă
(`<div class="tab-pane active" id="tab-description"></div>`). Nu există niciun preț.
Meta description există și se migrează.

**Paginile de brand** nu au nici ele text de prezentare — doar h1, meta title, meta description și grila de produse. Nu există logo-uri de brand în sursă.

## 7b. Regimuri speciale (deciziile B.1 – B.7)

### 7b.1 Produse care devin `is_active = false` la import

| Motiv | Nr. | Prag |
|---|---|---|
| `size_source = 'none'` (B.2) | **0** | sub 50, se poate continua |
| Orfane, fără breadcrumb `Anvelope` (B.3) | **1** | — |
| **Total distinct de dezactivat** | **1** | |

Niciun produs fără dimensiune parsabilă ✅

### 7b.2 Produse indisponibile (B.1)

| | |
|---|---|
| `out_of_stock` | **798** (37.96%) |
| dintre care fără preț | **798** |
| `out_of_stock` **cu** preț | **0** |
| `in_stock` sau `supplier` **fără** preț | **0** |

Ultima linie e critică: încalcă `CHECK (stock_status = 'out_of_stock' OR price_mdl IS NOT NULL)` din C.2.
Zero încălcări ✅

### 7b.3 Brand: link vs. atribut `Producator` (B.6)

| | |
|---|---|
| Discrepanțe link ≠ atribut | **0** |
| Brand doar din atribut (link absent) | **0** |

Nicio discrepanță ✅

### 7b.4 Imagini (B.7 + punctele 3 și 4 din promptul 3B)

**Distribuția pe directoare sursă**

| Director sursă | Referințe |
|---|---|
| `/image/catalog/product/` | 2098 |
| `/image/altul/` | 2 |
| `/image/catalog/pics/` | 1 |

**Reutilizare**

| | |
|---|---|
| Referințe totale | **2101** |
| Fișiere unice după **nume** | **2101** |
| Fișiere unice după **SHA-1** | _încă nedescărcate_ |
| Raport produse / imagine (nume) | 1.00 |
| Raport produse / imagine (SHA-1) | — |
| Produse cu exact o imagine | **2101** |
| Produse cu mai multe imagini | **0** |
| Produse fără imagine | **1** |

> **Numele de fișier sunt unice per produs** — nu există reutilizare detectabilă la nivel de nume. Ipoteza „o fotografie per model" se poate confirma sau infirma **doar** după deduplicarea SHA-1 din pasul de descărcare.

**Top 20 imagini reutilizate** (după nume — SHA-1 indisponibil încă)

Nicio imagine reutilizată de mai mult de un produs la acest nivel de deduplicare.

**Nume de fișier descriptive** (statistică, nu erori)

| | |
|---|---|
| Imagini cu nume descriptiv (nu pur numeric) | **3** (0.14%) |
| … din care conțin o dimensiune | **1** |
| … din care dimensiunea diferă de titlu | **1** |

Fotografiile de anvelope sunt per **model**, nu per SKU — o dimensiune diferită în numele fișierului **nu** e un defect de date.

**Erori reale: numele fișierului indică alt brand decât produsul**

Niciuna ✅ — niciun fișier nu poartă numele unui brand diferit de cel al produsului.

### 7b.5 Produse similare din sursă (C.3)

| | |
|---|---|
| Produse cu recomandări legacy | **2001** (95.20%) |
| Total relații | **6108** |
| Medie per produs cu relații | 3.1 |
| Slug-uri recomandate **nerezolvabile** | **1750** `anvelope-matador-mp62-all-weather-evo-165-70-r14-81t`, `matador-mp62-all-weather-evo-195-60-r15-88h-1`, `anvelope-matador-mp93-nordicca-195-55-r15-85h`, `gt-radial-maxmiler-wt2-cargo-185-75-r16c-104-102r`, `gt-radial-maxmiler-wt3-195-70-r15c-104-102t-8pr`, `anvelope-lassa-wintus-2-205-65-r15c`, `lassa-wintus-2-205-70-r15c`, `lassa-wintus-2-215-65-r15c` |

## 8. Coliziuni de rutare

### 8.1 Spațiul RO (rădăcină)
| Verificare | Nr. | Detalii |
|---|---|---|
| Slug-uri produs duplicate | **0** | — |
| Slug și produs, și brand | **0** | — |
| Slug și produs, și serviciu | **0** | — |
| Slug produs pe rută rezervată | **0** | — |
| Slug brand pe rută rezervată/serviciu | **0** | — |

### 8.2 Spațiul RU (`/ru/`)
| Verificare | Nr. | Detalii |
|---|---|---|
| Slug-uri RU duplicate | **0** | — |
| Slug și produs, și brand | **0** | — |
| Slug și produs, și serviciu | **0** | — |
| Slug produs pe rută rezervată RU | **0** | — |

Produse cu slug RU diferit de cel RO: **667** din 2102 (31.73%).
Slug-uri RU de categorie: `/ru/katalog-shin`, `/ru/datchiki-davleniya-v-shinah`, `/ru/uslugi`.
Slug-urile de brand sunt identice în ambele limbi.

## 9. Eșecuri de crawl

Niciunul.

## 10. Rute de filtru de păstrat (indexate azi, nu query params)

Total: **190** rute RO.

### Latime (20)

- `/catalog-anvelope/latime_135` — 135 (5)
- `/catalog-anvelope/latime_145` — 145 (23)
- `/catalog-anvelope/latime_155` — 155 (149)
- `/catalog-anvelope/latime_165` — 165 (183)
- `/catalog-anvelope/latime_175` — 175 (424)
- `/catalog-anvelope/latime_185` — 185 (820)
- `/catalog-anvelope/latime_195` — 195 (1157)
- `/catalog-anvelope/latime_205` — 205 (1329)
- `/catalog-anvelope/latime_215` — 215 (1965)
- `/catalog-anvelope/latime_225` — 225 (2246)
- `/catalog-anvelope/latime_235` — 235 (2053)
- `/catalog-anvelope/latime_245` — 245 (1240)
- `/catalog-anvelope/latime_255` — 255 (1135)
- `/catalog-anvelope/latime_265` — 265 (629)
- `/catalog-anvelope/latime_275` — 275 (811)
- `/catalog-anvelope/latime_285` — 285 (414)
- `/catalog-anvelope/latime_295` — 295 (132)
- `/catalog-anvelope/latime_305` — 305 (46)
- `/catalog-anvelope/latime_315` — 315 (187)
- `/catalog-anvelope/latime_325` — 325 (34)

### Inaltime (13)

- `/catalog-anvelope/inaltime_25` — /25 (3)
- `/catalog-anvelope/inaltime_30` — /30 (172)
- `/catalog-anvelope/inaltime_35` — /35 (838)
- `/catalog-anvelope/inaltime_40` — /40 (1467)
- `/catalog-anvelope/inaltime_45` — /45 (2151)
- `/catalog-anvelope/inaltime_50` — /50 (1515)
- `/catalog-anvelope/inaltime_55` — /55 (2747)
- `/catalog-anvelope/inaltime_60` — /60 (1966)
- `/catalog-anvelope/inaltime_65` — /65 (2311)
- `/catalog-anvelope/inaltime_70` — /70 (1150)
- `/catalog-anvelope/inaltime_75` — /75 (443)
- `/catalog-anvelope/inaltime_80` — /80 (67)
- `/catalog-anvelope/inaltime_85` — /85 (12)

### Diametru (19)

- `/catalog-anvelope/diametru_r10` — R10 (4)
- `/catalog-anvelope/diametru_r12` — R12 (13)
- `/catalog-anvelope/diametru_r12c` — R12C (1)
- `/catalog-anvelope/diametru_r13` — R13 (254)
- `/catalog-anvelope/diametru_r13c` — R13C (4)
- `/catalog-anvelope/diametru_r14` — R14 (777)
- `/catalog-anvelope/diametru_r14c` — R14C (12)
- `/catalog-anvelope/diametru_r15` — R15 (1631)
- `/catalog-anvelope/diametru_r15c` — R15C (32)
- `/catalog-anvelope/diametru_r16` — R16 (2705)
- `/catalog-anvelope/diametru_r16c` — R16C (61)
- `/catalog-anvelope/diametru_r17` — R17 (2817)
- `/catalog-anvelope/diametru_r17c` — R17C (3)
- `/catalog-anvelope/diametru_r18` — R18 (2500)
- `/catalog-anvelope/diametru_r19` — R19 (1831)
- `/catalog-anvelope/diametru_r20` — R20 (1456)
- `/catalog-anvelope/diametru_r21` — R21 (592)
- `/catalog-anvelope/diametru_r22` — R22 (284)
- `/catalog-anvelope/diametru_r23` — R23 (25)

### Sezon (3)

- `/catalog-anvelope/sezon_all-season` — All season (1858)
- `/catalog-anvelope/sezon_iarna` — Iarna (5805)
- `/catalog-anvelope/sezon_vara` — Vara (7339)

### Producator (134)

- `/catalog-anvelope/marca_accelera` — ACCELERA (118)
- `/catalog-anvelope/marca_achilles` — Achilles (1)
- `/catalog-anvelope/marca_anchee` — Anchee (6)
- `/catalog-anvelope/marca_annaite` — Annaite (32)
- `/catalog-anvelope/marca_aoteli` — Aoteli (1)
- `/catalog-anvelope/marca_aplus` — Aplus (204)
- `/catalog-anvelope/marca_aptany` — Aptany (3)
- `/catalog-anvelope/marca_ardent` — Ardent (1)
- `/catalog-anvelope/marca_arivo` — Arivo (331)
- `/catalog-anvelope/marca_atlas` — Atlas (2)
- `/catalog-anvelope/marca_atturo` — Atturo (3)
- `/catalog-anvelope/marca_austone` — Austone (6)
- `/catalog-anvelope/marca_avon` — Avon (25)
- `/catalog-anvelope/marca_barum` — Barum (166)
- `/catalog-anvelope/marca_bearway` — Bearway (2)
- `/catalog-anvelope/marca_belshina` — BELSHINA (1)
- `/catalog-anvelope/marca_bfgoodrich` — BFGoodrich (23)
- `/catalog-anvelope/marca_brics` — Brics (1)
- `/catalog-anvelope/marca_bridgestone` — Bridgestone (237)
- `/catalog-anvelope/marca_ceat` — Ceat (70)
- `/catalog-anvelope/marca_centara` — Centara (146)
- `/catalog-anvelope/marca_charmhoo` — Charmhoo (32)
- `/catalog-anvelope/marca_comfoser` — Comfoser (38)
- `/catalog-anvelope/marca_compasal` — Compasal (8)
- `/catalog-anvelope/marca_continental` — Continental (410)
- `/catalog-anvelope/marca_cooper` — Cooper (66)
- `/catalog-anvelope/marca_crosswind` — Crosswind (220)
- `/catalog-anvelope/marca_davanti` — Davanti (100)
- `/catalog-anvelope/marca_debica` — Debica (61)
- `/catalog-anvelope/marca_delinte` — Delinte (1)
- `/catalog-anvelope/marca_diplomat` — Diplomat (12)
- `/catalog-anvelope/marca_doublestar` — Doublestar (2)
- `/catalog-anvelope/marca_dovroad` — Dovroad (2)
- `/catalog-anvelope/marca_dunlop` — Dunlop (112)
- `/catalog-anvelope/marca_duraturn` — Duraturn (73)
- `/catalog-anvelope/marca_falken` — Falken (30)
- `/catalog-anvelope/marca_federal` — Federal (1)
- `/catalog-anvelope/marca_firemax` — Firemax (159)
- `/catalog-anvelope/marca_firestone` — Firestone (16)
- `/catalog-anvelope/marca_fortuna` — Fortuna (5)
- `/catalog-anvelope/marca_fortune` — Fortune (132)
- `/catalog-anvelope/marca_fronway` — Fronway (271)
- `/catalog-anvelope/marca_fulda` — Fulda (55)
- `/catalog-anvelope/marca_gislaved` — Gislaved (17)
- `/catalog-anvelope/marca_giti` — GiTi (5)
- `/catalog-anvelope/marca_goodride-westlake` — Goodride-WestLake (1)
- `/catalog-anvelope/marca_goodyear` — Goodyear (399)
- `/catalog-anvelope/marca_greentrac` — Greentrac (15)
- `/catalog-anvelope/marca_grenlander` — Grenlander (456)
- `/catalog-anvelope/marca_gripmax` — Gripmax (17)
- `/catalog-anvelope/marca_gt-radial` — GT Radial (99)
- `/catalog-anvelope/marca_habilead` — Habilead (152)
- `/catalog-anvelope/marca_haida` — Haida (278)
- `/catalog-anvelope/marca_hankook` — Hankook (635)
- `/catalog-anvelope/marca_hilo` — Hilo (177)
- `/catalog-anvelope/marca_ilink` — ILINK (91)
- `/catalog-anvelope/marca_imperial` — Imperial (9)
- `/catalog-anvelope/marca_joyroad` — Joyroad (328)
- `/catalog-anvelope/marca_kapsen` — Kapsen (197)
- `/catalog-anvelope/marca_kelly` — Kelly (21)
- `/catalog-anvelope/marca_kinforest` — Kinforest (13)
- `/catalog-anvelope/marca_kleber` — Kleber (127)
- `/catalog-anvelope/marca_kormoran` — Kormoran (18)
- `/catalog-anvelope/marca_kpatos` — Kpatos (126)
- `/catalog-anvelope/marca_kumho` — Kumho (357)
- `/catalog-anvelope/marca_kustone` — Kustone (14)
- `/catalog-anvelope/marca_landspider` — Landspider (200)
- `/catalog-anvelope/marca_lanvigator` — Lanvigator (102)
- `/catalog-anvelope/marca_lassa` — Lassa (365)
- `/catalog-anvelope/marca_laufenn` — Laufenn (107)
- `/catalog-anvelope/marca_leao` — Leao (113)
- `/catalog-anvelope/marca_linglong` — LingLong (486)
- `/catalog-anvelope/marca_marshal` — Marshal (36)
- `/catalog-anvelope/marca_matador` — Matador (173)
- `/catalog-anvelope/marca_maxxis` — Maxxis (358)
- `/catalog-anvelope/marca_michelin` — Michelin (483)
- `/catalog-anvelope/marca_mileking` — Mileking (34)
- `/catalog-anvelope/marca_minerva` — Minerva (18)
- `/catalog-anvelope/marca_motrio` — Motrio (8)
- `/catalog-anvelope/marca_nankang` — Nankang (66)
- `/catalog-anvelope/marca_neolin` — Neolin (20)
- `/catalog-anvelope/marca_nereus` — Nereus (60)
- `/catalog-anvelope/marca_nexen` — Nexen (624)
- `/catalog-anvelope/marca_nokian` — Nokian (39)
- `/catalog-anvelope/marca_nordexx` — Nordexx (69)
- `/catalog-anvelope/marca_onyx` — ONYX (27)
- `/catalog-anvelope/marca_orium` — Orium (4)
- `/catalog-anvelope/marca_otani` — Otani (108)
- `/catalog-anvelope/marca_ovation` — Ovation (114)
- `/catalog-anvelope/marca_petlas` — Petlas (348)
- `/catalog-anvelope/marca_pirelli` — Pirelli (207)
- `/catalog-anvelope/marca_platin` — Platin (273)
- `/catalog-anvelope/marca_point-s` — Point S (94)
- `/catalog-anvelope/marca_powertrac` — POWERTRAC (1)
- `/catalog-anvelope/marca_premiorri` — Premiorri (1)
- `/catalog-anvelope/marca_prinx` — Prinx (59)
- `/catalog-anvelope/marca_rapid` — Rapid (2)
- `/catalog-anvelope/marca_riken` — Riken (149)
- `/catalog-anvelope/marca_roadboss` — Roadboss (4)
- `/catalog-anvelope/marca_roadstone` — Roadstone (51)
- `/catalog-anvelope/marca_roadx` — Roadx (302)
- `/catalog-anvelope/marca_rockblade` — Rockblade (35)
- `/catalog-anvelope/marca_rosava` — Rosava (166)
- `/catalog-anvelope/marca_rotex` — Rotex (19)
- `/catalog-anvelope/marca_rovelo` — Rovelo (73)
- `/catalog-anvelope/marca_royal-black` — Royal Black (22)
- `/catalog-anvelope/marca_rydanz` — Rydanz (60)
- `/catalog-anvelope/marca_sailun` — Sailun (284)
- `/catalog-anvelope/marca_sava` — Sava (27)
- `/catalog-anvelope/marca_semperit` — Semperit (13)
- `/catalog-anvelope/marca_starmaxx` — Starmaxx (154)
- `/catalog-anvelope/marca_strial` — Strial (1)
- `/catalog-anvelope/marca_sunny` — Sunny (98)
- `/catalog-anvelope/marca_superia` — Superia (40)
- `/catalog-anvelope/marca_three-a` — Three-A (11)
- `/catalog-anvelope/marca_tigar` — Tigar (84)
- `/catalog-anvelope/marca_toledo` — Toledo (2)
- `/catalog-anvelope/marca_torque` — Torque (243)
- `/catalog-anvelope/marca_tourador` — Tourador (128)
- `/catalog-anvelope/marca_toyo` — Toyo (7)
- `/catalog-anvelope/marca_tracmax` — TRACMAX (713)
- `/catalog-anvelope/marca_triangle` — TRIANGLE (200)
- `/catalog-anvelope/marca_tristar` — TRISTAR (42)
- `/catalog-anvelope/marca_unigrip` — Unigrip (10)
- `/catalog-anvelope/marca_uniroyal` — Uniroyal (114)
- `/catalog-anvelope/marca_viking` — Viking (93)
- `/catalog-anvelope/marca_voyager` — Voyager (4)
- `/catalog-anvelope/marca_vredestein` — Vredestein (191)
- `/catalog-anvelope/marca_waterfall` — Waterfall (9)
- `/catalog-anvelope/marca_west-lake` — West Lake (4)
- `/catalog-anvelope/marca_westlake` — Westlake (22)
- `/catalog-anvelope/marca_yokohama` — Yokohama (201)
- `/catalog-anvelope/marca_zeta` — ZETA (7)
- `/catalog-anvelope/marca_zmax` — Zmax (86)

### Disponibilitate (1)

- `/catalog-anvelope/nalichie` — In stoc (8060)

**RU:** structura echivalentă pornește de la `/ru/katalog-shin`. Slug-urile de filtru RU se extrag separat (`tools/scraper/extract-facets.mjs`) — vezi §12.

---

## 11. Anexa A — 5 produse complet extrase

```json
{
 "slug": "joyroad-winter-rx826-235-65-r18-106t",
 "slug_ru": "joyroad-winter-rx826-235-65-r18-106t",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/joyroad-winter-rx826-235-65-r18-106t",
  "product_id": "110727",
  "canonical": "https://anvelope-ungheni.md/joyroad-winter-rx826-235-65-r18-106t",
  "title": "Joyroad Winter RX826 235/65 R18 106T",
  "brand": "Joyroad",
  "brand_url": "https://anvelope-ungheni.md/joyroad",
  "badge": "Credit 0% | 6 luni",
  "price_raw": null,
  "price": null,
  "old_price": null,
  "stock_raw": "Stoc epuizat",
  "stock_status": "out_of_stock",
  "season_raw": "Iarna",
  "season": "iarna",
  "width": 235,
  "aspect": 65,
  "diameter": "R18",
  "size_raw": "235/65 R18",
  "size_source": "attribute",
  "load_index": "106",
  "speed_index": "T",
  "attributes": {
   "Dimensiune": "235/65 R18",
   "Sezon": "Iarna",
   "Indice de sarcina": "106",
   "Indice de viteza": "T",
   "Producator": "Joyroad"
  },
  "images": [
   "/image/catalog/product/557118.jpg"
  ],
  "related_slugs": [
   "joyroad-winter-rx826-225-60-r18-100t",
   "joyroad-winter-rx826-235-75-r15-105t"
  ],
  "description_html": null,
  "meta_title": "Joyroad Winter RX826 235/65 R18 106T - cumpara in Ungheni",
  "meta_description": "Anvelope Joyroad Winter RX826 235/65 R18 106T - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Joyroad Winter RX826 235/65 R18 106T"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/joyroad-winter-rx826-235-65-r18-106t",
  "product_id": "110727",
  "canonical": "https://anvelope-ungheni.md/ru/joyroad-winter-rx826-235-65-r18-106t",
  "title": "Joyroad Winter RX826 235/65 R18 106T",
  "brand": "Joyroad",
  "brand_url": "https://anvelope-ungheni.md/ru/joyroad",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": null,
  "price": null,
  "old_price": null,
  "stock_raw": "Нет в наличии",
  "stock_status": "out_of_stock",
  "season_raw": "Зима",
  "season": "iarna",
  "width": 235,
  "aspect": 65,
  "diameter": "R18",
  "size_raw": "235/65 R18",
  "size_source": "attribute",
  "load_index": "106",
  "speed_index": "T",
  "attributes": {
   "Размер": "235/65 R18",
   "Сезон": "Зима",
   "Индекс нагрузки": "106",
   "Индекс скорости": "T",
   "Производитель": "Joyroad"
  },
  "images": [
   "/image/catalog/product/557118.jpg"
  ],
  "related_slugs": [
   "joyroad-winter-rx826-225-60-r18-100t",
   "joyroad-winter-rx826-235-75-r15-105t"
  ],
  "description_html": null,
  "meta_title": "Joyroad Winter RX826 235/65 R18 106T - купить в Унгенах",
  "meta_description": "Шины Joyroad Winter RX826 235/65 R18 106T - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Joyroad Winter RX826 235/65 R18 106T"
  ],
  "lang": "ru"
 },
 "crawled_at": "2026-08-21T21:10:27.619Z"
}
```

```json
{
 "slug": "matador-mp62-all-weather-evo-205-60-r16-96h",
 "slug_ru": "matador-mp62-all-weather-evo-205-60-r16-96h",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/matador-mp62-all-weather-evo-205-60-r16-96h",
  "product_id": "110726",
  "canonical": "https://anvelope-ungheni.md/matador-mp62-all-weather-evo-205-60-r16-96h",
  "title": "Matador MP62 All Weather EVO 205/60 R16 96H",
  "brand": "Matador",
  "brand_url": "https://anvelope-ungheni.md/matador",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 900 MDL",
  "price": 1900,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "All season",
  "season": "all_season",
  "width": 205,
  "aspect": 60,
  "diameter": "R16",
  "size_raw": "205/60 R16",
  "size_source": "attribute",
  "load_index": "96",
  "speed_index": "H",
  "attributes": {
   "Dimensiune": "205/60 R16",
   "Sezon": "All season",
   "Indice de sarcina": "96",
   "Indice de viteza": "H",
   "Producator": "Matador"
  },
  "images": [
   "/image/catalog/product/480861.jpg"
  ],
  "related_slugs": [
   "matador-mp62-all-weather-evo-205-55-r16-91h",
   "anvelope-matador-mp62-all-weather-evo-215-65-r16-98h",
   "anvelope-matador-mp62-all-weather-evo-165-70-r14-81t",
   "matador-mp62-all-weather-evo-195-60-r15-88h-1"
  ],
  "description_html": null,
  "meta_title": "Matador MP62 All Weather EVO 205/60 R16 96H - cumpara in Ungheni",
  "meta_description": "Anvelope Matador MP62 All Weather EVO 205/60 R16 96H - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Matador MP62 All Weather EVO 205/60 R16 96H"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/matador-mp62-all-weather-evo-205-60-r16-96h",
  "product_id": "110726",
  "canonical": "https://anvelope-ungheni.md/ru/matador-mp62-all-weather-evo-205-60-r16-96h",
  "title": "Matador MP62 All Weather EVO 205/60 R16 96H",
  "brand": "Matador",
  "brand_url": "https://anvelope-ungheni.md/ru/matador",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 900 MDL",
  "price": 1900,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Всесезонные",
  "season": "all_season",
  "width": 205,
  "aspect": 60,
  "diameter": "R16",
  "size_raw": "205/60 R16",
  "size_source": "attribute",
  "load_index": "96",
  "speed_index": "H",
  "attributes": {
   "Размер": "205/60 R16",
   "Сезон": "Всесезонные",
   "Индекс нагрузки": "96",
   "Индекс скорости": "H",
   "Производитель": "Matador"
  },
  "images": [
   "/image/catalog/product/480861.jpg"
  ],
  "related_slugs": [
   "matador-mp62-all-weather-evo-205-55-r16-91h",
   "shina-matador-mp62-all-weather-evo-21565-r16-98h",
   "shina-matador-mp62-all-weather-evo-16570-r14-81t",
   "matador-mp62-all-weather-evo-19560-r15-88h"
  ],
  "description_html": null,
  "meta_title": "Matador MP62 All Weather EVO 205/60 R16 96H - купить в Унгенах",
  "meta_description": "Шины Matador MP62 All Weather EVO 205/60 R16 96H - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Matador MP62 All Weather EVO 205/60 R16 96H"
  ],
  "lang": "ru"
 },
 "crawled_at": "2026-08-21T21:10:27.731Z"
}
```

```json
{
 "slug": "lassa-multiways-2-185-65-r15-92v",
 "slug_ru": "lassa-multiways-2-185-65-r15-92v",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/lassa-multiways-2-185-65-r15-92v",
  "product_id": "110729",
  "canonical": "https://anvelope-ungheni.md/lassa-multiways-2-185-65-r15-92v",
  "title": "Lassa Multiways 2 185/65 R15 92V",
  "brand": "Lassa",
  "brand_url": "https://anvelope-ungheni.md/lassa",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 074 MDL",
  "price": 1074,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "All season",
  "season": "all_season",
  "width": 185,
  "aspect": 65,
  "diameter": "R15",
  "size_raw": "185/65 R15",
  "size_source": "attribute",
  "load_index": "92",
  "speed_index": "V",
  "attributes": {
   "Dimensiune": "185/65 R15",
   "Sezon": "All season",
   "Indice de sarcina": "92",
   "Indice de viteza": "V",
   "Producator": "Lassa"
  },
  "images": [
   "/image/catalog/product/1138278.jpg"
  ],
  "related_slugs": [
   "lassa-multiways-2-185-55-r15-82v",
   "lassa-multiways-2-185-60-r15-88v"
  ],
  "description_html": null,
  "meta_title": "Lassa Multiways 2 185/65 R15 92V - cumpara in Ungheni",
  "meta_description": "Lassa Multiways 2 185/65 R15 92V - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Lassa Multiways 2 185/65 R15 92V"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/lassa-multiways-2-185-65-r15-92v",
  "product_id": "110729",
  "canonical": "https://anvelope-ungheni.md/ru/lassa-multiways-2-185-65-r15-92v",
  "title": "Lassa Multiways 2 185/65 R15 92V",
  "brand": "Lassa",
  "brand_url": "https://anvelope-ungheni.md/ru/lassa",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 074 MDL",
  "price": 1074,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Всесезонные",
  "season": "all_season",
  "width": 185,
  "aspect": 65,
  "diameter": "R15",
  "size_raw": "185/65 R15",
  "size_source": "attribute",
  "load_index": "92",
  "speed_index": "V",
  "attributes": {
   "Размер": "185/65 R15",
   "Сезон": "Всесезонные",
   "Индекс нагрузки": "92",
   "Индекс скорости": "V",
   "Производитель": "Lassa"
  },
  "images": [
   "/image/catalog/product/1138278.jpg"
  ],
  "related_slugs": [
   "lassa-multiways-2-185-55-r15-82v",
   "lassa-multiways-2-185-60-r15-88v"
  ],
  "description_html": null,
  "meta_title": "Lassa Multiways 2 185/65 R15 92V - купить в Унгенах",
  "meta_description": "Lassa Multiways 2 185/65 R15 92V - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Lassa Multiways 2 185/65 R15 92V"
  ],
  "lang": "ru"
 },
 "crawled_at": "2026-08-21T21:10:28.730Z"
}
```

```json
{
 "slug": "matador-mp93-nordicca-195-55-r16-91h",
 "slug_ru": "matador-mp93-nordicca-195-55-r16-91h",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/matador-mp93-nordicca-195-55-r16-91h",
  "product_id": "110731",
  "canonical": "https://anvelope-ungheni.md/matador-mp93-nordicca-195-55-r16-91h",
  "title": "Matador MP93 Nordicca 195/55 R16 91H",
  "brand": "Matador",
  "brand_url": "https://anvelope-ungheni.md/matador",
  "badge": "Credit 0% | 6 luni",
  "price_raw": null,
  "price": null,
  "old_price": null,
  "stock_raw": "Stoc epuizat",
  "stock_status": "out_of_stock",
  "season_raw": "Iarna",
  "season": "iarna",
  "width": 195,
  "aspect": 55,
  "diameter": "R16",
  "size_raw": "195/55 R16",
  "size_source": "attribute",
  "load_index": "91",
  "speed_index": "H",
  "attributes": {
   "Dimensiune": "195/55 R16",
   "Sezon": "Iarna",
   "Indice de sarcina": "91",
   "Indice de viteza": "H",
   "Producator": "Matador"
  },
  "images": [
   "/image/catalog/product/1053781.jpg"
  ],
  "related_slugs": [
   "matador-mp93-nordicca-195-65-r15-91t",
   "matador-mp93-nordicca-215-45-r16-90v-xl-fr",
   "anvelope-matador-mp93-nordicca-195-60-r16-89h",
   "anvelope-matador-mp93-nordicca-195-55-r15-85h"
  ],
  "description_html": null,
  "meta_title": "Matador MP93 Nordicca 195/55 R16 91H - cumpara in Ungheni",
  "meta_description": "Matador MP93 Nordicca 195/55 R16 91H - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Matador MP93 Nordicca 195/55 R16 91H"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/matador-mp93-nordicca-195-55-r16-91h",
  "product_id": "110731",
  "canonical": "https://anvelope-ungheni.md/ru/matador-mp93-nordicca-195-55-r16-91h",
  "title": "Matador MP93 Nordicca 195/55 R16 91H",
  "brand": "Matador",
  "brand_url": "https://anvelope-ungheni.md/ru/matador",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": null,
  "price": null,
  "old_price": null,
  "stock_raw": "Нет в наличии",
  "stock_status": "out_of_stock",
  "season_raw": "Зима",
  "season": "iarna",
  "width": 195,
  "aspect": 55,
  "diameter": "R16",
  "size_raw": "195/55 R16",
  "size_source": "attribute",
  "load_index": "91",
  "speed_index": "H",
  "attributes": {
   "Размер": "195/55 R16",
   "Сезон": "Зима",
   "Индекс нагрузки": "91",
   "Индекс скорости": "H",
   "Производитель": "Matador"
  },
  "images": [
   "/image/catalog/product/1053781.jpg"
  ],
  "related_slugs": [
   "matador-mp93-nordicca-195-65-r15-91t",
   "matador-mp93-nordicca-215-45-r16-90v-xl-fr",
   "shina-matador-mp93-nordicca-19560-r16-89h",
   "shiny-matador-mp93-nordicca-195-55-r15-85h"
  ],
  "description_html": null,
  "meta_title": "Matador MP93 Nordicca 195/55 R16 91H - купить в Унгенах",
  "meta_description": "Matador MP93 Nordicca 195/55 R16 91H - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Matador MP93 Nordicca 195/55 R16 91H"
  ],
  "lang": "ru"
 },
 "crawled_at": "2026-08-21T21:10:29.524Z"
}
```

```json
{
 "slug": "gt-radial-maxmiler-pro-195-70-r15c-104-102r",
 "slug_ru": "gt-radial-maxmiler-pro-195-70-r15c-104-102r",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/gt-radial-maxmiler-pro-195-70-r15c-104-102r",
  "product_id": "110742",
  "canonical": "https://anvelope-ungheni.md/gt-radial-maxmiler-pro-195-70-r15c-104-102r",
  "title": "GT Radial MaxMiler PRO 195/70 R15C 104/102R",
  "brand": "GT Radial",
  "brand_url": "https://anvelope-ungheni.md/gt-radial",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 592 MDL",
  "price": 1592,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "Vara",
  "season": "vara",
  "width": 195,
  "aspect": 70,
  "diameter": "R15C",
  "size_raw": "195/70 R15C",
  "size_source": "attribute",
  "load_index": "104/102",
  "speed_index": "R",
  "attributes": {
   "Dimensiune": "195/70 R15C",
   "Sezon": "Vara",
   "Indice de sarcina": "104/102",
   "Indice de viteza": "R",
   "Producator": "GT Radial"
  },
  "images": [
   "/image/catalog/product/595355.jpg"
  ],
  "related_slugs": [
   "gt-radial-maxmiler-pro-225-70-r15c-112-110r",
   "gt-radial-maxmiler-pro-185-75-r16c-104-102t-8pr",
   "gt-radial-maxmiler-wt2-cargo-185-75-r16c-104-102r",
   "gt-radial-maxmiler-wt3-195-70-r15c-104-102t-8pr"
  ],
  "description_html": null,
  "meta_title": "GT Radial MaxMiler PRO 195/70 R15C 104/102R - cumpara in Ungheni",
  "meta_description": "GT Radial MaxMiler PRO 195/70 R15C 104/102R - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "GT Radial MaxMiler PRO 195/70 R15C 104/102R"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/gt-radial-maxmiler-pro-195-70-r15c-104-102r",
  "product_id": "110742",
  "canonical": "https://anvelope-ungheni.md/ru/gt-radial-maxmiler-pro-195-70-r15c-104-102r",
  "title": "GT Radial MaxMiler PRO 195/70 R15C 104/102R",
  "brand": "GT Radial",
  "brand_url": "https://anvelope-ungheni.md/ru/gt-radial",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 592 MDL",
  "price": 1592,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Лето",
  "season": "vara",
  "width": 195,
  "aspect": 70,
  "diameter": "R15C",
  "size_raw": "195/70 R15C",
  "size_source": "attribute",
  "load_index": "104/102",
  "speed_index": "R",
  "attributes": {
   "Размер": "195/70 R15C",
   "Сезон": "Лето",
   "Индекс нагрузки": "104/102",
   "Индекс скорости": "R",
   "Производитель": "GT Radial"
  },
  "images": [
   "/image/catalog/product/595355.jpg"
  ],
  "related_slugs": [
   "gt-radial-maxmiler-pro-225-70-r15c-112-110r",
   "gt-radial-maxmiler-pro-185-75-r16c-104-102t-8pr",
   "gt-radial-maxmiler-wt2-cargo-18575-r16c-104102r",
   "gt-radial-maxmiler-wt3-19570-r15c-104102t-8pr"
  ],
  "description_html": null,
  "meta_title": "GT Radial MaxMiler PRO 195/70 R15C 104/102R - купить в Унгенах",
  "meta_description": "GT Radial MaxMiler PRO 195/70 R15C 104/102R - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "breadcrumbs": [
   "Главная",
   "Шины",
   "GT Radial MaxMiler PRO 195/70 R15C 104/102R"
  ],
  "lang": "ru"
 },
 "crawled_at": "2026-08-21T21:10:29.559Z"
}
```

## 12. Anexa B — o pagină de brand extrasă

```json
{
 "slug": "michelin",
 "ro": {
  "titlu": "Anvelope Michelin",
  "meta_title": "Anvelope Michelin - Ungheni",
  "meta_description": "Cauciucuri Michelin de Iarna, Vara, All Season in Ungheni ✔️Garantie 2 ani ✔️Cel mai bun pret ⚙️Oferim servicii de montare ☎️068-263-644.",
  "canonical": "https://anvelope-ungheni.md/michelin"
 },
 "ru": {
  "titlu": "Шины Michelin",
  "meta_title": "Шины Michelin - Унгены",
  "meta_description": "Шины Michelin летние, зимние, всесезонные в Унгенах ✔️Гарантия 2 года ✔️Самая низкая цена ⚙️Предоставляем шиномонтаж ☎️068-263-644.",
  "canonical": "https://anvelope-ungheni.md/ru/michelin"
 },
 "are_descriere_proprie": false,
 "are_logo": false
}
```

## 13. Anexa C — cele 134 de branduri cu numărul de produse

| # | Brand | Slug | Produse (filtru) | Produse (extrase) |
|---|---|---|---|---|
| 1 | ACCELERA | `accelera` | 118 | 9 |
| 2 | Achilles | `achilles` | 1 | 0 |
| 3 | Anchee | `anchee` | 6 | 0 |
| 4 | Annaite | `annaite` | 32 | 6 |
| 5 | Aoteli | `aoteli` | 1 | 0 |
| 6 | Aplus | `aplus` | 204 | 0 |
| 7 | Aptany | `aptany` | 3 | 0 |
| 8 | Ardent | `ardent` | 1 | 1 |
| 9 | Arivo | `arivo` | 331 | 39 |
| 10 | Atlas | `atlas` | 2 | 0 |
| 11 | Atturo | `atturo` | 3 | 0 |
| 12 | Austone | `austone` | 6 | 0 |
| 13 | Avon | `avon` | 25 | 0 |
| 14 | Barum | `barum` | 166 | 33 |
| 15 | Bearway | `bearway` | 2 | 0 |
| 16 | BELSHINA | `belshina` | 1 | 1 |
| 17 | BFGoodrich | `bfgoodrich` | 23 | 1 |
| 18 | Brics | `brics` | 1 | 0 |
| 19 | Bridgestone | `bridgestone` | 237 | 10 |
| 20 | Ceat | `ceat` | 70 | 0 |
| 21 | Centara | `centara` | 146 | 2 |
| 22 | Charmhoo | `charmhoo` | 32 | 30 |
| 23 | Comfoser | `comfoser` | 38 | 3 |
| 24 | Compasal | `compasal` | 8 | 0 |
| 25 | Continental | `continental` | 410 | 43 |
| 26 | Cooper | `cooper` | 66 | 0 |
| 27 | Crosswind | `crosswind` | 220 | 0 |
| 28 | Davanti | `davanti` | 100 | 26 |
| 29 | Debica | `debica` | 61 | 26 |
| 30 | Delinte | `delinte` | 1 | 0 |
| 31 | Diplomat | `diplomat` | 12 | 4 |
| 32 | Doublestar | `doublestar` | 2 | 0 |
| 33 | Dovroad | `dovroad` | 2 | 0 |
| 34 | Dunlop | `dunlop` | 112 | 19 |
| 35 | Duraturn | `duraturn` | 73 | 13 |
| 36 | Falken | `falken` | 30 | 1 |
| 37 | Federal | `federal` | 1 | 0 |
| 38 | Firemax | `firemax` | 159 | 33 |
| 39 | Firestone | `firestone` | 16 | 2 |
| 40 | Fortuna | `fortuna` | 5 | 0 |
| 41 | Fortune | `fortune` | 132 | 4 |
| 42 | Fronway | `fronway` | 271 | 0 |
| 43 | Fulda | `fulda` | 55 | 23 |
| 44 | Gislaved | `gislaved` | 17 | 8 |
| 45 | GiTi | `giti` | 5 | 0 |
| 46 | Goodride-WestLake | `goodride-westlake` | 1 | 1 |
| 47 | Goodyear | `goodyear` | 399 | 45 |
| 48 | Greentrac | `greentrac` | 15 | 15 |
| 49 | Grenlander | `grenlander` | 456 | 91 |
| 50 | Gripmax | `gripmax` | 17 | 10 |
| 51 | GT Radial | `gt-radial` | 99 | 30 |
| 52 | Habilead | `habilead` | 152 | 0 |
| 53 | Haida | `haida` | 278 | 41 |
| 54 | Hankook | `hankook` | 635 | 74 |
| 55 | Hilo | `hilo` | 177 | 27 |
| 56 | ILINK | `ilink` | 91 | 1 |
| 57 | Imperial | `imperial` | 9 | 0 |
| 58 | Joyroad | `joyroad` | 328 | 72 |
| 59 | Kapsen | `kapsen` | 197 | 0 |
| 60 | Kelly | `kelly` | 21 | 7 |
| 61 | Kinforest | `kinforest` | 13 | 0 |
| 62 | Kleber | `kleber` | 127 | 0 |
| 63 | Kormoran | `kormoran` | 18 | 0 |
| 64 | Kpatos | `kpatos` | 126 | 0 |
| 65 | Kumho | `kumho` | 357 | 24 |
| 66 | Kustone | `kustone` | 14 | 0 |
| 67 | Landspider | `landspider` | 200 | 0 |
| 68 | Lanvigator | `lanvigator` | 102 | 0 |
| 69 | Lassa | `lassa` | 365 | 130 |
| 70 | Laufenn | `laufenn` | 107 | 13 |
| 71 | Leao | `leao` | 113 | 7 |
| 72 | LingLong | `linglong` | 486 | 69 |
| 73 | Marshal | `marshal` | 36 | 29 |
| 74 | Matador | `matador` | 173 | 56 |
| 75 | Maxxis | `maxxis` | 358 | 35 |
| 76 | Michelin | `michelin` | 483 | 71 |
| 77 | Mileking | `mileking` | 34 | 3 |
| 78 | Minerva | `minerva` | 18 | 0 |
| 79 | Motrio | `motrio` | 8 | 0 |
| 80 | Nankang | `nankang` | 66 | 0 |
| 81 | Neolin | `neolin` | 20 | 1 |
| 82 | Nereus | `nereus` | 60 | 2 |
| 83 | Nexen | `nexen` | 624 | 113 |
| 84 | Nokian | `nokian` | 39 | 3 |
| 85 | Nordexx | `nordexx` | 69 | 4 |
| 86 | ONYX | `onyx` | 27 | 0 |
| 87 | Orium | `orium` | 4 | 0 |
| 88 | Otani | `otani` | 108 | 39 |
| 89 | Ovation | `ovation` | 114 | 0 |
| 90 | Petlas | `petlas` | 348 | 100 |
| 91 | Pirelli | `pirelli` | 207 | 10 |
| 92 | Platin | `platin` | 273 | 15 |
| 93 | Point S | `point-s` | 94 | 10 |
| 94 | POWERTRAC | `powertrac` | 1 | 0 |
| 95 | Premiorri | `premiorri` | 1 | 1 |
| 96 | Prinx | `prinx` | 59 | 0 |
| 97 | Rapid | `rapid` | 2 | 0 |
| 98 | Riken | `riken` | 149 | 23 |
| 99 | Roadboss | `roadboss` | 4 | 0 |
| 100 | Roadstone | `roadstone` | 51 | 15 |
| 101 | Roadx | `roadx` | 302 | 51 |
| 102 | Rockblade | `rockblade` | 35 | 0 |
| 103 | Rosava | `rosava` | 166 | 42 |
| 104 | Rotex | `rotex` | 19 | 19 |
| 105 | Rovelo | `rovelo` | 73 | 0 |
| 106 | Royal Black | `royal-black` | 22 | 0 |
| 107 | Rydanz | `rydanz` | 60 | 0 |
| 108 | Sailun | `sailun` | 284 | 2 |
| 109 | Sava | `sava` | 27 | 9 |
| 110 | Semperit | `semperit` | 13 | 0 |
| 111 | Starmaxx | `starmaxx` | 154 | 70 |
| 112 | Strial | `strial` | 1 | 0 |
| 113 | Sunny | `sunny` | 98 | 0 |
| 114 | Superia | `superia` | 40 | 4 |
| 115 | Three-A | `three-a` | 11 | 9 |
| 116 | Tigar | `tigar` | 84 | 33 |
| 117 | Toledo | `toledo` | 2 | 1 |
| 118 | Torque | `torque` | 243 | 83 |
| 119 | Tourador | `tourador` | 128 | 21 |
| 120 | Toyo | `toyo` | 7 | 2 |
| 121 | TRACMAX | `tracmax` | 713 | 136 |
| 122 | TRIANGLE | `triangle` | 200 | 0 |
| 123 | TRISTAR | `tristar` | 42 | 1 |
| 124 | Unigrip | `unigrip` | 10 | 7 |
| 125 | Uniroyal | `uniroyal` | 114 | 30 |
| 126 | Viking | `viking` | 93 | 24 |
| 127 | Voyager | `voyager` | 4 | 2 |
| 128 | Vredestein | `vredestein` | 191 | 3 |
| 129 | Waterfall | `waterfall` | 9 | 2 |
| 130 | West Lake | `west-lake` | 4 | 0 |
| 131 | Westlake | `westlake` | 22 | 0 |
| 132 | Yokohama | `yokohama` | 201 | 18 |
| 133 | ZETA | `zeta` | 7 | 7 |
| 134 | Zmax | `zmax` | 86 | 0 |
