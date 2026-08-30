# Etapa 0.1 — titlul contra coloanelor

Rulare: 2026-08-30T22:18:13.074Z · 8s · **nu s-a scris nimic**

**1896 produse** au titlul în dezacord cu propriile coloane.

## Verdict: TITLUL are dreptate

Comparația titlu-coloană e circulară: amândouă vin din același import OpenCart.
Arbitrul e catalogul pandashop, unde aceeași anvelopă are indicii scriși de
altcineva. Din 1896 de neconcordanțe, cele în care catalogul lor
confirmă exact una din cele două variante:

| Ce confirmă pandashop | Câte |
|---|---|
| **Doar titlul nostru** | **935** |
| **Doar coloanele noastre** | **60** |
| Ambele (există și 84H, și 86H la ei — variante reale) | 4 |
| Niciuna (nu au produsul deloc) | 897 |

Din 995 de cazuri decisive, **94.0%** dau dreptate titlului.

Cele 4 „ambele" sunt importante: acolo pandashop are **și** varianta din
titlu, **și** pe cea din coloană, ca produse distincte. Nu e o eroare de scriere;
sunt două anvelope diferite, iar rândul nostru le amestecă. Alea nu se corectează
automat, indiferent de verdict.

## Pe tipuri de neconcordanță

| Tip | Câte | Titlul confirmat | Coloana confirmată |
|---|---|---|---|
| `diametru_fara_C` | 755 | 383 | 0 |
| `indice_sarcina+indice_viteza` | 550 | 250 | 57 |
| `model` | 276 | 157 | 1 |
| `indice_sarcina+indice_viteza+model` | 65 | 25 | 0 |
| `indice_sarcina+indice_viteza+diametru_fara_C` | 62 | 30 | 0 |
| `indice_sarcina` | 39 | 25 | 2 |
| `indice_viteza` | 35 | 13 | 0 |
| `indice_sarcina+diametru_fara_C` | 19 | 12 | 0 |
| `diametru_fara_C+model` | 16 | 0 | 0 |
| `latime_sau_profil` | 15 | 8 | 0 |
| `diametru+latime_sau_profil+model` | 13 | 7 | 0 |
| `diametru` | 10 | 7 | 0 |
| `indice_viteza+diametru_fara_C` | 8 | 5 | 0 |
| `indice_sarcina+indice_viteza+diametru_fara_C+model` | 7 | 4 | 0 |
| `runflat+model` | 7 | 2 | 0 |
| `indice_sarcina+model` | 6 | 3 | 0 |
| `indice_sarcina+indice_viteza+latime_sau_profil` | 3 | 0 | 0 |
| `indice_sarcina+indice_viteza+diametru` | 2 | 1 | 0 |
| `indice_viteza+model` | 2 | 0 | 0 |
| `indice_sarcina+indice_viteza+diametru+latime_sau_profil+model` | 1 | 1 | 0 |
| `indice_sarcina+diametru_fara_C+model` | 1 | 1 | 0 |
| `latime_sau_profil+model` | 1 | 0 | 0 |
| `diametru_fara_C+latime_sau_profil` | 1 | 1 | 0 |
| `indice_sarcina+indice_viteza+diametru+latime_sau_profil` | 1 | 0 | 0 |
| `indice_sarcina+diametru+latime_sau_profil` | 1 | 0 | 0 |

### `diametru_fara_C` — 755 produse

- **#14100** `tracmax-x-privilo-vs450-175-70-r14c-95t`
  - titlu: **Tracmax X-privilo VS450 175/70 R14C 95T** → titlul spune `95T`
  - coloane: `load_index=95`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo VS450 175/70 R14C 95T`) · coloana negăsită
- **#14101** `tracmax-x-privilo-vs450-175-r14c-99r`
  - titlu: **Tracmax X-privilo VS450 175 R14C 99R** → titlul spune `99R`
  - coloane: `load_index=99`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo VS450 175 R14C 99R`) · coloana negăsită
- **#14102** `tracmax-x-privilo-vs450-185-75-r16c-104r`
  - titlu: **Tracmax X-privilo VS450 185/75 R16C 104R** → titlul spune `104R`
  - coloane: `load_index=104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`tracmax x privilo vs450 185/75 R16C 104R`) · coloana negăsită
- **#14103** `tracmax-x-privilo-vs450-185-r14c-102r`
  - titlu: **Tracmax X-privilo VS450 185 R14C 102R** → titlul spune `102R`
  - coloane: `load_index=102`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo VS450 185 R14C 102R`) · coloana negăsită
- **#14104** `tracmax-x-privilo-vs450-195-70-r15c-104r`
  - titlu: **Tracmax X-privilo VS450 195/70 R15C 104R** → titlul spune `104R`
  - coloane: `load_index=104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo VS450 195/70 R15C 104R`) · coloana negăsită
- **#14105** `tracmax-x-privilo-vs450-195-75-r16c-107-105r`
  - titlu: **Tracmax X-privilo VS450 195/75 R16C 107/105R** → titlul spune `107/105R`
  - coloane: `load_index=107/105`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14106** `tracmax-x-privilo-vs450-195-75-r16c-110r`
  - titlu: **Tracmax X-privilo VS450 195/75 R16C 110R** → titlul spune `110R`
  - coloane: `load_index=110`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo VS450 195/75 R16C 110R`) · coloana negăsită
- **#14108** `tracmax-x-privilo-vs450-205-70-r15c-106-104r`
  - titlu: **Tracmax X-privilo VS450 205/70 R15C 106/104R** → titlul spune `106/104R`
  - coloane: `load_index=106/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14109** `tracmax-x-privilo-vs450-205-75-r16c-110r`
  - titlu: **Tracmax X-privilo VS450 205/75 R16C 110R** → titlul spune `110R`
  - coloane: `load_index=110`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo VS450 205/75 R16C 110R`) · coloana negăsită
- **#14110** `tracmax-x-privilo-vs450-215-65-r16c-109r`
  - titlu: **Tracmax X-privilo VS450 215/65 R16C 109R** → titlul spune `109R`
  - coloane: `load_index=109`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`tracmax x privilo vs450 215/65 R16C 109R`) · coloana negăsită

### `indice_sarcina+indice_viteza` — 550 produse

- **#14291** `triangle-tr777-175-70-r14-88t`
  - titlu: **Triangle TR777 175/70 R14 88T** → titlul spune `88T`
  - coloane: `load_index=84`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14292** `triangle-tr777-185-60-r15-88t`
  - titlu: **Triangle TR777 185/60 R15 88T** → titlul spune `88T`
  - coloane: `load_index=84`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14300** `triangle-tr777-215-60-r16-99h`
  - titlu: **Triangle TR777 215/60 R16 99H** → titlul spune `99H`
  - coloane: `load_index=95`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Triangle TR777 215/60 R16 99H`) · coloana negăsită
