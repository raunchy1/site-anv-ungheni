import os from 'node:os';
import path from 'node:path';
import { config as pandashop } from '../pandashop/config.mjs';

/**
 * Configurarea sincronizării cu pneuexpert.md.
 *
 * Aceleași reguli ca la pandashop, alt magazin. Ce e comun — mărcile scoase din
 * catalog, pragurile întrerupătorului — se ia de acolo, nu se copiază: două
 * liste de mărci interzise care pot diverge sunt mai rele decât una singură.
 */
const peServer = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const radacina = peServer ? path.join(os.tmpdir(), 'pneuexpert-sync') : '.';

export const config = {
  origin: 'https://pneuexpert.md',

  http: {
    cacheDir: path.join(radacina, 'data/sync/pneuexpert-cache'),
    /* Mai domol decât la pandashop. Bitrix-ul lor randează fiecare pagină de la
       zero — 170 KB și ~400 ms per cerere — iar noi cerem 5.500 dintr-o suflare. */
    concurrency: Number(process.env.PNEUEXPERT_CONCURRENCY ?? 3),
    delayMin: 500,
    delayMax: 900,
    retries: 4,
  },

  /* Cele șase secțiuni de anvelope. Restul catalogului lor — jante, acumulatoare,
     uleiuri, accesorii — nu ne interesează: noi vindem anvelope și senzori. */
  categorii: [
    'shiny_dlya_avto_anvelope_autoturisme',
    'vnedorozhniki_suv',
    'mikroavtobusy_microbuse',
    'shiny_dlya_gruzovikov_anvelope_camioane',
    'shiny_dlya_agro_tekhniki_anvelope_p_u_agro_tehnic',
    'industrialnye_industriale',
  ],

  /* Sitemap-ul lor e din noiembrie 2023 și nu conține produsele adăugate de
     atunci; listarea paginată conține doar ce au pe stoc azi. Niciuna singură nu
     e catalogul întreg — se iau amândouă și se reunesc. */
  sitemap: '/sitemap-iblock-2.xml',

  breakers: {
    /* Enumerarea care întoarce mai puțin de atât înseamnă că s-a schimbat ceva
       la ei, nu că li s-a golit catalogul. Se oprește fără să scrie. */
    minEnumerate: 3000,
    maxQuarantineShare: 0.30,
    /* O rulare care ar crea mai multe mărci decât atât se oprește: la prima
       importare am văzut că numele lor de brand vin din câmp liber. */
    maxBranduriNoi: 80,
  },

  paths: {
    reports: 'reports/sync',
    state: path.join(radacina, 'data/sync/pneuexpert'),
  },

  /* Mărcile scoase din catalog. Aceeași listă ca la pandashop, deliberat. */
  brands: pandashop.brands,
};
