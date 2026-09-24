import os from 'node:os';
import path from 'node:path';

/*
 * Pe Vercel sistemul de fișiere e read-only, cu excepția lui `/tmp`. Cache-ul
 * HTTP și starea trebuie să meargă acolo, altfel prima cerere moare cu
 * „ENOENT: mkdir 'data/sync/cache'" înainte să atingă pandashop. Local rămân
 * unde erau, ca o rulare întreruptă de pe laptop să se reia din cache.
 */
const peServer = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const radacina = peServer ? path.join(os.tmpdir(), 'pandashop-sync') : '.';

/**
 * Configurarea sincronizării. Pragurile din Partea G stau AICI, nu în cod, ca să
 * poată fi strânse fără deploy când vedem cum se poartă sursa în realitate.
 */
export const config = {
  /* 'html' azi; 'feed' în ziua în care pandashop livrează fișierul. O linie. */
  source: process.env.PANDASHOP_SOURCE ?? 'html',

  http: {
    cacheDir: path.join(radacina, 'data/sync/cache'),
    concurrency: Number(process.env.SYNC_CONCURRENCY ?? 4),
    /* 8–12 s între cereri. Pe 24 septembrie 2026 pandashop bloca adresa cu 500
       pe TOT catalogul după ~100 de pagini la 0,4–0,8 s și după ~64 la 1,5–2,5 s,
       iar blocajul ținea 20–30 de minute. La 8–12 s listarea completă (138 de
       pagini) a trecut curat, în ~25 de minute — pentru o rulare de noapte, nimic. */
    delayMin: Number(process.env.SYNC_DELAY_MIN ?? 8000),
    delayMax: Number(process.env.SYNC_DELAY_MAX ?? 12000),
    /* 7, nu 4. Pe 24 septembrie 2026 pandashop a început să dea 500 după ~100
       de pagini de listare la rând și și-a revenit abia după un minut sau două;
       4 reîncercări însemnau ~30s de răbdare, deci rularea cădea la pagina 100.
       Cu 7 (plafon 60s fiecare) sunt ~3 minute pe pagină înainte de renunțare. */
    retries: Number(process.env.SYNC_RETRIES ?? 7),
  },

  /*
   * MĂRCILE SCOASE DIN CATALOG. Nu se importă și nu se creează, niciodată,
   * indiferent de cale — cronul de noapte, `backfill.mjs`, `--branduri`.
   *
   * Fără lista asta, ștergerea lor din bază ar ține exact o noapte: produsele
   * există în continuare la pandashop, iar prima recuperare care trece pe lângă
   * ele le-ar aduce înapoi. Comparația se face pe numele normalizat, minuscule,
   * ca „POWERTRAC" și „Powertrac" să fie același lucru.
   *
   * Cerute de atelier pe 5 septembrie 2026. Ca să reintre o marcă, se scoate de
   * aici și se rulează `backfill.mjs --branduri`.
   */
  brands: {
    /* `premiorri`/`premiorre` e linia de produse a Rosavei, scrisă de furnizori
       și ca marcă de sine stătătoare. Fără ea în listă, aceleași anvelope ar fi
       reintrat din alt catalog sub alt nume — exact ce s-a cerut să dispară. */
    excluse: [
      /* Prima cerere, 5 septembrie 2026. */
      'rosava', 'centara', 'rotex', 'powertrac', 'charmhoo',
      /* A doua cerere, aceeași zi, după importul din pneuexpert. */
      'valleystone', 'zeta', 'greentrac',
      /* Linia de produse a Rosavei, pe care furnizorii o scriu și ca marcă de sine
         stătătoare. Fără ea, aceleași anvelope reintră din alt catalog sub alt nume. */
      'premiorri', 'premiorre',
    ],
  },

  discovery: {
    /* `sync:new` se uită doar în față; oprire după atâtea pagini consecutive
       fără niciun ID necunoscut. */
    newPagesLookahead: 8,
    stopAfterKnownPages: 2,
  },

  /* Întrerupătorul din Partea G.1. Implicit: OPRIRE, nu continuare. */
  breakers: {
    /* Peste atâtea produse noi într-o singură rulare, ceva e greșit: catalogul
       lor nu crește cu sute de anvelope pe noapte. Se oprește, nu continuă. */
    maxNewPerRun: 100,
    maxQuarantineShare: 0.30,
    maxParseFailureRate: 0.05,
    /* Gate C. Prima rulare atinge aproape tot catalogul — nimic n-a mai fost
       confruntat cu sursa de la exportul din OpenCart — deci pragul e larg
       intentionat. El pazeste altceva: o listare ciuntita sau un parser stricat,
       care ar incerca sa rescrie 100% din randuri. */
    maxRefreshShare: 0.95,
  },

  paths: {
    reports: path.join(radacina, 'reports/sync'),
    state: path.join(radacina, 'data/sync'),
  },
};
