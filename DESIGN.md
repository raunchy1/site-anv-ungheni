# DESIGN — anvelope-ungheni.md

Sistemul de design, în cod. Fiecare decizie de mai jos are un motiv scris și,
unde se poate măsura, un număr.

Sursa de adevăr pentru valori: `src/styles/tokens.css`.
Demonstrația live: `/design-system` (`noindex`, exclusă din `sitemap.xml`).
Capturi: `docs/design/`.

Ultima actualizare: 22 august 2026 · Faza 2

---

## 0. Poziționarea, redusă la o propoziție

**Atelier german de precizie, nu magazin de piese auto.**

Din datele reale rezultă că nu avem de ales. 15.010 produse, **8 cu descriere**,
**zero conținut editorial**, **zero logo-uri de marcă**, o singură fotografie per
produs dintr-un catalog extern. Nu există text în spatele căruia să ascunzi o
navigație slabă și nu există imagine care să vândă în locul interfeței.

Rămâne un singur material de construcție: **cifrele**. `205/55 R16 91V`,
`1 847 MDL`, `6 944 indisponibile`. Un site care are numai cifre trebuie să
arate ca un instrument de măsură, nu ca o vitrină. Toate deciziile din acest
document servesc asta.

Consecința practică, cea mai importantă: **tabelul de specificații nu e un
detaliu al paginii de produs, e pagina de produs.**

---

## 1. Ce am refuzat să pun

Un designer scump se recunoaște după ce a refuzat. Lista, ca să fie verificabilă:

| Refuzat | De ce |
|---|---|
| Hero cu fotografie de anvelopă pe asfalt umed | N-avem fotografie proprie. Orice imagine de stoc ar fi prima minciună de pe pagină. |
| Secțiune „De ce noi?” cu trei iconițe | Trei superlative pe care nu le poate verifica nimeni. Selectorul de dimensiune convinge mai mult decât trei adjective. |
| Carusel de „oferte” | 46% din catalog n-are preț. Un carusel ar roti exact produsele pe care nu le putem vinde. |
| Badge-uri de urgență, contoare descrescătoare | Nu avem stoc real per SKU. Ar fi inventat. |
| Galerie de imagini, miniaturi, zoom | O singură fotografie per produs. O galerie cu un element e un buton fals. |
| Tab „Descriere” | 8 produse din 15.010 ar avea ce pune în el. |
| Logo-uri de producători | Drepturi de autor, și `DECISIONS.md` A.3 le interzice explicit. Identitatea de marcă e tipografică. |
| Gradiente, glassmorphism, blur decorativ | Blurul din spatele unui modal ascunde exact tabelul pentru care a venit omul. |
| Carduri care se ridică la hover | Într-o grilă de 24 de carduri, jumătate de ecran vibrează la fiecare mișcare de mouse. |
| Inimă pentru „favorite” | Un atelier marchează piese, nu colecționează simpatii. Am pus semn de carte. |

---

## 2. Culoare

### 2.1 Punctul de plecare

Roșul din CSS-ul site-ului vechi: **`#db0103`**, hover `#c90305`.
În OKLCH: `L 0.560 · C 0.229 · H 29.0°`. Croma e practic pe marginea gamutului
sRGB — de acolo vine senzația că vibrează pe alb.

Contrastele lui reale, calculate (WCAG 2.x, formula standard de luminanță relativă):

| | |
|---|---|
| `#db0103` pe `#FFFFFF` | **5,23:1** — trece AA |
| `#db0103` pe `#FAF8F5` (fundalul nostru) | **4,93:1** — trece AA la limită |
| `#db0103` pe `#121211` (fundal întunecat) | **3,59:1** — **PICĂ AA** |
| `#FFFFFF` pe `#db0103` | **5,23:1** — trece AA |

### 2.2 De ce fiecare variantă are două valori, nu una

Briefingul cere ca fiecare roșu să treacă AA și pe alb, și pe fundal închis.
Aritmetic, fereastra în care asta e posibil cu **un singur hex** e aceasta:

- pentru 4,5:1 pe `#FAF8F5` → luminanța relativă a roșului trebuie să fie **≤ 0,180**
- pentru 4,5:1 pe `#121211` → aceeași luminanță trebuie să fie **≥ 0,175**

Deci `L_rel ∈ [0,175 … 0,180]`. Există, dar e un roșu atât de întunecat încât pe
un card de produs se citește ca maro, iar textul alb de pe el ajunge la 4,5:1 fix
— fără nicio marjă pentru compresia JPEG a fotografiilor din spate.

