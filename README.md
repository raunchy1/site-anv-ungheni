# anvelope-ungheni.md

Reconstrucția magazinului OpenCart 3.x pe Next.js 16 + Supabase.
Documente: [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`DESIGN.md`](DESIGN.md) · [`DECISIONS.md`](DECISIONS.md) · [`data/raw/REPORT.md`](data/raw/REPORT.md)

## Rulare locală

```bash
pnpm install
cp .env.example .env.local     # completează cheile Supabase
pnpm dev                       # http://localhost:3000
```

`/design-system` arată tokenii și cele 23 de componente, în ambele limbi.

## Comenzi

| Comandă | Ce face |
|---|---|
| `pnpm dev` · `pnpm build` · `pnpm start` | Next.js |
| `pnpm test` | teste pe parserul de dimensiuni + determinismul reparsării |
| `pnpm db:seed` | seed idempotent în Supabase din `data/raw/` |
| `pnpm inspector` | inspector local al datelor migrate (port 4321) |
| `node --env-file=.env.local tools/seed/upload-images.mjs` | urcă imaginile în Storage |
| `pnpm logos [--apply]` | urcă logo-urile de marcă din `data/brand-logos/` și scrie `brands.logo_url` |
| `node --env-file=.env.local tools/build/size-tree.mjs` | regenerează arborele de dimensiuni **după fiecare import** |
| `node tools/db/apply-local.mjs --twice` | verifică migrațiile pe Postgres local (docker, port 55432) |
| `node tools/db/test-constraints.mjs` | cele 8 teste de constrângeri |

## Unelte de migrare

`tools/scraper/` conține crawler-ul care a extras cele 15.010 produse (RO + RU) de pe
site-ul vechi, cu rezolvarea provocării proof-of-work, cache de HTML brut și validator.
Cache-ul (`data/raw/html-cache/`, ~590 MB) **nu se șterge până la lansare**: orice
corecție de parser costă 20 de secunde de reparsare locală în loc de 2,5 ore de crawl.

## Stare

Fazele 0–3 parțial. Ce lipsește e listat în `ARCHITECTURE.md` §12 și în auditul din `docs/`.
