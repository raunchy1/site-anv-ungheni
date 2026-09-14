"use server";

import { redirect } from "next/navigation";
import { supabaseAuthServer } from "@/lib/supabase/auth";

export type LoginState = { error: string | null };

/** Contul real e email Supabase; „admin" e aliasul de login cerut de utilizator. */
const LOGIN_ALIASES: Record<string, string> = {
  admin: "admin@anvelope-ungheni.md",
};

function resolveLogin(raw: string): string {
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase();
  if (LOGIN_ALIASES[key]) return LOGIN_ALIASES[key];
  return trimmed;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const loginRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginRaw || !password) return { error: "Completează utilizatorul și parola." };

  const email = resolveLogin(loginRaw);
  const supabase = await supabaseAuthServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Utilizator sau parolă incorectă." };

  redirect("/admin/produse");
}
