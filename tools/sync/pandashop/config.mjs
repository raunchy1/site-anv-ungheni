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
    delayMin: 400,
    delayMax: 800,
    retries: 4,
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
