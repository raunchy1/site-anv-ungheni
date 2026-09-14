Panou de administrare pentru anvelope-ungheni.md

Ești o sesiune Claude Code cu acces la repozitoriu, Supabase și serverul
Contabo. Construiești panoul de administrare al catalogului.

Citește tot fișierul înainte să scrii o linie. Lucrezi pe o ramură nouă,
panou-admin, nu pe master.

1. Ce există deja

Repo
raunchy1/site-anv-ungheni, ramura de producție master
Stivă
Next.js 16 App Router, pnpm, TypeScript, next-intl (RO/RU)
Bază
Supabase tzzycvsbnlurypfstisc
Găzduire
Contabo + Coolify, publicare automată la push pe master
Conținut
18.443 produse, 130 mărci, 9 servicii, 5 pagini legale, comenzi
Nu există nici panou, nici autentificare. Se face de la zero.
robots.txt interzice deja /admin — ruta e anticipată, nu trebuie schimbat
nimic acolo.
Tabelele
products (52 coloane), product_images, product_related, brands,
services, legal_pages, orders, order_items, reviews,
service_bookings, settings, import_runs, sync_quarantine, sync_lock,
pandashop_seen, rate_limits.

2. Mecanici pe care trebuie să le înțelegi înainte

Astea nu sunt detalii. Dacă le ignori, panoul pare că funcționează și nu
funcționează.

2.1 Cache-ul ISR — capcana numărul unu
Paginile de produs se țin în cache 30 de zile. O modificare scrisă în bază
nu se vede pe site până nu se golește eticheta paginii.
Fiecare citire de produs după slug poartă eticheta produs:<slug>
(src/lib/supabase/server.ts). Deci după fiecare salvare, acțiunea de
server trebuie să cheme revalidateTag pe etichetele relevante.
Fără asta, utilizatorul schimbă un preț, vede în panou că s-a salvat, deschide
site-ul și vede prețul vechi. Apoi își pierde încrederea în tot panoul.
catalog se golește cu măsură: acoperă listările și paginile de marcă. Nu
se cheamă la fiecare tastă, ci o dată, la salvare, și doar când s-a schimbat
preț, stoc, titlu sau disponibilitate.

2.2 price_locked — prețul pus de om
Sincronizarea nocturnă cu pandashop rescrie prețurile. Un preț editat în panou
trebuie salvat cu price_locked = true și price_source = 'admin_edit',
altfel dispare la 03:00.
Panoul trebuie să arate explicit starea: „preț de la furnizor" vs
„preț fixat manual", cu un buton de deblocare care îl întoarce sub
sincronizare.
Coloana source_price_mdl păstrează prețul furnizorului chiar și pe rândurile
blocate — afișează marja în listă, e cea mai utilă cifră din tot panoul.

2.3 stock_status — stocul propriu
Trei stări: in_stock (marfa e fizic în atelier), supplier (se aduce în 1–3
zile), out_of_stock.
Migrarea 0029 face ca in_stock să nu mai poată fi șters de sincronizare.
Consecința: când se vinde ultima bucată, nimeni nu scoate produsul din
in_stock automat. Panoul e locul unde se face asta — pune-o la vedere, nu
ascunsă într-un meniu.
Acum sunt 37 de produse în in_stock, puse manual din stocul aplicației de
fișe.

2.4 Imaginile
Trăiesc în Supabase Storage, bucket produse (mărcile în marci). În bază,
product_images.storage_path are forma produse/<sha1>.jpg.
Politica de securitate a site-ului blochează imaginile de pe alte domenii
(vezi img-src în vercel.json) — deci o poză trebuie urcată în Storage,
nu legată de pe alt site.
Convenția catalogului: o fotografie per model, reutilizată la toate măsurile
lui. Mai multe produse pot împărți același storage_path. Respect-o.

3. REGULI CARE NU SE ÎNCALCĂ
Cheia service_role nu ajunge niciodată în browser. Toate scrierile trec
prin Server Actions sau Route Handlers, pe server.
Context, ca să înțelegi de ce insist: cealaltă aplicație a firmei ține
parolele personalului în clar într-un fișier pe care Next îl trimite în
pachetul din browser. Oricine deschide aplicația le poate citi. E în
producție din martie. Nu repeta asta.
Fără înregistrare publică. Conturile se creează manual, din panoul
Supabase. Panoul are doar autentificare.
Nu atinge funcția sync_refresh_products și nici pipeline-ul din
tools/sync/. Panoul citește rezultatele lor, nu le rescrie.
Nu schimba designul site-ului public. Panoul e o zonă separată.
Nu șterge date. Dezactivarea (is_active = false) în loc de delete,
peste tot.
Lucrezi pe ramura panou-admin. Pe master se ajunge doar prin
verificarea utilizatorului.

