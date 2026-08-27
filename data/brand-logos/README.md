# Logo-uri de marcă

Pune aici fișierele oficiale de logo, unul per marcă. Numele fișierului e
slug-ul mărcii din catalog sau numele ei: `michelin.svg`, `nokian-tyres.png`,
`Bridgestone.svg`. Formate acceptate: `.svg`, `.png`, `.jpg`, `.webp`.

De unde se iau: **media kit / press kit-ul producătorului**, nu de pe site-uri
concurente. Fișierele nu se comit în git (vezi `.gitignore`) — sursa de adevăr
după încărcare e Supabase Storage.

```bash
node --env-file=.env.local tools/seed/upload-brand-logos.mjs          # rulare seacă
node --env-file=.env.local tools/seed/upload-brand-logos.mjs --apply  # urcă și scrie brands.logo_url
```

Mărcile fără logo nu arată gol: `BrandLogo` cade pe numele în versale, care e
identitatea tipografică decisă în `DECISIONS.md` §A.3.
