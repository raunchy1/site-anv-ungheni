#!/usr/bin/env node
/**
 * REPARAREA FISELOR RAMASE FARA POZE.
 *
 * DE CE EXISTA. Importul verifica explicit ca fiecare produs are cel putin o
 * imagine si trimite in carantina orice fisa fara — dar verificarea se face pe
 * imaginile DESCARCATE, iar scrierea e in doi pasi: intai randul din `products`,
 * apoi randurile din `product_images`. Daca al doilea pas pica (o cadere de
 * retea spre Supabase, un 500 de la ei intre timp), produsul ramane in catalog
 * fara nicio poza, iar eroarea ajunge doar in jurnalul rularii.
 *
 * S-a intamplat: 2 fise din primele 910 importate pe 5 septembrie 2026.
 *
 * O fisa de anvelopa fara poza nu e o fisa incompleta, e una inutila — poza e
 * jumatate din pagina. Scriptul asta cauta toate fisele venite prin
 * sincronizare care n-au nicio imagine, aduce din nou pagina lor si le pune
 * pozele. Nu atinge nimic altceva: nici titlul, nici pretul, nici stocul.
 *
 *   node --env-file=.env.local tools/sync/pandashop/repair-images.mjs          # dry-run
 *   node --env-file=.env.local tools/sync/pandashop/repair-images.mjs --apply
 */
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { readAll } from './db.mjs';
import { insert } from './db-write.mjs';
import { pregatesteImagini } from './images.mjs';

/** Fisele din sincronizare care n-au niciun rand in `product_images`. */
async function faraPoze() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  /* `product_images` embedat, filtrat pe lipsa: PostgREST nu are „left join
     where null", asa ca se citesc coloanele si se filtreaza in memorie. Sunt
     cateva mii de randuri, nu e o problema. */
  const res = await fetch(
    `${url}/rest/v1/products?select=id,pandashop_id,title_ro,title_ru,slug_ro,product_images(id)&source=eq.pandashop_sync&pandashop_id=not.is.null`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`products: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).filter((p) => (p.product_images?.length ?? 0) === 0);
}

export async function repara(opts = {}) {
  const { apply: aplica = false, limit = Infinity } = opts;
  const log = opts.log ?? console.log;

  const stricate = (await faraPoze()).slice(0, limit === Infinity ? undefined : limit);
  log(`· fise din sincronizare fara nicio poza: ${stricate.length}`);
  if (stricate.length === 0) return { reparate: 0, esuate: [] };

  const imagini = await readAll('product_images', 'content_hash');
  const hashuri = new Set(imagini.map((i) => i.content_hash).filter(Boolean));

  const http = createHttp({ ...config.http, useCache: true });
  const source = createHtmlSource(http);

  let reparate = 0;
  const esuate = [];

  for (const p of stricate) {
    try {
      /* URL-ul lor nu e in baza noastra, dar slug-ul lor se reconstruieste din
         ID: paginile de produs raspund pe orice slug, ID-ul e cel care conteaza.
         Se cauta prin listare doar daca asta esueaza. */
      const sursa = await source.fetchProduct({
        id: p.pandashop_id,
        url: `/ro/product/x-${p.pandashop_id}/`,
        urlRu: `/ru/product/x-${p.pandashop_id}/`,
      });
      if (!sursa || !sursa.images?.length) { esuate.push({ id: p.id, motiv: 'sursa n-a dat imagini' }); continue; }

      const { imagini: imgs, erori } = await pregatesteImagini(sursa.images, hashuri, {
        dryRun: !aplica, altRo: p.title_ro, altRu: p.title_ru ?? p.title_ro,
      });
      if (imgs.length === 0) { esuate.push({ id: p.id, motiv: erori[0] ?? 'nicio imagine descarcata' }); continue; }

      log(`  ${aplica ? '+' : '·'} ${p.title_ro} — ${imgs.length} poze`);
      if (aplica) {
        await insert('product_images', imgs.map(({ refolosita, ...im }) => ({ ...im, product_id: p.id })));
      }
      reparate++;
    } catch (e) {
      esuate.push({ id: p.id, motiv: e.message });
    }
  }

  log(`\n${aplica ? 'APLICAT' : 'DRY-RUN'}: ${reparate} reparate, ${esuate.length} esuate`);
  for (const e of esuate) log(`   ! #${e.id}: ${e.motiv}`);
  return { reparate, esuate };
}

async function main() {
  const iLimit = process.argv.indexOf('--limit');
  await repara({
    apply: process.argv.includes('--apply'),
    limit: iLimit > 0 ? Number(process.argv[iLimit + 1]) : Infinity,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error('\nA ESUAT:', e.message); process.exit(1); });
}
