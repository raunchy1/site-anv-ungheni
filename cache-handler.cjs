/**
 * CACHE-UL ISR, CU O LIMITA PE CATALOG.
 *
 * Pe Vercel, cache-ul ISR il administra platforma. Pe Coolify il tine Next in
 * `FileSystemCache`, care scrie fiecare pagina randata in `.next/server/app` si
 * nu sterge niciodata nimic. Ruta `catalog/[...filtre]` are sute de mii de
 * adrese valide (marca × latime × inaltime × diametru × sezon × pagina ×
 * sortare), iar robotii le parcurg pe toate. Pe 24 septembrie 2026 s-au strans
 * asa 175 GB in ~25 de ore, discul serverului a ajuns la 100%, iar paginile
 * scrise dupa aceea au iesit de 0 bytes — site-ul raspundea 200 cu o pagina
 * alba.
 *
 * Handlerul de mai jos e `FileSystemCache` neschimbat, cu doua exceptii:
 *
 * 1. O pagina de catalog cu MAI MULT de un segment de filtru nu se mai scrie pe
 *    disc. Sta doar in LRU-ul din memorie (`cacheMaxMemorySize` din
 *    next.config.ts), care e plafonat si isi scoate singur intrarile vechi.
 *    Filtrele simple (`latime_205`, `marca_michelin`, `sezon_iarna`) sunt un set
 *    finit — cele pre-generate la build plus marcile — si raman pe disc.
 *
 * 2. O intrare de pagina cu HTML gol se trateaza ca lipsa, nu ca raspuns. Asa
 *    un fisier trunchiat de un disc plin produce o randare noua, nu o pagina
 *    alba servita o zi intreaga.
 *
 * 3. ETICHETELE GOLITE SUPRAVIETUIESC UNEI REPORNIRI.
 *
 *    `revalidateTag("produs:<slug>")` — cu care sincronizarea si panoul de
 *    admin anunta un pret nou — nu sterge nimic de pe disc. Next doar noteaza
 *    „eticheta asta a expirat la ora X" intr-un `Map` din MEMORIE
 *    (`tags-manifest.external.js`) si refuza apoi raspunsurile mai vechi de X.
 *    Raspunsurile de la baza stau insa in `.next/cache/fetch-cache`, pe volumul
 *    persistent, valabile o luna. La fiecare deploy sau repornire `Map`-ul
 *    porneste gol, iar raspunsul vechi redevine „proaspat": fisa se re-randa
 *    cu pretul de dinaintea sincronizarii.
 *
 *    Masurat pe 26 septembrie 2026: baza avea 2.200 lei la Firestone Roadhawk 2
 *    245/50 R18, pagina arata 3.300; 8 din 80 de fise pneu.md verificate aveau
 *    pretul vechi. Tata a vazut-o primul.
 *
 *    Acum fiecare golire se scrie si in `.next/cache/etichete-golite.json`,
 *    langa fetch-cache, pe acelasi volum, si se reincarca la pornire.
 */
const fs = require("node:fs");
const path = require("node:path");
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;
const { tagsManifest } =
  require("next/dist/server/lib/incremental-cache/tags-manifest.external");

/* Raspunsurile din fetch-cache traiesc o luna (`O_LUNA` in supabase/server.ts);
   o golire mai veche de atat nu mai are ce refuza. */
const PASTRARE_MS = 32 * 24 * 3600 * 1000;

let fisierEtichete = null;
let programat = null;

function scrieEtichetele() {
  programat = null;
  if (!fisierEtichete) return;
  const limita = Date.now() - PASTRARE_MS;
  const obiect = {};
  for (const [tag, v] of tagsManifest) {
    if (Math.max(v.expired ?? 0, v.stale ?? 0) >= limita) obiect[tag] = v;
  }
  try {
    const tmp = `${fisierEtichete}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(obiect));
    fs.renameSync(tmp, fisierEtichete);
  } catch (e) {
    console.error("cache-handler: nu pot scrie etichetele golite:", e.message);
  }
}

/* O data pe proces: IncrementalCache construieste handlerul la fiecare cerere. */
function incarcaEtichetele(fisier) {
  if (fisierEtichete) return;
  fisierEtichete = fisier;
  try {
    const salvate = JSON.parse(fs.readFileSync(fisier, "utf8"));
    for (const [tag, v] of Object.entries(salvate)) {
      const acum = tagsManifest.get(tag) ?? {};
      tagsManifest.set(tag, {
        ...acum,
        ...(v.stale != null ? { stale: Math.max(v.stale, acum.stale ?? 0) } : {}),
        ...(v.expired != null ? { expired: Math.max(v.expired, acum.expired ?? 0) } : {}),
      });
    }
  } catch (e) {
    if (e.code !== "ENOENT") console.error("cache-handler: etichete golite ilizibile:", e.message);
  }
  /* La oprire, ultima golire amanata se scrie pe loc. `globalThis.process`,
     nu `process`: Turbopack citeste fisierul si pentru runtime-ul Edge si
     respinge accesul direct, desi handlerul ruleaza doar in Node. */
  const proc = globalThis["process"];
  if (proc && typeof proc.once === "function") proc.once("exit", () => { if (programat) scrieEtichetele(); });
}

/** `/ro/catalog/a/b` -> doua segmente de filtru, deci doar in memorie. */
const CATALOG_ADANC = /^\/(?:ro|ru)\/catalog\/[^/]+\/./;

module.exports = class CacheCuLimita extends FileSystemCache {
  constructor(ctx) {
    super(ctx);
    this.flushToDiskImplicit = this.flushToDisk;
    incarcaEtichetele(path.join(ctx.serverDistDir, "..", "cache", "etichete-golite.json"));
  }

  /* Sincronizarea goleste sute de etichete una dupa alta; fisierul se scrie o
     data, dupa ultima. */
  async revalidateTag(tags, durations) {
    await super.revalidateTag(tags, durations);
    if (!programat) programat = setTimeout(scrieEtichetele, 250);
  }

  async get(key, ctx) {
    const data = await super.get(key, ctx);
    const v = data && data.value;
    if (v && (v.kind === "APP_PAGE" || v.kind === "PAGES") && !v.html) return null;
    return data;
  }

  /* `super.set` citeste `flushToDisk` sincron, inainte de primul `await`, deci
     steagul se pune la loc imediat — doua scrieri concurente nu se incurca. */
  set(key, data, ctx) {
    this.flushToDisk = this.flushToDiskImplicit && !CATALOG_ADANC.test(key);
    try {
      return super.set(key, data, ctx);
    } finally {
      this.flushToDisk = this.flushToDiskImplicit;
    }
  }
};
