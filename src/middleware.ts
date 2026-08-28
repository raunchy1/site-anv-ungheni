import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  /* Tot, mai puțin: API, fișierele Next, /design-system (intern), rutele de
     metadate generate de Next (`/icon`, `/apple-icon`, `/opengraph-image` —
     n-au extensie, deci nu le prinde regula de mai jos, iar prefixarea cu
     limba le-ar trimite în 404) și orice cale cu extensie. */
  matcher: ["/((?!api|_next|_vercel|design-system|icon|apple-icon|opengraph-image|.*\\..*).*)"],
};
