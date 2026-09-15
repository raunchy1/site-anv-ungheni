# Faza 1 — recunoaștere, cei cinci furnizori

Data: 16 septembrie 2026. Nimic nu s-a scris: nici în Supabase, nici pe disc în
afara acestui fișier. Toate cererile au mers pe un singur fir, cu pauze de 1,5–3
secunde și cu User-Agent-ul care spune cine suntem și pe cine să sune.

Permisiunea a fost confirmată de atelier pentru toți cinci înainte de prima
cerere. Niciunul n-a dat listă de prețuri electronică — de aceea ce urmează.

---

## Răspunsul scurt

| Furnizor | Se poate citi? | Anvelope | Date | Efort |
|---|---|---|---|---|
| **pneu.md** | **da — API JSON** | **7.260** | complete | **~2 zile** |
| **agropiese.md** | da — `ld+json` + tabel | 1.436 în perimetru | bune, fără XL | ~4 zile |
| **autoplanet.md** | da — doar HTML | 243 în perimetru | sărace, doar titlul | ~3 zile |
| **autotyres.md** | **nu — 403 pe tot** | ? | ? | blocat |
| **trisauto.md** | **nu — provocare JS** | ? | ? | blocat |

**Întrebarea care conta:** niciunul n-are listă de prețuri pentru revânzători,
dar **pneu.md are ceva mai bun** — un API JSON care întoarce tot catalogul,
7.260 de anvelope cu toate câmpurile, într-o singură cerere. Pentru el nu se
scrie parser, se scrie o potrivire de câmpuri. Din cele cinci lucrări, aia e
cea mai ieftină și cea mai mare.

**Doi din cinci nu se pot citi deloc** fără ca ei să ne lase. Nu e ceva ce
rezolvăm noi din cod — e un telefon de dat.

---

## 1. pneu.md — cel mai bun dintre cinci, de departe

**`robots.txt`:** trei rânduri. `Disallow: /login`, `Disallow: /admin/*`.
Nimic altceva interzis, niciun `Sitemap:` declarat.

**Feed:** `/sitemap.xml` există (582 adrese) dar **nu conține niciun produs** —
doar 569 de pagini de căutare pe dimensiuni, 9 mărci, 4 oferte. Inutil pentru
enumerare.

**Randat cu JavaScript: complet.** Angular, fără randare pe server. Orice adresă
de pe site întoarce exact același HTML de 78 KB — pagina goală a aplicației.
Parsarea HTML e imposibilă, nu grea: **nu există HTML de parsat**.

**Dar nu contează**, pentru că au un API. Pachetul lor `main.js` îl declară
deschis: `wo_baseUrl`, un serviciu pe Heroku, cu rutele `/tires`,
`/tires/stock`, `/tires/dimensions/{width,height,diameter}`, `/api/products`,
`/api/sensors` — și senzori vindem și noi.

O singură cerere `GET /tires` întoarce **tot catalogul**: 10 MB de JSON,
7.260 de anvelope. Fără paginare, fără autentificare, fără cheie.

Câmpuri, pe fiecare rând, deja separate — nimic de ghicit din titluri:

```
brand · model · width · height · diameter · loadIndex · speedIndex
season (SUMMER/WINTER/ALL SEASONS) · price · eanCode · productCode
fuelEfficiency · wetGrip · noiseEmissions · productImages · stock
```

Acoperirea, măsurată pe toate cele 7.260:

- preț > 0: **7.260 / 7.260**
- indice sarcină **și** viteză: **7.238 / 7.260** (99,7%)
- cel puțin o poză: 5.361 (74%)
- sezon: curat, 3.442 vară · 2.660 iarnă · 1.158 all-season

**Două capcane:**

1. `isInStock` e `true` pe toate cele 7.260 de rânduri — nu e un semnal de stoc.
   Stocul adevărat e în `stock` și `invoiceStock` (prima anvelopă din listă are
   `stock: 0`, `invoiceStock: 4`, `isInStock: true`). Dacă luăm `isInStock` de
   bun, promitem livrare pe tot catalogul lor. **Se folosește `stock`.**
