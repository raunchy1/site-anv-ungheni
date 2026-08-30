#!/usr/bin/env node
/**
 * GATE 1 — RAPORTUL DE POTRIVIRE.
 *
 * Prima rulare nu e un import. E o rulare care răspunde la o singură întrebare:
 * din cele 8.221 de anvelope de la pandashop, câte sunt deja la noi, sub alt
 * nume, fără `pandashop_id`?
 *
 * NU SCRIE NIMIC. Nici în bază, nici în storage. Singurele fișiere atinse sunt
 * cache-ul HTTP și raportul. Asta nu e o convenție de politețe: modulul `db.mjs`
 * n-are funcție de scriere, deci nici n-ar avea cu ce.
 *
 *   node --env-file=.env.local tools/sync/pandashop/report-match.mjs [--limit N] [--no-cache]
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { createFeedSource } from './feed-source.mjs';
import { readProducts, readBrands } from './db.mjs';
import { parseTitle } from './parse-title.mjs';
import { naturalKey, loseKey } from './natural-key.mjs';
import { tyreUrls, slugToTitle } from './sitemap.mjs';

const arg = (name, def = null) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? def : (process.argv[i + 1]?.startsWith('--') ? true : process.argv[i + 1]);
};

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');

async function main() {
  const limit = Number(arg('--limit', Infinity));
  const t0 = Date.now();

  console.log('· citesc catalogul nostru…');
  const [ours, brands] = await Promise.all([readProducts(), readBrands()]);
  const brandNames = brands.map((b) => b.name).filter(Boolean).sort((a, b) => b.length - a.length);
  console.log(`  ${ours.length} produse, ${brands.length} branduri`);

  /* Indexul nostru, pe cheie naturală. Un produs de-al nostru poate apărea de
     mai multe ori sub aceeași cheie — exact cazul pe care trebuie să-l vedem. */
  const byKey = new Map();       // cheia din coloanele noastre structurate
  const byTitleKey = new Map();  // cheia din titlul nostru, parsat ca al lor
  const byLose = new Map();
  let oursNoKey = 0;
  let dezacord = 0;
  for (const p of ours) {
    if (p.category !== 'anvelope') continue;
    if (!p.brand_name || !p.model || !p.diameter) { oursNoKey++; continue; }

    const k = naturalKey({
      brand: p.brand_name, model: p.model, width: p.width, aspect: p.aspect, diameter: p.diameter,
      loadIndex: p.load_index, speedIndex: p.speed_index, isXl: p.is_xl, isRunflat: p.is_runflat,
    });
    (byKey.get(k) ?? byKey.set(k, []).get(k)).push(p);

    /* A DOUA CHEIE, din titlul nostru, parsat cu exact aceeași funcție ca al lor.
       Nu e o plasă de siguranță de complezență: în catalogul nostru, coloanele
       `load_index`/`speed_index`/`is_xl` vin din atributele OpenCart și NU sunt
       mereu de acord cu titlul aceluiași rând (#12379 are titlu „…84H" și coloane
       „86H"). Pandashop scrie indicii în titlu. Dacă am compara doar coloană cu
       titlu, aceleași produse ar apărea ca „noi" și le-am importa a doua oară —
       adică fix duplicatele pe care Partea B le previne. */
    const tk = parseTitle(p.title_ro, brandNames);
    if (tk.brandKnown && tk.size_raw) {
      const k2 = naturalKey({
        brand: tk.brand, model: tk.model, width: tk.width, aspect: tk.aspect, diameter: tk.diameter,
        loadIndex: tk.loadIndex, speedIndex: tk.speedIndex, isXl: tk.isXl, isRunflat: tk.isRunflat,
      });
      (byTitleKey.get(k2) ?? byTitleKey.set(k2, []).get(k2)).push(p);
      if (k2 !== k) dezacord++;
    }

    const lk = loseKey({ brand: p.brand_name, model: p.model, width: p.width, aspect: p.aspect, diameter: p.diameter });
    (byLose.get(lk) ?? byLose.set(lk, []).get(lk)).push(p);
  }

  console.log('· enumăr catalogul lor…');
  const http = createHttp({ ...config.http, useCache: arg('--no-cache') !== true });
  const source = config.source === 'feed' ? createFeedSource() : createHtmlSource(http);

  const theirs = [];
  let declaredTotal = null;
  for await (const ref of source.listProducts({
    limit,
    onPage: (page, refs, meta) => {
      declaredTotal = meta.total ?? declaredTotal;
      if (page % 10 === 0) process.stdout.write(`  pagina ${page}, ${theirs.length} produse\r`);
    },
  })) {
    theirs.push(ref);
  }
  console.log(`\n  ${theirs.length} anvelope enumerate (ei declară ${declaredTotal})`);

  /* ---------------------------------------------------------- potrivirea */
  const exact = []; const ambiguous = []; const onlyTheirs = []; const unknownBrand = []; const unparsed = [];
  const matchedOurIds = new Set();

  for (const ref of theirs) {
    const t = parseTitle(ref.card.title, brandNames);
    if (!t.brandKnown) { unknownBrand.push({ ref, t }); continue; }
    if (t.size_source === undefined && !t.size_raw) { unparsed.push({ ref, t }); continue; }
    if (!t.size_raw) { unparsed.push({ ref, t }); continue; }

    const k = naturalKey({
      brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter,
      loadIndex: t.loadIndex, speedIndex: t.speedIndex, isXl: t.isXl, isRunflat: t.isRunflat,
    });
    const hit = byKey.get(k) ?? byTitleKey.get(k);
    if (!hit) {
      /* Un candidat „nou" merită privit de două ori: dacă avem deja același
         brand-model-dimensiune și diferă doar indicii sau XL, e fie o variantă
         reală (atunci e corect să-l importăm), fie o scăpare de normalizare
         (atunci NU e). Diferența se vede doar dacă raportul o arată. */
      const lk = loseKey({ brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter });
      onlyTheirs.push({ ref, t, key: k, near: byLose.get(lk) ?? null });
      continue;
    }
    if (hit.length > 1) { ambiguous.push({ ref, t, key: k, candidates: hit }); continue; }
    exact.push({ ref, t, key: k, our: hit[0] });
    matchedOurIds.add(hit[0].id);
  }

  let onlyOurs = ours.filter((p) => p.category === 'anvelope' && !matchedOurIds.has(p.id));

  /* AL DOILEA PAS DE DESCOPERIRE — vezi `sitemap.mjs`.
     Listarea categoriei arată doar ce au ei în stoc. Un produs de-al nostru care
     lipsește din listare poate foarte bine să existe la ei, doar fără stoc. Fără
     verificarea asta, „doar la noi" ar fi citit ca „de marcat delisted", iar
     Partea D.4 s-ar aplica peste vreo 8.000 de produse care n-au dispărut nicăieri. */
  let faraStoc = [];
  if (arg('--skip-outofstock') !== true) {
    console.log('· caut în sitemap-ul lor de produse fără stoc…');
    const urls = await tyreUrls({
      stateDir: config.paths.state,
      refresh: arg('--refresh-sitemap') === true,
      onFile: (i, n, found) => process.stdout.write(`  fișierul ${i}/${n}, ${found} anvelope\r`),
    });
    console.log(`\n  ${urls.length} anvelope fără stoc la ei`);

    const oosKeys = new Set();
    for (const u of urls) {
      const t = parseTitle(slugToTitle(u.slug), brandNames);
      if (!t.brandKnown || !t.size_raw) continue;
      oosKeys.add(naturalKey({
        brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter,
        loadIndex: t.loadIndex, speedIndex: t.speedIndex, isXl: t.isXl, isRunflat: t.isRunflat,
      }));
    }

    const inca = [];
    const disparute = [];
    for (const p of onlyOurs) {
      const t = parseTitle(p.title_ro, brandNames);
      const k = t.brandKnown && t.size_raw ? naturalKey({
        brand: t.brand, model: t.model, width: t.width, aspect: t.aspect, diameter: t.diameter,
        loadIndex: t.loadIndex, speedIndex: t.speedIndex, isXl: t.isXl, isRunflat: t.isRunflat,
      }) : null;
      (k && oosKeys.has(k) ? inca : disparute).push(p);
    }
    faraStoc = inca;
    onlyOurs = disparute;
  }

  /* --------------------------------------------------------------- raport */
  const dir = config.paths.reports;
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const summary = {
    rulare: new Date().toISOString(),
    durata_s: Math.round((Date.now() - t0) / 1000),
    ai_nostri: { total: ours.length, anvelope: ours.filter((p) => p.category === 'anvelope').length, fara_cheie: oursNoKey, titlu_vs_coloane_diferite: dezacord },
    ai_lor: { enumerate: theirs.length, declarate: declaredTotal },
    potriviri: {
      exacte: exact.length,
      ambigue: ambiguous.length,
      doar_la_ei: onlyTheirs.length,
      doar_la_noi: onlyOurs.length,
      la_ei_fara_stoc: faraStoc.length,
      brand_necunoscut: unknownBrand.length,
      dimensiune_neparsata: unparsed.length,
    },
    http: http.stats,
  };

  fs.writeFileSync(path.join(dir, `gate1-${stamp}.json`), JSON.stringify({
    summary,
    exact: exact.map((e) => ({ pandashop_id: e.ref.id, our_id: e.our.id, key: e.key, lor: e.ref.card.title, noi: e.our.title_ro })),
    ambiguous: ambiguous.map((a) => ({ pandashop_id: a.ref.id, key: a.key, lor: a.ref.card.title, candidati: a.candidates.map((c) => ({ id: c.id, slug: c.slug_ro, titlu: c.title_ro })) })),
    onlyTheirs: onlyTheirs.map((o) => ({
      pandashop_id: o.ref.id, url: o.ref.url, titlu: o.ref.card.title, key: o.key, pret_lor: o.ref.card.price,
      aproape: o.near ? o.near.slice(0, 3).map((c) => ({ id: c.id, titlu: c.title_ro })) : null,
    })),
    onlyOurs: onlyOurs.map((p) => ({ id: p.id, slug: p.slug_ro, titlu: p.title_ro, stoc: p.stock_status })),
    laEiFaraStoc: faraStoc.map((p) => ({ id: p.id, slug: p.slug_ro, titlu: p.title_ro, stoc: p.stock_status })),
    unknownBrand: unknownBrand.map((u) => ({ pandashop_id: u.ref.id, titlu: u.ref.card.title })),
    unparsed: unparsed.map((u) => ({ pandashop_id: u.ref.id, titlu: u.ref.card.title })),
  }, null, 2));

  const md = `# Gate 1 — raport de potrivire pandashop.md

Rulare: ${summary.rulare} · durată ${summary.durata_s}s · **nu s-a scris nimic în bază**

## Cifre

| | |
|---|---|
| Anvelope la noi | ${summary.ai_nostri.anvelope} |
| Anvelope la ei (enumerate / declarate) | ${theirs.length} / ${declaredTotal} |
| **Potrivite exact** | **${exact.length}** (${pct(exact.length, theirs.length)} din ale lor) |
| Ambigue (mai mulți candidați) | ${ambiguous.length} |
| Doar la ei — candidați de import | ${onlyTheirs.length} |
| ├ complet noi (nimic asemănător la noi) | ${onlyTheirs.filter((o) => !o.near).length} |
| └ variante ale unora existente (diferă indicii/XL) | ${onlyTheirs.filter((o) => o.near).length} |
| La ei, dar fără stoc — **NU** se marchează \`delisted\` | ${faraStoc.length} |
| Doar la noi — candidați reali de \`delisted\` | ${onlyOurs.length} |
| Brand necunoscut la noi | ${unknownBrand.length} |
| Dimensiune neparsată din titlu | ${unparsed.length} |
| Produsele noastre fără cheie completă | ${oursNoKey} |
| **Produse ale noastre unde titlul contrazice coloanele** | **${dezacord}** |

HTTP: ${http.stats.fetched} cereri, ${http.stats.cached} din cache, ${http.stats.retried} reîncercări, ${http.stats.failed} eșecuri.

## Primele 20 de potriviri exacte
${exact.slice(0, 20).map((e) => `- \`${e.ref.id}\` · ${e.ref.card.title}\n  → #${e.our.id} \`${e.our.slug_ro}\``).join('\n') || '_niciuna_'}

