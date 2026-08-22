# REPORT — Faza 0, achiziția datelor de pe anvelope-ungheni.md

Generat: **2026-08-22T21:20:47.469Z**
Sursă: scraping propriu (nu a existat export OpenCart în `data/source/`).
Crawl complet: **DA**

---

## 1. Totaluri și reconciliere

| | Valoare |
|---|---|
| URL-uri produs în sitemap | **15010** |
| Produse numărate de filtrele catalogului | **15002** |
| Produse extrase cu succes | **15010** |
| Eșecuri de crawl | **0** |
| Acoperire față de sitemap | **100.00%** |
| Branduri în sitemap | 134 |
| Pagini de serviciu | 10 |
| Imagini unice descărcate | 1749 |

### 1.1 Explicația diferenței 15010 (sitemap) vs. 15002 (catalog)

Produse extrase care **nu** au breadcrumb-ul `Anvelope` (deci nu intră în contorul catalogului): **3**

| Slug | Titlu | Breadcrumb | Preț | Stoc |
|---|---|---|---|---|
| `michelin-latitude-sport-3-255-60-r17-106v` | Michelin Latitude Sport 3 255/60 R17 106V | Acasă › Michelin Latitude Sport 3 255/60 R17 106V | — | Stoc epuizat |
| `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-cauciuc` | Senzor universal de presiune anvelope programabil Foxwell T10 (supapa cauciuc) | Acasă › Senzori presiune anvelope › Senzor universal de presiune anvelope programabil Foxwell T10 (supapa cauciuc) | 1000 | Stoc furnizor |
| `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-metalica` | Senzor universal de presiune anvelope programabil Foxwell T10 (supapa metalica) | Acasă › Senzori presiune anvelope › Senzor universal de presiune anvelope programabil Foxwell T10 (supapa metalica) | 1000 | Stoc furnizor |

## 2. Distribuție pe sezon

| Sezon | Așteptat (filtru live) | Extras | Δ |
|---|---|---|---|
| all_season | 1858 | 1858 | ✅ |
| iarna | 5805 | 5805 | ✅ |
| vara | 7339 | 7340 | +1 |

## 3. Disponibilitate

Etichete brute găsite în sursă (RO):

| Etichetă sursă | Nr. | → enum |
|---|---|---|
| Stoc furnizor | 8066 | `supplier` |
| Stoc epuizat | 6915 | `out_of_stock` |

| Enum | Nr. |
|---|---|
| `supplier` | 8066 |
| `out_of_stock` | 6944 |

Contor live „In stoc" în catalog: **8060** · extras `in_stock`: **0** · Δ **-8060**

## 4. Integritate a câmpurilor

| Verificare | Nr. | % | Exemple |
|---|---|---|---|
| fără preț | **6944** | 46.26% | `accelera-651-sport-21545-r17-87w`, `accelera-651-sport-255-35-r18-94w`, `accelera-651-sport-285-35-r18-101w` |
| fără imagine | **10** | 0.07% | `hankook-ventus-s1-evo-3-k127a-305-40-r20-112y-xl`, `hankook-ventus-s1-evo-3-suv-k127-275-40-r21-107y-xl-run-flat`, `kormoran-snow-205-60-r16-92h` |
| fără brand | **2** | 0.01% | `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-cauciuc`, `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-metalica` |
| fără dimensiune parsabilă | **2** | 0.01% | `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-cauciuc`, `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-metalica` |
| dimensiuni imperiale (31x10.50 R15) | **20** | 0.13% | `anvelope-accelera-badak-x-treme-lt-31x10-50-r15-110n`, `anvelope-accelera-badak-x-treme-lt-35x10-50-r16119l`, `anvelope-firemax-fm523-m-t-31x10-5-r15-109q` |
| fără înălțime (profil) — anvelope C și imperiale | **162** | 1.08% | `accelera-ultra-5-175-r13c-97-95r`, `annaite-an900-185-r14c-102-100r`, `anvelope-accelera-badak-x-treme-lt-31x10-50-r15-110n` |
| fără sezon | **7** | 0.05% | `bridgestone-blizzak-6-245-50-r20-105w-xl`, `habilead-aw33-245-40-r19-98h-xl`, `kpatos-fm518-235-60-r17-102h` |
| fără indice de sarcină | **68** | 0.45% | `achilles-gs-328-24-61-17`, `annaite-an600-165-65-r14`, `anvelope-goodyear-efficientgrip-2-suv-225-65-r17-106v-xl` |
| fără indice de viteză | **85** | 0.57% | `achilles-gs-328-24-61-17`, `annaite-an600-165-65-r14`, `annaite-an658-225-70-r15c-112-110-8pr` |
| fără versiune RU | **0** | 0.00% | — |
| fără slug_ru | **0** | 0.00% | — |
| fără meta description RO | **0** | 0.00% | — |
| fără meta description RU | **0** | 0.00% | — |
| cu descriere proprie (description_html) | **1** | 0.01% | `michelin-latitude-sport-3-255-60-r17-106v` |

Sursa dimensiunii: `attribute`=14980 · `title`=28 · `none`=2

Marcaje derivate: XL **5556** · run-flat **11** · cu cuie **25** · comercial (C) **340**

### 4.1 Prețuri suspecte (< 200 MDL sau > 30.000 MDL)

**0** produse.

Niciunul.

### 4.2 Valori în afara enum-urilor