2. Parametrii `?page=` și `?limit=` sunt ignorați — cere tot, de fiecare dată.
   10 MB per rulare, o dată pe zi, e acceptabil; de 50 de ori pe zi, nu.

### ⚠️ Ceva ce trebuie să-i sune cineva să le spună

API-ul e deschis fără nicio autentificare și **fiecare rând conține
`primeCost` — prețul lor de achiziție**, plus `discount` și `transferLimit`.
Adică: oricine de pe internet, inclusiv concurenții lor, poate descărca în 30
de secunde cât plătește pneu.md pe fiecare anvelopă din stoc.

Nu e ceva ce exploatăm și nu e ceva ce ținem pentru noi. **Sună-i.** Doi pași,
în ordinea asta:

1. spune-le ce e expus, ca să închidă ce vor să închidă;
2. cere-le în scris dreptul de a folosi API-ul pentru sincronizare — și, dacă
   tot îl securizează, o cheie pentru noi.

Până primim răspunsul, nu importăm din el. Faptul că o ușă e deschisă nu e o
invitație, iar plecăm de la premisa că `primeCost` n-a fost pus acolo intenționat.

**Efort:** `config.mjs` + `json-source.mjs` + `import.mjs`, în jur de **300 de
linii** față de cele ~1.200 de la pneuexpert. Nu există parser de HTML, nu
există enumerare, nu există reconstruit titluri — doar potrivirea câmpurilor
lor pe ale noastre și `XL` scos din `invoiceName`. **~2 zile.**

### Suprapunerea cu ce avem deja — măsurată, nu presupusă

Aici se răstoarnă ipoteza proprietarului. Din cele **39 de mărci** ale lor,
**34 le avem deja**. Nu ne aduc mărci noi decât 5, cu 11 anvelope cu totul
(Goodrich, BF Goodrich, Sunfull, General Tire, ESA Tecar).

Suprapunerea pe cheia naturală, din 7.019 chei distincte ale lor:

| Măsură | Comune | Procent |
|---|---|---|
| marcă + model + dimensiune + indici + XL | **1.685** | 24% |
| marcă + dimensiune + indici + XL (fără model) | **3.392** | 48% |

