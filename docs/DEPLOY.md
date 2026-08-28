# Unde se publică ce

Există **două** proiecte Vercel cu nume asemănător. Nu sunt același lucru și nu
trebuie să se atingă niciodată.

| Ce | Proiect Vercel | Sursa codului | Ce servește |
|---|---|---|---|
| **Aplicația** de administrare | `anvelope-ungheni` (`prj_cvq9…`) | GitHub `raunchy1/anvelope-ungheni` | „Anvelope Ungheni – Administrare", sistemul intern |
| **Site-ul** public de catalog | `anvelope-ungheni-site` (`prj_QZlN…`) | acest folder, git local fără remote | catalogul de 15.005 anvelope |

Folderul acesta e legat prin `.vercel/project.json` **doar** de
`anvelope-ungheni-site`. Dacă fișierul lipsește sau arată altceva, nu rula
`vercel --prod` până nu-l refaci:

```bash
npx vercel link --yes --project anvelope-ungheni-site
```

## Ce s-a întâmplat pe 28 august 2026

Folderul era legat din greșeală la proiectul aplicației, iar patru `vercel --prod`
au publicat site-ul peste ea; producția aplicației a servit catalogul până la
remediere. Reparat în aceeași zi: aplicația promovată înapoi la deploy-ul ei
(`5xa8bzz7z`), cele patru deploy-uri greșite șterse, folderul relegat la
proiectul nou. Lecția e în tabelul de mai sus.

## Ce rămâne comun, și de ce

Baza Supabase e **una singură** pentru amândouă — catalogul, mărcile, comenzile
și programările sunt aceleași date. Deci o migrare rulată de aici se vede și în
aplicație. Migrările `0008`–`0012` (retragerea drepturilor RPC publice, cele trei
reparații de marcă, bucketul `marci`, `logo_on_dark`, `logo_ratio`) au fost
aplicate din acest folder și sunt vizibile în aplicație.

Bucketul `marci` e folosit doar de site; `produse` e comun.