- **#14304** `triangle-tr928-215-65-r15-100h`
  - titlu: **Triangle TR928 215/65 R15 100H** → titlul spune `100H`
  - coloane: `load_index=96`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14737** `yokohama-advan-sport-v105-235-50-r19-99w`
  - titlu: **Yokohama Advan Sport V105 235/50 R19 99W** → titlul spune `99W`
  - coloane: `load_index=105`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Yokohama Advan Sport V105 235/50 R19 99W`) · coloana negăsită
- **#6881** `hilo-brawn-xc1-205-65-r16c`
  - titlu: **Hilo Brawn XC1 205/65 R16C** → titlul spune `—`
  - coloane: `load_index=107/105`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6931** `hilo-sport-xv1-235-75-r15`
  - titlu: **Hilo Sport XV1 235/75 R15** → titlul spune `—`
  - coloane: `load_index=105`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#8501** `lassa-greenways-185-70-r14`
  - titlu: **Lassa Greenways 185/70 R14** → titlul spune `—`
  - coloane: `load_index=88`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana **confirmată** (`Anvelopa Lassa Greenways 185/70 R14 88H`)
- **#8502** `lassa-greenways-195-70-r14`
  - titlu: **Lassa Greenways 195/70 R14** → titlul spune `—`
  - coloane: `load_index=91`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana **confirmată** (`Anvelopa Lassa Greenways 195/70 R14 91T`)
- **#8610** `lassa-snoways-3-225-40-r18`
  - titlu: **Lassa Snoways 3 225/40 R18** → titlul spune `—`
  - coloane: `load_index=92`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `model` — 276 produse

- **#14570** `vredestein-sportrac-5-195-55-r16-91v-xl-vw`
  - titlu: **Vredestein Sportrac 5 195/55 R16 91V XL VW** → titlul spune `91V XL`
  - coloane: `load_index=91`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Vredestein Sportrac 5 195/55 R16 91V XL VW`) · coloana negăsită
- **#14571** `vredestein-sportrac-5-195-65-r15-91h-vw`
  - titlu: **Vredestein Sportrac 5 195/65 R15 91H VW** → titlul spune `91H`
  - coloane: `load_index=91`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Vredestein Sportrac 5 195/65 R15 91H VW`) · coloana negăsită
- **#14588** `vredestein-ultrac-205-65-r15-99h-xl-vw`
  - titlu: **Vredestein Ultrac 205/65 R15 99H XL VW** → titlul spune `99H XL`
  - coloane: `load_index=99`, `speed_index=H`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Vredestein Ultrac 205/65 R15 99H XL VW`) · coloana negăsită
- **#14736** `yokohama-advan-sport-v105-225-45-r18-95y-mo`
  - titlu: **Yokohama Advan Sport V105 225/45 R18 95Y MO** → titlul spune `95Y`
  - coloane: `load_index=95`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14739** `yokohama-advan-sport-v105-245-35-r20-95y-mo`
  - titlu: **Yokohama Advan Sport V105 245/35 R20 95Y MO** → titlul spune `95Y`
  - coloane: `load_index=95`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Yokohama Advan Sport V105 245/35 R20 95Y MO`) · coloana negăsită
- **#14740** `yokohama-advan-sport-v105-245-40-r19-98y-xl-mo`
  - titlu: **Yokohama Advan Sport V105 245/40 R19 98Y XL MO** → titlul spune `98Y XL`
  - coloane: `load_index=98`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14741** `yokohama-advan-sport-v105-255-35-r19-96y-xl-mo`
  - titlu: **Yokohama Advan Sport V105 255/35 R19 96Y XL MO** → titlul spune `96Y XL`
  - coloane: `load_index=96`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14742** `yokohama-advan-sport-v105-265-40-r19-98y-n0`
  - titlu: **Yokohama Advan Sport V105 265/40 R19 98Y N0** → titlul spune `98Y`
  - coloane: `load_index=98`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14743** `yokohama-advan-sport-v105-275-30-r20-97y-mo`
  - titlu: **Yokohama Advan Sport V105 275/30 R20 97Y MO** → titlul spune `97Y`
  - coloane: `load_index=97`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14744** `yokohama-advan-sport-v105-275-35-r19-100y-xl-mo`
  - titlu: **Yokohama Advan Sport V105 275/35 R19 100Y XL MO** → titlul spune `100Y XL`
  - coloane: `load_index=100`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+indice_viteza+model` — 65 produse

- **#10146** `michelin-primacy-3-245-55-r17-mo`
  - titlu: **Michelin Primacy 3 245/55 R17 MO** → titlul spune `—`
  - coloane: `load_index=102`, `speed_index=W`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#368** `anvelope-diplomat-winter-st-185-65-r15-88t`
  - titlu: **Diplomat Winter ST 185/65 R15 88Т** → titlul spune `—`
  - coloane: `load_index=88`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Diplomat Winter ST 185/65 R15 88Т`) · coloana negăsită
- **#738** `anvelope-hankook-winter-icept-iz2-w616-205-55-r16-94t-xl`
  - titlu: **Hankook Winter I*cept IZ2 W616 205/55 R16 94Т XL** → titlul spune `— XL`
  - coloane: `load_index=94`, `speed_index=T`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Hankook Winter i*Cept IZ2 W616 205/55 R16 94Т XL`) · coloana negăsită
