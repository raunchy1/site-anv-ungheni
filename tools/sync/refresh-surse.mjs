#!/usr/bin/env node
/**
 * ACTUALIZAREA PREȚULUI ȘI A STOCULUI PENTRU PNEU.MD ȘI PNEUEXPERT.
 *
 * Echivalentul lui `pandashop/refresh.mjs` pentru sursele care se citesc dintr-o
 * fotografie (`catalog.ndjson`). Până acum prețurile lor se scriau o singură
 * dată, la import, și rămâneau pe loc — iar când furnizorul scumpea o
 * dimensiune, la noi rămânea prețul vechi.
 *
 * CINE DICTEAZĂ PREȚUL. Regula din migrarea 0030: o anvelopă, un furnizor, un
 * preț. Rularea asta atinge DOAR produsele cu `primary_source` = sursa ei, și le
 * găsește prin legătura deja scrisă în `product_sources` — nu prin potrivire pe
 * titlu. Potrivirea s-a făcut o dată, la import, cu toate verificările ei; aici
 * doar se citește prețul de azi al aceluiași cod de la ei.
 *
 * CE SCRIE. Prin `sync_refresh_products`, aceeași funcție ca pandashop, deci
 * aceleași protecții: `price_locked` nu se rescrie, `in_stock` (marfa din
 * atelier) nu se stinge. Plus `available` în `product_sources`, ca să se vadă
 * pe cine mai putem întreba de fiecare anvelopă.
 *
 * DISPĂRUTE LA EI. Un cod care nu mai apare în fotografie se stinge
 * (`out_of_stock`, fără preț) — dar numai dacă fotografia e completă: codurile
 * la care fotografierea a dat eroare nu se ating.
 *
 *   node --env-file=.env.local tools/sync/refresh-surse.mjs --sursa pneu              # dry-run
 *   node --env-file=.env.local tools/sync/refresh-surse.mjs --sursa pneu --apply
 *   node --env-file=.env.local tools/sync/refresh-surse.mjs --sursa pneuexpert --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readAll } from './pandashop/db.mjs';
import { insert } from './pandashop/db-write.mjs';
import { calculeazaPret } from './pandashop/pricing.mjs';
import { reimprospateazaContoarele } from './pandashop/counters.mjs';
import { scrieSurse } from './pneu/sources.mjs';
import { config as cfgPneu } from './pneu/config.mjs';
import { config as cfgPneuexpert } from './pneuexpert/config.mjs';
import { citesteFotografia as fotoPneu } from './pneu/snapshot.mjs';
import { citesteFotografia as fotoPneuexpert } from './pneuexpert/snapshot.mjs';

/** Peste atâtea produse stinse dintr-o rulare, se oprește fără să scrie. */
const PRAG_STINSE = 0.35;

const SURSE = {
  pneu: {
    enumSursa: 'pneu_sync',
    fotografie: fotoPneu,
    minim: cfgPneu.breakers.minEnumerate,
    /* Un singur răspuns cu tot catalogul: ce lipsește din el nu mai există. */
    cuEroare: () => new Set(),
  },
  pneuexpert: {
    enumSursa: 'pneuexpert_sync',
    fotografie: fotoPneuexpert,
    /* ~1.900 de fișe vii din ~5.600 de adrese; sub atât fotografia e ciuntită. */
    minim: 1200,
    /* Paginile care au dat eroare la fotografiere nu sunt „dispărute". */
    cuEroare: () => {
      const f = path.join(cfgPneuexpert.paths.state, 'checkpoint.ndjson');
      const out = new Set();
      if (!fs.existsSync(f)) return out;
      for (const linie of fs.readFileSync(f, 'utf8').split('\n')) {
        try { const r = JSON.parse(linie); if (r.eroare) out.add(String(r.id)); } catch { /* linie trunchiată */ }
      }
      return out;
    },
  },
};

