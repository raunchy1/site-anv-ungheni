/**
 * Configurarea sincronizării. Pragurile din Partea G stau AICI, nu în cod, ca să
 * poată fi strânse fără deploy când vedem cum se poartă sursa în realitate.
 */
export const config = {
  /* 'html' azi; 'feed' în ziua în care pandashop livrează fișierul. O linie. */
  source: process.env.PANDASHOP_SOURCE ?? 'html',

  http: {
    cacheDir: 'data/sync/cache',
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
  },

  paths: {
    reports: 'reports/sync',
    state: 'data/sync',
  },
};