- **#833** `anvelope-joyroad-winter-rx808-225-40-r18-92vxl`
  - titlu: **Joyroad Winter RX808 225/40 R18 92VXL** → titlul spune `—`
  - coloane: `load_index=92`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1194** `anvelope-michelin-alpin-a4-175-65-r15-grnx`
  - titlu: **Michelin Alpin A4 175/65 R15 GRNX** → titlul spune `—`
  - coloane: `load_index=84`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1216** `anvelope-michelin-crossclimate-suv-275-55-r19-mo`
  - titlu: **Michelin Crossclimate SUV 275/55 R19 MO** → titlul spune `—`
  - coloane: `load_index=111`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1227** `anvelope-michelin-pilot-alpin-5-275-35-r19-mo`
  - titlu: **Michelin Pilot Alpin 5 275/35 R19 MO** → titlul spune `—`
  - coloane: `load_index=100`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1237** `anvelope-michelin-pilot-sport-3-275-40-r19-mo`
  - titlu: **Michelin Pilot Sport 3 275/40 R19 MO** → titlul spune `—`
  - coloane: `load_index=101`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1813** `anvelope-rosava-premiorri-viamaggiore-185-60-r15-88t`
  - titlu: **Rosava Premiorri ViaMaggiore 185/60 R15 88Т** → titlul spune `—`
  - coloane: `load_index=88`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Rosava Premiorri ViaMaggiore 185/60 R15 88Т`) · coloana negăsită
- **#1901** `anvelope-torque-tq022-155-70-r13-75t`
  - titlu: **Torque TQ022 155/70 R13 75Т** → titlul spune `—`
  - coloane: `load_index=75`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Torque TQ022 155/70 R13 75Т`) · coloana negăsită

### `indice_sarcina+indice_viteza+diametru_fara_C` — 62 produse

- **#1013** `anvelope-lassa-transway-195-75-r16c`
  - titlu: **Lassa Transway 195/75 R16C** → titlul spune `—`
  - coloane: `load_index=107`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1014** `anvelope-lassa-transway-2-195-r14c`
  - titlu: **Lassa Transway 2 195 R14C** → titlul spune `—`
  - coloane: `load_index=106/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1016** `anvelope-lassa-transway-205-65-r16c`
  - titlu: **Lassa Transway 205/65 R16C** → titlul spune `—`
  - coloane: `load_index=107/105`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Transway 205/65 R16C`) · coloana negăsită
- **#1017** `anvelope-lassa-transway-215-75-r16c`
  - titlu: **Lassa Transway 215/75 R16C** → titlul spune `—`
  - coloane: `load_index=113/111`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Transway 215/75 R16C`) · coloana negăsită
- **#1018** `anvelope-lassa-transway-a-t-215-75-r16c`
  - titlu: **Lassa Transway A/T 215/75 R16C** → titlul spune `—`
  - coloane: `load_index=113`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1019** `anvelope-lassa-transway-a-t-235-65-r16c`
  - titlu: **Lassa Transway A/T 235/65 R16C** → titlul spune `—`
  - coloane: `load_index=121/119`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Transway A/T 235/65 R16C`) · coloana negăsită
- **#1099** `anvelope-linglong-radial-701-155-70-r12c`
  - titlu: **Linglong Radial 701 155/70 R12C** → titlul spune `—`
  - coloane: `load_index=104/102`, `speed_index=N`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1190** `anvelope-michelin-agilis-alpin-205-75-r16c`
  - titlu: **Michelin Agilis Alpin 205/75 R16C** → titlul spune `—`
  - coloane: `load_index=110/108`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1475** `anvelope-petlas-full-grip-pt925-215-65-r16c-109-107t`
  - titlu: **Petlas Full Grip PT925 215/65 R16C 109/107T** → titlul spune `109/107T`
  - coloane: `load_index=109`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Petlas Full Grip PT925 215/65 R16C 109/107T`) · coloana negăsită
- **#1496** `anvelope-petlas-power-pt835-285-65-r16c`
  - titlu: **Petlas Power PT835 285/65 R16C** → titlul spune `—`
  - coloane: `load_index=128`, `speed_index=N`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Petlas Power PT835 285/65 R16C`) · coloana negăsită

### `indice_sarcina` — 39 produse

- **#14302** `triangle-tr918-205-60-r16-96h`
  - titlu: **Triangle TR918 205/60 R16 96H** → titlul spune `96H`
  - coloane: `load_index=92`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#14458** `viking-protech-newgen-235-55-r18-100v`
  - titlu: **Viking ProTech NewGen 235/55 R18 100V** → titlul spune `100V`
  - coloane: `load_index=110`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Viking ProTech NewGen 235/55 R18 100V`) · coloana negăsită
- **#459** `anvelope-goodyear-eagle-f1-asymmetric-5-235-45-r17-99y`
  - titlu: **Goodyear Eagle F1 Asymmetric 5 235/45 R17 99Y** → titlul spune `99Y`
  - coloane: `load_index=94`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana **confirmată** (`Anvelopa Goodyear Eagle F1 Asymmetric 5 235/45 R17 94Y`)
- **#770** `anvelope-hilo-arctic-s6-195-70-r15c-104-102r`
  - titlu: **Hilo Arctic S6 195/70 R15C 104/102R** → titlul spune `104/102R`
  - coloane: `load_index=104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#776** `anvelope-hilo-arctic-xs1-175-r14c-99-99r`
  - titlu: **Hilo Arctic XS1 175 R14C 99/99R** → titlul spune `99/99R`
  - coloane: `load_index=99`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1164** `anvelope-maxxis-ma-slw-presa-spike-225-70-r15c-112-100q`
  - titlu: **Maxxis MA-SLW Presa Spike 225/70 R15C 112/100Q** → titlul spune `112/100Q`
  - coloane: `load_index=112/110`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Maxxis MA-SLW Presa Spike 225/70 R15C 112/100Q`) · coloana negăsită
- **#1473** `anvelope-petlas-full-grip-pt925-205-70-r15c-106-104r`
  - titlu: **Petlas Full Grip PT925 205/70 R15C 106/104R** → titlul spune `106/104R`
  - coloane: `load_index=106`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Petlas Full Grip PT925 205/70 R15C 106/104R`) · coloana negăsită
