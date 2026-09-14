"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type AdminNavItem = { href: string; label: string };

export function AdminMobileNav({
  items,
  email,
  logoutAction,
}: {
  items: readonly AdminNavItem[];
  email: string | null | undefined;
  logoutAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-b border-[var(--line-strong)] bg-[var(--surface)]">
      {/* Mobile top bar */}
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-[var(--sp-3)] px-[var(--sp-4)] md:hidden">
        <span className="min-w-0 truncate text-300 font-semibold text-[var(--ink-strong)]">
          Anvelope Ungheni · Admin
        </span>
        <div className="flex shrink-0 items-center gap-[var(--sp-2)]">
          <form action={logoutAction}>
            <button
              type="submit"
              className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              Ieșire
            </button>
          </form>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            aria-label={open ? "Închide meniul" : "Deschide meniul"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--line-strong)] text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <nav
        id="admin-mobile-menu"
        className={`border-t border-[var(--line)] md:hidden ${open ? "block" : "hidden"}`}
      >
        <ul className="mx-auto flex max-w-[1400px] flex-col px-[var(--sp-4)] py-[var(--sp-2)]">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-[var(--radius-xs)] px-[var(--sp-3)] py-[var(--sp-3)] text-300 ${
                    active
                      ? "bg-[var(--surface-2)] font-semibold text-[var(--accent)]"
                      : "text-[var(--ink)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {email ? (
          <p className="border-t border-[var(--line)] px-[var(--sp-4)] py-[var(--sp-3)] text-200 text-[var(--ink-muted)]">
            {email}
          </p>
        ) : null}
      </nav>

      {/* Desktop bar */}
      <div className="mx-auto hidden h-14 max-w-[1400px] items-center justify-between gap-[var(--sp-4)] px-[var(--sp-4)] md:flex">
        <div className="flex min-w-0 items-center gap-[var(--sp-4)]">
          <span className="shrink-0 text-300 font-semibold text-[var(--ink-strong)]">
            Anvelope Ungheni · Admin
          </span>
          <nav className="flex flex-wrap items-center gap-x-[var(--sp-3)] gap-y-[var(--sp-1)]">
            {items.map((item) => (
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
        <div className="flex shrink-0 items-center gap-[var(--sp-4)]">
          {email ? <span className="text-200 text-[var(--ink-muted)]">{email}</span> : null}
          <form action={logoutAction}>
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
  );
}