- Sezon nemapat: **0** 
- Stoc nemapat: **0** 
- Indice de viteză neconform: **0** 
- Indici de viteză întâlniți: `C` `E` `H` `J` `L` `M` `N` `P` `Q` `R` `S` `T` `V` `W` `Y`

### 4.3 Atribute nemapate în schema propusă

Niciunul — toate atributele din sursă au corespondent în schemă.

Atribute mapate: Sezon (15003) · Dimensiune (15000) · Indice de sarcina (14942) · Indice de viteza (14925) · Producator (4637) · RunFlat (самонесущие) (9)

## 5. Branduri

Găsite în produse: **135** · în sitemap: **134** · în filtrul catalogului: **134** · în briefing §2.4: **134**

### 5.1 Diferențe față de contorul filtrului (doar cele care nu se potrivesc)

| Brand | Așteptat | Extras | Δ |
|---|---|---|---|
| APTANY | 0 | 1 | +1 |
| Kormoran | 18 | 0 | -18 |
| KORMORAN | 0 | 19 | +19 |
| Michelin | 483 | 484 | +1 |
| Orium | 4 | 0 | -4 |
| ORIUM | 0 | 4 | +4 |

### 5.2 Diferențe față de lista din briefing

- În briefing, absente din filtru: —
- În filtru, absente din briefing: —

## 6. Dimensiuni

### 6.1 Diametru
| Diametru | Așteptat | Extras | Δ |
|---|---|---|---|
| R10 | 4 | 4 | ✅ |
| R12 | 13 | 12 | -1 |
| R12C | 1 | 2 | +1 |
| R13 | 254 | 254 | ✅ |
| R13C | 4 | 4 | ✅ |
| R14 | 777 | 751 | -26 |
| R14C | 12 | 38 | +26 |
| R15 | 1631 | 1554 | -77 |
| R15C | 32 | 109 | +77 |
| R16 | 2705 | 2584 | -121 |
| R16C | 61 | 182 | +121 |
| R17 | 2817 | 2817 | ✅ |
| R17C | 3 | 5 | +2 |
| R18 | 2500 | 2501 | +1 |
| R19 | 1831 | 1832 | +1 |
| R20 | 1456 | 1458 | +2 |
| R21 | 592 | 592 | ✅ |
| R22 | 284 | 284 | ✅ |
| R23 | 25 | 25 | ✅ |

### 6.2 Lățime (doar diferențele)
| Lățime | Așteptat | Extras | Δ |
|---|---|---|---|
| 215 | 1965 | 1966 | +1 |
| 235 | 2053 | 2054 | +1 |
| 245 | 1240 | 1242 | +2 |
| 255 | 1135 | 1137 | +2 |

### 6.3 Înălțime (doar diferențele)
| Înălțime | Așteptat | Extras | Δ |
|---|---|---|---|
| 40 | 1467 | 1468 | +1 |
| 50 | 1515 | 1517 | +2 |
| 60 | 1966 | 1969 | +3 |

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
| `size_source = 'none'` (B.2) | **2** | sub 50, se poate continua |
| Orfane, fără breadcrumb `Anvelope` (B.3) | **3** | — |
| **Total distinct de dezactivat** | **3** | |

Produse fără dimensiune parsabilă:

| Slug | Titlu | Atribute prezente |
|---|---|---|
| `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-cauciuc` | Senzor universal de presiune anvelope programabil Foxwell T10 (supapa cauciuc) | — |
| `senzor-universal-de-presiune-anvelope-programabil-foxwell-t10-supapa-metalica` | Senzor universal de presiune anvelope programabil Foxwell T10 (supapa metalica) | — |

### 7b.2 Produse indisponibile (B.1)

| | |
|---|---|
| `out_of_stock` | **6944** (46.26%) |
| dintre care fără preț | **6944** |
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
| `/image/catalog/product/` | 14963 |
| `/image/altul/` | 36 |
| `/image/catalog/pics/` | 1 |

**Reutilizare**

| | |
|---|---|
| Referințe totale | **15000** |
| Fișiere unice după **nume** | **14991** |
| Fișiere unice după **SHA-1** | **1749** |
| Raport produse / imagine (nume) | 1.00 |
| Raport produse / imagine (SHA-1) | 8.58 |
| Produse cu exact o imagine | **15000** |
| Produse cu mai multe imagini | **0** |
| Produse fără imagine | **10** |



**Top 20 imagini reutilizate** (după SHA-1)

