#!/usr/bin/env node
/**
 * ANVELOPELE OPRITE ÎN CARANTINĂ DOAR PENTRU CĂ N-AVEAU POZĂ.
 *
 * Din importul pneu.md, 198 de anvelope n-au intrat în catalog pentru un singur
 * motiv: la ei nu există nicio fotografie pentru ele. Restul — dimensiune,
 * indici, preț, titlu — e în regulă.
 *
 * Pentru o parte din ele avem deja fotografia ACELUIAȘI MODEL, la altă
 * dimensiune, în propriul nostru catalog. Nu e împrumutată de nicăieri: e
 * fotografia noastră, iar catalogul funcționează deja așa — un model are o poză
 * pentru toate dimensiunile lui (15.000 de referințe stau pe 1.749 de fișiere).
 * La anvelope asta e și practica normală: fotografia arată desenul benzii de
 * rulare, care e al modelului, nu al dimensiunii.
 *
 * Ce NU face: nu inventează poze, nu ia poze de pe alte site-uri, nu pune un
 * substitut generic. Anvelopele pentru care nu există fotografia modelului
 * nicăieri rămân în carantină și în `reports/sync/pneu-fara-poza.md`, de cerut
 * de la furnizor sau de la marcă.
 *
 *   node --env-file=.env.local tools/sync/pneu/poze-din-catalog.mjs           # dry-run
 *   node --env-file=.env.local tools/sync/pneu/poze-din-catalog.mjs --apply
 */
import { pathToFileURL } from 'node:url';
import { readAll } from '../pandashop/db.mjs';
import { insert, insertReturning, update } from '../pandashop/db-write.mjs';
import { scrieSurse } from './sources.mjs';
import { SURSA } from './import.mjs';

/** Marcă + model, comparabile indiferent cum sunt scrise. */
const cheieModel = (brand, model) => `${brand ?? ''}|${model ?? ''}`
  .toUpperCase().replace(/[^A-Z0-9|]/g, '');

export async function ruleaza({ apply = false, log = console.log } = {}) {
  const t0 = Date.now();

  const [carantina, produse, imagini] = await Promise.all([
    readAll('sync_quarantine', 'id,pandashop_id,reason,raw,resolved_at', '&supplier=eq.pneu&resolved_at=is.null'),
    readAll('products', 'id,brand_name,model,slug_ro,slug_ru,legacy_product_id'),
    readAll('product_images', 'product_id,storage_path,original_path,content_hash,width,height,sort_order'),
  ]);

  const deRezolvat = carantina.filter((c) => /nicio imagine/.test(c.reason) && c.raw?.title_ro);
  log(`· în carantină pentru „nicio imagine": ${deRezolvat.length}`);

  /* Poza de referință a fiecărui model din catalogul nostru: prima din galerie. */
  const pozaModelului = new Map();
  const pePodus = new Map();
  for (const im of imagini) {
    const l = pePodus.get(im.product_id) ?? [];
    l.push(im);
    pePodus.set(im.product_id, l);
  }
  for (const p of produse) {
    if (!p.brand_name || !p.model) continue;
    const gal = pePodus.get(p.id);
    if (!gal?.length) continue;
    const k = cheieModel(p.brand_name, p.model);
    if (pozaModelului.has(k)) continue;
    pozaModelului.set(k, [...gal].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]);
  }

  const sluguriRo = new Set(produse.map((p) => p.slug_ro).filter(Boolean));
  const sluguriRu = new Set(produse.map((p) => p.slug_ru).filter(Boolean));
  const legacyFolosite = new Set(produse.map((p) => p.legacy_product_id));

  const gata = [];
  const faraModel = [];
  const conflict = [];

  for (const c of deRezolvat) {
    const r = c.raw;
    const poza = pozaModelului.get(cheieModel(r.brand_name, r.model));
    if (!poza) { faraModel.push(c); continue; }

    /*
     * Slugurile și `legacy_product_id` se verifică DIN NOU, față de catalogul de
     * acum. Rândurile astea au fost pregătite când catalogul avea 18.443 de
     * produse; între timp au intrat 4.275, iar unul dintre ele poate să fi luat
     * exact slug-ul pe care îl voia ăsta.
     */
    if (sluguriRo.has(r.slug_ro) || (r.slug_ru && sluguriRu.has(r.slug_ru))) { conflict.push(c); continue; }
    let legacy = r.legacy_product_id;
    while (legacyFolosite.has(legacy)) legacy -= 1;

    sluguriRo.add(r.slug_ro);
    if (r.slug_ru) sluguriRu.add(r.slug_ru);
    legacyFolosite.add(legacy);
    gata.push({ c, rand: { ...r, legacy_product_id: legacy }, poza });
  }

  log(`· au poza modelului în catalogul nostru: ${gata.length}`);
  log(`· n-au fotografie nicăieri — rămân în carantină: ${faraModel.length}`);
  if (conflict.length) log(`· slug ocupat între timp de alt produs: ${conflict.length}`);

  if (!apply) {
    for (const g of gata.slice(0, 10)) log(`    ${g.rand.title_ro}  ←  ${g.poza.storage_path}`);
    log('\nNimic scris. Adaugă --apply.');
    return { gata: gata.length, faraModel: faraModel.length, conflict: conflict.length, dryRun: true };
  }

  let create = 0;
  const surse = [];
  const nebifate = [];
  for (const g of gata) {
    try {
      const [creat] = await insertReturning('products', [g.rand]);
      await insert('product_images', [{
        product_id: creat.id,
        storage_path: g.poza.storage_path,
        original_path: g.poza.original_path,
        content_hash: g.poza.content_hash,
        width: g.poza.width,
        height: g.poza.height,
        /* Textul alternativ e al produsului NOU, nu al celui de la care s-a luat
           fotografia: altfel o anvelopă de 205/55 ar fi descrisă ca 225/45. */
        alt_ro: g.rand.title_ro,
        alt_ru: g.rand.title_ru ?? g.rand.title_ro,
        sort_order: 0,
      }]);
      surse.push({
        product_id: creat.id, source: SURSA, external_id: String(g.c.pandashop_id),
        available: g.rand.stock_status === 'supplier',
      });
      create++;
      /*
       * Bifarea carantinei e evidență, nu treabă. `resolution` are o constrângere
       * care acceptă doar „approved" / „rejected" / „ignored" — nu text liber; de
       * aceea explicația stă aici, în cod, și nu în coloană. Dacă bifarea pică,
       * produsul e deja în catalog și nu se pierde nimic: se raportează și se
       * merge mai departe, ca un rând de evidență să nu poată opri importul.
       */
      try {
        await update('sync_quarantine', { id: g.c.id }, {
          resolved_at: new Date().toISOString(), resolution: 'approved',
        });
      } catch (e) {
        nebifate.push(`#${creat.id} (carantina ${g.c.id}): ${e.message}`);
      }
      if (create % 25 === 0) log(`  scrise ${create}/${gata.length}…`);
    } catch (e) {
      log(`  ! ${g.rand.title_ro}: ${e.message}`);
    }
  }
  if (surse.length) await scrieSurse(surse);

  log(`\n  create: ${create} produse, fiecare cu fotografia modelului lui`);
  if (nebifate.length) log(`  carantină nebifată (produsele SUNT în catalog): ${nebifate.length}`);
  log(`  rămase fără fotografie: ${faraModel.length}`);
  log(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
  return { create, faraModel: faraModel.length, conflict: conflict.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ruleaza({ apply: process.argv.includes('--apply') })
    .catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
