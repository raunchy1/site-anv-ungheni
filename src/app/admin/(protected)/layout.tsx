import Link from "next/link";
import { requireAdminUser } from "@/lib/supabase/auth";
import { logout } from "../actions";

const NAV = [
  { href: "/admin/produse", label: "Produse" },
  { href: "/admin/comenzi", label: "Comenzi" },
  { href: "/admin/programari", label: "Programări" },
  { href: "/admin/recenzii", label: "Recenzii" },
] as const;

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // Al doilea gard, pe lângă middleware — vezi nota din requireAdminUser().
  const user = await requireAdminUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line-strong)] bg-[var(--surface)]">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-[var(--sp-4)]">
          <div className="flex items-center gap-[var(--sp-6)]">
            <span className="text-300 font-semibold text-[var(--ink-strong)]">Anvelope Ungheni · Admin</span>
            <nav className="flex items-center gap-[var(--sp-4)]">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-300 text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-[var(--sp-4)]">
            <span className="text-200 text-[var(--ink-muted)]">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
              >
                Ieșire
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-[var(--sp-4)] py-[var(--sp-6)]">{children}</main>
    </div>
  );
}