- **#1484** `anvelope-petlas-full-grip-pt935-215-65-r16c-109-107r`
  - titlu: **Petlas Full Grip PT935 215/65 R16C 109/107R** → titlul spune `109/107R`
  - coloane: `load_index=109`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Petlas Full Grip PT935 215/65 R16C 109/107R`) · coloana negăsită
- **#1795** `anvelope-rosava-itegro-175-65-r14-82h`
  - titlu: **Rosava Itegro 175/65 R14 82H** → titlul spune `82H`
  - coloane: `load_index=84`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Rosava Itegro 175/65 R14 82H`) · coloana negăsită
- **#1829** `anvelope-rosava-snowgard-van-205-65-r16c-103-101r`
  - titlu: **Rosava Snowgard-Van 205/65 R16C 103/101R** → titlul spune `103/101R`
  - coloane: `load_index=103`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Rosava Snowgard-Van 205/65 R16C 103/101R`) · coloana negăsită

### `indice_viteza` — 35 produse

- **#14301** `triangle-tr777-215-60-r17-96h`
  - titlu: **Triangle TR777 215/60 R17 96H** → titlul spune `96H`
  - coloane: `load_index=96`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Triangle TR777 215/60 R17 96H`) · coloana negăsită
- **#774** `anvelope-hilo-arctic-s9-245-55-r19-103t`
  - titlu: **Hilo Arctic S9 245/55 R19 103T** → titlul spune `103T`
  - coloane: `load_index=103`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`hilo arctic s9 245/55 R19 103T`) · coloana negăsită
- **#832** `anvelope-joyroad-winter-rx808-205-70-r15-96t`
  - titlu: **Joyroad Winter RX808 205/70 R15 96T** → titlul spune `96T`
  - coloane: `load_index=96`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1060** `anvelope-leao-nova-force-c-s-285-45-r19-111w-xl`
  - titlu: **Leao Nova-Force C/S 285/45 R19 111W XL** → titlul spune `111W XL`
  - coloane: `load_index=111`, `speed_index=T`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1394** `anvelope-nexen-winguard-winspike-3-205-65-r15-99t`
  - titlu: **Nexen WinGuard WinSpike 3 205/65 R15 99T** → titlul spune `99T`
  - coloane: `load_index=99`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`nexen winguard winspike 3 205/65 R15 99T`) · coloana negăsită
- **#1453** `anvelope-otani-wk1000225-60-r17-99v`
  - titlu: **Otani WK1000225/60 R17 99V** → titlul spune `99V`
  - coloane: `load_index=99`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`otani wk1000 225/60 R17 99V`) · coloana negăsită
- **#1726** `anvelope-riken-uhp-215-45-zr18-93y-xl`
  - titlu: **Riken UHP 215/45 ZR18 93Y XL** → titlul spune `93Y XL`
  - coloane: `load_index=93`, `speed_index=M`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#2089** `anvelope-tracmax-x-privilo-rs01-265-45-r20-108y-xl`
  - titlu: **Tracmax X-Privilo RS01+ 265/45 R20 108Y XL** → titlul spune `108Y XL`
  - coloane: `load_index=108`, `speed_index=W`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Tracmax X-privilo RS01+ 265/45 R20 108Y XL`) · coloana negăsită
- **#3210** `bridgestone-turanza-t001-225-60-r16-98v-1`
  - titlu: **Bridgestone Turanza T001 225/60 R16 98V** → titlul spune `98V`
  - coloane: `load_index=98`, `speed_index=W`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Bridgestone Turanza T001 225/60 R16 98V`) · coloana negăsită
- **#3831** `continental-contiwintercontact-ts870p-275-45-r20-110v-xl`
  - titlu: **Continental ContiWinterContact TS870P 275/45 R20 110V XL** → titlul spune `110V XL`
  - coloane: `load_index=110`, `speed_index=NULL`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+diametru_fara_C` — 19 produse

- **#14288** `triangle-tr737-185-r14c-102-100q-8pr`
  - titlu: **Triangle TR737 185 R14C 102/100Q 8PR** → titlul spune `102/100Q`
  - coloane: `load_index=102`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#117** `annaite-an658-225-70-r15c-112-110-8pr`
  - titlu: **Annaite AN658 225/70 R15C 112/110 8PR** → titlul spune `—`
  - coloane: `load_index=112/110`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Annaite AN658 225/70 R15C 112/110 8PR`) · coloana negăsită
- **#1629** `anvelope-platin-rp-700-van-allseason-205-75-r16c-110-118r`
  - titlu: **Platin RP 700 Van Allseason 205/75 R16C 110/118R** → titlul spune `110/118R`
  - coloane: `load_index=118/110`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Platin RP 700 Van Allseason 205/75 R16C 110/118R`) · coloana negăsită
- **#1947** `anvelope-torque-wtq7000-195-75-r16c-107-105r`
  - titlu: **Torque WTQ7000 195/75 R16C 107/105R** → titlul spune `107/105R`
  - coloane: `load_index=107`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#3725** `continental-contivancontact-100-235-65-r16c-121-119r`
  - titlu: **Continental ContiVanContact 100 235/65 R16C 121/119R** → titlul spune `121/119R`
  - coloane: `load_index=115/113`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6332** `hankook-vantra-transit-ra58-215-60-r17c-109t-107t`
  - titlu: **Hankook Vantra Transit RA58 215/60 R17C 109T/107T** → titlul spune `109T`
  - coloane: `load_index=109/107`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6816** `hilo-arctic-s6-215-65-r16c-109-107r-8pr`
  - titlu: **Hilo Arctic S6 215/65 R16C 109/107R 8PR** → titlul spune `109/107R`
  - coloane: `load_index=NULL`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6821** `hilo-arctic-s6-225-70-r15c-112-110r`
  - titlu: **Hilo Arctic S6 225/70 R15C 112/110R** → titlul spune `112/110R`
  - coloane: `load_index=112`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6822** `hilo-arctic-s6-235-65-r16c-115-113r`
  - titlu: **Hilo Arctic S6 235/65 R16C 115/113R** → titlul spune `115/113R`
  - coloane: `load_index=115`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#8567** `lassa-multiways-c-205-65-r15c-100-102r`
  - titlu: **Lassa Multiways-C 205/65 R15C 100/102R** → titlul spune `100/102R`
  - coloane: `load_index=102/100`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Multiways-C 205/65 R15C 100/102R`) · coloana negăsită

