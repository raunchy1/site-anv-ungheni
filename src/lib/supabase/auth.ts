import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

/**
 * Client de autentificare pentru Componente Server și Server Actions ale
 * panoului. Cheia e cea publică — sesiunea trăiește în cookie-uri httpOnly,
 * nu în `service_role`. Scrierile de date folosesc `adminDb()` separat.
 *
 * `setAll` poate fi apelat dintr-o randare de Componentă Server, unde Next
 * interzice scrierea de cookie-uri — `try/catch` o lasă să treacă în tăcere,
 * fiindcă `src/middleware.ts` reîmprospătează oricum sesiunea la fiecare
 * cerere către `/admin/*`.
 */
export async function supabaseAuthServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* Componentă Server: cookie-ul se scrie oricum din middleware. */
          }
        },
      },
    },
  );
}

export async function getAdminUser() {
  const supabase = await supabaseAuthServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Al doilea gard, pe lângă middleware. `adminDb()` ocolește RLS complet —
 * o Server Action care ar rămâne accesibilă fără sesiune ar scrie direct în
 * bază cu drepturi depline. Verificarea de aici costă un apel Supabase, dar
 * închide exact acea gaură.
 */
export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
