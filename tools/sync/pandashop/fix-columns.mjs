#!/usr/bin/env node
/**
 * ETAPA 0.1 — corecția coloanelor care contrazic titlul.
 *
 * DRY-RUN IMPLICIT. Fără `--apply` nu se scrie nimic; se tipărește ce s-ar face.
 * Chiar și cu `--apply`, se ating STRICT coloanele de specificație ale
 * produselor din raport: `diameter`, `size_raw`, `is_commercial`, `load_index`,
 * `speed_index`, `is_xl`, `is_runflat`. Nici preț, nici stoc, nici titlu, nici
 * slug, nici alt produs.
 *
 * Regulile, în ordine — prima care se potrivește câștigă:
 *
 *   1. Litera C pierdută la diametru („R14" în coloană, „R14C" în titlu).
 *      Atributul OpenCart a tăiat-o. Nu e o judecată de valoare: titlul o are,
 *      catalogul lor o confirmă de 354 de ori și o contrazice de 0 ori.
 *   2. Indici pe care catalogul lor îi confirmă din titlu → se ia titlul.
 *   3. Indici pe care catalogul lor îi confirmă din coloană → NU se atinge.
 *   4. Indici pe care nu-i confirmă nici de-o parte, nici de alta → se ia titlul
 *      doar cu `--fara-confirmare`, altfel se sare. 94% din cazurile decisive dau
 *      dreptate titlului, dar o probabilitate nu e o dovadă pentru rândul ăsta.
 *   5. Cazurile în care ei au AMBELE variante ca produse distincte → NU se atinge.
 *      Acolo rândul nostru amestecă două anvelope; le rezolvă un om.
 *
 *   node --env-file=.env.local tools/sync/pandashop/fix-columns.mjs [--apply] [--fara-confirmare]
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.mjs';

const has = (f) => process.argv.includes(f);

const raport = () => {
  const f = fs.readdirSync(config.paths.reports).filter((x) => x.startsWith('etapa0-neconcordante-') && x.endsWith('.json')).sort().pop();
  if (!f) throw new Error('rulează întâi report-mismatch.mjs');
  return JSON.parse(fs.readFileSync(path.join(config.paths.reports, f), 'utf8'));
};

function decizie(r, faraConfirmare) {
  const patch = {};
  const dCol = String(r.coloane.diameter ?? '').toUpperCase();
  const dTit = String(r.din_titlu.diameter ?? '').toUpperCase();

  /* 1 — litera C */
  if (dCol !== dTit && dCol.replace(/C$/, '') === dTit.replace(/C$/, '') && dTit.endsWith('C')) {
    patch.diameter = dTit;
    patch.is_commercial = true;
    /* Fără profil („175 R14C") dimensiunea n-are slash — vezi `parseSize`. */
    patch.size_raw = r.din_titlu.aspect == null
      ? `${r.din_titlu.width} ${dTit}`
      : `${r.din_titlu.width}/${r.din_titlu.aspect} ${dTit}`;
  }

  const indiciDiferiti = String(r.coloane.load_index ?? '') !== String(r.din_titlu.loadIndex ?? '')
    || String(r.coloane.speed_index ?? '').toUpperCase() !== String(r.din_titlu.speedIndex ?? '').toUpperCase()
    || Boolean(r.coloane.is_xl) !== Boolean(r.din_titlu.isXl);

  if (indiciDiferiti) {
    if (r.lor_confirma_titlul && r.lor_confirma_coloana) return { motiv: 'ambele variante există la ei — decide un om', patch: null };
    if (r.lor_confirma_coloana) return { motiv: 'catalogul lor confirmă coloana — nu se atinge', patch: null };
    if (!r.lor_confirma_titlul && !faraConfirmare) return { motiv: 'neconfirmat de nicio parte — sărit (vezi --fara-confirmare)', patch: Object.keys(patch).length ? patch : null };
    patch.load_index = r.din_titlu.loadIndex ?? null;
    patch.speed_index = r.din_titlu.speedIndex ?? null;
    patch.is_xl = Boolean(r.din_titlu.isXl);
  }
  return { motiv: r.lor_confirma_titlul ? 'confirmat de catalogul lor' : 'doar litera C', patch: Object.keys(patch).length ? patch : null };
}

async function main() {
  const d = raport();
  const faraConfirmare = has('--fara-confirmare');
  const aplica = has('--apply');

  const deFacut = []; const sarite = [];
  for (const r of d.produse) {
    const { patch, motiv } = decizie(r, faraConfirmare);
    (patch ? deFacut : sarite).push({ r, patch, motiv });
  }

  const peCamp = {};
  for (const x of deFacut) for (const k of Object.keys(x.patch)) peCamp[k] = (peCamp[k] ?? 0) + 1;

  console.log(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}${faraConfirmare ? ' (inclusiv cazurile neconfirmate)' : ''}\n`);
  console.log(`Din ${d.produse.length} neconcordanțe:`);
  console.log(`  de corectat: ${deFacut.length}`);
  console.log(`  lăsate în pace: ${sarite.length}`);
  console.log('\nCâmpuri atinse:');
  for (const [k, n] of Object.entries(peCamp).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${n}`);

  const peMotiv = {};
  for (const x of sarite) peMotiv[x.motiv] = (peMotiv[x.motiv] ?? 0) + 1;
  console.log('\nDe ce se sare peste restul:');
  for (const [k, n] of Object.entries(peMotiv).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);

  console.log('\nPrimele 10 corecții:');
  for (const x of deFacut.slice(0, 10)) {
    console.log(`  #${x.r.id} ${x.r.titlu}`);
    console.log(`     ${JSON.stringify(x.patch)}   (${x.motiv})`);
  }

  if (!aplica) { console.log('\nNimic scris. Adaugă --apply după ce aprobi lista.'); return; }
  throw new Error('scrierea nu e implementată încă: se activează după aprobarea raportului (Gate 0)');
}

main().catch((e) => { console.error('\n', e.message); process.exit(1); });
