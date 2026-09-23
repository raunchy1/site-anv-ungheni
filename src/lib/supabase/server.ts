import { createClient } from "@supabase/supabase-js";

/**
 * Client de citire pentru componentele server. Folosește cheia publică:
 * RLS permite `select` pe catalog, deci nu e nevoie de service role la randare.
 *
 * FETCH-UL E ÎNLOCUIT ca răspunsurile să intre în Data Cache-ul lui Next.
 * `cache()` din React ține un rezultat cât ține o cerere; catalogul e o rută
 * dinamică (citește `?pagina`, `?sortare`), deci fără asta fiecare clic pe un
 * filtru relua aceleași interogări în Supabase — 450 ms de așteptare în care
 * ecranul stă neschimbat. Cu `revalidate`, a doua vizită pe aceeași combinație
 * răspunde din cache.
 *
 * O zi e cât ține și `revalidate` al rutelor de catalog; prețurile și stocurile
 * vin din același import zilnic, deci nu se învechește nimic ce nu era deja
 * vechi de o zi. Eticheta `catalog` nu mai e o rezervă teoretică: cronul o
 * golește la finalul fiecărei sincronizări, așa că datele proaspete ajung în
 * catalog imediat după import, nu la următoarea expirare.
 */
/**
 * O SINGURĂ ÎNCERCARE RATATĂ NU E UN RĂSPUNS.
 *
 * Gateway-ul Supabase răspunde 502/504/522 când baza e sub presiune — câteva
 * secunde, apoi trece. Fără reîncercare, fiecare astfel de secundă însemna:
 * la randare, o excepție (deci pagina veche din cache, acceptabil); la BUILD,
 * un deploy întreg pierdut, fiindcă o singură rută pre-generată care aruncă
 * oprește exportul. Pe 8 septembrie 2026 exact asta a blocat repararea:
 * build-ul nu putea porni cât timp baza clipea.
 *
 * O singură reîncercare, cu pauză și puțin zgomot ca să nu plece toate odată.
 *
 * ERA DOUĂ, ȘI ASTA A DOBORÂT BAZA PE 22 SEPTEMBRIE 2026.
 *
 * Reîncercarea oarbă e un amplificator: cât timp baza răspunde, nu se vede; dar
 * din clipa în care încetinește, fiecare interogare pleacă de trei ori, deci
 * sarcina se triplează exact în minutul în care baza avea nevoie de mai puțină.
 * Bucla se închide singură — 522 aduce reîncercări, reîncercările aduc 522 — și
 * nu se mai deschide, fiindcă nimic din lanț nu scade când lucrurile merg prost.
 * Dovada că nu se deschide: peste noapte traficul a scăzut de douăzeci de ori,
 * iar baza tot răspundea 522 la fiecare cerere, până la repornire.
 *
 * Commitul dinainte a scos cauza acelei zile — cele 106.694 de apeluri ale lui
 * `getCatalogSummary`. Limitele de aici sunt pentru următoarea cauză, care va fi
 * alta: ce ține baza în viață nu e politețea codului care o interoghează, ci
 * faptul că nu O POATE lovi mai tare decât atât.
 *
 *   TIMP    fiecare încercare moare la 8 secunde. Înainte nu exista nicio
 *           limită, deci o cerere agățată aștepta cele ~20 de secunde după care
 *           Cloudflare răspunde 522 — ori 60 cu tot cu reîncercări. De acolo
 *           veneau fișele de produs care dădeau 404 după 22 de secunde.
 *
 *   LĂȚIME  cel mult 12 interogări simultane din tot procesul. E singura
 *           protecție care nu depinde de cine ne vizitează: oricâte cereri ar
 *           trimite un crawler peste navigarea pe filtre, baza vede tot 12.
 *           Restul așteaptă la rând, iar dacă rândul nu se mișcă în 8 secunde,
 *           cererea pică — ISR servește pagina veche, ceea ce e răspunsul corect.
 *
 *   SIGURANȚĂ  după 5 eșecuri de gateway la rând, oprim complet interogările
 *           pentru 30 de secunde. O bază care se îneacă are nevoie de liniște ca
 *           să-și revină, nu de încă un val. Când siguranța e sărită, cererile
 *           pică instantaneu, fără să atingă rețeaua.
 */
const RETRY_STATUS = new Set([429, 500, 502, 503, 504, 520, 521, 522, 524]);

const TIMEOUT_MS = 8_000;
const CONCURENTA_MAX = 12;
const PRAG_SIGURANTA = 5;
const RACIRE_MS = 30_000;

