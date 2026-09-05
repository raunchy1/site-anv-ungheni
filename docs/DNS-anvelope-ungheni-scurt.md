% anvelope-ungheni.md → Vercel
%
% 5 septembrie 2026

Domeniul e deja atașat proiectului Vercel. `www` are redirect 308 spre apex,
configurat de partea noastră. De pus în zona de la iHost:

```
@      A       216.198.79.1
@      A       64.29.17.1
www    CNAME   c49ba0ea1b17b3d1.vercel-dns-017.com.
```

Se șterg `A @ → 31.131.1.41` și `A www → 31.131.1.41`. TTL 300.

**Nameserverele rămân la iHost.** Pe domeniu e și poșta: `MX`, `mail`, `ftp`,
`SPF`, `_dmarc` — se lasă neatinse.

Certificatul se emite singur. Verificare:

```
dig +short anvelope-ungheni.md A          # 216.198.79.1, 64.29.17.1
dig +short www.anvelope-ungheni.md CNAME  # c49ba0ea1b17b3d1.vercel-dns-017.com.
```

Revenire: `A @` și `A www` înapoi pe `31.131.1.41`.