### `diametru_fara_C+model` — 16 produse

- **#1924** `anvelope-torque-tq7000-225-75-r16s-121-120r`
  - titlu: **Torque TQ7000 225/75 R16С 121/120R** → titlul spune `121/120R`
  - coloane: `load_index=121/120`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1941** `anvelope-torque-wtq5000-215-65-r16s-109-107r`
  - titlu: **Torque WTQ5000 215/65 R16С 109/107R** → titlul spune `109/107R`
  - coloane: `load_index=109/107`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6325** `hankook-vantra-lt-ra18-195-75-r16c-107r-mo-v`
  - titlu: **Hankook Vantra LT RA18 195/75 R16C 107R MO-V** → titlul spune `107R`
  - coloane: `load_index=107`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6326** `hankook-vantra-lt-ra18-195-75-r16s-107r`
  - titlu: **Hankook Vantra LT RA18 195/75 R16С 107R** → titlul spune `107R`
  - coloane: `load_index=107`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#9157** `linglong-lmc8-195-r14c-pr8-106-104p`
  - titlu: **Linglong LMC8 195 R14C PR8 106/104P** → titlul spune `106/104P`
  - coloane: `load_index=106/104`, `speed_index=P`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#9470** `matador-nordicca-van-235-65-r16-c-115-113r-8pr`
  - titlu: **Matador Nordicca Van 235/65 R16 C 115/113R 8PR** → titlul spune `115/113R`
  - coloane: `load_index=115/113`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#9495** `maxxis-cr-966n-trailermaxx-195-55-r10c-98p`
  - titlu: **Maxxis CR-966N Trailermaxx 195/55 R10C 98P** → titlul spune `98P`
  - coloane: `load_index=98`, `speed_index=P`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#11131** `ovation-v-07as-195-70-r15c-104-102r-8pr`
  - titlu: **Ovation V-07AS 195/70 R15C 104/102R 8PR** → titlul spune `104/102R`
  - coloane: `load_index=104/102`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#11132** `ovation-v-07as-195-75-r16c-107-105r-8pr`
  - titlu: **Ovation V-07AS 195/75 R16C 107/105R 8PR** → titlul spune `107/105R`
  - coloane: `load_index=107/105`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#11133** `ovation-v-07as-205-65-r16c-107-105t-8pr`
  - titlu: **Ovation V-07AS 205/65 R16C 107/105T 8PR** → titlul spune `107/105T`
  - coloane: `load_index=107/105`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `latime_sau_profil` — 15 produse

- **#14652** `vredestein-ultrac-pro-285-40-r20-108y-xl`
  - titlu: **Vredestein Ultrac Pro 285/40 R20 108Y XL** → titlul spune `108Y XL`
  - coloane: `load_index=108`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Vredestein Ultrac Pro 285/40 R20 108Y XL`) · coloana negăsită
- **#8646** `lassa-transway-195-r14c`
  - titlu: **Lassa Transway 195 R14C** → titlul spune `—`
  - coloane: `load_index=NULL`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Transway 195 R14C`) · coloana negăsită
- **#446** `anvelope-fulda-kristall-control-hp2-225-55-r17-101v-xl`
  - titlu: **Fulda Kristall Control HP2 225/55 R17 101V XL** → titlul spune `101V XL`
  - coloane: `load_index=101`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Fulda Kristall Control HP2 225/55 R17 101V XL`) · coloana negăsită
- **#4844** `fronway-fronwing-a-s-245-40-r18-97w-xl`
  - titlu: **Fronway Fronwing A/S 245/40 R18 97W XL** → titlul spune `97W XL`
  - coloane: `load_index=97`, `speed_index=W`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#5051** `gislaved-ultra-speed-2-255-35-r20-97y-xl`
  - titlu: **Gislaved Ultra Speed 2 255/35 R20 97Y XL** → titlul spune `97Y XL`
  - coloane: `load_index=97`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`gislaved ultra speed 2 255/35 R20 97Y xl`) · coloana negăsită
- **#5305** `goodyear-ultragrip-performance-gen-1-225-45-r18-95h-xl`
  - titlu: **Goodyear UltraGrip Performance Gen-1 225/45 R18 95H XL** → titlul spune `95H XL`
  - coloane: `load_index=95`, `speed_index=H`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#5775** `gripmax-suregrip-pro-winter-245-50-r20-105v-xl`
  - titlu: **Gripmax SureGrip Pro Winter 245/50 R20 105V XL** → titlul spune `105V XL`
  - coloane: `load_index=105`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6798** `hankook-winter-ipike-lt-rw09-195-75-r16c-107-105r`
  - titlu: **Hankook Winter i*Pike LT RW09 195/75 R16C 107/105R** → titlul spune `107/105R`
  - coloane: `load_index=107/105`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Hankook Winter i*Pike LT RW09 195/75 R16C 107/105R`) · coloana negăsită
- **#6913** `hilo-green-plus-245-45-r17-99w-xl`
  - titlu: **Hilo Green Plus 245/45 R17 99W XL** → titlul spune `99W XL`
  - coloane: `load_index=99`, `speed_index=W`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#7338** `kapsen-comfortmax-s801-205-60-r16-92v`
  - titlu: **Kapsen ComfortMax S801 205/60 R16 92V** → titlul spune `92V`
  - coloane: `load_index=92`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `diametru+latime_sau_profil+model` — 13 produse

