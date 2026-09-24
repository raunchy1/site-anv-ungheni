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
 */
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;

/** `/ro/catalog/a/b` -> doua segmente de filtru, deci doar in memorie. */
const CATALOG_ADANC = /^\/(?:ro|ru)\/catalog\/[^/]+\/./;

module.exports = class CacheCuLimita extends FileSystemCache {
  constructor(ctx) {
    super(ctx);
    this.flushToDiskImplicit = this.flushToDisk;
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
