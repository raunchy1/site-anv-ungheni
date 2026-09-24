/**
 * RULAREA PROGRAMATĂ PENTRU PNEU.MD ȘI PNEUEXPERT — lanțul întreg, în ordine:
 *
 *   1. fotografia lor, proaspătă (fără cache — altfel prețurile ar fi cele vechi)
 *   2. importul: dimensiunile apărute la ei de la ultima rulare intră în catalog
 *   3. pozele: anvelopele noi fără fotografie la ei o primesc pe a modelului, dacă o avem
 *   4. prețul și stocul fișelor care le aparțin (`primary_source`)
 *
 * Importul și actualizarea sunt pași separați și independenți: dacă importul se
 * oprește la întrerupător, prețurile se actualizează oricum — un import blocat
 * nu trebuie să țină prețurile pe loc. Eroarea se raportează, nu se înghite.
 *
 * Fără `--branduri`: o marcă nouă se creează de mână, după ce o vede un om.
 */
import { actualizeazaSursa } from './refresh-surse.mjs';

export async function ruleazaSursa(sursa, { apply = false, log = console.log } = {}) {
  const t0 = Date.now();
  /** @type {{sursa: string, erori: string[], fotografie: any, noi: number, carantina: number, pret: any, durata_s: number}} */
  const rezultat = { sursa, erori: [], fotografie: null, noi: 0, carantina: 0, pret: null, durata_s: 0 };

  if (sursa === 'pneu') {
    const { faFotografia } = await import('./pneu/snapshot.mjs');
    rezultat.fotografie = await faFotografia({ useCache: false, log });
  } else if (sursa === 'pneuexpert') {
    const { faFotografia } = await import('./pneuexpert/snapshot.mjs');
    rezultat.fotografie = await faFotografia({ proaspat: true, log });
  } else {
    throw new Error(`sursă necunoscută: ${sursa}`);
  }

  try {
    const { ruleaza } = sursa === 'pneu'
      ? await import('./pneu/import.mjs')
      : await import('./pneuexpert/import.mjs');
    const r = await ruleaza({ apply, actor: `cron:${sursa}`, log });
    rezultat.noi = r.create ?? 0;
    rezultat.carantina = r.carantina?.length ?? 0;
  } catch (e) {
    log(`! importul ${sursa} a eșuat: ${e.message}`);
    rezultat.erori.push(`import: ${e.message}`);
  }

  if (sursa === 'pneu' && apply) {
    try {
      const { ruleaza } = await import('./pneu/poze-din-catalog.mjs');
      await ruleaza({ apply, log });
    } catch (e) {
      rezultat.erori.push(`poze: ${e.message}`);
    }
  }

  const pret = await actualizeazaSursa(sursa, { apply, actor: `cron:${sursa}`, log });
  rezultat.pret = pret;
  rezultat.durata_s = Math.round((Date.now() - t0) / 1000);
  return rezultat;
}
