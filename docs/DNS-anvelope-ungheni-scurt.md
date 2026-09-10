% anvelope-ungheni.md → Vercel
%
% 5 septembrie 2026

Domeniul e atașat proiectului Vercel. `www` are redirect 308 spre apex.
Două variante, după accesul pe care îl ai.

# A. Ai acces în panoul iHost (recomandat)

Nameserverele rămân la iHost, se schimbă doar două înregistrări:

```
@      A       216.198.79.1
@      A       64.29.17.1
www    CNAME   c49ba0ea1b17b3d1.vercel-dns-017.com.
```

Se șterg `A @ → 31.131.1.41` și `A www → 31.131.1.41`. Restul zonei — `MX`,
`mail`, `ftp`, `smtp`, `pop`, `SPF`, `_dmarc` — rămâne neatins.

# B. Ai doar nic.md

Se schimbă nameserverele, primele două câmpuri, celelalte două goale:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Zona a fost deja recreată integral la Vercel, inclusiv poșta, deci nu se pierde
nimic la comutare:

| Nume | Tip | Valoare |
|---|---|---|
| `@` | MX | `10 mail.anvelope-ungheni.md.` |
| `mail`, `ftp`, `smtp`, `pop` | A | `31.131.1.41` |
| `@` | TXT | `v=spf1 mx ip4:31.131.1.250 ~all` |
| `_dmarc` | TXT | `v=DMARC1; p=none; sp=none` |

Apex-ul și `www` le servește Vercel automat.

Două valori au fost curățate față de zona veche: SPF-ul a pierdut mecanismul `a`,
care după comutare ar fi autorizat rețeaua site-ului să trimită poștă (`mx`
acoperă același server, deci livrarea nu se schimbă), iar DMARC-ul a pierdut
`rua=mailto:|USER|@...`, un șablon lăsat neînlocuit, care oricum nu trimitea
rapoarte nicăieri.

# Verificare, după oricare variantă

```
dig +short anvelope-ungheni.md A          # 216.198.79.1, 64.29.17.1
dig +short mail.anvelope-ungheni.md A     # 31.131.1.41  ← poșta, obligatoriu
dig +short anvelope-ungheni.md MX         # 10 mail.anvelope-ungheni.md.
```

Certificatul HTTPS se emite singur. Revenire: nameserverele înapoi pe
`a–d.ihostdns.net`, sau `A @` și `A www` înapoi pe `31.131.1.41`.
