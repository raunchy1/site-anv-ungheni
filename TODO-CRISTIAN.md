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

## 7. Logo-urile celor 134 de mărci

Lanțul e gata: coloană, bucket, încărcător, afișare pe card, pe fișă și pe pagina de marcă.
Lipsesc **fișierele**. Le iei din media kit-ul fiecărui producător, le pui în
`data/brand-logos/` cu numele mărcii (`michelin.svg`, `nokian-tyres.png`) și rulezi:

```bash
pnpm logos            # rulare seacă: ce s-ar urca, ce fișier n-are marcă
pnpm logos --apply    # urcă și scrie brands.logo_url
```

Nu se iau de pe site-urile concurenței. Până atunci, cardurile arată numele în versale —
nu rămâne spațiu gol.

## 8. Fotografia Lassa Greenways

Fișierul din catalogul furnizorului are **27614×5592 px, 21 MB** și servește 16 produse.
E o eroare în sursă. Funcționează, dar merită înlocuită.