Adevărul e între ele: **aproximativ jumătate din pneu.md o avem deja**. Cifra
strictă e o limită de jos, pentru că numele lor de model („WP-52") și ale
noastre („Winter Craft WP52") se scriu altfel și nu se potrivesc literal.

Deci: **~3.500–5.500 de produse noi**, nu 7.260. Dedublarea nu contează puțin —
contează pe jumătate din import.

---

## 2. agropiese.md — se poate, curat, dar anvelopele sunt o firimitură

**`robots.txt`:** lung și bine făcut, Laravel în spatele Cloudflare. `User-agent: *`
primește `Allow: /`. Interzice login, coș, plată, căutare, `/api/`, și — atenție —
**toate adresele cu parametri, în afară de `?page=`** (`Disallow: /*?*`,
`Allow: /*?page=`). Interzice și navigarea pe fațete (`/catalog/*/brand-`,
`/catalog/*/latimea-` etc.), ceea ce e în regulă: noi mergem pe sitemap.

Două lucruri de spus cinstit:

- robots-ul conține `User-agent: ClaudeBot → Disallow: /`, alături de GPTBot,
  CCBot și restul. Sunt reguli pentru crawlerele de antrenament AI. Botul
  nostru nu e niciunul dintre ele — e un bot de sincronizare al unui partener
  comercial, iar regula care i se aplică e `*`, adică `Allow: /`. Semnalul
  `Content-Signal: ai-train=no` îl respectăm: nu antrenăm nimic, importăm un
  catalog. Am spus-o aici ca să fie scrisă, nu ca să fie trecută cu vederea.
- **`Disallow: /*?*` e o regulă pe care trebuie s-o respecte codul**, nu doar
  raportul. Nicio cerere cu query string, în afară de `?page=`.

**Feed:** `Sitemap: https://agropiese.md/sitemap.xml`, un index cu 7 fișiere.
`sitemap_products.xml` se desface în trei, împreună **46.884 de produse**.

Din ele, catalogul de anvelope (`/catalog/anvelope-5/`) are **1.842**, împărțit așa:

| | |
|---|---|
| autoturisme | 907 |
| SUV | 450 |
| microbuse | 79 |
| **în perimetru (autoturisme + autoutilitare)** | **1.436** |
| camioane | 79 |
| tehnică agricolă | 187 |
| industriale | 18 |
| camere · jante | 70 · 52 |

Restul celor 46.884 sunt piese de schimb pentru camioane și tractoare — nu ne
privesc. Enumerarea e ieftină tocmai pentru că sitemap-ul e complet: filtrăm pe
prefixul de categorie și rămânem cu 1.436 de adrese, fără să atingem nicio
pagină de listare.

**Date structurate: da.** Fiecare fișă are `application/ld+json` tip `Product`,
valid, cu `name`, `brand`, `model`, `sku`, `mpn`, `image` și `offers`
(`price`, `priceCurrency: MDL`, `availability`). Pe 40 de fișe verificate,
**completate 40/40**, toate `InStock`.

Peste ld+json există un tabel „Specificații" în HTML, verificat pe 20 de fișe:

| Câmp | Acoperire |
|---|---|
| Lățime | 20/20 |
| Înălțime | 19/20 |
| Sezon (Vară/Iarnă/Universal) | 20/20 |
| Index viteză | 20/20 |
| Index încărcare | 20/20 |
| Cod marfă (al lor) | 20/20 |

**Ce lipsește, și de ce contează:** diametrul nu e în tabel — dar e în nume
(„Anvelopa 225/55 R17 (PS 71) Kumho"), unde se citește sigur. Ce chiar
lipsește e **XL și runflat**: nicăieri, nici în tabel, nici în nume. Cheia
noastră naturală le cere. Fără ele, o anvelopă XL de la ei se potrivește peste
una non-XL de la noi, sau invers — exact genul de contopire greșită împotriva
căreia e făcută cheia.

Nu e blocant, dar e o decizie de luat: ori le tratăm pe toate ca non-XL și
acceptăm câteva potriviri greșite, ori le lăsăm în carantină până confirmă
cineva. Recomandarea mea: **carantină**, cu un raport de mână, așa cum s-a
făcut la „model lipsă" la pneuexpert.

**Randat cu JavaScript:** fișele de produs, **nu** — HTML complet, ld+json în
sursă. Paginile de listare, **da** — produsele nu sunt în HTML. Nu contează,
pentru că enumerarea merge pe sitemap.

**Efort:** tiparul pneuexpert exact, cu partea grea deja rezolvată de ld+json.
Enumerare simplă (filtrare de sitemap, fără paginare), parser mixt (ld+json +
tabel), plus regula pentru XL. În jur de **700 de linii**, **~4 zile**.

**Suprapunere:** pe eșantionul de 40, mărcile sunt Lassa, Michelin, Goodyear,
Kapsen, Nokian, Kumho, Tigar, Sunny, Cooper, Rosava — **toate le avem deja, în
afară de Rosava**. Ipoteza „fiecare are alte mărci" nu ține nici aici.

---

## 3. autoplanet.md — se poate, dar merită discutat dacă merită

**`robots.txt`:** 200 OK, Joomla cu VirtueMart. Interzice directoarele
administrative și paginile de rezultate de filtrare (`/catalog/results`,
`/catalog?`, `/ro/catalog?`, `.../results`). **Paginile de produs și listările
de categorie sunt permise** — `?limitstart=` nu cade sub niciuna dintre reguli,
pentru că regulile lor de query sunt ancorate pe `/catalog?`, nu pe
`/catalog/shiny/legkovye?`.

**Feed:** declară două sitemap-uri xmap (ro și ru). **Practic inutile:** 48 de
adrese cu totul, adică paginile de categorie plus vreo 11 produse recente.
Enumerarea trebuie făcută prin listarea paginată.

**Enumerarea — și capcana, aceeași ca la pneuexpert.** 12 produse pe pagină,
`?limitstart=` din 12 în 12. Peste ultima pagină **nu vine nici 404, nici
pagină goală**: vine tot 200 OK, cu 12 produse. `limitstart=192`, `=396`,
`=2400` — toate întorc același set. Regula de oprire e din nou **„setul se
repetă"**, nimic altceva. Am parcurs-o până la capăt:

| Categorie | Anvelope |
|---|---|
| autoturisme (`legkovye`) | **191** |
| autoutilitare (`legko-gruzovye`) | **52** |
| **în perimetru** | **243** |
| camioane | 23 |
| agricole · industriale | 4 · 1 |

Tot catalogul lor de anvelope e **271**. În perimetrul cerut, **243**.

**Date structurate: niciuna.** Zero `ld+json`, zero microdate, zero `itemprop`.
Fișa de produs are 46 KB și conține trei lucruri utile: titlul, prețul și
categoria.

Singura veste bună e că **titlul e deja în convenția noastră**:
„ZMAX Winter Hawke 1 175/65R15 84T" — marcă, model, dimensiune, indici, în
ordinea în care `parseTitle` le citește. Nu trebuie reconstruit ca la pneuexpert.

Ce se poate citi, și ce nu:

| Câmp | De unde |
|---|---|
| marcă, model, lățime, înălțime, diametru, indici | din titlu |
| preț | din HTML („795 MDL") |
| poză | din pagina de listare, nu din fișă |
| **sezon** | **nicăieri** — se deduce din numele modelului („Winter Hawke") |
| **XL, runflat** | **nicăieri** |
| **disponibilitate** | **nicăieri** — nu scriu dacă e pe stoc |

Poza e una singură pe model, nu pe dimensiune (`FIREMAXFM805.jpg`) — deci
aceeași imagine pentru toate dimensiunile aceluiași model. Acceptabil, dar de
știut.

Lipsa disponibilității e problema reală: putem publica un preț, dar nu putem
spune cinstit „livrare 1–3 zile" pentru că ei nu ne spun dacă o au. Ori intră
toate ca `supplier` și ne bazăm pe faptul că ce e pe site e pe stoc, ori întrebăm.

**Randat cu JavaScript:** nu. HTML clasic, ieftin de citit.

**Efort:** enumerarea e mică și simplă, dar tot trebuie scrisă cu regula de
repetiție; parserul e subțire dar are trei câmpuri de dedus euristic. În jur de
**600 de linii**, **~3 zile** — pentru **243 de anvelope**, dintre care după
cifrele de mai sus vreo jumătate le avem deja.

**Suprapunere:** 17 mărci, **16 le avem deja**. Singura nouă e „Points", cu 12
anvelope. Iar Hankook, Continental, Nokian, Maxxis, Yokohama — exact mărcile
despre care proprietarul credea că-s împărțite între furnizori — sunt la toți.

**Recomandarea mea:** autoplanet e ultimul pe listă, nu al doilea. Trei zile de
muncă pentru ~120 de produse cu adevărat noi și fără semnal de stoc e cel mai
prost raport din cele cinci. Dacă ne dau un fișier, se schimbă totul.

---

## 4. autotyres.md — nu se poate citi nimic

**`robots.txt`: 403.** Pagina principală: **403.** Orice adresă: **403.**

Serverul e LiteSpeed și răspunde 1.242 de octeți de „Access to this resource on
the server is denied!" la tot, pe `https://`, pe `http://`, cu `www` și fără.
Am verificat și cu User-Agent-ul nostru, și cu unul de browser obișnuit —
**același 403**. Deci nu e blocat numele botului nostru; e blocat fie IP-ul
nostru, fie tot ce nu vine dintr-un browser adevărat, la nivel de WAF.

N-am încercat să ocolesc blocajul și nici n-o să încerc. Un furnizor care ne
lasă înăuntru o face dintr-o listă albă, nu pentru că ne-am deghizat.

**Nu pot da nici măcar o estimare** de număr de anvelope, de structură sau de
efort: n-am văzut nicio pagină de la ei.

**Ce trebuie făcut, în ordine:**

1. întreabă-i dacă au un export — XLS, CSV, XML, orice. Dacă au, nu mai
   contează deloc că site-ul e închis;
2. dacă nu, roagă-i să treacă IP-ul serverului nostru pe lista albă în panoul
   LiteSpeed, sau să accepte User-Agent-ul `AnvelopeUngheniSyncBot`;
3. verifică pe telefon, din rețeaua ta, dacă site-ul se deschide normal — dacă
   nici acolo nu merge, e problema lor, nu a noastră.

Fără unul din primele două, autotyres.md nu intră în catalog.

---

## 5. trisauto.md — nu se poate citi nimic

**`robots.txt`: 503.** Toate adresele: **503**, cu pagina „Just a moment…" —
o provocare anti-bot care cere execuție de JavaScript. Serverul e nginx pe
Ubuntu; provocarea e pusă în față și se aplică la tot, inclusiv la `robots.txt`
și `sitemap.xml`.

Ca și la autotyres, am încercat și cu User-Agent de browser: **același 503**.

Trecerea peste o provocare anti-bot înseamnă fie un browser fără cap, fie un
serviciu de rezolvat provocări. Primul e scump și fragil, al doilea e exact
lucrul pe care regula 5 din plan îl interzice în spirit: nu sunt ținte, sunt
partenerii atelierului. Dacă și-au pus o poartă, o deschid ei, nu o forțăm noi.

**Nu pot da nici măcar o estimare.**

**Ce trebuie făcut:** aceiași trei pași ca la autotyres — întâi fișierul, apoi
lista albă (o regulă de „skip" în anti-bot pentru IP-ul nostru), apoi
verificarea că site-ul merge din browser obișnuit.

---

## Suprapunerea, pe scurt — ipoteza nu s-a confirmat

Proprietarul credea că fiecare furnizor are alte mărci. Măsurat:

- pneu.md: **34 din 39 de mărci** le avem deja. Suprapunere de produse **24–48%**
- agropiese.md: **9 din 10** mărci din eșantion le avem deja
- autoplanet.md: **16 din 17** mărci le avem deja

Hankook, Continental, Michelin, Goodyear, Bridgestone, Nokian, Yokohama, Kumho
apar la toți. Nu împart piața pe mărci, o împart pe dimensiuni și pe preț.

**Consecința practică:** dedublarea nu e o formalitate, e jumătate din lucrare,
și `product_sources` din Faza 0 e exact ce trebuia construit. Un produs cu
patru furnizori legați va fi cazul obișnuit, nu excepția. Merită gândit acum
cum se alege `primary_source` când patru furnizori au aceeași anvelopă la patru
prețuri — regula „cine a intrat primul" o să dea prețuri aiurea.

---

## Ce propun pentru Faza 2

**pneu.md, și nu e aproape.** 7.260 de anvelope cu date complete, o singură
cerere, ~300 de linii de cod, ~2 zile. Agropiese aduce 1.436 în patru zile,
autoplanet 243 în trei.

Dar **înainte de orice linie de cod: telefonul către pneu.md**, pentru cele
două lucruri de la punctul 1 — că le e expus `primeCost`, și că avem nevoie de
acordul lor scris pe API. Dacă închid API-ul, pneu.md devine imposibil de citit
(aplicația e Angular pur, n-are HTML) și Faza 2 trece pe agropiese.

Ordinea pe care o recomand:

1. **pneu.md** — după acordul lor
2. **agropiese.md** — cel mai previzibil dintre cele trei deschise
3. **autotyres.md / trisauto.md** — dacă ne deschid ușa; altfel, deloc
4. **autoplanet.md** — ultimul, sau niciodată dacă nu dau fișier

Cele 243 de la autoplanet nu justifică trei zile cât timp sunt 7.260 și 1.436
nefăcute.
