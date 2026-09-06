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

## 5. Textul juridic al paginilor legale

Paginile sunt acum cinci, nu patru: s-a adăugat **Politica de cookie**.

| Pagină | RO | RU |
|---|---|---|
| Politica de confidențialitate | scrisă, publicată | tradusă, publicată |
| Politica de cookie | scrisă, publicată | tradusă, publicată |
| Termeni și condiții | lipsește | lipsește |
| Livrare și plată | lipsește | lipsește |
| Retur și garanție | lipsește | lipsește |

Cele fără text stau pe `noindex` și arată blocul „Textul este în pregătire", cu
trimitere la telefon. Nu apar în sitemap până nu au text.

Varianta rusă a celor două publicate e **traducerea mea**, cu aceleași rezerve ca
la punctul 9: termenii juridici sunt cei din versiunea rusă a Legii 133/2011, dar
tonul n-a fost citit de un vorbitor nativ.

**Ce am nevoie de la tine pentru confidențialitate**, două lucruri pe care nu le
inventez:

1. **Denumirea juridică și IDNO-ul societății.** Acum politica numește atelierul
   „Anvelope Ungheni" și adresa din `settings`. Corect, dar o politică de
   confidențialitate se cere semnată de o persoană juridică identificabilă.
2. **Confirmarea a două termene pe care le-am pus ca implicite rezonabile:**
   comenzile se păstrează 2 ani (durata garanției) plus termenul contabil, iar
   programările la serviciu 12 luni. Dacă vrei alte durate, se schimbă textul.

Ambele se completează din admin, în `legal_pages.body_ro` — nu e nevoie de deploy.

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

## 11. E-mailul de comandă — REZOLVAT (5 septembrie 2026)

Comenzile pleacă pe e-mail. Nu mai e nimic de făcut aici; secțiunea rămâne ca
să se știe cum e legat.

Domeniul `anvelope-ungheni.md` e verificat în Resend — DKIM pe
`resend._domainkey`, SPF pe subdomeniul `send`, ambele adăugate în DNS-ul de la
Vercel. Sunt pe subdomenii, deci **nu ating MX-ul, SPF-ul și DMARC-ul poștei
existente** de pe `mail.anvelope-ungheni.md`.

Expeditorul e `comenzi@anvelope-ungheni.md`. Destinatarii, în ordine, din
`ORDER_NOTIFY_EMAIL`:

```
ermurachealex108@gmail.com     ← atelierul, prima
cristiermurache@gmail.com
```

Ordinea nu e decorativă: dacă Resend refuză trimiterea în bloc — se întâmplă
când **o singură** adresă din listă e invalidă sau suprimată — codul reia pe
rând, în ordinea asta. O adresă stricată nu mai poate face comanda invizibilă și
pentru cealaltă.

Adresele se schimbă fără deploy:

```bash
npx vercel env rm ORDER_NOTIFY_EMAIL production
npx vercel env add ORDER_NOTIFY_EMAIL production   # adrese separate prin virgulă
```

Dacă vreodată nu mai ajung comenzi: verifică întâi în Resend → Emails dacă
mesajul a plecat. Dacă scrie `delivered` și tot nu-l vezi, e la tine în Spam —
apasă „Nu este spam" o dată și următoarele vin în Inbox.

Comanda intră în `orders` **înainte** de e-mail și rămâne acolo orice s-ar
întâmpla cu trimiterea.

## 12. WhatsApp: de ce e buton, nu trimitere automată

Pe ecranul de confirmare, comanda e gata scrisă și pleacă la un clic spre
numărul atelierului. **Nu se trimite singură** și nu se poate, fără WhatsApp
Business API de la Meta: acela cere cont de business verificat, iar numărul
înregistrat acolo nu mai poate fi folosit din aplicația WhatsApp obișnuită —
adică exact ce folosiți zilnic.

Dacă vrei totuși trimitere automată, canalul corect e e-mailul (punctul 11) plus,
eventual, un al doilea număr dedicat pentru API. Spune-mi și îl configurez.

## 13. Marja de preț — decizie de luat, nu problemă de rezolvat

De pe 5 septembrie 2026, prețurile din catalog se confruntă zilnic cu pandashop
și se scriu **1:1**, fără adaos.

Nu e o alegere făcută la întâmplare. Regula din admin era „+15%", o valoare
implicită pusă la scrierea codului și nevalidată vreodată pe date reale. Am
comparat 5.799 de anvelope pe care le aveam și noi, și ei: mediana raportului
preț-nostru / preț-pandashop era **1.000**, iar 3.264 aveau prețul identic la
leu. Catalogul vindea deja la prețul lor. Cei 15% ar fi ridicat ~5.800 de
prețuri peste ce afișează pandashop public, unde le poate verifica orice client.

Dacă vrei adaos, se schimbă dintr-un singur rând, fără deploy:

