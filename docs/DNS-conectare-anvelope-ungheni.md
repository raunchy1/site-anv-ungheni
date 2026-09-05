% Conectarea domeniului anvelope-ungheni.md la noul site
% Pentru administratorul DNS · zona e la iHost.md (a–d.ihostdns.net)
% 5 septembrie 2026

# 1. Ce e de făcut, pe scurt

Se schimbă **două înregistrări** în zona DNS a domeniului `anvelope-ungheni.md`:
înregistrarea `A` a domeniului gol și înregistrarea pentru `www`.

**Nu se schimbă serverele de nume.** Zona rămâne unde e, la iHost. Motivul e la
punctul 3 și e important: pe același domeniu stă și poșta electronică.

Restul, inclusiv certificatul HTTPS, se rezolvă singur după propagare.

# 2. Cele două înregistrări de pus

| Tip | Nume / gazdă | Valoare | TTL |
|---|---|---|---|
| A | `@` (domeniul gol) | `216.198.79.1` | 300 |
| A | `@` (domeniul gol) | `64.29.17.1` | 300 |
| CNAME | `www` | `c49ba0ea1b17b3d1.vercel-dns-017.com.` | 300 |

Aceleași valori, într-un loc din care se pot copia fără să le rupă rândul:

```
@      A       216.198.79.1
@      A       64.29.17.1
www    CNAME   c49ba0ea1b17b3d1.vercel-dns-017.com.
```

Da, două înregistrări `A` pe același nume: sunt cele două adrese ale rețelei care
va servi site-ul, iar traficul se împarte între ele. Ambele se adaugă.

**Înregistrarea `A` existentă pentru `@`, cea către `31.131.1.41`, se șterge.**
La fel și cea pentru `www` — se înlocuiește cu CNAME-ul de mai sus.

Dacă panoul refuză un `CNAME` pe `www` (unele panouri nu-l acceptă când există
alte înregistrări pe același nume), atunci `www` se face tot din două `A`, cu
exact aceleași două adrese ca `@`. Funcționează identic.

Variantă de rezervă, dacă adresele de mai sus dau erori de validare în panou: o
singură înregistrare `A` pe `@` către `76.76.21.21` și `CNAME www` către
`cname.vercel-dns.com.` Sunt adresele mai vechi ale aceleiași rețele, încă
valabile, dar prima variantă e cea recomandată.

# 3. Ce NU se atinge

Acesta e punctul din care poate ieși o problemă reală. Pe domeniu stă și poșta
electronică, tot la iHost. Înregistrările de mai jos **rămân exact cum sunt**:

| Tip | Nume | Valoare actuală | De ce rămâne |
|---|---|---|---|
| MX | `@` | `10 mail.anvelope-ungheni.md.` | Ruta poștei electronice |
| A | `mail` | `31.131.1.41` | Serverul de poștă. Dacă se schimbă, poșta se oprește |
| A | `ftp` | `31.131.1.41` | Accesul FTP la vechea găzduire |
| TXT | `@` | `v=spf1 a mx ip4:31.131.1.250 ~all` | SPF — vezi observația de la punctul 7 |
| TXT | `_dmarc` | `v=DMARC1; p=none; sp=none; rua=...` | DMARC |
| NS | `@` | `a–d.ihostdns.net` | **Serverele de nume rămân la iHost** |

**De ce nu mutăm serverele de nume la Vercel:** ar însemna rescrierea de la zero,
în alt panou, a MX-ului, a lui `mail`, a SPF-ului și a DMARC-ului. Orice omisiune
acolo se plătește în e-mailuri pierdute, iar o zonă DNS pe jumătate mutată e cel
mai neplăcut fel de defecțiune — merge tot, mai puțin poșta, și nimeni nu-și dă
seama câteva zile. Cu două înregistrări schimbate în zona existentă, riscul e zero.

# 4. Cum arată zona acum

Ca să existe o fotografie a stării dinainte, dacă e nevoie de revenire:

