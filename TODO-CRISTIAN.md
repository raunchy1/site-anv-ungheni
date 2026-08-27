# TODO(cristian) — de completat din admin

Lucruri care **lipsesc din sursă**, nu din migrare. Nu le-am inventat.

## 1. Sezonul, la 5 anvelope

Verificat în cache-ul HTML: paginile au un singur atribut, `Dimensiune`, și acela gol.
Nu e defect de parser.

Numele produsului sugerează sezonul, dar sugestia **nu s-a scris în bază** — o confirmi tu:

| Slug | Titlu | Sezon sugerat de nume |
|---|---|---|
| `bridgestone-blizzak-6-245-50-r20-105w-xl` | Bridgestone Blizzak 6 245/50 R20 105W XL | iarnă (Blizzak) |
| `habilead-aw33-245-40-r19-98h-xl` | Habilead AW33 245/40 R19 98H XL | all season (AW = All Weather) |
| `kumho-wintercraft-ice-wi32-215-65-r17-103t` | Kumho WinterCraft Ice WI32 215/65 R17 103T | iarnă (WinterCraft Ice) |
| `nexen-n-blue-4season-2-255-50-r20-109w-xl` | Nexen N'blue 4Season 2 255/50 R20 109W XL | all season (4Season) |
| `kpatos-fm518-235-60-r17-102h` | Kpatos FM518 235/60 R17 102H | necunoscut |

Consecință până la completare: nu apar în filtrele de sezon și n-au insignă pe card.
Rămân găsibile după dimensiune și marcă.

## 2. Cei 2 senzori TPMS

N-au marcă în sursă (`brand_name` NULL) și n-au dimensiune de anvelopă — corect, sunt senzori.
Dacă vrei marcă pe ei (Foxwell), o completezi din admin.

## 3. Programul de duminică

`settings.opening_hours.sun` e `null`. Apare ca `TODO(cristian)` în footer și pe `/contact`,
**vizibil pe site**. Prima valoare de completat înainte de lansare.

## 4. Textele celor 9 pagini de servicii

`body_ro` și `body_ru` sunt `NULL`. Layout-ul funcționează fără ele.

## 5. Textul juridic al celor 4 pagini legale

Schelete create, `body` `NULL`, pagini pe `noindex` până se completează.

## 6. Descrierile de marcă

Nu există în sursă la niciunul dintre cele 134 de branduri. `brands.description_ro/ru` NULL.

## 7. Logo-urile de marcă — 42 din 132, restul lipsesc

Urcate la 28 august 2026: **43 de mărci**, care acoperă **7.316 din 15.005 produse (48,8%)**.
Sursele: Wikimedia Commons (37) și site-urile oficiale ale producătorilor (6).

Cele 89 rămase n-au logo găsibil din surse acceptabile — sunt aproape toate mărci
chinezești fără site oficial funcțional. Lista completă, în ordinea importanței, e în
`tools/logos/marci-checklist.csv`; primele cinci: TRACMAX (713), Grenlander (456),
Petlas (348), Arivo (331), Joyroad (328).

Dacă obții fișierul oficial al vreuneia, pune-l în `logos-sursa/` cu numele slug-ului
și rulează:

```bash
pnpm logos                 # rulare seacă
pnpm logos --apply         # urcă în bucketul `marci` și scrie brands.logo_url
pnpm logos:sheet           # planșa de verificare, din ce e urcat
```

Nu se iau de pe agregatoare și nici de la concurență. Mărcile fără logo arată numele
în versale — nu rămâne spațiu gol.

## 8. Fotografia Lassa Greenways

Fișierul din catalogul furnizorului are **27614×5592 px, 21 MB** și servește 16 produse.
E o eroare în sursă. Funcționează, dar merită înlocuită.