Alegerea corectă, și cea pe care o fac toate sistemele serioase: **o pereche de
valori per variantă** — un roșu de suprafață pentru temă deschisă și unul pentru
temă întunecată. Tokenul semantic e același (`--accent`); doar valoarea din
spatele lui se schimbă cu tema. Componentele nu știu în ce temă rulează.

**A doua consecință, la fel de importantă:** în temă întunecată, textul de pe
butonul roșu **nu e alb**. Alb pe `#F15E54` dă `3,45:1` și pică. Negru-cauciuc pe
el dă `6,10:1`. Deci `--on-accent` e `#FFFFFF` în light și `#0A0A09` în dark.

### 2.3 Cele trei rafinări

Toate trei sunt construite în OKLCH cu unghi de nuanță fix și cromă retrasă
**8–10% de la marginea gamutului** — la cromă maximă, roșurile sRGB vibrează pe
alb și arată ieftin pe ecranele ieftine, care sunt majoritatea ecranelor din Ungheni.

---

#### Varianta 1 — **OXID** · roșu profund, bază caldă · `H 27°` *(implicit)*

```
light   #B72121   oklch(0.505 0.185 27)      hover  #A40B13
dark    #F15E54   oklch(0.670 0.183 27)      hover  #F9786C
```

| Pereche | Raport | Verdict |
|---|---|---|
| `#B72121` pe `#FAF8F5` | **6,09:1** | AA text normal · AAA text mare |
| `#B72121` pe `#F2EFEA` | **5,63:1** | AA |
| `#FFFFFF` pe `#B72121` | **6,46:1** | AA |
| `#F15E54` pe `#121211` | **5,77:1** | AA |
| `#F15E54` pe `#1C1B19` | **5,30:1** | AA |
| `#0A0A09` pe `#F15E54` | **6,10:1** | AA |

**Argumentul.** E la 2° de roșul existent, deci clientul vechi îl recunoaște ca
fiind același brand, dar e coborât cu 5,5% în luminozitate și cu 19% în cromă.
Ce câștigă: la 6,09:1 nu mai vibrează pe fundal deschis, deci poate sta la 40 cm
de un tabel de cifre fără să-l concureze. Ce pierde: lângă un roșu-semnal pare
mai puțin „ieftin” — ceea ce e exact scopul. E roșu de atelier, nu de raion de
promoții. **Recomandarea mea și implicitul sistemului.**

---

#### Varianta 2 — **SIGNAL** · roșu-semnal saturat, spre portocaliu · `H 36,5°`

```
light   #B93503   oklch(0.525 0.176 36.5)    hover  #A42A00
dark    #F86034   oklch(0.680 0.195 36.5)    hover  #FF7953
```

| Pereche | Raport | Verdict |
|---|---|---|
| `#B93503` pe `#FAF8F5` | **5,54:1** | AA |
| `#B93503` pe `#F2EFEA` | **5,12:1** | AA |
| `#FFFFFF` pe `#B93503` | **5,88:1** | AA |
| `#F86034` pe `#121211` | **5,99:1** | AA |
| `#F86034` pe `#1C1B19` | **5,50:1** | AA |
| `#0A0A09` pe `#F86034` | **6,33:1** | AA |

**Argumentul.** 7,5° spre portocaliu față de brandul actual. E cel mai vizibil
dintre cele trei pe un telefon ținut în soare — un argument real când 70% din
trafic e mobil și o parte din el se întâmplă în parcarea service-ului. Ce pierde:
portocaliul e culoarea avertismentului rutier și a reducerilor de sezon. Pe un
card cu preț citește ca ofertă, nu ca marcă. Îl propun **doar** dacă poziționarea
se mută dinspre atelier spre volum.

---

#### Varianta 3 — **KARMIN** · roșu rece, cu urmă de magenta · `H 13,5°`

```
light   #BB1C46   oklch(0.515 0.190 13.5)    hover  #A7063A
dark    #F45974   oklch(0.675 0.190 13.5)    hover  #FE7286
```

| Pereche | Raport | Verdict |
|---|---|---|
| `#BB1C46` pe `#FAF8F5` | **5,88:1** | AA |
| `#BB1C46` pe `#F2EFEA` | **5,44:1** | AA |
| `#FFFFFF` pe `#BB1C46` | **6,24:1** | AA |
| `#F45974` pe `#121211` | **5,83:1** | AA |
| `#F45974` pe `#1C1B19` | **5,35:1** | AA |
| `#0A0A09` pe `#F45974` | **6,16:1** | AA |

