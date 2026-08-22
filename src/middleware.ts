import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // tot, mai puțin API, fișierele Next, /design-system (intern) și orice cale cu extensie
  matcher: ["/((?!api|_next|_vercel|design-system|.*\\..*).*)"],
};
