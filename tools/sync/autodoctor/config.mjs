import os from 'node:os';
import path from 'node:path';
import { config as pandashop } from '../pandashop/config.mjs';

/**
 * Configurarea sincronizării cu autodoctor.md — a patra sursă de catalog.
 *
 * ACORDUL. Atelierul a cerut pe 8 octombrie 2026 importul complet al
 * anvelopelor și pozelor de la ei, „la fel ca și pe celelalte platforme" —
 * același regim ca pandashop, pneuexpert și pneu.md.
 *
 * CE CITIM. Magazinul lor e o aplicație Angular. API-ul ei (`/api/products`)
 * răspunde 403 oricui din afara aplicației, inclusiv browserului, deci nu-l
 * folosim. Paginile de listare însă vin randate pe server și au în ele, într-un
 * `<script id="autodoctor-state">`, exact datele pe care le folosește aplicația:
 * dimensiune, sezon, indici, preț, stoc, marcă, poză. Le citim de acolo —
 * 134 de pagini pentru tot catalogul, nu 2.100 de pagini de produs.
 */
const peServer = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const radacina = peServer ? path.join(os.tmpdir(), 'autodoctor-sync') : '.';

export const config = {
  origin: 'https://autodoctor.md',

  /* Categoria „Anvelope" a lor: vară, iarnă și all season, autoturism, SUV,
     microbuz și camion. Jantele și accesoriile sunt în alte categorii. */
  listare: '/shop/category/pneu/products',

  http: {
    cacheDir: path.join(radacina, 'data/sync/autodoctor-cache'),
    /* O pagină de listare e ~650 KB randați de Angular pe server. Una câte una,
       cu pauză: 134 de pagini în vreo cinci minute. */
    concurrency: 1,
    delayMin: 1200,
    delayMax: 2000,
    retries: 4,
    timeoutMs: 60_000,
    /*
     * SERVERUL LOR DĂ PAGINA GOALĂ ORICĂRUI USER-AGENT CU „BOT" ÎN NUME.
     * Răspunde cu antetul `x-ssr-mode: CSR` și un `<app-root>` gol, fără date.
     * Numele nostru rămâne în User-Agent, iar adresa de contact în `From` —
     * exact antetul făcut pentru asta.
     */
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AnvelopeUngheni/1.0',
      From: 'info@anvelope-ungheni.md',
    },
  },

  /*
   * PARAMETRII ADRESEI. Doar `page` și `sort` țin pagina randată pe server;
   * `limit` sau filtrele o trimit înapoi la aplicația goală. Ordinea după nume
   * nu depinde de stoc sau de popularitate, deci nu se mută produse între
   * pagini cât timp le citim.
   */
  sortare: 'name_asc',

  breakers: {
    /* Aveau 2.136 de anvelope pe 8 octombrie 2026. Sub atât, ceva s-a schimbat
       la ei — nu li s-a golit depozitul. */
    minEnumerate: 1500,
    maxQuarantineShare: 0.30,
    /* Din cele ~20 de mărci ale lor, majoritatea le avem deja. */
    maxBranduriNoi: 15,
  },

  /*
   * Mărci care NU se creează nici cu `--branduri`. „Black" vine de sub
   * „ПРОЧИЕ" („Black ROYAL VAN A/S") și nu e limpede dacă marca e „Royal
   * Black" sau alta; un om decide, nu importul. Rândurile fără marcă deloc
   * apar ca „—".
   */
  branduriNecreabile: ['—', 'Black'],

  /* O poză pe produs, ca la pneu.md: la ei oricum fiecare anvelopă are una. */
  imagini: {
    max: Number(process.env.AUTODOCTOR_IMAGINI_MAX ?? 2),
  },

  paths: {
    reports: 'reports/sync',
    state: path.join(radacina, 'data/sync/autodoctor'),
  },

  /* Mărcile scoase din catalog. Aceeași listă ca la pandashop, deliberat. */
  brands: pandashop.brands,
};