| Nume | Tip | Valoare |
|---|---|---|
| `@` | A | `31.131.1.41` |
| `www` | A | `31.131.1.41` |
| `mail` | A | `31.131.1.41` |
| `ftp` | A | `31.131.1.41` |
| `@` | MX | `10 mail.anvelope-ungheni.md.` |
| `@` | TXT | `v=spf1 a mx ip4:31.131.1.250 ~all` |
| `_dmarc` | TXT | `v=DMARC1; p=none; sp=none; rua=mailto:|USER|@anvelope-ungheni.md` |
| `@` | NS | `a.ihostdns.net`, `b.ihostdns.net`, `c.ihostdns.net`, `d.ihostdns.net` |

Nu există înregistrare CAA, deci emiterea certificatului nu e blocată de nimic.

**Revenirea la vechiul site**, dacă e nevoie: se pun înapoi `A @ → 31.131.1.41` și
`A www → 31.131.1.41` și se șterge CNAME-ul. Durează cât TTL-ul.

# 5. Pașii, în ordine

1. **Cu o zi înainte:** se coboară TTL-ul înregistrărilor `@` și `www` la 300 de
   secunde. Fără pasul ăsta, o eventuală revenire durează ore în loc de minute.
2. Se șterg `A @ → 31.131.1.41` și `A www → 31.131.1.41`.
3. Se adaugă cele trei înregistrări de la punctul 2.
4. Se anunță că e gata. Verificarea de partea noastră durează un minut.
5. După 24 de ore de funcționare fără probleme, TTL-ul se poate urca înapoi la
   3600.

**Momentul comutării e o decizie, nu un detaliu tehnic.** Din clipa în care
înregistrarea `A` se schimbă, vizitatorii ajung pe site-ul nou. Vechiul site nu
mai e servit pe acest domeniu — rămâne pe găzduirea lui, accesibil pe adresa IP,
dar nu pe nume.

# 6. Cum se verifică

Din orice terminal:

```
dig +short anvelope-ungheni.md A
dig +short www.anvelope-ungheni.md CNAME
```

Corect arată așa: prima comandă întoarce `216.198.79.1` și `64.29.17.1`, a doua
întoarce `c49ba0ea1b17b3d1.vercel-dns-017.com.`

Apoi, în browser, `https://anvelope-ungheni.md` trebuie să deschidă noul site, iar
`https://www.anvelope-ungheni.md` să sară automat pe adresa fără `www` —
redirecționarea e deja configurată de partea noastră, nu trebuie făcut nimic
pentru ea.

# 7. Trei observații care nu blochează nimic

**Certificatul HTTPS** se emite automat, de la Let's Encrypt, în câteva minute
după ce înregistrările se propagă. Nu e nevoie să fie cumpărat, instalat sau
reînnoit de cineva. Până se emite, browserul poate arăta un avertisment de
securitate pentru câteva minute — e normal și trece singur.

**SPF-ul merită curățat, după comutare.** Valoarea actuală, `v=spf1 a mx
ip4:31.131.1.250 ~all`, conține mecanismul `a`, care înseamnă „adresa din
înregistrarea `A` a domeniului are voie să trimită poștă". După comutare, acea
adresă va fi a rețelei care servește site-ul, care nu trimite niciun e-mail.
Nu strică nimic — `mx` și `ip4` acoperă serverul real — dar mecanismul devine
fără sens și e mai curat să fie scos: `v=spf1 mx ip4:31.131.1.250 ~all`.
Se poate face oricând, nu e urgent.

**DMARC-ul are un câmp necompletat.** Adresa de raportare e
`rua=mailto:|USER|@anvelope-ungheni.md` — un șablon lăsat neînlocuit de cine a
configurat zona. Rapoartele nu ajung nicăieri. Se înlocuiește `|USER|` cu o
adresă reală, de exemplu `info`, sau se scoate `rua` cu totul. Nu afectează
livrarea e-mailurilor.

# 8. Dacă ceva nu merge

Verificarea se poate face de la distanță în orice moment, iar dacă înregistrările
sunt puse și site-ul tot nu apare, problema se vede imediat în panoul de la
Vercel — domeniul e deja atașat proiectului și așteaptă doar înregistrările.

Pentru orice nelămurire, la telefonul de contact al atelierului.