- **#1139** `anvelope-matador-hectorra-van-185-r14c-102-100r-8pr`
  - titlu: **Matador Hectorra Van 185 R14C 102/100R 8PR** → titlul spune `102/100R`
  - coloane: `load_index=102/100`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#1756** `anvelope-roadx-frost-wc01-155-r12c-88-86r-8pr`
  - titlu: **Roadx Frost WC01 155 R12C 88/86R 8PR** → titlul spune `88/86R`
  - coloane: `load_index=88/86`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#2965** `barum-vanis-3-185-r14c-102-100r-8pr`
  - titlu: **Barum Vanis 3 185 R14C 102/100R 8PR** → titlul spune `102/100R`
  - coloane: `load_index=102/100`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Barum Vanis 3 185 R14C 102/100R 8PR`) · coloana negăsită
- **#4602** `fortune-fsr-102-195-r14c-106-104r-8pr`
  - titlu: **Fortune FSR-102 195 R14C 106/104R 8PR** → titlul spune `106/104R`
  - coloane: `load_index=106/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Fortune FSR-102 195 R14C 106/104R 8PR`) · coloana negăsită
- **#6151** `haida-hd737-185-r14c-102-100r-8pr`
  - titlu: **Haida HD737 185 R14C 102/100R 8PR** → titlul spune `102/100R`
  - coloane: `load_index=102/100`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Haida HD737 185 R14C 102/100R 8PR`) · coloana negăsită
- **#6877** `hilo-brawn-xc1-175-r14c-99-97r-8pr`
  - titlu: **Hilo Brawn XC1 175 R14C 99/97R 8PR** → titlul spune `99/97R`
  - coloane: `load_index=99/97`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#9530** `maxxis-mcv3-185-r14c-102-100r-8pr`
  - titlu: **Maxxis MCV3+ 185 R14C 102/100R 8PR** → titlul spune `102/100R`
  - coloane: `load_index=102/100`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#9533** `maxxis-mcv3-195-r14c-106-104r-8pr`
  - titlu: **Maxxis MCV3+ 195 R14C 106/104R 8PR** → titlul spune `106/104R`
  - coloane: `load_index=106/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#11121** `ovation-v-02-185-r14c-102-100r-8pr`
  - titlu: **Ovation V-02 185 R14C 102/100R 8PR** → titlul spune `102/100R`
  - coloane: `load_index=102/100`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Ovation V-02 185 R14C 102/100R 8PR`) · coloana negăsită
- **#11125** `ovation-v-02-195-r15c-106-104r-8pr`
  - titlu: **Ovation V-02 195 R15C 106/104R 8PR** → titlul spune `106/104R`
  - coloane: `load_index=106/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Ovation V-02 195 R15C 106/104R 8PR`) · coloana negăsită

### `diametru` — 10 produse

- **#14541** `vredestein-quatrac-pro-245-35-r18-92y-xl`
  - titlu: **Vredestein Quatrac Pro+ 245/35 R18 92Y XL** → titlul spune `92Y XL`
  - coloane: `load_index=92`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Vredestein Quatrac Pro+ 245/35 R18 92Y XL`) · coloana negăsită
- **#844** `anvelope-joyroad-winter-rx818-235-65-r17-104t`
  - titlu: **Joyroad Winter RX818 235/65 R17 104T** → titlul spune `104T`
  - coloane: `load_index=104`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#4564** `firemax-fm809-195-65-r16c-104-102t-8pr`
  - titlu: **Firemax FM809 195/65 R16C 104/102T 8PR** → titlul spune `104/102T`
  - coloane: `load_index=104/102`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Firemax FM809 195/65 R16C 104/102T 8PR`) · coloana negăsită
- **#5315** `goodyear-ultragrip-performance-suv-255-50-r20-109v`
  - titlu: **Goodyear UltraGrip Performance+ SUV 255/50 R20 109V** → titlul spune `109V`
  - coloane: `load_index=109`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#5447** `grenlander-colo-h02-205-65-r15-94v`
  - titlu: **Grenlander Colo H02 205/65 R15 94V** → titlul spune `94V`
  - coloane: `load_index=94`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Grenlander Colo H02 205/65 R15 94V`) · coloana negăsită
- **#7263** `joyroad-winter-rx821-195-65-r15-91t`
  - titlu: **Joyroad Winter RX821 195/65 R15 91T** → titlul spune `91T`
  - coloane: `load_index=91`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#10382** `nereus-ns805-225-45-r18-95v`
  - titlu: **Nereus NS805+ 225/45 R18 95V** → titlul spune `95V`
  - coloane: `load_index=95`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Nereus NS805+ 225/45 R18 95V`) · coloana negăsită
- **#12353** `roadx-rxmotion-performa-dh51-195-60-r16-89v`
  - titlu: **Roadx RxMotion Performa DH51 195/60 R16 89V** → titlul spune `89V`
  - coloane: `load_index=89`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Roadx RxMotion Performa DH51 195/60 R16 89V`) · coloana negăsită
- **#12662** `rydanz-r02s-275-30-r20-97w`
  - titlu: **Rydanz R02S 275/30 R20 97W** → titlul spune `97W`
  - coloane: `load_index=97`, `speed_index=W`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`rydanz r02s 275/30 R20 97W`) · coloana negăsită
- **#12686** `sailun-atrezzo-4-seasons-195-55-r20-95h`
  - titlu: **Sailun Atrezzo 4 Seasons 195/55 R20 95H** → titlul spune `95H`
  - coloane: `load_index=95`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Sailun Atrezzo 4 Seasons 195/55 R20 95H`) · coloana negăsită

### `indice_viteza+diametru_fara_C` — 8 produse

- **#2606** `arivo-transito-arz6-c-195-60-r16c-99-97h`
  - titlu: **Arivo Transito ARZ6-C 195/60 R16C 99/97H** → titlul spune `99/97H`
  - coloane: `load_index=99/97`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Arivo Transito ARZ6-C 195/60 R16C 99/97H`) · coloana negăsită
- **#4986** `fronway-vanplus-09-215-60-r17c-109-107t`
  - titlu: **Fronway Vanplus 09 215/60 R17C 109/107T** → titlul spune `109/107T`
  - coloane: `load_index=109/107`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Fronway Vanplus 09 215/60 R17C 109/107T`) · coloana negăsită
