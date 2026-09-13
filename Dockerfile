# Catalogul anvelope-ungheni.md, pregatit pentru Coolify.
#
# Trei etape, ca imaginea finala sa contina doar ce ruleaza: `deps` aduce
# pachetele, `build` construieste, `runner` porneste. Node modules de build nu
# ajung in imaginea servita — de la ~1,2 GB la ~200 MB.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable

# ------------------------------------------------------------------ pachete
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true

# ----------------------------------------------------------------- build-ul
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# VARIABILELE `NEXT_PUBLIC_*` SE COC IN PACHETUL DIN BROWSER LA CONSTRUIRE,
# nu se citesc la pornire. Daca lipsesc aici, aplicatia porneste si cade la
# prima cerere cu „supabaseUrl is required" — exact eroarea din build-urile
# locale. In Coolify se dau ca „Build Variable", nu doar ca variabila normala.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

# 4 GB RAM inseamna ca build-ul imparte memoria cu Coolify si cu aplicatiile
# care merg deja. Plafonul opreste colectorul de gunoi din V8 sa creasca pana
# cand nucleul omoara procesul.
ENV NODE_OPTIONS="--max-old-space-size=2560"
RUN pnpm build

# ----------------------------------------------------------------- pornirea
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# CACHE-UL ISR TRAIESTE AICI si trebuie sa fie volum persistent in Coolify
# (`/app/.next/cache`). Fara volum, fiecare repornire goleste cele ~37.000 de
# pagini si toate se randeaza din nou — exact risipa de care fugim de pe
# Vercel, doar ca fara factura.
RUN mkdir -p .next/cache data/sync/cache data/sync/locks reports/sync && chown -R nextjs:nodejs .next data reports

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