| # | Imagine | Produse | Titluri |
|---|---|---|---|
| 1 | `57e07c8417f21694b4cac893c1056839e738e736.jpg` | **114** | Hankook Winter i*Cept Evo3 W330 195/55 R20 95H · Hankook Winter i*Cept Evo3 W330 215/55 R18 99V XL · Hankook Winter I*cept Evo3 W330 215/60 R17 96H · Hankook Winter I*cept Evo3 W330 225/40 R18 92V XL · Hankook Winter i*Cept Evo3 W330 225/50 R18 99V XL · Hankook Winter i*Cept Evo3 W330 235/35 R20 92W XL … +108 |
| 2 | `0224504bbad7dd665114b3db326efc040346f45a.jpg` | **104** | Tracmax X-privilo TX3 195/40 R17 81W XL · Tracmax X-privilo TX3 195/50 R20 93V XL · Tracmax X-privilo TX3 195/55 R20 95H · Tracmax X-privilo TX3 205/40 R17 84W XL · Tracmax X-privilo TX3 205/40 ZR18 86Y XL · Tracmax X-privilo TX3 205/45 R16 87W XL … +98 |
| 3 | `718f8c0130eeabf06e2e231f8bdab85ec1f4ace5.jpg` | **99** | Grenlander L-ZEAL56 215/55 R18 99W XL · Grenlander L-ZEAL56 225/40 R18 92W XL · Grenlander L-ZEAL56 235/50 R17 100W XL · Grenlander L-ZEAL56 235/55 R20 105W XL · Grenlander L-ZEAL56 245/40 ZR19 98W XL · Grenlander L-ZEAL56 245/40 ZR20 99W XL … +93 |
| 4 | `10624d41dae6b72e231aa756bd43950b753e17c7.jpg` | **94** | Tracmax X-prilivo A/S Trac Saver 165/65 R14 79T · Tracmax X-privilo A/S Trac Saver 145/70 R13 71T · Tracmax X-privilo A/S Trac Saver 145/80 R13 79T XL · Tracmax X-privilo A/S Trac Saver 155/65 R14 75T · Tracmax X-privilo A/S Trac Saver 155/80 R13 79T · Tracmax X-privilo A/S Trac Saver 165/65R 15 81H … +88 |
| 5 | `1270cd285d077f1338f2d22ef17f0fdbb657ef74.jpg` | **88** | Fronway Fronwing A/S 145/70 R13 71T · Fronway Fronwing A/S 155/65 R13 73T · Fronway Fronwing A/S 155/65 R14 75T · Fronway Fronwing A/S 155/70 R13 75T · Fronway Fronwing A/S 155/70 R19 84T · Fronway Fronwing A/S 155/80 R13 79T … +82 |
| 6 | `f8df64ac824b379657f653de1c1f61cd907e8365.jpg` | **75** | Landspider Sportraxx UHP 195/45 R16 84V XL · Landspider Sportraxx UHP 205/40 R17 84W XL · Landspider Sportraxx UHP 205/40 R18 86Y XL · Landspider Sportraxx UHP 205/45 R17 88W XL · Landspider Sportraxx UHP 205/50 R16 91W XL · Landspider Sportraxx UHP 205/50 R17 93W XL … +69 |
| 7 | `9c45793ed86c7aa50893f6423f132363e4bf41e6.jpg` | **74** | Bridgestone Blizzak 6 205/55 R16 91H · Bridgestone Blizzak 6 205/60 R16 96H XL · Bridgestone Blizzak 6 215/50 R17 95V XL · Bridgestone Blizzak 6 215/55 R17 98V XL · Bridgestone Blizzak 6 215/55 R18 99V XL · Bridgestone Blizzak 6 215/60 R17 100V XL … +68 |
| 8 | `7feecf560af4e6496c009faa9312ef6a485e53f7.jpg` | **71** | Arivo Ultra ARZ5 235/55 R18 104V XL · Arivo Ultra ARZ5 245/50 R20 105W XL · Arivo Ultra ARZ5 245/55 R19 103V · Arivo Ultra ARZ5 255/35 R20 97W XL · Arivo Ultra ARZ5 255/45 R20 105W XL · Arivo Ultra ARZ5 265/30 R19 93W XL … +65 |
| 9 | `373cf2ef8654b843eaf85c471da9ae2b38172b41.jpg` | **71** | Arivo Winmaster ProX ARW3 175/70 R13 82T · Arivo Winmaster ProX ARW3 175/70 R14 84T · Arivo Winmaster ProX ARW3 185/55 R15 82H · Arivo Winmaster ProX ARW3 195/55 R15 85H · Arivo Winmaster ProX ARW3 195/60 R15 88H · Arivo Winmaster ProX ARW3 205/45 R16 87V XL … +65 |
| 10 | `d1397e37b0c5c5c79eeeacfac10d7bbe841f29d5.jpg` | **71** | Barum Bravuris 5HM 175/65 R14 82T · Barum Bravuris 5HM 185/60R15 84H · Barum Bravuris 5HM 215/55 R17 94Y · Barum Bravuris 5HM 225/40 R18 XL · Barum Bravuris 5HM 235/50 R18 97V · Barum Bravuris 5HM 235/65 R17 108V XL … +65 |
| 11 | `87df46c82b201391579215b20ddd5bca2444faa3.jpg` | **71** | Matador Hectorra 5 195/55 R16 87V · Matador Hectorra 5 205/55 R16 91H · Matador Hectorra 5 205/60 R16 92H · Matador Hectorra 5 215/50 R17 95W XL FR · Matador Hectorra 5 215/55 R16 93V · Matador Hectorra 5 215/55 R17 98Y XL FR … +65 |
| 12 | `46cb563c4217c289c353101452a3a779305fcaed.jpg` | **71** | Habilead AW33 185/60 R15 93H · Habilead AW33 185/65 R14 96T · Habilead AW33 185/65 R15 88H · Habilead AW33 195/60 R16 89T · Habilead AW33 195/65 R15 95T · Habilead AW33 205/45 R17 88H … +65 |
| 13 | `29cbc21af5891454cd390e7d51622b76cb09d950.jpg` | **70** | Crosswind Sport Peak 195/55 R20 95H · Crosswind Sport Peak 205/45 R17 88Y · Crosswind Sport Peak 205/55 R19 97V XL · Crosswind Sport Peak 215/45 R17 91Y XL · Crosswind Sport Peak 215/50 R17 95Y XL · Crosswind Sport Peak 215/50 R18 92W … +64 |
| 14 | `ecae110ca889ea65ec5cea616e2e63a2d3527829.jpg` | **69** | Continental ContiWinterContact TS870P 215/60 R17 96H · Continental ContiWinterContact TS870P 215/65 R17 99H FR · Continental ContiWinterContact TS870P 225/60 R18 104V XL · Continental ContiWinterContact TS870P 235/55 R19 105T XL · Continental ContiWinterContact TS870P 235/65 R17 108H XL · Continental ContiWinterContact TS870P 235/65 R18 110H XL … +63 |
| 15 | `316014af54dcd04682cf1e38bcecb0828fd3b368.jpg` | **68** | Linglong Sport Master 225/55 R17 101Y XL · Linglong Sport Master 225/55 R19 103Y XL · Linglong Sport Master 245/40 R18 97Y XL · Linglong Sport Master 185/55 R15 87H XL · Linglong Sport Master 195/45 R16 84Y XL · Linglong Sport Master 195/55 R20 95H XL … +62 |
| 16 | `c33c35547d86a7c8d7e73d2d7a3a3d9075a4c401.jpg` | **67** | Kpatos FM601 155/60 R15 74T · Kpatos FM601 155/70 R14 77T · Kpatos FM601 155/80 R13 79T · Kpatos FM601 165/60 R15 88H XL · Kpatos FM601 165/70 R13 79T · Kpatos FM601 175/55 R15 77T … +61 |
| 17 | `b37f9978b7f9a44229eb47ec439343aa2b4212d5.jpg` | **67** | Zmax Zealion 205/50 R17 93W XL · Zmax Zealion 205/55 R16 94W XL · Zmax Zealion 205/55 R17 95W XL · Zmax Zealion 205/55 R19 97W XL · Zmax Zealion 215/45 R17 91W XL · Zmax Zealion 215/50 R17 95W XL … +61 |
| 18 | `5a2f58f0ea9e8c1c41e9ef15040c88008d512413.jpg` | **65** | Hankook Winter i*Cept evo 3 X W330A 225/65 R17 102H · Hankook Winter i*Cept evo 3 X W330A 235/50 R20 104W XL · Hankook Winter i*Cept evo 3 X W330A 235/60 R18 107H XL · Hankook Winter i*Cept evo 3 X W330A 265/40 R21 105V TL XL · Hankook Winter i*Cept Evo 3 X W330A 265/50 R20 111V XL · Hankook Winter i*Cept evo 3 X W330A 275/45 R21 110V XL … +59 |
| 19 | `805103a190ea7250271c88e628d3fda8bd370d2d.jpg` | **64** | Uniroyal RainSport 5 195/55 R20 95H XL FR · Uniroyal RainSport 5 205/55 R16 91H · Uniroyal RainSport 5 215/55 R17 94V FR · Uniroyal RainSport 5 215/55 R18 99V XL FR · Uniroyal RainSport 5 225/55 R19 99V FR · Uniroyal RainSport 5 235/50 R18 97V FR … +58 |
| 20 | `5f5ea0a01a0a8a17aa1ab839f4e1dcc3109ba662.jpg` | **62** | Nexen WinGuard Sport 2 195/65 R15 91H · Nexen Winguard Sport 2 205/45 R17 88V · Nexen WinGuard Sport 2 205/55 R17 95V · Nexen WinGuard Sport 2 215/40 R17 87V · Nexen WinGuard Sport 2 215/40 R18 89V · Nexen WinGuard Sport 2 215/45 R17 91V … +56 |