**Argumentul.** Sub roșul pur, cu suficientă magenta cât să se citească drept
alegere și nu drept accident de gamut. E cel mai „scump” dintre cele trei —
aceeași familie cu roșurile de modă și de automobile premium. Ce pierde: se rupe
de gri-ul cald al restului paletei. Ar cere ca cele 11 trepte de neutre să
migreze spre rece, adică rescrierea întregii palete. **Costul lui nu e culoarea,
e sistemul din jurul ei.**

---

### 2.4 Regula celor 5%, măsurată

Roșul ocupă maximum 5% din suprafața oricărui ecran.

**Unde apare:**
1. CTA-ul primar — **unul singur per ecran**
2. Indicatorul de stare activă — linia de sub tabul activ, linia pasului activ
   din selectorul de dimensiune, sublinierea paginii curente
3. Marcajul-semnătură de sub titlu

**Unde NU apare:** fundaluri mari, antet, subsol, gradiente, umbre, glow,
conturul cardurilor, iconițe decorative, hover pe rânduri, badge-uri multiple,
casete bifate, indicatorul de stoc.

**Măsurat pe capturile reale** (procent de pixeli cu nuanță în banda 338°–52°,
saturație > 0,35, valoare > 0,18 — `docs/design/`):

| Ecran | Captură | Roșu |
|---|---|---|
| Pagina de produs · 1440 · light | `1440-light-03-produs.png` | **0,73%** |
| Pagina de produs · 1440 · dark | `1440-dark-03-produs.png` | **0,76%** |
| Pagina de produs · 768 · light | `768-light-03-produs.png` | **1,36%** |
| Pagina de produs · 768 · dark | `768-dark-03-produs.png` | **1,45%** |
| Pagina de produs · 375 · light | `375-light-03b-produs.png` | **1,15%** |
| Pagina de produs · 375 · dark | `375-dark-03-produs.png` | **0,53%** |
| Selectorul de dimensiune · 1440 | `1440-light-02-dimensiune.png` | **0,07%** |
| Selectorul de dimensiune · 768 | `768-light-02-dimensiune.png` | **0,47%** |
| Selectorul de dimensiune · 375 | `375-light-02-dimensiune.png` | **0,50%** |
| Componente · 1440 · light | `1440-light-09-componente.png` | **0,31%** |
| Componente · 768 · light | `768-light-09-componente.png` | **0,38%** |
| RO / RU · 1440 | `1440-light-10-ro-ru.png` | **0,38%** |
| Light / dark · 1440 | `1440-light-11-teme.png` | **1,08%** |

Maximul măsurat pe orice ecran real: **1,45%**. Singurele capturi peste 2% sunt
secțiunea §01 din `/design-system`, care afișează intenționat cele șase eșantioane
de roșu una lângă alta — o pagină de documentație, nu un ecran de produs.

Metoda e reproductibilă: numărare de pixeli pe PNG-urile din `docs/design/`,
bandă de nuanță 338°–52°, saturație > 0,35, valoare > 0,18.

**Un caz în care regula a schimbat designul, nu doar l-a validat.**
Prima versiune avea pe mobil butonul „Adaugă în coș” pe toată lățimea, 52px
înălțime. Măsurat: `343 × 52 / (375 × 812) =` **5,9%** — peste prag, dintr-un
singur element. Soluția n-a fost să micșorez butonul, ci să pun cele trei acțiuni
pe același rând: primar flexibil + comparare + favorite, ambele pătrate de 52px.
Butonul primar a scăzut la **3,2%**, iar rândul e și ergonomic mai bun, pentru că
toate trei țintele cad sub degetul mare. Vezi `ProductPage.tsx`.

### 2.5 Paleta neutră

Grafit cald / negru-cauciuc, 11 trepte. **Nicio treaptă nu e gri neutru** —
toate poartă `H ≈ 78–107°` în OKLCH, adică o urmă de căldură. Un gri rece lângă
un roșu cald arată ca două sisteme lipite unul de altul.

