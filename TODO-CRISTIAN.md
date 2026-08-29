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

## 7. Logo-urile de marcă — 78 din 132, restul lipsesc

Urcate la 28 august 2026: **78 de mărci**, care acoperă **11.463 din 15.005 produse (76,4%)**.
Surse: Wikimedia Commons (37) și site-urile oficiale ale producătorilor (41).

Cele 54 rămase n-au logo găsibil din surse acceptabile. Lista completă e în
`tools/logos/marci-checklist.csv`; primele cinci: TRACMAX (713), Haida (278),
Fronway (271), Crosswind (220), Kpatos (126).

Cazul TRACMAX, cel mai mare gol: marca n-are site propriu. Fișierele care circulă
sunt pe site-uri de distribuitori (`interpneu.de`), iar site-ul grupului proprietar
(Shandong Yongsheng) arată logo-ul companiei, nu al mărcii. Dacă obții fișierul
oficial de la furnizor, acoperirea sare la 81%.

Dacă primești fișierul oficial al vreuneia, pune-l în `logos-sursa/` cu numele
slug-ului și rulează:

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

## 9. Traducerea rusă a paginii de servicii

Textul românesc din `src/content/servicii.ts` e preluat cuvânt cu cuvânt din
`AnvelopeUngheniServiciisiPreturi.docx` — prețurile și denumirile operațiunilor
sunt ale atelierului, nu ale mele.

**Varianta rusă e traducerea mea și nu a fost citită de un vorbitor nativ.** E
corectă tehnic (шиномонтаж, балансировка, вентиль, датчик давления), dar tonul
comercial merită o trecere de la cineva care vorbește rusa zilnic — mai ales
cârligele („Presiunea care nu scade de la o lună la alta") și îndemnurile.

Totul stă într-un singur fișier, în perechi `t("ro", "ru")`, deci corecturile se
fac direct acolo, fără să umbli prin componente.

## 10. Fotografiile serviciilor

Zece imagini, toate de pe Wikimedia Commons, cu autorul și licența trecute atât
în `src/content/servicii.ts` (câmpul `foto`, de unde se generează atribuirea de
sub fiecare fotografie), cât și în `public/servicii/LICENSES.md`.

Sunt fotografii reale de atelier, dar **nu din atelierul nostru**. Când ai poze
proprii, ele sunt de preferat: schimbi fișierul din `public/servicii/`, pui
`sursa: "Anvelope Ungheni"`, `licenta: "Foto proprie"` și ștergi rândul din
LICENSES.md. Atribuirea de sub imagine dispare singură.

## 11. E-mailul de comandă — cheia Resend

Comanda se salvează în bază și pleacă pe WhatsApp, dar **e-mailul către
info@anvelope-ungheni.md nu pleacă încă**: `RESEND_API_KEY` e gol. Ai ales
(30 august 2026) să rămână așa deocamdată — codul e scris și așteaptă cheia.

**Cât timp e așa, comenzile se citesc din baza de date.** Dacă un client nu
apasă butonul de WhatsApp de pe ecranul de confirmare, singurul loc unde apare
comanda e tabelul `orders`. Merită verificat zilnic până se pune cheia.

Ce e de făcut, o singură dată:

1. Cont pe [resend.com](https://resend.com) (gratuit până la 3.000 de e-mailuri
   pe lună — suficient).
2. **Domains → Add Domain → `anvelope-ungheni.md`**, apoi cele trei înregistrări
   DNS (SPF, DKIM, DMARC) la registrarul domeniului. Fără asta, e-mailurile ori
   nu pleacă, ori ajung în spam.
3. **API Keys → Create**, apoi:

```bash
npx vercel env add RESEND_API_KEY production   # lipești cheia
npx vercel env add RESEND_FROM production      # Anvelope Ungheni <comenzi@anvelope-ungheni.md>
```

4. Deploy și o comandă de test. `emailTrimis` din răspuns spune adevărul: dacă
   e `false`, comanda a intrat oricum în bază.

Adresa destinatarului nu e scrisă în cod — vine din `settings.email`, deci se
schimbă din baza de date, nu din repo.

## 12. WhatsApp: de ce e buton, nu trimitere automată

Pe ecranul de confirmare, comanda e gata scrisă și pleacă la un clic spre
numărul atelierului. **Nu se trimite singură** și nu se poate, fără WhatsApp
Business API de la Meta: acela cere cont de business verificat, iar numărul
înregistrat acolo nu mai poate fi folosit din aplicația WhatsApp obișnuită —
adică exact ce folosiți zilnic.

Dacă vrei totuși trimitere automată, canalul corect e e-mailul (punctul 11) plus,
eventual, un al doilea număr dedicat pentru API. Spune-mi și îl configurez.