```sql
update settings set pricing_rules = jsonb_build_object(
  'default_margin_pct', 10,          -- procentul
  'rounding',           'end_9',     -- 1234 -> 1239; 'none' lasă cifra exactă
  'by_brand',           '{}'::jsonb, -- excepții: {"Michelin": 8}
  'by_price_range',     '[]'::jsonb  -- [{"max":1000,"pct":20},{"min":5000,"pct":8}]
);
```

Se aplică la următoarea sincronizare, adică a doua zi la 3:00. Un preț pe care
l-ai pus cu mâna și l-ai marcat `price_locked = true` **nu se atinge niciodată**,
oricare ar fi regula.

## 14. Cele 4.800 de anvelope pe care pandashop nu le mai are

Catalogul conține ~4.800 de fișe moștenite din OpenCart care nu mai apar deloc
la pandashop — nici pe stoc, nici fără stoc. Sincronizarea **nu le atinge**,
deliberat: pot veni de la alt furnizor, iar stingerea lor e o decizie
comercială, nu una tehnică. Majoritatea sunt oricum `out_of_stock`, deci
ascunse din catalog.

Dacă hotărăști că nu se mai aduc deloc, se sting toate dintr-o rulare:

```bash
node --env-file=.env.local tools/sync/pandashop/refresh.mjs --delisted        # arată ce ar face
node --env-file=.env.local tools/sync/pandashop/refresh.mjs --delisted --apply
```

Nu se șterge nimic niciodată: URL-urile rămân `200`, ca să nu pierdem indexarea.

## 15. SEO — cele șapte lucruri pe care nu le pot face eu

Optimizarea tehnică e făcută (vezi `ARCHITECTURE.md §SEO`). Ce urmează sunt
lucruri care cer ori o decizie comercială, ori un cont la care n-am acces. Le
las în ordinea în care aduc trafic.

### 15.1 Google Business Profile — cel mai mare câștig din listă

Pentru „anvelope Ungheni" și „vulcanizare lângă mine", fișa de firmă din Google
Maps bate orice optimizare de site. Trebuie **revendicată** și completată cu
exact aceleași date ca pe site — literă cu literă, că așa le pune Google în
pereche:

```
Nume:     Anvelope Ungheni
Adresă:   Strada Decebal 62/1, Ungheni
Telefon:  068 263 644
Site:     https://anvelope-ungheni.md
Program:  luni–sâmbătă 9:00–20:00   (duminica — vezi §3, e încă necompletată)
Categorii: Magazin de anvelope (principală) + Atelier auto
```

Datele structurate de pe site declară deja aceleași valori, citite din
`settings`. Dacă schimbi ceva în admin, schimbă și în Google, altfel cele două
se contrazic.

### 15.2 Search Console și Bing Webmaster Tools

Adaugă domeniul în amândouă și trimite `https://anvelope-ungheni.md/sitemap.xml`
(11.187 de adrese). Fără asta, indexarea celor 900 de pagini noi de dimensiune
durează săptămâni în loc de zile. Bing contează dublu acum: ChatGPT caută prin
indexul lui.

### 15.3 Costul livrării — lipsește de pe site

Site-ul spune „livrare în toată Moldova în 1–3 zile" și atât. Nu scrie nicăieri
cât costă, de la ce sumă e gratuită, sau cine livrează. E prima întrebare a
oricărui client și e singurul lucru care lipsește din răspunsurile de la
„Întrebări frecvente".

**N-am inventat un tarif.** Dă-mi cifrele și le pun și în text, și în datele
structurate (`shippingRate`), unde Google le poate arăta direct în rezultate.

### 15.4 Termenul de retur — la fel

Google cere o politică de retur declarată ca să arate fișele de produs cu preț
și disponibilitate în rezultatele de cumpărături. Am lăsat câmpul gol
deliberat: o politică scrisă de mine în numele atelierului e o promisiune pe
care n-o pot face. Îmi trebuie **termenul în zile** și condițiile; pagina
„Retur și garanție" (§5) are oricum nevoie de textul ăsta.

### 15.5 Pagina de Facebook — pentru `sameAs`

Dacă atelierul are pagină de Facebook sau Instagram, dă-mi adresele: intră în
datele structurate ca `sameAs` și leagă site-ul de profilurile sociale. E felul
în care Google confirmă că firma din Maps, pagina de Facebook și site-ul sunt
aceeași entitate.

### 15.6 Recenziile

`aggregateRating` — stelele de sub rezultat — nu se poate inventa și nu se poate
copia din Google. Dacă vrei stele în rezultate, trebuie recenzii scrise pe site,
cu nume și dată. Se poate face, dar cere o pagină de recenzii și moderare.
Spune dacă merită.

### 15.7 Programul de duminică

Repet §3 pentru că acum are un al doilea efect: apare în datele structurate, în
`llms.txt` și în fișa de Google. Cât timp e necompletat, duminica pur și simplu
lipsește din program peste tot — ceea ce un client citește ca „închis".