## Ambiguități (nu se ghicește — carantină)
${ambiguous.slice(0, 20).map((a) => `- \`${a.ref.id}\` · ${a.ref.card.title}\n  candidați: ${a.candidates.map((c) => `#${c.id} ${c.slug_ro}`).join(', ')}`).join('\n') || '_niciuna_'}

## Primii 20 candidați complet noi
${onlyTheirs.filter((o) => !o.near).slice(0, 20).map((o) => `- \`${o.ref.id}\` · ${o.ref.card.title} · ${o.ref.card.price ?? '—'} MDL`).join('\n') || '_niciunul_'}

## Candidați care seamănă cu ceva ce avem — de citit cu atenție
Diferă doar prin indici sau XL/runflat. Ori sunt variante reale, ori normalizarea
noastră ratează ceva. Primele 15:
${onlyTheirs.filter((o) => o.near).slice(0, 15).map((o) => `- \`${o.ref.id}\` · ${o.ref.card.title}\n  seamănă cu: ${o.near.slice(0, 2).map((c) => `#${c.id} ${c.title_ro}`).join(' · ')}`).join('\n') || '_niciunul_'}

## Branduri pe care nu le avem (nu se creează automat — Partea D.2)
${[...new Set(unknownBrand.map((u) => u.ref.card.title.replace(/^Anvelopa\s+/i, '').split(' ').slice(0, 2).join(' ')))].slice(0, 30).map((b) => `- ${b}`).join('\n') || '_niciunul_'}
`;

  const mdPath = path.join(dir, `gate1-${stamp}.md`);
  fs.writeFileSync(mdPath, md);
  console.log(`\n${md.split('## Primele 20')[0]}`);
  console.log(`Raport complet: ${mdPath}`);
}

main().catch((e) => { console.error('\nRULAREA A EȘUAT:', e); process.exit(1); });
