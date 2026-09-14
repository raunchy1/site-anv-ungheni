import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Intră în cont" };

export default async function LoginPage() {
  const user = await getAdminUser();
  if (user) redirect("/admin/produse");

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-[var(--sp-4)]">
      <h1 className="text-600 font-semibold tracking-tight text-[var(--ink-strong)]">Anvelope Ungheni</h1>
      <p className="mt-[var(--sp-1)] text-300 text-[var(--ink-muted)]">Panou de administrare</p>
      <LoginForm />
    </div>
  );
}