| Token | Hex | Rol | Contrast |
|---|---|---|---|
| `--n-0` | `#FAF8F5` | fundal de pagină, light — **nu `#FFFFFF`** | — |
| `--n-50` | `#F2EFEA` | singurul gri cald pentru suprafețe secundare | — |
| `--n-100` | `#E6E2DB` | hairline implicit | — |
| `--n-200` | `#CBC6BC` | contur de câmp, separator de bloc | — |
| `--n-300` | `#9B968C` | text secundar pe dark | **6,37:1** pe `#121211` |
| `--n-400` | `#6C6862` | text secundar pe light | **5,22:1** pe `#FAF8F5` |
| `--n-500` | `#494640` | suprafață 2, dark | — |
| `--n-600` | `#2E2C29` | linie de contrast, light | 13,13:1 |
| `--n-700` | `#1C1B19` | text principal, light | **16,24:1** |
| `--n-800` | `#121211` | fundal de pagină, dark | — |
| `--n-900` | `#0A0A09` | cifre, prețuri, titluri | **18,68:1** |

`#FFFFFF` pur există în paletă sub numele `--pure-white` și are **o singură
utilizare**: text alb pe butonul roșu în temă deschisă. Niciodată ca fundal.

**Do / Don't**
> **Așa:** textul secundar e `--ink-muted` = `#6C6862`, 5,22:1, ales pentru că
> trece AA la 14px.
> **Nu așa:** `text-gray-500` pentru că „arată mai discret”. Discreția care
> pică testul de contrast nu e discreție, e text pe care jumătate din clienți
> nu-l pot citi la volan.

### 2.6 Sezoane

Trei semnale, **desaturate deliberat**, mereu în pereche light/dark. Sezonul e o
etichetă, nu un accent — dacă ar fi saturat, ar concura cu roșul într-o grilă de
24 de carduri unde fiecare card are un badge de sezon.

| Sezon | Light | Contrast | Dark | Contrast |
|---|---|---|---|---|
| Vară (cald) | `#8A6A2A` | 4,74:1 | `#C8A75E` | 8,16:1 |
| Iarnă (rece) | `#3F6274` | 6,17:1 | `#8FB2C4` | 8,33:1 |
| All season (neutru) | `#4F6350` | 6,13:1 | `#9DB39E` | 8,37:1 |

**Iarna nu e albastru electric.** E ardezie rece, la 0,09 cromă. Albastrul
electric e culoarea butoanelor de sistem, nu a unui sezon.

### 2.7 Fotografia: placa

Fotografiile de catalog au fundal alb, încadrare inegală și calitate variabilă.
Soluția e o **placă**: un dreptunghi deschis și cald (`--img-plate`), identic ca
rol în ambele teme, peste care fotografia se aplică cu `mix-blend-mode: multiply`.

- Pe alb pur, marginea neregulată a fotografiei ar fi invizibilă și produsele ar
  părea de dimensiuni diferite. Pe placă, toate au aceeași ramă.
- În temă întunecată, o fotografie cu fundal alb pe o suprafață închisă apare ca
  un **dreptunghi alb decupat** — exact efectul care face un catalog să arate
  ieftin. Placa rămâne deschisă și în dark tocmai ca să elimine asta.

---

## 3. Tipografie

### 3.1 Alegerea, și cum a fost verificată

**IBM Plex Sans** (interfață și text) + **IBM Plex Mono** (date numerice).
Două familii dintr-o singură superfamilie.

Nu am ales din fișa de produs. Am descărcat fișierele `woff2` servite efectiv de
Google Fonts și le-am citit tabelele `cmap`, `hmtx` și `GSUB`:

| Familie | RO lipsă | RU lipsă | Cifre de lățime egală | Cifre |
|---|---|---|---|---|
| **IBM Plex Sans** | **0** | **0** | **da** | toate 600/1000em |
| **IBM Plex Mono** | **0** | **0** | **da** | toate 600/1000em |
| Golos Text | 0 | 0 | nu | 485…620 |
| Onest | 0 | 0 | nu | 363…665 |
| Commissioner | 0 | 0 | nu | 816…1286 |
| Archivo | 0 | — | — | **fără chirilic** |
| Space Grotesk | 0 | — | — | **fără chirilic** |

Setul RO verificat: `Ă ă Â â Î î Ș ș Ț ț`. Setul RU: alfabetul chirilic complet,
inclusiv `Ё ё`. `Ș` și `Ț` sunt formele cu **virgulă dedesubt** (U+0218…U+021B),
nu cu sedilă — ambele familii au și tabela `locl`, care aplică forma corectă
când `lang="ro"`.

**Argumentul decisiv, cel care elimină restul candidaților.** În IBM Plex, cifrele
au lățime tabulară **din desen**, nu dintr-o funcție OpenType opțională: toate
zece au avansul `600/1000em`, în ambele familii, la aceeași unitate de em (1000).
Consecințe:

