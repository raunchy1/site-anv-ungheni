#!/usr/bin/env node
/**
 * CORECTAREA DIMENSIUNILOR GRESITE DIN IMPORTUL VECHI.
 *
 * DE CE EXISTA. Verificarea de paritate a gasit fise unde titlul nostru si
 * titlul furnizorului spun aceeasi dimensiune, iar coloanele spun altceva:
 * „Vredestein Quatrac Pro+ 245/35 R18" cu `diameter = 'R19'`, „Petlas
 * Snowmaster 2 Sport 255/55 R20" cu coloanele „235/50 R18". Sunt erori venite
 * din exportul OpenCart. Produsul e pe site, cumparabil, cu pretul corect — dar
 * sta in alt sertar de filtru, deci nu-l gaseste nimeni care cauta dupa
 * dimensiunea reala.
 *
 * REGULA DE DECIZIE, si de ce nu e mai simpla. Titlul nostru singur nu e destul:
 * 1.896 de fise au titlul in dezacord cu coloanele, si nu de fiecare data
 * titlul are dreptate. Se scrie DOAR cand doua surse independente — titlul
 * nostru si titlul furnizorului — spun acelasi lucru impotriva coloanei. Doi
 * martori care nu s-au vorbit intre ei bat un registru.
 *
 * Cazurile unde furnizorul nu are produsul, sau unde titlurile nu sunt de acord
 * intre ele, raman neatinse si se tiparesc la sfarsit.
 *
 *   node --env-file=.env.local tools/sync/pandashop/fix-sizes.mjs          # dry-run
 *   node --env-file=.env.local tools/sync/pandashop/fix-sizes.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { readAll, readBrands } from './db.mjs';
import { indexeazaCatalogul, potriveste, potrivireRelaxata } from './match.mjs';
import { parseSize } from '../../scraper/parse-product.mjs';

const COLOANE = [
  'id', 'category', 'brand_name', 'model', 'width', 'aspect', 'diameter', 'size_raw', 'size_system',
  'load_index', 'speed_index', 'is_xl', 'is_runflat', 'is_commercial', 'title_ro', 'slug_ro', 'pandashop_id',
].join(',');

/** Titlul, fara cuvantul de categorie, ca sa nu incurce parserul. */
const curat = (t) => String(t ?? '').replace(/^\s*(Anvelopa|Anvelope|Шина|Шины)\s+/i, '');

const cheie = (s) => `${s.width ?? '—'}/${s.aspect ?? '—'} ${s.diameter ?? '—'}`;

async function scrie(randuri) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/rpc/sync_fix_sizes`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_rows: randuri }),
  });
  if (!res.ok) throw new Error(`sync_fix_sizes: HTTP ${res.status} ${await res.text()}`);
  const [r] = await res.json();
  return r?.actualizate ?? 0;
}

export async function corecteaza(opts = {}) {
  const { apply: aplica = false, faraCache = false } = opts;
  const log = opts.log ?? console.log;

  log('· citesc catalogul nostru…');
  const [produse, branduri] = await Promise.all([readAll('products', COLOANE), readBrands()]);
  const brandNames = branduri.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  const index = indexeazaCatalogul(produse, brandNames);
  const dupaId = new Map(produse.map((p) => [p.id, p]));

  log('· enumar listarea lor…');
  const http = createHttp({ ...config.http, useCache: !faraCache });
  const source = createHtmlSource(http);

  const deScris = [];
  const dezacord = [];   // titlurile nu se pun de acord intre ele
  let vazute = 0;

  for await (const ref of source.listProducts({
    onPage: (pg) => { if (pg % 20 === 0) process.stdout.write(`  pagina ${pg}, ${deScris.length} de corectat\r`); },
  })) {
    vazute++;
    const m = potriveste(ref.card.title, index, brandNames, { pandashopId: ref.id });
    let noi = m.stare === 'gasit' ? m.produs : (m.stare === 'doar_la_ei' ? potrivireRelaxata(m.t, m.aproape) : null);
    if (!noi) continue;
    const p = dupaId.get(noi.id) ?? noi;

    const sLor = parseSize(curat(ref.card.title));
    const sNoi = parseSize(curat(p.title_ro));
    if (!sLor.size_raw || !sNoi.size_raw) continue;

    const coloane = { width: p.width, aspect: p.aspect, diameter: p.diameter };
    if (cheie(sLor) === cheie(coloane)) continue;          // coloanele sunt bune

    if (cheie(sLor) !== cheie(sNoi)) {
      /* Cele doua titluri nu spun acelasi lucru. Nu se atinge nimic. */
      dezacord.push({ id: p.id, titlu: p.title_ro, lor: cheie(sLor), titlulNostru: cheie(sNoi), coloane: cheie(coloane) });
      continue;
    }

    deScris.push({
      id: p.id,
      width: sNoi.width,
      aspect: sNoi.aspect,
      diameter: sNoi.diameter,
      size_raw: sNoi.size_raw,
      size_system: sNoi.size_system,
      is_commercial: /C$/i.test(String(sNoi.diameter ?? '')),
      _titlu: p.title_ro,
      _dinainte: cheie(coloane),
      _dupa: cheie(sNoi),
    });
  }

  log(`\n  ${vazute} produse la ei`);
  log(`  de corectat (ambele titluri de acord, coloana gresita): ${deScris.length}`);
  log(`  titluri in dezacord — se lasa in pace:                  ${dezacord.length}`);

  for (const x of deScris) log(`   ~ ${x._titlu}\n       ${x._dinainte}  ->  ${x._dupa}`);
  for (const x of dezacord.slice(0, 10)) log(`   ? ${x.titlu}\n       ei: ${x.lor} · titlul nostru: ${x.titlulNostru} · coloane: ${x.coloane}`);

  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  fs.writeFileSync(path.join(dir, `dimensiuni-${stamp}.json`), JSON.stringify({ deScris, dezacord }, null, 2));

  if (!aplica) { log('\nNimic scris. Adauga --apply.'); return { deScris, dezacord }; }
  if (deScris.length === 0) return { deScris, dezacord };

  const n = await scrie(deScris.map(({ _titlu, _dinainte, _dupa, ...r }) => r));
  log(`\nAPLICAT: ${n} dimensiuni corectate`);

  const { reimprospateazaContoarele } = await import('./counters.mjs');
  await reimprospateazaContoarele(log);
  return { deScris, dezacord, actualizate: n };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  corecteaza({ apply: process.argv.includes('--apply'), faraCache: process.argv.includes('--no-cache') })
    .catch((e) => { console.error('\nA ESUAT:', e.message); process.exit(1); });
}
