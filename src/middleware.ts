import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

/** Prefixele de catalog, în ambele limbi. */
const CATALOG = [/^\/catalog-anvelope(?=\/|$)/, /^\/ru\/katalog-shin(?=\/|$)/];

/**
 * Sortarea, pagina și „arată și indisponibilele" au stat în query până acum:
 * `?sortare=price_asc&pagina=2`. Acum sunt segmente de cale, ca filtrele.
 *
 * Adresele vechi nu se lasă să cadă în tăcere — un link trimis pe WhatsApp acum
 * o lună ar fi arătat pagina 1 nesortată, fără ca nimeni să înțeleagă de ce.
 * Se redirecționează definitiv (308) spre forma nouă, deci și Google mută ce
 * avea în index.
 */
const SORT_TO_SEGMENT: Record<string, string> = {
  price_asc: "pret-asc", price_desc: "pret-desc", name: "nume",
};

function legacyQueryRedirect(req: NextRequest): NextResponse | null {
  const { pathname, searchParams } = req.nextUrl;
  if (!CATALOG.some((re) => re.test(pathname))) return null;

  const sort = searchParams.get("sortare");
  const page = Number(searchParams.get("pagina") ?? "1");
  const unavailable = searchParams.get("indisponibile") === "1";
  if (!sort && !unavailable && !(page > 1)) return null;

  const extra: string[] = [];
  if (unavailable) extra.push("indisponibile");
  if (sort && SORT_TO_SEGMENT[sort]) extra.push(`sortare_${SORT_TO_SEGMENT[sort]}`);
  if (Number.isInteger(page) && page > 1) extra.push(`pagina_${page}`);

  const url = req.nextUrl.clone();
  url.pathname = `${pathname.replace(/\/$/, "")}/${extra.join("/")}`;
  /* Doar cheile mutate se șterg; restul query-ului rămâne cum era. */
  for (const k of ["sortare", "pagina", "indisponibile"]) url.searchParams.delete(k);
  return NextResponse.redirect(url, 308);
}

export default function middleware(req: NextRequest) {
  return legacyQueryRedirect(req) ?? intl(req);
}

export const config = {
  /* Tot, mai puțin: API, fișierele Next, /design-system (intern), rutele de
     metadate generate de Next (`/icon`, `/apple-icon`, `/opengraph-image` —
     n-au extensie, deci nu le prinde regula de mai jos, iar prefixarea cu
     limba le-ar trimite în 404) și orice cale cu extensie. */
  matcher: ["/((?!api|_next|_vercel|design-system|icon|apple-icon|opengraph-image|.*\\..*).*)"],
};