1. `205/55 R16` scris în Mono și `1 847` scris în Sans cad pe **același pas
   orizontal**. Nicio altă pereche testată nu are cifre metric-compatibile între
   text și date.
2. Alinierea verticală a cifrelor nu depinde de `font-feature-settings`. Dacă
   fontul nu se încarcă, dacă un motor de randare ignoră `tnum`, dacă cineva
   copiază tabelul în alt context — coloanele rămân aliniate.
   `Golos Text` și `Onest`, care au cifre proporționale implicit și `tnum`
   opțional, pierd alinierea în oricare din cele trei situații.

`.num` aplică oricum `tabular-nums lining-nums` — centură de siguranță pentru
fontul de sistem folosit ca fallback până se încarcă Plex.

**Interzise prin briefing și respectate:** Poppins, Montserrat, Inter, Roboto și
orice familie din primele 10 rezultate Google Fonts. IBM Plex Sans e în jurul
poziției 40–60; IBM Plex Mono, mai jos.

**Notă operațională:** IBM Plex Sans e variabil pe Google Fonts (`wght 400..700`),
IBM Plex Mono **nu** este — se cer greutăți explicite. `src/app/layout.tsx` o face.

### 3.2 Scara

Modulară, rație **1,2** (terță mică), bază 16px. Rație mică pentru că un catalog
tehnic are nevoie de multe trepte apropiate, nu de trei sărituri dramatice.

| Token | px | Unde |
|---|---|---|
| `--fs-1000` | 47,8 | display — un singur loc pe site |
| `--fs-900` | 39,8 | preț pe pagina de produs, desktop |
| `--fs-800` | 33,2 | H1 |
| `--fs-700` | 27,6 | H1 mobil / H2 desktop |
| `--fs-600` | 23 | H2 |
| `--fs-500` | 19,2 | H3, preț pe card |
| `--fs-400` | 16 | corp, valoare în tabel |
| `--fs-300` | 14 | UI dens, titlu de card, rând de tabel |
| `--fs-200` | 13 | meta, contor, notă |
| `--fs-100` | 11 | etichetă de coloană, versale |

Tracking: negativ pe corpurile mari (`-0,022em` la display, `-0,014em` la titluri),
zero pe text curent, **pozitiv doar pe eticheta în versale** (`+0,085em`).
Versalele fără tracking pozitiv se lipesc; textul curent cu tracking pozitiv arată
ca o prezentare de vânzări.

### 3.3 Aliniere optică

`.optical-left` mută începutul de rând cu `-0,055em` acolo unde primul caracter
e majusculă sau cifră. Majusculele și cifrele au bearing lateral mai mare decât
minusculele; aliniate matematic la marginea grilei, arată împinse spre interior.

**Do / Don't**
> **Așa:** H1-ul, eticheta de marcă și prețul mare poartă `.optical-left`, deci
> muchia lor stângă coincide optic cu a paragrafului de dedesubt.
> **Nu așa:** toate elementele la `padding-left` identic, „pentru că grila spune
> așa”. Grila e un instrument, nu un arbitru.

### 3.4 Proba de 20 de dimensiuni

`/design-system` §05 afișează **20 de dimensiuni reale**, una sub alta, cu indice,
marcă și preț. E proba de foc a acestei tipografii: `/` cade în aceeași coloană
pe fiecare rând, formatul imperial `31x10.50 R15` (12 caractere față de 10) nu
împinge coloana, iar prețurile se aliniază la dreapta **pe ultima cifră**, nu pe
primul caracter.

---

## 4. Elementul-semnătură — profilul benzii de rulare

Un singur element grafic recurent: lugurile înclinate la 20° și coasta
longitudinală continuă de sub ele. `<TreadRule>` în `src/components/icons/`.

**De ce el.** Mărcile n-au logo, produsele n-au descriere, nu există fotografie
de atmosferă și nu există conținut editorial. Site-ul are nevoie de un semn care
să spună „anvelope” fără să fie o ilustrație și fără să consume culoare. Un profil
de bandă e literal amprenta produsului și rămâne recognoscibil la 96px lățime.

**De ce cu coastă continuă.** Prima versiune era doar din luguri înclinate și se
citea ca o **linie punctată** — adică nimic. Coasta continuă de dedesubt e partea
care îl transformă din ornament în semn.

**Regula de folosire: maximum două apariții pe ecran.**
Una ca marcaj sub titlul principal (în accent), una ca separator între două
blocuri majore (în linie neutră). A treia apariție îl transformă din semnătură
în tapet.

