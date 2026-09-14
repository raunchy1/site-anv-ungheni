import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Singurul loc care decide dacă o cerere către `/admin/*` trece sau se
 * întoarce la `/admin/login`. Sesiunea Supabase trăiește în cookie-uri
 * httpOnly, iar `getUser()` (nu `getSession()`) o validează la fiecare
 * cerere direct la Supabase — un cookie vechi sau falsificat nu trece.
 */
export async function adminGate(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/produse";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