4. Arhitectura — deciziile sunt luate, nu le redeschide
Rută: /admin, în afara segmentului [locale]. Panoul e doar în
română — îl folosesc două persoane, nu are nevoie de traducere.
Autentificare: Supabase Auth, email + parolă. proxy.ts/middleware
protejează tot ce e sub /admin, cu redirect la /admin/login. Sesiunea în
cookie httpOnly.
Scrierile: Server Actions cu clientul adminDb() care există deja în
src/lib/supabase/server.ts.
Randarea: /admin e complet dinamic. export const dynamic = "force-dynamic"
și revalidate = 0. Panoul nu intră niciodată în cache-ul ISR.

5. Etapele. În ordinea asta, fiecare livrabilă singură.
Nu construi tot și apoi arăți. După fiecare etapă, publică pe ramură, spune ce
merge, și așteaptă confirmarea.

Etapa 1 — intrarea și lista de produse
/admin/login, autentificare, ieșire din cont
/admin/produse: tabel cu căutare (titlu, marcă, model), filtre pe marcă,
sezon, măsură, stare de stoc, „doar preț fixat manual", paginare
Coloane: poză mică, titlu, măsură, sezon, preț, preț furnizor,
marjă (lei și %), stare stoc, lacăt preț
Editare rapidă direct în listă: preț și stare de stoc, cu salvare
imediată și golirea etichetelor din 2.1
Asta singură acoperă 80% din ce face utilizatorul zilnic. Livreaz-o
înainte de orice altceva.

Etapa 2 — fișa produsului
Editor complet pe /admin/produse/[id]: titluri RO/RU, descrieri, meta (title,
description), măsură, indici sarcină/viteză, XL, runflat, sezon, marcă, model,
activ/inactiv.
Slug-urile: arată-le, permite editarea, dar avertizează că schimbarea rupe
adresa indexată de Google. Convenția e în tools/sync/pandashop/slug.mjs — RO
cu cratime, RU cu lățimea lipită (205/55 → 20555). Refolosește fișierul,
nu rescrie regula.

Etapa 3 — imaginile
Încărcare prin drag & drop, mai multe odată. La încărcare: redimensionare
rezonabilă, nume de fișier = sha1 al conținutului, urcare în bucket produse,
apoi rândul în product_images.
Reordonare (sort_order), ștergere, editare alt_ro / alt_ru.
Și o funcție care va fi folosită des: „aplică poza asta la toate produsele
aceluiași model" — fiindcă așa e construit catalogul.

Etapa 4 — produs nou
Formular de creare. Atenție la două capcane:
legacy_product_id e NOT NULL UNIQUE, moștenit din OpenCart. Produsele
care nu vin de acolo primesc valori negative (vezi import.mjs)
produsul nou trebuie să primească price_locked = true, altfel sincronizarea
îl poate atinge

Etapa 5 — comenzi și cereri
/admin/comenzi: listă, detaliu cu produsele, schimbare de stare
/admin/programari (service_bookings) și /admin/recenzii (reviews),
cu aprobare/respingere dacă schema o permite

Etapa 6 — restul conținutului
Mărci, servicii, pagini legale, settings. Plus control de sincronizare:
comutator settings.sync_enabled (pipeline-ul îl respectă deja)
istoricul din import_runs: când a rulat, ce s-a schimbat, ce a eșuat
sync_quarantine: produsele oprite la import, de confirmat manual
buton de rulare de probă (?dry=1), care nu scrie nimic

Etapa 7 — analiza site-ului
Două lucruri diferite, nu le amesteca:
Trafic: nu construi contoare proprii. Instalează Umami ca serviciu
separat în Coolify (gratuit, open-source, fără cookie-uri, conform GDPR) și
pune un card în panou cu cifrele lui. E o oră de lucru în loc de o săptămână.
Comercial, din baza noastră: comenzi pe zi/săptămână, valoare medie,
produse cele mai comandate, câte produse sunt în in_stock și ce valoare au,
produse fără poză, produse fără preț, marja medie pe marcă.
Cifrele astea nu există nicăieri azi și sunt cele pe care un proprietar chiar
le deschide dimineața.

6. Ce merită propus, dar NU construi fără aprobare
Legătura automată cu aplicația de fișe. Anvelopele din in_stock au fost
puse manual din stocul aplicației interne (raunchy1/anvelope-ungheni,
Supabase gbdyzojsevqceiexkhxo — alt cont). Când se vinde ultima bucată acolo,
site-ul continuă să scrie „în stoc".
Soluția curată e o sincronizare care citește cantitățile din aplicația de fișe
și stinge singură produsele epuizate. E lucrare separată, cu decizii
comerciale în ea. Propune-o la final, cu o estimare. Nu o începe.

7. Ce raportezi
După fiecare etapă: ce merge, ce nu, adresa unde se poate încerca, și ce
decizie îți trebuie de la utilizator ca să continui.
Dacă găsești ceva în cod care pare greșit dar funcționează, spune, nu
repara — există motive documentate în comentarii pentru aproape tot ce pare
ciudat în repozitoriul ăsta. Citește comentariul înainte de a schimba linia.