/** Semafor simplu: ține numărul de interogări în zbor sub `CONCURENTA_MAX`. */
let inZbor = 0;
const laRand: Array<() => void> = [];

function elibereaza() {
  inZbor--;
  laRand.shift()?.();
}

async function ocupaLoc(semnal: AbortSignal): Promise<void> {
  if (inZbor < CONCURENTA_MAX) { inZbor++; return; }
  /* Un semnal deja anulat nu mai emite „abort", deci l-am aștepta la nesfârșit. */
  if (semnal.aborted) throw new Error("Supabase: timp expirat înainte de rând");
  await new Promise<void>((rezolva, respinge) => {
    const pornim = () => { inZbor++; rezolva(); };
    laRand.push(pornim);
    /* Cine a așteptat degeaba iese din rând, ca rândul să nu crească la infinit. */
    semnal.addEventListener("abort", () => {
      const i = laRand.indexOf(pornim);
      if (i !== -1) { laRand.splice(i, 1); respinge(new Error("Supabase: rând plin")); }
    }, { once: true });
  });
}

/**
 * LIMITELE SUNT PENTRU CINE SERVEȘTE TRAFIC, NU PENTRU BUILD.
 *
 * Nota de sus spune de ce exista reîncercarea: un build pierdut, fiindcă o
 * singură rută pre-generată care aruncă oprește exportul. Siguranța ar strica
 * exact asta — cinci clipiri la rând ale bazei în timpul exportului și deploy-ul
 * cade, de data asta fără nicio reîncercare care să-l salveze.
 *
 * Deci la build se întoarce regimul vechi: trei încercări, fără siguranță. E
 * sigur, fiindcă build-ul e o sarcină mărginită și controlată — randează cele
 * ~294 de pagini de marcă, serviciu și pagină legală, și atât. Crawlerul de care
 * ne aparăm nu există acolo.
 *
 * Semaforul rămâne pornit în ambele regimuri: la build nu strică nimănui, iar
 * dacă vreodată pre-generăm din nou mii de pagini, e singurul lucru care ține
 * exportul de la a deschide o mie de conexiuni deodată.
 */
const LA_BUILD = process.env.NEXT_PHASE === "phase-production-build";

/** Siguranța: cât timp `sariPanaLa` e în viitor, nu atingem deloc rețeaua. */
let esecuriLaRand = 0;
let sariPanaLa = 0;

function inregistreaza(reusit: boolean) {
  if (LA_BUILD) return;
  if (reusit) { esecuriLaRand = 0; return; }
  if (++esecuriLaRand >= PRAG_SIGURANTA) sariPanaLa = Date.now() + RACIRE_MS;
}

async function oIncercare(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  /* La build, răbdare: `getSizeFacets` cere 20.000 de rânduri, iar o tăiere la
     8 secunde ar transforma o interogare grea într-un deploy pierdut. */
  const ceas = AbortSignal.timeout(LA_BUILD ? 30_000 : TIMEOUT_MS);
  await ocupaLoc(ceas);
  try {
    const res = await fetch(input, { ...init, signal: ceas });
    inregistreaza(!RETRY_STATUS.has(res.status));
    return res;
  } catch (e) {
    inregistreaza(false);
    throw e;
  } finally {
    elibereaza();
  }
}

async function withRetry(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  const incercari = LA_BUILD ? 3 : 2;
  let last: Response | undefined;
  for (let attempt = 0; attempt < incercari; attempt++) {
    if (!LA_BUILD && Date.now() < sariPanaLa) {
      throw new Error("Supabase: siguranța e sărită, baza se odihnește");
    }
    if (attempt > 0) {
      const pauza = 400 * 2 ** (attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, pauza));
    }
    try {
      const res = await oIncercare(input, init);
      if (!RETRY_STATUS.has(res.status)) return res;
      last = res;
    } catch (e) {
      /* Rețea căzută, timp expirat sau rând plin: ultima încercare o lasă să iasă. */
      if (attempt === incercari - 1) throw e;
    }
  }
  return last!;
}