---

## 5. Iconițele

Un singur set, desenat pentru acest proiect. `src/components/icons/index.tsx`.

Reguli, respectate de toate: grilă 24×24, contur 1,5, **capete drepte** (`butt`),
îmbinări în unghi (`miter`), zero umpluturi, zero colțuri rotunjite.
Capetele drepte sunt decizia care ține setul împreună — amestecul dintre capete
rotunde și drepte e cel mai rapid semn că iconițele vin din două surse.

Dimensiunea implicită e **20, nu 24**: la 24 domină un rând de text de 14–16px.

**Cele trei sezoane au aceeași geometrie** — disc central de rază 3,6, marcaje
între raza 5,4 și 8,4 — ca să se citească drept set, nu drept trei iconițe
separate. `IconAllSeason` e împărțită vertical: trei raze scurte drepte în stânga
(soarele), trei brațe lungi terminate în furcă în dreapta (fulgul).

**Do / Don't**
> **Așa:** `IconFavorite` e un semn de carte.
> **Nu așa:** o inimă. Un atelier marchează piese, nu colecționează simpatii —
> și inima e cel mai rapid mod de a face o interfață tehnică să arate ca o
> aplicație de rețete.

---

## 6. Spațiu, formă, umbră, mișcare

**Spațiu.** Grilă strictă de 4px, `--sp-1` … `--sp-32`. Nicio valoare în afara ei.
Ținte de atingere ≥ 44px pe mobil (`--tap-min`), aplicate și pe desktop: un câmp
de 36px pe desktop și 44 pe mobil ar însemna două grile de întreținut.

**Formă.** Raze mici — 2px pe controale, 3 pe carduri, 4 pe containere mari.
Un catalog tehnic nu are colțuri rotunde. Pilula (`--radius-pill`) există pentru
un singur element: contorul numeric rotund.

**Umbră.** Exact trei, toate subtile:
`--shadow-1` control ridicat · `--shadow-2` meniu și toast · `--shadow-3` modal
și drawer. Construite din `color-mix` peste `--n-900`, deci se recalibrează
singure în temă întunecată.

**Mișcare.** Trei durate — `90ms` culoare și focus, `140ms` meniu și tab,
`190ms` drawer și modal. **Nimic peste 200ms.** Două curbe: `--ease-out` pentru
intrări, `--ease-in-out` pentru schimbări de stare.
La `prefers-reduced-motion` toate trei devin `1ms` și animația de skeleton se
oprește complet — **nu se reduce, se stinge**.

**Do / Don't**
> **Așa:** cardul de produs semnalează hover printr-o schimbare de fundal și de
> contur, în 90ms.
> **Nu așa:** `translateY(-4px)` plus `scale(1.02)` plus umbră crescută, în 300ms.
> Într-o grilă de 24 de carduri, asta înseamnă că jumătate de ecran se mișcă la
> fiecare tremur de mouse.

---

## 7. Selectorul de dimensiune

Ecranul care contează cel mai mult. `src/components/ui/SizeSelector.tsx`.

Șoferul știe „205/55 R16” și vrea un preț în trei atingeri. Patru decizii servesc
exact asta:

1. **Afișajul.** Sus, în mono, la 27–33px: `205/55 R16`, cu pozițiile necompletate
   ca liniuțe. Se completează sub deget, în timp real. Asta transformă trei liste
   de butoane într-un **instrument cu citire** — diferența dintre un aparat de
   măsură și un formular.
2. **Cifrele sunt reale.** Contorul de sub fiecare opțiune vine din
   `data/raw/products.ndjson`, printr-o cascadă generată (`src/lib/size-tree.ts`):
   14.988 de anvelope metrice, `[total, disponibile]` pe fiecare nod.
   `205 / 55 / R16` = **263 în catalog, 135 disponibile**. Dacă o combinație n-are
   stoc, se vede **înainte** de a fi aleasă, nu după.
3. **Restrângerea e dependentă.** Înălțimile afișate sunt cele care există pe
   lățimea aleasă. Nu există opțiune care duce la zero rezultate.
4. **Ordinea e fixă și e ordinea de pe flancul anvelopei**: lățime → înălțime →
   diametru. Nu se poate începe cu diametrul, pentru că nici anvelopa nu se
   citește așa.

Înainte de prima atingere, contorul arată **catalogul întreg**, nu zero. Un
„0 disponibile” pe ecranul de start spune că magazinul e gol.