- **#7643** `kleber-transalp-2-195-70-r15c-104r`
  - titlu: **Kleber Transalp 2 195/70 R15C 104R** → titlul spune `104R`
  - coloane: `load_index=104`, `speed_index=E`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#7648** `kleber-transalp-2-225-70-r15c-112s`
  - titlu: **Kleber Transalp 2 225/70 R15C 112S** → titlul spune `112S`
  - coloane: `load_index=112`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#7950** `kumho-portran-cw51-215-60-r17c-104h`
  - titlu: **Kumho PorTran CW51 215/60 R17C 104H** → titlul spune `104H`
  - coloane: `load_index=104`, `speed_index=C`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`kumho portran cw51 215/60 R17C 104H`) · coloana negăsită
- **#8671** `lassa-transway-3-225-70-r15c-116-114s`
  - titlu: **Lassa Transway 3 225/70 R15C 116/114S** → titlul spune `116/114S`
  - coloane: `load_index=116/114`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Transway 3 225/70 R15C 116/114S`) · coloana negăsită
- **#8672** `lassa-transway-3-235-65-r16c-121-119q`
  - titlu: **Lassa Transway 3 235/65 R16C 121/119Q** → titlul spune `121/119Q`
  - coloane: `load_index=121/119`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Lassa Transway 3 235/65 R16C 121/119Q`) · coloana negăsită
- **#10236** `mileking-mk737-215-65-r16c-109-107r-8pr`
  - titlu: **Mileking MK737 215/65 R16C 109/107R 8PR** → titlul spune `109/107R`
  - coloane: `load_index=109/107`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+indice_viteza+diametru_fara_C+model` — 7 produse

- **#1028** `anvelope-laufenn-lv01-x-fit-van-195-70-r15c-104-102r`
  - titlu: **Laufenn LV01 X Fit Van 195/70 R15C 104/102R** → titlul spune `01X`
  - coloane: `load_index=104/102`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Laufenn LV01 X Fit Van 195/70 R15C 104/102R`) · coloana negăsită
- **#4719** `fortune-travello-4s235-65-r16c-121-119r10pr`
  - titlu: **Fortune Travello 4S235/65 R16C 121/119R10PR** → titlul spune `10PR`
  - coloane: `load_index=121/119`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6329** `hankook-vantra-lt-ra18-215-75-r16s`
  - titlu: **Hankook Vantra LT RA18 215/75 R16С** → titlul spune `—`
  - coloane: `load_index=113/111`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#8738** `laufenn-lv01-x-fit-van-195-75-r16c-107-105r`
  - titlu: **Laufenn LV01 X Fit Van 195/75 R16C 107/105R** → titlul spune `01X`
  - coloane: `load_index=107/105`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#8740** `laufenn-lv01-x-fit-van-205-75-r16c-113-111r`
  - titlu: **Laufenn LV01 X Fit Van 205/75 R16C 113/111R** → titlul spune `01X`
  - coloane: `load_index=113/111`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Laufenn LV01 X Fit Van 205/75 R16C 113/111R`) · coloana negăsită
- **#8741** `laufenn-lv01-x-fit-van-215-65-r16c`
  - titlu: **Laufenn LV01 X Fit Van 215/65 R16C** → titlul spune `01X`
  - coloane: `load_index=109/107`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Laufenn LV01 X Fit Van 215/65 R16C`) · coloana negăsită
- **#8742** `laufenn-lv01-x-fit-van-225-70-r15c-112-110s`
  - titlu: **Laufenn LV01 X Fit Van 225/70 R15C 112/110S** → titlul spune `01X`
  - coloane: `load_index=112/110`, `speed_index=S`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Laufenn LV01 X Fit Van 225/70 R15C 112/110S`) · coloana negăsită

### `runflat+model` — 7 produse

- **#3097** `bridgestone-blizzak-lm001-285-45-r21-113v-xl-run-flat`
  - titlu: **Bridgestone Blizzak LM001 285/45 R21 113V XL Run-Flat *** → titlul spune `113V XL`
  - coloane: `load_index=113`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#6536** `hankook-ventus-s1-evo-3-suv-k127-275-40-r21-107y-xl-run-flat`
  - titlu: **Hankook Ventus S1 Evo 3 SUV K127 275/40 R21 107Y XL RUN-FLAT *** → titlul spune `107Y XL`
  - coloane: `load_index=107`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#10002** `michelin-pilot-alpin-5-suv-245-50-r19-105v-xl-run-flat`
  - titlu: **Michelin Pilot Alpin 5 SUV 245/50 R19 105V XL Run-Flat *** → titlul spune `105V XL`
  - coloane: `load_index=105`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#10076** `michelin-pilot-sport-4-suv-275-40-r22-107y-xl-rf`
  - titlu: **Michelin Pilot Sport 4 SUV 275/40 R22 107Y XL RF** → titlul spune `107Y XL`
  - coloane: `load_index=107`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#10092** `michelin-pilot-sport-4-suv-315-35-r22-111y-xl-rf`
  - titlu: **Michelin Pilot Sport 4 SUV 315/35 R22 111Y XL RF** → titlul spune `111Y XL`
  - coloane: `load_index=111`, `speed_index=Y`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#11691** `pirelli-winter-sottozero-iii-245-45-r20-103v-xl-run-flat`
  - titlu: **Pirelli Winter SottoZero III 245/45 R20 103V XL Run-Flat *** → titlul spune `103V XL`
  - coloane: `load_index=103`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Pirelli Winter SottoZero III 245/45 R20 103V XL Run-Flat *`) · coloana negăsită