/**
 * O ETICHETĂ PENTRU TOT CATALOGUL ERA O ETICHETĂ PENTRU NIMIC.
 *
 * Până aici, fiecare citire din Supabase primea `tags: ["catalog"]`. Layout-ul
 * rădăcină cheamă `getSettings()`, deci eticheta ajungea pe absolut fiecare
 * pagină — cele 18.373 de fișe de produs × 2 limbi, plus catalogul. Un singur
 * `revalidateTag("catalog")` expira ~37.000 de intrări din cache, iar fiecare
 * pagină atinsă după aceea de un robot se re-randa și se rescria: o scriere ISR
 * bucata.
 *
 * Cronul o golea în fiecare zi. Iar jurnalul de sincronizări arată pentru ce:
 * pe 10 septembrie se schimbaseră 3 produse; pe 9 septembrie, 58. Aruncam tot
 * catalogul ca să împrospătăm trei fișe. De aici cele 325.000 de scrieri ISR
 * dintr-un buget de 200.000.
 *
 * Acum eticheta se deduce din interogare:
 *
 *   `products` căutat după un slug   ->  `produs:<slug>` (+ `produse-toate`)
 *   orice altceva                    ->  `catalog`
 *
 * Așa `revalidateTag("produs:michelin-…")` atinge exact fișa aceea și nimic
 * altceva. `catalog` rămâne, dar acoperă doar listările, paginile de marcă și
 * cele statice — nu și fișele de produs, fiindcă citirea lor după slug nu mai
 * poartă eticheta. `produse-toate` e frâna de mână: se golește doar când chiar
 * s-a schimbat aproape tot.
 */
function eticheteDinInterogare(input: RequestInfo | URL): string[] {
  const href =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const i = href.indexOf("/rest/v1/");
  if (i < 0) return ["catalog"];

  const [tabel, interogare = ""] = href.slice(i + "/rest/v1/".length).split("?");
  if (tabel !== "products") return ["catalog"];

  /* `getProductBySlug` filtrează `slug_ro=eq.X`; `resolveRootSlug` întreabă
     `or=(slug_ru.eq.X,slug_ro.eq.X)`. Ambele caută o singură fișă și amândouă
     trebuie să dea aceeași etichetă — altfel una din cele două citiri ale
     paginii ar rămâne legată de `catalog` și ar reînvia exact problema. */
  let clar = interogare;
  try {
    clar = decodeURIComponent(interogare);
  } catch {
    /* Secvență procentuală stricată: se caută pe forma brută. O etichetă
       greșită ar fi mai rea decât o excepție aici — rămâne `catalog`. */
  }
  const m = clar.match(/slug_r[ou](?:=|\.)eq\.([^&,)]+)/);
  return m ? [`produs:${m[1]}`, "produse-toate"] : ["catalog"];
}

/**
 * O lună, nu o zi. Prospețimea nu mai vine de la ceas, ci de la etichete:
 * sincronizarea golește exact fișele pe care le-a schimbat. Ceasul e doar plasa
 * de siguranță pentru ce s-ar schimba pe lângă cron — și o plasă care se lasă
 * zilnic peste 37.000 de pagini costă singură mai mult decât tot bugetul.
 */
const O_LUNA = 2592000;

const cachedFetch: typeof fetch = (input, init) =>
  withRetry(input, {
    ...init,
    next: { revalidate: O_LUNA, tags: eticheteDinInterogare(input) },
  } as RequestInit);

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch: cachedFetch } },
);

/**
 * Client pentru CE E ÎN JURUL fișei, nu pentru fișă: „alternative", „măsuri
 * apropiate", „recomandate".
 *
 * Sunt listări de produse, deci prin `db` ar primi eticheta `catalog` — și
 * atunci fișa de produs ar purta-o și ea, prin ele, iar golirea listărilor ar
 * expira din nou toate cele 37.000 de pagini. Exact ocolul pe care fixul de mai
 * sus îl închide pe ușa din față.
 *
 * Blocurile astea sunt sugestii, nu prețul de pe pagină. Se pot învechi cu o
 * lună fără să deranjeze pe nimeni, iar `secundar` nu se golește din cron.
 */
const cachedFetchSecundar: typeof fetch = (input, init) =>
  withRetry(input, { ...init, next: { revalidate: O_LUNA, tags: ["secundar"] } } as RequestInit);

export const dbSecundar = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false }, global: { fetch: cachedFetchSecundar } },
);

/**
 * Client de SCRIERE, tot cu cheia anonimă, dar fără cache.
 *
 * Comenzile se inserează cu cheia publică intenționat: honeypot-ul și limita de
 * 3 comenzi pe oră stau în declanșatoare de bază (migrarea 0007), iar
 * `service_role` le sare din construcție. Fetch-ul e cel implicit — un POST
 * n-are ce căuta în Data Cache, iar `revalidate` pe el ar fi doar zgomot.
 */
export const dbWrite = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/** Doar pentru operații care trebuie să ocolească RLS. Niciodată importat în client. */
export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY lipsește");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "produse";

/** `produse/<hash>.jpg` -> URL public complet. */
export function imageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const file = storagePath.startsWith(`${BUCKET}/`) ? storagePath.slice(BUCKET.length + 1) : storagePath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${file}`;
}