**Nume de fișier descriptive** (statistică, nu erori)

| | |
|---|---|
| Imagini cu nume descriptiv (nu pur numeric) | **37** (0.25%) |
| … din care conțin o dimensiune | **3** |
| … din care dimensiunea diferă de titlu | **2** |

Fotografiile de anvelope sunt per **model**, nu per SKU — o dimensiune diferită în numele fișierului **nu** e un defect de date.

**Erori reale: numele fișierului indică alt brand decât produsul**

Niciuna ✅ — niciun fișier nu poartă numele unui brand diferit de cel al produsului.

### 7b.5 Produse similare din sursă (C.3)

| | |
|---|---|
| Produse cu recomandări legacy | **10480** (69.82%) |
| Total relații | **35070** |
| Medie per produs cu relații | 3.3 |
| Slug-uri recomandate **nerezolvabile** | **0**  |

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

Produse cu slug RU diferit de cel RO: **13502** din 15010 (89.95%).
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
 "slug": "accelera-651-sport-195-50-r16-84w",
 "slug_ru": "accelera-651-sport-19550-r16-84w",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/accelera-651-sport-195-50-r16-84w",
  "product_id": "126222",
  "canonical": "https://anvelope-ungheni.md/accelera-651-sport-195-50-r16-84w",
  "title": "Accelera 651 Sport 195/50 R16 84W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/accelera",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 320 MDL",
  "price": 1320,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "Vara",
  "season": "vara",
  "size_system": "metric",
  "width": 195,
  "aspect": 50,
  "diameter": "R16",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "195/50 R16",
  "size_source": "attribute",
  "load_index": "84",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Dimensiune": "195/50 R16",
   "Sezon": "Vara",
   "Indice de sarcina": "84",
   "Indice de viteza": "W"
  },
  "images": [
   "/image/catalog/product/2351375.jpg"
  ],
  "related_slugs": [
   "accelera-651-sport-225-40-r18-88w",
   "accelera-651-sport-20550-r15-90v",
   "accelera-651-sport-235-35-r19-91w",
   "accelera-651-sport-245-40-r17-95w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 195/50 R16 84W - cumpara in Ungheni",
  "meta_description": "Anvelope Accelera 651 Sport 195/50 R16 84W - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Accelera 651 Sport 195/50 R16 84W"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/",
  "product_id": "126222",
  "canonical": "https://anvelope-ungheni.md/ru/accelera-651-sport-19550-r16-84w",
  "title": "Accelera 651 Sport 195/50 R16 84W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/ru/accelera",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 320 MDL",
  "price": 1320,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Лето",
  "season": "vara",
  "size_system": "metric",
  "width": 195,
  "aspect": 50,
  "diameter": "R16",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "195/50 R16",
  "size_source": "attribute",
  "load_index": "84",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Размер": "195/50 R16",
   "Сезон": "Лето",
   "Индекс нагрузки": "84",
   "Индекс скорости": "W"
  },
  "images": [
   "/image/catalog/product/2351375.jpg"
  ],
  "related_slugs": [
   "accelera-651-sport-22540-r18-88w",
   "accelera-651-sport-20550-r15-90v",
   "accelera-651-sport-23535-r19-91w",
   "accelera-651-sport-24540-r17-95w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 195/50 R16 84W - купить в Унгенах",
  "meta_description": "Шины Accelera 651 Sport 195/50 R16 84W - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Accelera 651 Sport 195/50 R16 84W"
  ],
  "lang": "ru"
 },
 "crawled_at": null,
 "reparsed_at": "2026-08-22T21:20:23.768Z"
}
```

```json
{
 "slug": "accelera-651-sport-20550-r15-90v",
 "slug_ru": "accelera-651-sport-20550-r15-90v",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/accelera-651-sport-20550-r15-90v",
  "product_id": "125013",
  "canonical": "https://anvelope-ungheni.md/accelera-651-sport-20550-r15-90v",
  "title": "Accelera 651 Sport 205/50 R15 90V",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/accelera",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 280 MDL",
  "price": 1280,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "Vara",
  "season": "vara",
  "size_system": "metric",
  "width": 205,
  "aspect": 50,
  "diameter": "R15",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "205/50 R15",
  "size_source": "attribute",
  "load_index": "90",
  "speed_index": "V",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Dimensiune": "205/50 R15",
   "Sezon": "Vara",
   "Indice de sarcina": "90",
   "Indice de viteza": "V"
  },
  "images": [
   "/image/catalog/product/2346503.jpg"
  ],
  "related_slugs": [
   "accelera-651-sport-225-40-r18-88w",
   "accelera-651-sport-235-35-r19-91w",
   "accelera-651-sport-245-40-r17-95w",
   "accelera-651-sport-255-35-r18-94w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 205/50 R15 90V - cumpara in Ungheni",
  "meta_description": "Anvelope Accelera 651 Sport 205/50 R15 90V - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Accelera 651 Sport 205/50 R15 90V"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/",
  "product_id": "125013",
  "canonical": "https://anvelope-ungheni.md/ru/accelera-651-sport-20550-r15-90v",
  "title": "Accelera 651 Sport 205/50 R15 90V",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/ru/accelera",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 280 MDL",
  "price": 1280,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Лето",
  "season": "vara",
  "size_system": "metric",
  "width": 205,
  "aspect": 50,
  "diameter": "R15",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "205/50 R15",
  "size_source": "attribute",
  "load_index": "90",
  "speed_index": "V",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Размер": "205/50 R15",
   "Сезон": "Лето",
   "Индекс нагрузки": "90",
   "Индекс скорости": "V"
  },
  "images": [
   "/image/catalog/product/2346503.jpg"
  ],
  "related_slugs": [
   "accelera-651-sport-22540-r18-88w",
   "accelera-651-sport-23535-r19-91w",
   "accelera-651-sport-24540-r17-95w",
   "accelera-651-sport-25535-r18-94w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 205/50 R15 90V - купить в Унгенах",
  "meta_description": "Шины Accelera 651 Sport 205/50 R15 90V - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Accelera 651 Sport 205/50 R15 90V"
  ],
  "lang": "ru"
 },
 "crawled_at": null,
 "reparsed_at": "2026-08-22T21:20:23.771Z"
}
```

```json
{
 "slug": "accelera-651-sport-21545-r17-87w",
 "slug_ru": "accelera-651-sport-21545-r17-87w",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/accelera-651-sport-21545-r17-87w",
  "product_id": "121427",
  "canonical": "https://anvelope-ungheni.md/accelera-651-sport-21545-r17-87w",
  "title": "Accelera 651 Sport 215/45 R17 87W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/accelera",
  "badge": "Credit 0% | 6 luni",
  "price_raw": null,
  "price": null,
  "old_price": null,
  "stock_raw": "Stoc epuizat",
  "stock_status": "out_of_stock",
  "season_raw": "Vara",
  "season": "vara",
  "size_system": "metric",
  "width": 215,
  "aspect": 45,
  "diameter": "R17",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "215/45 R17",
  "size_source": "attribute",
  "load_index": "87",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Dimensiune": "215/45 R17",
   "Sezon": "Vara",
   "Indice de sarcina": "87",
   "Indice de viteza": "W",
   "Producator": "ACCELERA"
  },
  "images": [
   "/image/catalog/product/1935649.jpg"
  ],
  "related_slugs": [
   "anvelope-accelera-651-sport-255-40-r17-98w",
   "accelera-651-sport-225-40-r18-88w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 215/45 R17 87W - cumpara in Ungheni",
  "meta_description": "Anvelope Accelera 651 Sport 215/45 R17 87W - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Accelera 651 Sport 215/45 R17 87W"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/",
  "product_id": "121427",
  "canonical": "https://anvelope-ungheni.md/ru/accelera-651-sport-21545-r17-87w",
  "title": "Accelera 651 Sport 215/45 R17 87W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/ru/accelera",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": null,
  "price": null,
  "old_price": null,
  "stock_raw": "Нет в наличии",
  "stock_status": "out_of_stock",
  "season_raw": "Лето",
  "season": "vara",
  "size_system": "metric",
  "width": 215,
  "aspect": 45,
  "diameter": "R17",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "215/45 R17",
  "size_source": "attribute",
  "load_index": "87",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Размер": "215/45 R17",
   "Сезон": "Лето",
   "Индекс нагрузки": "87",
   "Индекс скорости": "W",
   "Производитель": "ACCELERA"
  },
  "images": [
   "/image/catalog/product/1935649.jpg"
  ],
  "related_slugs": [
   "shina-accelera-651-sport-25540-r17-98w",
   "accelera-651-sport-22540-r18-88w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 215/45 R17 87W - купить в Унгенах",
  "meta_description": "Шины Accelera 651 Sport 215/45 R17 87W - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Accelera 651 Sport 215/45 R17 87W"
  ],
  "lang": "ru"
 },
 "crawled_at": null,
 "reparsed_at": "2026-08-22T21:20:23.772Z"
}
```

```json
{
 "slug": "accelera-651-sport-225-40-r18-88w",
 "slug_ru": "accelera-651-sport-22540-r18-88w",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/accelera-651-sport-225-40-r18-88w",
  "product_id": "121198",
  "canonical": "https://anvelope-ungheni.md/accelera-651-sport-225-40-r18-88w",
  "title": "Accelera 651 Sport 225/40 R18 88W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/accelera",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 490 MDL",
  "price": 1490,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "Vara",
  "season": "vara",
  "size_system": "metric",
  "width": 225,
  "aspect": 40,
  "diameter": "R18",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "225/40 R18",
  "size_source": "attribute",
  "load_index": "88",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Dimensiune": "225/40 R18",
   "Sezon": "Vara",
   "Indice de sarcina": "88",
   "Indice de viteza": "W",
   "Producator": "ACCELERA"
  },
  "images": [
   "/image/catalog/product/1935650.jpg"
  ],
  "related_slugs": [
   "anvelope-accelera-651-sport-255-40-r17-98w",
   "accelera-651-sport-225-45-r17-91w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 225/40 R18 88W - cumpara in Ungheni",
  "meta_description": "Anvelope Accelera 651 Sport 225/40 R18 88W - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Accelera 651 Sport 225/40 R18 88W"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/",
  "product_id": "121198",
  "canonical": "https://anvelope-ungheni.md/ru/accelera-651-sport-22540-r18-88w",
  "title": "Accelera 651 Sport 225/40 R18 88W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/ru/accelera",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 490 MDL",
  "price": 1490,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Лето",
  "season": "vara",
  "size_system": "metric",
  "width": 225,
  "aspect": 40,
  "diameter": "R18",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "225/40 R18",
  "size_source": "attribute",
  "load_index": "88",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Размер": "225/40 R18",
   "Сезон": "Лето",
   "Индекс нагрузки": "88",
   "Индекс скорости": "W",
   "Производитель": "ACCELERA"
  },
  "images": [
   "/image/catalog/product/1935650.jpg"
  ],
  "related_slugs": [
   "shina-accelera-651-sport-25540-r17-98w",
   "accelera-651-sport-22545-r17-91w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 225/40 R18 88W - купить в Унгенах",
  "meta_description": "Шины Accelera 651 Sport 225/40 R18 88W - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Accelera 651 Sport 225/40 R18 88W"
  ],
  "lang": "ru"
 },
 "crawled_at": null,
 "reparsed_at": "2026-08-22T21:20:23.775Z"
}
```

```json
{
 "slug": "accelera-651-sport-225-45-r17-91w",
 "slug_ru": "accelera-651-sport-22545-r17-91w",
 "ro": {
  "source_url": "https://anvelope-ungheni.md/accelera-651-sport-225-45-r17-91w",
  "product_id": "121199",
  "canonical": "https://anvelope-ungheni.md/accelera-651-sport-225-45-r17-91w",
  "title": "Accelera 651 Sport 225/45 R17 91W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/accelera",
  "badge": "Credit 0% | 6 luni",
  "price_raw": "1 415 MDL",
  "price": 1415,
  "old_price": null,
  "stock_raw": "Stoc furnizor",
  "stock_status": "supplier",
  "season_raw": "Vara",
  "season": "vara",
  "size_system": "metric",
  "width": 225,
  "aspect": 45,
  "diameter": "R17",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "225/45 R17",
  "size_source": "attribute",
  "load_index": "91",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Dimensiune": "225/45 R17",
   "Sezon": "Vara",
   "Indice de sarcina": "91",
   "Indice de viteza": "W",
   "Producator": "ACCELERA"
  },
  "images": [
   "/image/catalog/product/1935651.jpg"
  ],
  "related_slugs": [
   "anvelope-accelera-651-sport-255-40-r17-98w",
   "accelera-651-sport-225-40-r18-88w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 225/45 R17 91W - cumpara in Ungheni",
  "meta_description": "Anvelope Accelera 651 Sport 225/45 R17 91W - cele mai mici preturi din Ungheni. ✔️Livrare ✔️Garantie ❂Oferim servicii de montare ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Acasă",
   "Anvelope",
   "Accelera 651 Sport 225/45 R17 91W"
  ],
  "lang": "ro"
 },
 "ru": {
  "source_url": "https://anvelope-ungheni.md/ru/",
  "product_id": "121199",
  "canonical": "https://anvelope-ungheni.md/ru/accelera-651-sport-22545-r17-91w",
  "title": "Accelera 651 Sport 225/45 R17 91W",
  "brand": "ACCELERA",
  "brand_url": "https://anvelope-ungheni.md/ru/accelera",
  "badge": "Кредит 0% | 6 мес.",
  "price_raw": "1 415 MDL",
  "price": 1415,
  "old_price": null,
  "stock_raw": "В наличии",
  "stock_status": "in_stock",
  "season_raw": "Лето",
  "season": "vara",
  "size_system": "metric",
  "width": 225,
  "aspect": 45,
  "diameter": "R17",
  "overall_diameter_in": null,
  "section_width_in": null,
  "size_raw": "225/45 R17",
  "size_source": "attribute",
  "load_index": "91",
  "speed_index": "W",
  "is_xl": false,
  "is_runflat": false,
  "is_studded": false,
  "is_commercial": false,
  "attributes": {
   "Размер": "225/45 R17",
   "Сезон": "Лето",
   "Индекс нагрузки": "91",
   "Индекс скорости": "W",
   "Производитель": "ACCELERA"
  },
  "images": [
   "/image/catalog/product/1935651.jpg"
  ],
  "related_slugs": [
   "shina-accelera-651-sport-25540-r17-98w",
   "accelera-651-sport-22540-r18-88w"
  ],
  "description_html": null,
  "meta_title": "Accelera 651 Sport 225/45 R17 91W - купить в Унгенах",
  "meta_description": "Шины Accelera 651 Sport 225/45 R17 91W - лучшие цены в Унгены ✔️Доставка ✔️Гарантия ❂Предоставляем шиномонтаж ☎-068-263-644",
  "reviews_count": 0,
  "category": "anvelope",
  "breadcrumbs": [
   "Главная",
   "Шины",
   "Accelera 651 Sport 225/45 R17 91W"
  ],
  "lang": "ru"
 },
 "crawled_at": null,
 "reparsed_at": "2026-08-22T21:20:23.777Z"
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
| 1 | ACCELERA | `accelera` | 118 | 118 |
| 2 | Achilles | `achilles` | 1 | 1 |
| 3 | Anchee | `anchee` | 6 | 6 |
| 4 | Annaite | `annaite` | 32 | 32 |
| 5 | Aoteli | `aoteli` | 1 | 1 |
| 6 | Aplus | `aplus` | 204 | 204 |
| 7 | Aptany | `aptany` | 3 | 3 |
| 8 | Ardent | `ardent` | 1 | 1 |
| 9 | Arivo | `arivo` | 331 | 331 |
| 10 | Atlas | `atlas` | 2 | 2 |
| 11 | Atturo | `atturo` | 3 | 3 |
| 12 | Austone | `austone` | 6 | 6 |
| 13 | Avon | `avon` | 25 | 25 |
| 14 | Barum | `barum` | 166 | 166 |
| 15 | Bearway | `bearway` | 2 | 2 |
| 16 | BELSHINA | `belshina` | 1 | 1 |
| 17 | BFGoodrich | `bfgoodrich` | 23 | 23 |
| 18 | Brics | `brics` | 1 | 1 |
| 19 | Bridgestone | `bridgestone` | 237 | 237 |
| 20 | Ceat | `ceat` | 70 | 70 |
| 21 | Centara | `centara` | 146 | 146 |
| 22 | Charmhoo | `charmhoo` | 32 | 32 |
| 23 | Comfoser | `comfoser` | 38 | 38 |
| 24 | Compasal | `compasal` | 8 | 8 |
| 25 | Continental | `continental` | 410 | 410 |
| 26 | Cooper | `cooper` | 66 | 66 |
| 27 | Crosswind | `crosswind` | 220 | 220 |
| 28 | Davanti | `davanti` | 100 | 100 |
| 29 | Debica | `debica` | 61 | 61 |
| 30 | Delinte | `delinte` | 1 | 1 |
| 31 | Diplomat | `diplomat` | 12 | 12 |
| 32 | Doublestar | `doublestar` | 2 | 2 |
| 33 | Dovroad | `dovroad` | 2 | 2 |
| 34 | Dunlop | `dunlop` | 112 | 112 |
| 35 | Duraturn | `duraturn` | 73 | 73 |
| 36 | Falken | `falken` | 30 | 30 |
| 37 | Federal | `federal` | 1 | 1 |
| 38 | Firemax | `firemax` | 159 | 159 |
| 39 | Firestone | `firestone` | 16 | 16 |
| 40 | Fortuna | `fortuna` | 5 | 5 |
| 41 | Fortune | `fortune` | 132 | 132 |
| 42 | Fronway | `fronway` | 271 | 271 |
| 43 | Fulda | `fulda` | 55 | 55 |
| 44 | Gislaved | `gislaved` | 17 | 17 |
| 45 | GiTi | `giti` | 5 | 5 |
| 46 | Goodride-WestLake | `goodride-westlake` | 1 | 1 |
| 47 | Goodyear | `goodyear` | 399 | 399 |
| 48 | Greentrac | `greentrac` | 15 | 15 |
| 49 | Grenlander | `grenlander` | 456 | 456 |
| 50 | Gripmax | `gripmax` | 17 | 17 |
| 51 | GT Radial | `gt-radial` | 99 | 99 |
| 52 | Habilead | `habilead` | 152 | 152 |
| 53 | Haida | `haida` | 278 | 278 |
| 54 | Hankook | `hankook` | 635 | 635 |
| 55 | Hilo | `hilo` | 177 | 177 |
| 56 | ILINK | `ilink` | 91 | 91 |
| 57 | Imperial | `imperial` | 9 | 9 |
| 58 | Joyroad | `joyroad` | 328 | 328 |
| 59 | Kapsen | `kapsen` | 197 | 197 |
| 60 | Kelly | `kelly` | 21 | 21 |
| 61 | Kinforest | `kinforest` | 13 | 13 |
| 62 | Kleber | `kleber` | 127 | 127 |
| 63 | Kormoran | `kormoran` | 18 | 0 |
| 64 | Kpatos | `kpatos` | 126 | 126 |
| 65 | Kumho | `kumho` | 357 | 357 |
| 66 | Kustone | `kustone` | 14 | 14 |
| 67 | Landspider | `landspider` | 200 | 200 |
| 68 | Lanvigator | `lanvigator` | 102 | 102 |
| 69 | Lassa | `lassa` | 365 | 365 |
| 70 | Laufenn | `laufenn` | 107 | 107 |
| 71 | Leao | `leao` | 113 | 113 |
| 72 | LingLong | `linglong` | 486 | 486 |
| 73 | Marshal | `marshal` | 36 | 36 |
| 74 | Matador | `matador` | 173 | 173 |
| 75 | Maxxis | `maxxis` | 358 | 358 |
| 76 | Michelin | `michelin` | 483 | 484 |
| 77 | Mileking | `mileking` | 34 | 34 |
| 78 | Minerva | `minerva` | 18 | 18 |
| 79 | Motrio | `motrio` | 8 | 8 |
| 80 | Nankang | `nankang` | 66 | 66 |
| 81 | Neolin | `neolin` | 20 | 20 |
| 82 | Nereus | `nereus` | 60 | 60 |
| 83 | Nexen | `nexen` | 624 | 624 |
| 84 | Nokian | `nokian` | 39 | 39 |
| 85 | Nordexx | `nordexx` | 69 | 69 |
| 86 | ONYX | `onyx` | 27 | 27 |
| 87 | Orium | `orium` | 4 | 0 |
| 88 | Otani | `otani` | 108 | 108 |
| 89 | Ovation | `ovation` | 114 | 114 |
| 90 | Petlas | `petlas` | 348 | 348 |
| 91 | Pirelli | `pirelli` | 207 | 207 |
| 92 | Platin | `platin` | 273 | 273 |
| 93 | Point S | `point-s` | 94 | 94 |
| 94 | POWERTRAC | `powertrac` | 1 | 1 |
| 95 | Premiorri | `premiorri` | 1 | 1 |
| 96 | Prinx | `prinx` | 59 | 59 |
| 97 | Rapid | `rapid` | 2 | 2 |
| 98 | Riken | `riken` | 149 | 149 |
| 99 | Roadboss | `roadboss` | 4 | 4 |
| 100 | Roadstone | `roadstone` | 51 | 51 |
| 101 | Roadx | `roadx` | 302 | 302 |
| 102 | Rockblade | `rockblade` | 35 | 35 |
| 103 | Rosava | `rosava` | 166 | 166 |
| 104 | Rotex | `rotex` | 19 | 19 |
| 105 | Rovelo | `rovelo` | 73 | 73 |
| 106 | Royal Black | `royal-black` | 22 | 22 |
| 107 | Rydanz | `rydanz` | 60 | 60 |
| 108 | Sailun | `sailun` | 284 | 284 |
| 109 | Sava | `sava` | 27 | 27 |
| 110 | Semperit | `semperit` | 13 | 13 |
| 111 | Starmaxx | `starmaxx` | 154 | 154 |
| 112 | Strial | `strial` | 1 | 1 |
| 113 | Sunny | `sunny` | 98 | 98 |
| 114 | Superia | `superia` | 40 | 40 |
| 115 | Three-A | `three-a` | 11 | 11 |
| 116 | Tigar | `tigar` | 84 | 84 |
| 117 | Toledo | `toledo` | 2 | 2 |
| 118 | Torque | `torque` | 243 | 243 |
| 119 | Tourador | `tourador` | 128 | 128 |
| 120 | Toyo | `toyo` | 7 | 7 |
| 121 | TRACMAX | `tracmax` | 713 | 713 |
| 122 | TRIANGLE | `triangle` | 200 | 200 |
| 123 | TRISTAR | `tristar` | 42 | 42 |
| 124 | Unigrip | `unigrip` | 10 | 10 |
| 125 | Uniroyal | `uniroyal` | 114 | 114 |
| 126 | Viking | `viking` | 93 | 93 |
| 127 | Voyager | `voyager` | 4 | 4 |
| 128 | Vredestein | `vredestein` | 191 | 191 |
| 129 | Waterfall | `waterfall` | 9 | 9 |
| 130 | West Lake | `west-lake` | 4 | 4 |
| 131 | Westlake | `westlake` | 22 | 22 |
| 132 | Yokohama | `yokohama` | 201 | 201 |
| 133 | ZETA | `zeta` | 7 | 7 |
| 134 | Zmax | `zmax` | 86 | 86 |