- **#11693** `pirelli-winter-sottozero-iii-275-40-r20-106v-xl-run-flat`
  - titlu: **Pirelli Winter SottoZero III 275/40 R20 106V XL Run-Flat *** → titlul spune `106V XL`
  - coloane: `load_index=106`, `speed_index=V`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Pirelli Winter SottoZero III 275/40 R20 106V XL Run-Flat *`) · coloana negăsită

### `indice_sarcina+model` — 6 produse

- **#5416** `grenlander-colo-h01-155-70-r13-75`
  - titlu: **Grenlander Colo H01 155/70 R13 75** → titlul spune `—`
  - coloane: `load_index=75`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Grenlander Colo H01 155/70 R13 75`) · coloana negăsită
- **#8903** `linglong-crosswind-a-t-235-75-r15-100`
  - titlu: **Linglong Crosswind A/T 235/75 R15 100** → titlul spune `—`
  - coloane: `load_index=100`, `speed_index=NULL`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Linglong Crosswind A/T 235/75 R15 100`) · coloana negăsită
- **#13048** `starmaxx-incurro-winter-w870-245-60-r18-105h-reinforced`
  - titlu: **Starmaxx Incurro Winter W870 245/60 R18 105H Reinforced** → titlul spune `105H`
  - coloane: `load_index=150`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Starmaxx Incurro Winter W870 245/60 R18 105H Reinforced`) · coloana negăsită
- **#13533** `torque-wtq7000-215-65-r16s-109-107r`
  - titlu: **Torque WTQ7000 215/65 R16С 109/107R** → titlul spune `109/107R`
  - coloane: `load_index=109`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#13534** `torque-wtq7000-225-70-r15s-112-110r`
  - titlu: **Torque WTQ7000 225/70 R15С 112/110R** → titlul spune `112/110R`
  - coloane: `load_index=112`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#13535** `torque-wtq7000as-215-75-r16s-116-114r`
  - titlu: **Torque WTQ7000AS 215/75 R16С 116/114R** → titlul spune `116/114R`
  - coloane: `load_index=116`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+indice_viteza+latime_sau_profil` — 3 produse

- **#4205** `debica-frigo-2-165-70-r13`
  - titlu: **Debica Frigo 2 165/70 R13** → titlul spune `—`
  - coloane: `load_index=79`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#10493** `nexen-n-blue-hd-plus-225-70-r16-103t`
  - titlu: **Nexen N'blue HD Plus 225/70 R16 103T** → titlul spune `103T`
  - coloane: `load_index=95`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#13345** `tigar-winter-suv-215-60-r17`
  - titlu: **Tigar Winter SUV 215/60 R17** → titlul spune `—`
  - coloane: `load_index=96`, `speed_index=H`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+indice_viteza+diametru` — 2 produse

- **#3901** `cooper-zeon-4xs-235-60-r18`
  - titlu: **Cooper Zeon 4XS 235/60 R18** → titlul spune `—`
  - coloane: `load_index=103`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#11287** `petlas-full-grip-pt935-215-65-r15c`
  - titlu: **Petlas Full Grip PT935 215/65 R15C** → titlul spune `—`
  - coloane: `load_index=104/102`, `speed_index=T`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Petlas Full Grip PT935 215/65 R15C`) · coloana negăsită

### `indice_viteza+model` — 2 produse

- **#11508** `pirelli-cinturato-p7-225-45-r18-91w-mo`
  - titlu: **Pirelli Cinturato P7 225/45 R18 91W MO** → titlul spune `91W`
  - coloane: `load_index=91`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită
- **#12047** `roadboss-celeritas-n906-225-55-r16-w99-xl`
  - titlu: **Roadboss Celeritas N906 225/55 R16 W99 XL** → titlul spune `99XL XL`
  - coloane: `load_index=99`, `speed_index=W`, `is_xl=true`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+indice_viteza+diametru+latime_sau_profil+model` — 1 produse

- **#14282** `triangle-tr645-185-r14c-102-100r-8pr`
  - titlu: **Triangle TR645 185 R14C 102/100R 8PR** → titlul spune `102/100R`
  - coloane: `load_index=102`, `speed_index=S`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Triangle TR645 185 R14C 102/100R 8PR`) · coloana negăsită

### `indice_sarcina+diametru_fara_C+model` — 1 produse

- **#1939** `anvelope-torque-wtq5000-195-70-r15s-104-101r`
  - titlu: **Torque WTQ5000 195/70 R15С 104/101R** → titlul spune `104/101R`
  - coloane: `load_index=101/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Torque WTQ5000 195/70 R15С 104/101R`) · coloana negăsită

### `latime_sau_profil+model` — 1 produse

- **#2471** `aplus-a867r14c-195-106-104r`
  - titlu: **Aplus A867R14C 195 106/104R** → titlul spune `106/104R`
  - coloane: `load_index=106/104`, `speed_index=R`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `diametru_fara_C+latime_sau_profil` — 1 produse

- **#7219** `joyroad-van-rx5-195-r15c-106-104q`
  - titlu: **Joyroad Van RX5 195 R15C 106/104Q** → titlul spune `106/104Q`
  - coloane: `load_index=106/104`, `speed_index=Q`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Joyroad Van RX5 195 R15C 106/104Q`) · coloana negăsită

### `indice_sarcina+indice_viteza+diametru+latime_sau_profil` — 1 produse

- **#8696** `laufenn-lh71-g-fit-4s-205-55-r16-91h`
  - titlu: **Laufenn LH71 G Fit 4S 205/55 R16 91H** → titlul spune `91H`
  - coloane: `load_index=104`, `speed_index=Y`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul negăsit · coloana negăsită

### `indice_sarcina+diametru+latime_sau_profil` — 1 produse

- **#11446** `petlas-snowmaster-2-sport-255-55-r20-110v`
  - titlu: **Petlas Snowmaster 2 Sport 255/55 R20 110V** → titlul spune `110V`
  - coloane: `load_index=101`, `speed_index=V`, `is_xl=false`
  - `attributes`: sarcină `—`, viteză `—`, dimensiune `—`
  - HTML-ul vechi: sarcină `—`, viteză `—`
  - la pandashop: titlul **confirmat** (`Anvelopa Petlas Snowmaster 2 Sport 255/55 R20 110V`) · coloana **confirmată** (`Anvelopa Petlas Snowmaster 2 Sport 235/50 R18 101V`)