async function scriePreturi(randuri, { chunk = 500 } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  let actualizate = 0; let blocate = 0;
  for (let i = 0; i < randuri.length; i += chunk) {
    const res = await fetch(`${url}/rest/v1/rpc/sync_refresh_products`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_rows: randuri.slice(i, i + chunk) }),
    });
    if (!res.ok) throw new Error(`sync_refresh_products: HTTP ${res.status} ${await res.text()}`);
    const [r] = await res.json();
    actualizate += r?.actualizate ?? 0;
    blocate += r?.blocate ?? 0;
  }
  return { actualizate, blocate };
}

export async function actualizeazaSursa(sursa, opts = {}) {
  const def = SURSE[sursa];
  if (!def) throw new Error(`sursă necunoscută: ${sursa} (pneu | pneuexpert)`);
  const { apply: aplica = false, actor = 'cli' } = opts;
  const log = opts.log ?? console.log;
  const t0 = Date.now();

  const setari = (await readAll('settings', 'sync_enabled,pricing_rules'))[0] ?? {};
  if (setari.sync_enabled === false) {
    log('sincronizarea e oprită din admin (settings.sync_enabled = false)');
    return { oprit: 'din_admin' };
  }

  const foto = def.fotografie();
  if (foto.length < def.minim) {
    throw new Error(`fotografia ${sursa} are ${foto.length} anvelope, sub pragul de ${def.minim} — nu se scrie nimic`);
  }
  const lor = new Map(foto.map((r) => [String(r.id), r]));
  const cuEroare = def.cuEroare();
  log(`· fotografia ${sursa}: ${lor.size} anvelope${cuEroare.size ? `, ${cuEroare.size} coduri cu eroare (nu se ating)` : ''}`);

  const [produse, legaturi] = await Promise.all([
    readAll('products', 'id,brand_name,title_ro,price_mdl,stock_status,price_locked,slug_ro,slug_ru,pneuexpert_id', `&primary_source=eq.${sursa}`),
    readAll('product_sources', 'product_id,external_id', `&source=eq.${sursa}`),
  ]);
  const cod = new Map(legaturi.map((l) => [l.product_id, String(l.external_id)]));
  /* Pneuexpert a scris legătura întâi în coloana lui; tabelul a venit după. */
  for (const p of produse) if (!cod.has(p.id) && p.pneuexpert_id) cod.set(p.id, String(p.pneuexpert_id));
  log(`· produse care îi aparțin: ${produse.length}, cu cod legat: ${produse.filter((p) => cod.has(p.id)).length}`);

  const rezumat = { scumpite: 0, ieftinite: 0, reactivate: 0, stinse: 0, neschimbate: 0, faraCod: 0, eroare: 0 };
  const exemple = { scumpite: [], ieftinite: [], reactivate: [], stinse: [] };
  const deScris = [];
  const disponibilitate = [];
  const slugSchimbate = new Set();
  const marcheaza = (p) => {
    if (p.slug_ro) slugSchimbate.add(p.slug_ro);
    if (p.slug_ru && p.slug_ru !== p.slug_ro) slugSchimbate.add(p.slug_ru);
  };

  for (const p of produse) {
    const c = cod.get(p.id);
    if (!c) { rezumat.faraCod++; continue; }
    if (cuEroare.has(c)) { rezumat.eroare++; continue; }
    const r = lor.get(c);

    const pret = r ? calculeazaPret(r.priceMdl, p.brand_name, setari.pricing_rules) : null;
    const pretNou = pret?.pret ?? null;
    const stocNou = r && pret && r.stockStatus !== 'out_of_stock' ? 'supplier' : 'out_of_stock';
    disponibilitate.push({ product_id: p.id, source: sursa, external_id: c, available: stocNou === 'supplier' });

    /* Stocul propriu rămâne al atelierului; funcția SQL îl apără oricum, dar
       numărătoarea din raport trebuie să spună ce se întâmplă de fapt. */
    const stocFinal = p.stock_status === 'in_stock' ? 'in_stock' : stocNou;
    const pretVechi = p.price_mdl == null ? null : Number(p.price_mdl);
    const schimbaPret = !p.price_locked && pretVechi !== pretNou;
    const schimbaStoc = p.stock_status !== (pretNou == null && !p.price_locked ? 'out_of_stock' : stocFinal);
    if (!schimbaPret && !schimbaStoc) { rezumat.neschimbate++; continue; }

    marcheaza(p);
    deScris.push({ id: p.id, pandashop_id: null, source_price_mdl: r?.priceMdl ?? null, price_mdl: pretNou, stock_status: stocNou });
    if (schimbaStoc && stocFinal === 'out_of_stock') {
      rezumat.stinse++;
      if (exemple.stinse.length < 10) exemple.stinse.push(p.title_ro);
    } else if (schimbaStoc && p.stock_status === 'out_of_stock') {
      rezumat.reactivate++;
      if (exemple.reactivate.length < 10) exemple.reactivate.push(`${p.title_ro} → ${pretNou} MDL`);
    }
    if (schimbaPret && pretVechi != null && pretNou != null) {
      const k = pretNou > pretVechi ? 'scumpite' : 'ieftinite';
      rezumat[k]++;
      if (exemple[k].length < 10) exemple[k].push(`${p.title_ro}: ${pretVechi} → ${pretNou} MDL`);
    }
  }

  log(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'} (${sursa})`);
  log(`  preț crescut:     ${rezumat.scumpite}`);
  log(`  preț scăzut:      ${rezumat.ieftinite}`);
  log(`  reactivate:       ${rezumat.reactivate}`);
  log(`  stinse:           ${rezumat.stinse}`);
  log(`  neschimbate:      ${rezumat.neschimbate}`);
  if (rezumat.faraCod) log(`  fără cod legat:   ${rezumat.faraCod} (nu se ating)`);
  if (rezumat.eroare) log(`  eroare la ei:     ${rezumat.eroare} (nu se ating)`);
  for (const k of ['scumpite', 'ieftinite', 'reactivate']) for (const e of exemple[k]) log(`   ${k === 'ieftinite' ? '↓' : k === 'scumpite' ? '↑' : '+'} ${e}`);
  for (const e of exemple.stinse) log(`   − ${e}`);

  const legate = produse.length - rezumat.faraCod;
  if (legate && rezumat.stinse / legate > PRAG_STINSE) {
    throw new Error(`s-ar stinge ${rezumat.stinse} din ${legate} produse, peste pragul de ${PRAG_STINSE * 100}% — fotografia e probabil incompletă; nu se scrie nimic`);
  }

  if (!aplica) return { ...rezumat, dryRun: true, deScris: deScris.length, slugSchimbate: [...slugSchimbate] };

  const { actualizate, blocate } = await scriePreturi(deScris);
  await scrieSurse(disponibilitate);
  log(`\n  actualizate: ${actualizate} (${blocate} cu preț blocat manual — doar stocul)`);
  log(`  disponibilitate în product_sources: ${disponibilitate.length}`);
  if (actualizate > 0) await reimprospateazaContoarele(log);

  await insert('import_runs', [{
    source: def.enumSursa, actor, dry_run: false,
    started_at: new Date(t0).toISOString(), finished_at: new Date().toISOString(),
    rows_total: produse.length, rows_updated: actualizate, rows_created: 0, rows_skipped: rezumat.neschimbate,
    rows_deactivated: rezumat.stinse, prices_changed: rezumat.scumpite + rezumat.ieftinite, prices_locked: blocate,
    errors: [], notes: `refresh ${sursa}: ↑${rezumat.scumpite} ↓${rezumat.ieftinite} +${rezumat.reactivate} −${rezumat.stinse}`,
  }]);

  log(`gata în ${Math.round((Date.now() - t0) / 1000)}s`);
  return { ...rezumat, dryRun: false, actualizate, blocate, slugSchimbate: [...slugSchimbate] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--sursa');
  actualizeazaSursa(i > 0 ? process.argv[i + 1] : '', { apply: process.argv.includes('--apply') })
    .catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
}