Cele 20 de anvelope imperiale (`31x10.50 R15`) **nu intră** în cascadă: n-au
lățime și înălțime metrice, iar a le forța în selector ar strica restrângerea
pentru cei 14.988. Se ajunge la ele prin căutare și prin rutele de brand.
`TODO(cristian)`: dacă vrei o intrare dedicată pentru off-road, e o a patra
opțiune în afișaj, nu o coloană în plus.

**Do / Don't**
> **Așa:** trei canale cu opțiuni vizibile, contor live sub fiecare, citire mare
> deasupra.
> **Nu așa:** trei `<select>`-uri unul lângă altul cu un buton „Caută” și un ecran
> de rezultate goale la final. Aceleași trei date, dar fără citire și fără feedback.

---

## 8. Pagina de produs

**Tabelul de specificații e conținutul.** 8 produse din 15.010 au descriere, deci
nu există tab „Descriere”. Ce rămâne sunt patru rânduri — dimensiune, sezon,
indice de sarcină, indice de viteză — și acele patru rânduri trebuie să arate ca
o fișă tehnică, nu ca un rest.

Două decizii de aliniere, ambele vizibile cu ochiul liber dacă lipsesc:

1. **Valorile sunt în IBM Plex Mono.** `205/55 R16` și `31x10.50 R15` încep pe
   aceeași coloană și au aceeași lățime per caracter, deci cifrele se aliniază
   vertical între rânduri **și între produse diferite**.
2. **Coloana de etichete are lățime fixă** (`--spec-label: 11.5rem`), nu `auto`.
   Cu `auto`, „Indice de sarcină” (17 caractere) și „Индекс нагрузки” (15) ar
   muta coloana de valori între limbi, iar tabelul ar arăta ca alt tabel în
   fiecare limbă.

**Ordinea pe card și pe pagină:** marcă (etichetă în versale) → model (titlu) →
dimensiune + indici (mono) → specificații → preț → stoc → acțiune.
Marca e sus și mică, nu jos și mare: mărcile n-au logo, deci singura lor
identitate e tipografică, iar un cuvânt în versale la 11px cu tracking larg
citește ca **cap de fișă**, nu ca etichetă de preț.

### 8.1 Produsul indisponibil — 6.944, adică 46% din catalog

Nu e un caz marginal, e jumătate din trafic. Deci se proiectează ca ecran
principal, nu ca eroare.

- **„Preț la cerere”** are aceeași greutate tipografică și același loc în grilă ca
  prețul. Fără „0 MDL”, fără preț barat inventat, fără semn de exclamare.
- CTA telefon proeminent, în locul butonului de coș.
- **Butonul „Adaugă în coș” e ABSENT, nu dezactivat.** Un buton gri e o promisiune
  care nu se ține.
- Indicatorul de stoc pentru indisponibil e un **pătrat gol, gri** — **nu roșu**.
  Dacă 46% din catalog ar fi marcat cu roșu, roșul n-ar mai însemna nimic.
  **Absența culorii E semnalul.**
- Alternativele reale sunt element principal al paginii, nu subsol.

**Do / Don't**
> **Așa:** „Preț la cerere” + `068 263 644` ca buton cu contur.
> **Nu așa:** „0 MDL”, buton de coș dezactivat, badge roșu „STOC EPUIZAT”.
> Trei minciuni mici într-un singur bloc.

---

## 9. Stările marginale

Un site scump se recunoaște după stările marginale. Toate șapte sunt proiectate
și randate în `/design-system` §09:

| # | Stare | Tratament |
|---|---|---|
| 1 | Se încarcă | Skeleton cu **aceeași grilă** ca rezultatul. Pulsează opacitatea, nu o sclipire care traversează — sclipirea e un gradient în mișcare, adică exact ce e interzis. |
| 2 | Zero rezultate | Dimensiunea există, stocul nu. Acțiune: „Arată și produsele momentan indisponibile”. |
| 3 | Eroare tehnică | Spune ce s-a rupt și oferă reîncercarea. `role="alert"`, iconiță în `--warn`, nu în roșu. |
| 4 | Gol | Coș fără produse. Trei părți: ce s-a întâmplat, de ce, ce poți face. |
| 5 | O singură literă în căutare | **Prag, nu listă goală.** Cu 134 de mărci, `M` întoarce 21 de rezultate — util. Cu 15.010 titluri, `M` întoarce o treime din catalog — inutil. Pragul e configurabil (`minChars`). |
| 6 | Produs fără fotografie | 10 din 15.010. Nu un pătrat gri gol: silueta produsului plus eticheta „Fără fotografie”, ca să se vadă că lipsa e **cunoscută**. |
| 7 | Indisponibil | Vezi §8.1. |

