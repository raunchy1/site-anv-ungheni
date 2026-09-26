/**
 * Trimite adresele din sitemap-ul de producție la IndexNow (Bing, Yandex,
 * Seznam, Naver — o singură cerere ajunge la toți).
 *
 *   node tools/seo/indexnow.mjs            paginile fără fișe de produs
 *   node tools/seo/indexnow.mjs --toate    tot sitemap-ul, inclusiv produsele
 *   node tools/seo/indexnow.mjs --doar /anvelope-moldova   doar adresele care conțin textul
 *
 * Se rulează după un deploy care schimbă pagini, nu la fiecare. Fișele de
 * produs se trimit rar: sunt zeci de mii, iar Bing le găsește oricum din
 * sitemap — IndexNow grăbește, nu înlocuiește.
 */
import { readFileSync } from "node:fs";

const SITE = "https://anvelope-ungheni.md";
const KEY = readFileSync(new URL("../../src/lib/seo/indexnow.ts", import.meta.url), "utf8")
  .match(/INDEXNOW_KEY = "([0-9a-f]+)"/)[1];

const toate = process.argv.includes("--toate");
const iDoar = process.argv.indexOf("--doar");
const doar = iDoar > -1 ? process.argv[iDoar + 1] : null;

const cheie = await fetch(`${SITE}/${KEY}.txt`).then((r) => r.text());
if (cheie.trim() !== KEY) throw new Error(`fișierul-cheie nu e publicat la ${SITE}/${KEY}.txt`);

const xml = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
/* Fișele de produs au prioritatea 0.6 și stau la rădăcină; restul au prefixe cunoscute. */
const PAGINI = /\/(ru\/?)?$|\/(catalog-anvelope|katalog-shin|anvelope-moldova|shiny-moldova|servicii|uslugi|contact|kontakty|senzori-presiune-anvelope|datchiki-davleniya-v-shinah)(\/|$)/;
if (!toate) urls = urls.filter((u) => PAGINI.test(u));
if (doar) urls = urls.filter((u) => u.includes(doar));

console.log(`${urls.length} adrese de trimis`);
for (let i = 0; i < urls.length; i += 10000) {
  const lot = urls.slice(i, i + 10000);
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).hostname, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: lot }),
  });
  console.log(`lot ${i / 10000 + 1}: ${lot.length} adrese -> HTTP ${r.status} ${await r.text()}`);
}
