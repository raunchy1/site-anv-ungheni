#!/usr/bin/env node
/**
 * VERIFICAREA POZELOR. Doar citire.
 *
 * O anvelopă fără poză nu se vinde. Regula de import spune „cel puțin o imagine
 * descărcată cu succes", dar o regulă verificată o singură dată, la import, nu
 * spune nimic despre ce e pe site azi: fișierul poate lipsi din storage, rândul
 * poate rămâne fără pereche. Scriptul ăsta întreabă direct fișierele, nu baza.
 *
 * Se rulează după fiecare import și oricând, ieftin.
 *
 *   node --env-file=.env.local tools/sync/pandashop/verify-images.mjs [--toate]
 */
import { readAll } from './db.mjs';

const toate = process.argv.includes('--toate');

async function main() {
  const [produse, imagini] = await Promise.all([
    readAll('products', 'id,slug_ro,title_ro,source'),
    readAll('product_images', 'product_id,storage_path,alt_ro,alt_ru,sort_order'),
  ]);

  const tinta = produse.filter((p) => (toate ? true : p.source === 'pandashop_sync'));
  const peProdus = new Map();
  for (const i of imagini) (peProdus.get(i.product_id) ?? peProdus.set(i.product_id, []).get(i.product_id)).push(i);

  console.log(`· verific ${tinta.length} produse${toate ? ' (tot catalogul)' : ' importate prin sincronizare'}`);

  const faraImagine = [];
  const oSinguraImagine = [];
  const faraAlt = [];
  const cai = new Map();               // cale unică -> produsele care o folosesc
  for (const p of tinta) {
    const list = (peProdus.get(p.id) ?? []).sort((a, b) => a.sort_order - b.sort_order);
    if (list.length === 0) { faraImagine.push(p); continue; }
    if (list.length === 1) oSinguraImagine.push(p);
    if (list.some((i) => !i.alt_ro || !i.alt_ru)) faraAlt.push(p);
    for (const i of list) (cai.get(i.storage_path) ?? cai.set(i.storage_path, []).get(i.storage_path)).push(p);
  }

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
  const lista = [...cai.keys()];
  console.log(`· ${lista.length} fișiere distincte de verificat`);

  const rupte = [];
  const lot = 12;
  for (let i = 0; i < lista.length; i += lot) {
    await Promise.all(lista.slice(i, i + lot).map(async (cale) => {
      try {
        const res = await fetch(base + cale, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
        if (!res.ok) rupte.push({ cale, status: res.status });
      } catch (e) {
        rupte.push({ cale, status: e.message });
      }
    }));
    if (i % 120 === 0 && i) process.stdout.write(`  ${i}/${lista.length}\r`);
  }

  console.log(`\nProduse fără nicio imagine: ${faraImagine.length}`);
  for (const p of faraImagine.slice(0, 20)) console.log(`  #${p.id} ${p.slug_ro}`);
  console.log(`Produse cu o singură imagine: ${oSinguraImagine.length}`);
  for (const p of oSinguraImagine.slice(0, 20)) console.log(`  #${p.id} ${p.slug_ro}`);
  console.log(`Produse cu text alternativ incomplet: ${faraAlt.length}`);
  for (const p of faraAlt.slice(0, 10)) console.log(`  #${p.id} ${p.slug_ro}`);
  console.log(`Fișiere care nu răspund: ${rupte.length}`);
  for (const r of rupte.slice(0, 20)) console.log(`  ${r.cale} → ${r.status}  (${cai.get(r.cale).length} produse)`);

  const ok = faraImagine.length === 0 && rupte.length === 0 && faraAlt.length === 0;
  console.log(`\n${ok ? 'TOATE POZELE SUNT LA LOCUL LOR' : 'SUNT PROBLEME — vezi mai sus'}`);
  if (!ok) process.exitCode = 1;
}

main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