Starea goală nu are ilustrație, nu are scuze și nu are semne de exclamare.
Iconița e mică și gri — dacă ar fi mare și colorată, ar sărbători eșecul.

---

## 10. Bilingv

RO la `/`, RU la `/ru`. Chirilicul are aceeași calitate ca latina — verificat pe
fișierele de font, nu presupus (§3.1).

Testul real nu e alfabetul, ci **lungimea**. „Показать результаты” e cu ~40% mai
lat decât „Vezi rezultatele”. De aceea:

- coloana de etichete din `SpecTable` are lățime fixă;
- butoanele n-au lățime calculată din text, iar cel primar e `flex-1` pe mobil;
- etichetele de coloană sunt scurte în ambele limbi, alese ca atare;
- `/design-system` §10 randează selectorul și pagina de produs **una lângă alta**
  în RO și RU, ca orice regresie de lungime să fie vizibilă înainte de deploy.

---

## 11. Accesibilitate

- **Contrast AA minim peste tot.** Perechile critice sunt calculate în §2 și §2.5.
- **Focus desenat intenționat**: `outline: 2px solid var(--accent)` cu
  `outline-offset: 2px` și rază proprie. Se vede pe fundal deschis, pe fundal
  închis și peste un buton roșu. `:focus-visible`, nu `:focus` — mouse-ul nu
  primește inel.
- **Ținte ≥ 44px** pe mobil. La `Checkbox`, zona de atingere e **tot rândul**, nu
  pătratul de 18px: pe un filtru cu 134 de mărci, ținte de 18px sunt inutilizabile
  cu degetul.
- **Primitive native acolo unde browserul o face mai bine**: `<dialog>` pentru
  Modal și Drawer (blocarea focusului, `Escape`, inertizarea paginii),
  `<details>` pentru Accordion, `<select>` pentru Select (pe mobil deschide roata
  sistemului, care bate orice listbox rescris).
- **Pattern-uri ARIA complete** unde nu există primitivă: `Tabs` (tabindex rotitor,
  săgeți, Home/End), `Combobox` (ARIA 1.2, `aria-activedescendant`).
- **`prefers-reduced-motion` respectat integral**, inclusiv `scroll-behavior`.
- `aria-live="polite"` pe contorul de rezultate din selectorul de dimensiune.
- `RangeSlider` folosește două `<input type="range">` suprapuse, cu
  `aria-valuetext` care spune „1 200 MDL”, nu „1200”.

---

## 12. Ce e în cod

```
src/styles/tokens.css              tokenii — culoare light+dark, tipografie,
                                   spațiu, formă, umbre, mișcare, punte @theme
src/app/globals.css                stratul de bază + utilitare (.num, .label,
                                   .optical-left, .shell, .measure, .scroll-x)
src/components/icons/index.tsx     21 de iconițe + <TreadRule>
src/components/ui/                 23 de componente tipizate
src/lib/cn · format · i18n         concatenare de clase, formatare de cifre,
                                   dicționar RO/RU
src/lib/sample-products.ts         86 de produse REALE din products.ndjson
src/lib/size-tree.ts               cascada reală lățime→înălțime→diametru
src/app/design-system/             ruta internă, noindex
```

**Zero `any`, zero `@ts-ignore`, zero erori de ESLint.**

---

## 13. Ce n-am putut decide singur

1. **Care dintre cele trei roșuri.** Recomand OXID. Karmin e cel mai scump vizual,
   dar cere rescrierea celor 11 neutre în versiune rece — decizie de buget, nu de gust.
2. **Eticheta stocului disponibil** — „În stoc” sau „Stoc furnizor” pentru cele
   8.066 de produse. `ARCHITECTURE.md` §12 decizia 2. Sistemul suportă ambele
   (`StockIndicator` are trei stări); doar textul se schimbă.
3. **Intrarea pentru cele 20 de anvelope imperiale** — §7.
4. **Numărul de telefon afișat ca CTA.** Am folosit `068 263 644`, extras din
   `meta_description` din sursă. `TODO(cristian)`: confirmă că e numărul corect
   pentru comenzi.
5. **Dacă modul întunecat se activează automat** din `prefers-color-scheme` sau
   printr-un comutator explicit. Tokenii suportă ambele; e o decizie de produs.
