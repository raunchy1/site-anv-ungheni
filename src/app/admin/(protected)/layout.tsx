import { requireAdminUser } from "@/lib/supabase/auth";
import { logout } from "../actions";
import { AdminMobileNav } from "./AdminMobileNav";

const NAV = [
  { href: "/admin/analiza", label: "Analiză" },
  { href: "/admin/produse", label: "Produse" },
  { href: "/admin/comenzi", label: "Comenzi" },
  { href: "/admin/programari", label: "Programări" },
  { href: "/admin/recenzii", label: "Recenzii" },
  { href: "/admin/marci", label: "Mărci" },
  { href: "/admin/servicii", label: "Servicii" },
  { href: "/admin/pagini-legale", label: "Pagini" },
  { href: "/admin/setari", label: "Setări" },
  { href: "/admin/sincronizare", label: "Sincronizare" },
] as const;

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // Al doilea gard, pe lângă middleware — vezi nota din requireAdminUser().
  const user = await requireAdminUser();

  return (
    <div className="min-h-screen">
      <AdminMobileNav items={NAV} email={user.email} logoutAction={logout} />
      <main className="mx-auto max-w-[1400px] px-[var(--sp-4)] py-[var(--sp-6)]">{children}</main>
    </div>
  );
}
