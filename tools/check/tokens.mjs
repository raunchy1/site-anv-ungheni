/**
 * Verifică că fiecare variabilă CSS folosită în componente e definită în tokens.css
 * și că nu se strecoară valori brute care ocolesc sistemul.
 *
 * Motivul: CSS-ul nu dă eroare la o variabilă inexistentă — pur și simplu nu aplică
 * nimic. Am pierdut margini întregi cu `--sp-7` și `--sp-14`, care nu există în scală.
 * Singura apărare e automată.
 *
 * Rulare: pnpm check:tokens (rulează și în CI)
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const TOKENS = 'src/styles/tokens.css';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : /\.(tsx|ts|css)$/.test(e.name) ? [p] : [];
});

const tokensCss = fs.readFileSync(TOKENS, 'utf8');
const defined = new Set([...tokensCss.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]));
// variabile venite din alte surse legitime
// Variabile legitime care nu vin din tokens.css:
// fonturile (next/font), prefixul Tailwind, variabilele locale setate inline
// pe componentă, și `--sp-` folosit ca prefix într-un template literal.
for (const v of ['--font-plex-sans', '--font-plex-mono', '--tw-', '--spec-label', '--sp-']) defined.add(v);

// `/design-system` afișează paleta, deci scrie hex-uri intenționat — e singura
// rută unde o culoare brută e conținut, nu abatere.
const files = walk(SRC).filter((f) => !f.endsWith('tokens.css') && !f.includes('design-system'));
const missing = new Map();
const rawValues = new Map();

// Culorile brute nu sunt niciodată acceptabile: paleta e închisă, iar un hex
// scris direct ocolește și modul întunecat, și verificarea de contrast.
const RAW_COLOR = /\b(?:text|bg|border|fill|stroke|shadow|ring|from|to|via)-\[#[0-9a-fA-F]{3,8}\]/g;

// La spațiere, doar valorile de pe grila de 4px trebuie să fie tokeni. Sub 4px
// (borduri, hairline-uri) și înălțimile fixe de componentă sunt legitime —
// `h-[60px]` pentru header nu e o abatere, e o decizie de layout.
const RAW_SPACE = /\b(?:p|m|gap|space)[a-z]*-\[(\d+)px\]/g;
const isOffGrid = (px) => Number(px) >= 4 && Number(px) % 4 === 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/var\((--[a-z0-9-]+)/gi)) {
    const name = m[1];
    if (defined.has(name) || [...defined].some((d) => d.endsWith('-') && name.startsWith(d))) continue;
    (missing.get(name) ?? missing.set(name, new Set()).get(name)).add(f);
  }
  for (const m of src.matchAll(RAW_COLOR)) {
    (rawValues.get(m[0]) ?? rawValues.set(m[0], new Set()).get(m[0])).add(f);
  }
  for (const m of src.matchAll(RAW_SPACE)) {
    // pe grila de 4px există token; sub 4px nu are rost unul
    if (isOffGrid(m[1])) (rawValues.get(m[0]) ?? rawValues.set(m[0], new Set()).get(m[0])).add(f);
  }
}

let failed = false;

if (missing.size) {
  failed = true;
  console.error(`\n${missing.size} variabile CSS nedefinite în tokens.css:`);
  for (const [name, where] of missing) console.error(`  ${name}  ->  ${[...where].join(', ')}`);
}

if (rawValues.size) {
  failed = true;
  console.error(`\n${rawValues.size} valori brute care ocolesc tokenii (culori hex, sau spațiere de pe grila de 4px scrisă în px):`);
  for (const [val, where] of rawValues) console.error(`  ${val}  ->  ${[...where].join(', ')}`);
}

if (!failed) console.log(`tokeni: ${defined.size} definiți, ${files.length} fișiere verificate, zero probleme`);
process.exit(failed ? 1 : 0);
