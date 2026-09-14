# Umami pe Coolify — trafic pentru Anvelope Ungheni

Panoul admin **nu** construiește contoare proprii de trafic. Umami (open-source, fără cookie-uri de tracking clasice, potrivit GDPR) rulează ca **serviciu separat** în Coolify. Cardul de pe `/admin/analiza` doar leagă URL-ul și Website ID-ul, dacă există în env.

## De ce separat

- Baza catalogului (Supabase) rămâne pentru comenzi / stoc / marjă.
- Traficul e alt domeniu de date; un serviciu dedicat e o oră de lucru, nu o săptămână de analytics custom.
- Scriptul de tracking pe site-ul public e opțional și independent de cardul din admin.

## Instalare în Coolify (rezumat)

1. **New Resource** → Docker Image (sau template Umami, dacă e în registry-ul Coolify).
2. Imagine recomandată: `ghcr.io/umami-software/umami:postgresql-latest`.
3. Adaugă un serviciu **PostgreSQL** în același proiect Coolify și leagă-l.
4. Variabile de mediu tipice pe containerul Umami:
   - `DATABASE_URL` — connection string Postgres (din Coolify).
   - `APP_SECRET` — șir lung aleator (secret de sesiune).
5. Domains: ex. `https://analytics.anvelope-ungheni.md` (sau subdomeniul pe care îl alegi).
6. Deploy → deschide URL-ul → login inițial Umami (schimbă parola default imediat).
7. **Add website** pentru `https://anvelope-ungheni.md` → copiază **Website ID**.

## Legătura cu panoul admin

Pe aplicația Next (Coolify / `.env`):

```
UMAMI_URL=https://analytics.anvelope-ungheni.md
UMAMI_WEBSITE_ID=<uuid-din-umami>
```

Repornește app-ul. Pe `/admin/analiza`, cardul „Trafic (Umami)” afișează iframe/share către instanță.

> Share link: în Umami poți crea un link de share public; dacă iframe-ul pe `/share/<id>` nu se potrivește cu setup-ul tău, deschide direct panoul Umami din linkul afișat. Fără aceste env-uri, panoul arată instrucțiuni — **niciodată cifre inventate**.

## Tracking pe site-ul public (opțional, etapă ulterioară)

Umami oferă un snippet `<script>` cu Website ID. Poți adăuga ulterior pe layout-ul public (`NEXT_PUBLIC_UMAMI_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID`) — **nu** face parte din Etapa 7 a panoului; cardul din admin rămâne doar vizualizarea/instrucțiunile.

## Verificare

- [ ] Container Umami healthy în Coolify
- [ ] Login admin Umami schimbat
- [ ] Website creat pentru domeniul public
- [ ] `UMAMI_URL` + `UMAMI_WEBSITE_ID` pe app-ul site-ului
- [ ] `/admin/analiza` arată cardul configurat (nu instrucțiunile goale)
