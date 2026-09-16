import os from 'node:os';
import path from 'node:path';
import { config as pandashop } from '../pandashop/config.mjs';

/**
 * Configurarea sincronizării cu pneu.md.
 *
 * Spre deosebire de pandashop și pneuexpert, aici nu există pagini de citit.
 * Site-ul lor e o aplicație Angular fără randare pe server — orice adresă
 * întoarce același HTML gol — dar aplicația își ia datele dintr-un API care
 * întoarce tot catalogul într-un singur răspuns JSON. Citim API-ul.
 *
 * ACORDUL. Atelierul a confirmat pe 16 septembrie 2026 că a vorbit cu ei și că
 * avem voie să folosim API-ul pentru sincronizare. Ca la celelalte două surse:
 * nu citim nimic ce nu ne-au dat voie să citim.
 */
const peServer = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const radacina = peServer ? path.join(os.tmpdir(), 'pneu-sync') : '.';

export const config = {
  origin: 'https://pneu.md',

  /*
   * Serviciul din care își ia aplicația lor datele. E declarat deschis în
   * pachetul lor `main.js`, ca `wo_baseUrl`. Dacă îl mută, aici se schimbă.
   */
  api: {
    base: process.env.PNEU_API_BASE ?? 'https://target-tranquil-hamlet-74748.herokuapp.com',
    tires: '/tires',
  },

  http: {
    cacheDir: path.join(radacina, 'data/sync/pneu-cache'),
    /* O singură cerere pe rulare. Concurența și pauzele contează doar la
       descărcarea pozelor, care merg pe alt client. */
    concurrency: 1,
    delayMin: 500,
    delayMax: 900,
    retries: 3,
    /* Răspunsul e de ~10 MB și se construiește la ei la fiecare cerere. 45s nu
       ajung: prima încercare a ieșit în 38s, dar cu marja lor de variație am
       văzut și peste un minut. */
    timeoutMs: 180_000,
  },

  /* Cererea nu ia parametri: `?page=` și `?limit=` sunt ignorate de ei, vine
     tot catalogul de fiecare dată. Nu insistăm cu cereri repetate. */

  breakers: {
    /* Sub atât înseamnă că s-a schimbat ceva la ei — nu că li s-a golit
       catalogul. La prima citire aveau 7.260. */
    minEnumerate: 5000,
    maxQuarantineShare: 0.30,
    /* Din 39 de mărci ale lor, 34 le aveam deja. O rulare care ar vrea să
       creeze mai mult de atât înseamnă că numele lor de brand s-au schimbat. */
    maxBranduriNoi: 20,
  },

  /*
   * CÂTE POZE PE PRODUS. Celelalte două surse urcă până la patru; aici ar
   * însemna 18.977 de fișiere distincte, ~3,7 GB, într-un bucket care azi are
   * 416 MB. Pozele lor nu se dedublează aproape deloc: fiecare dimensiune are
   * fotografia ei, pe o cale proprie în S3-ul lor.
   *
   * Decis cu atelierul pe 16 septembrie 2026: o poză per produs, ~1 GB. Fiecare
   * anvelopă are poza ei, iar galeria se completează la faza 4, după ce pozele
   * se mută pe Contabo și spațiul nu mai e o constrângere.
   */
  imagini: {
    max: Number(process.env.PNEU_IMAGINI_MAX ?? 1),
  },

  paths: {
    reports: 'reports/sync',
    state: path.join(radacina, 'data/sync/pneu'),
  },

  /* Mărcile scoase din catalog. Aceeași listă ca la pandashop, deliberat. */
  brands: pandashop.brands,
};
