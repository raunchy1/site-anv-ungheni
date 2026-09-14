"use server";

import { redirect } from "next/navigation";
import { supabaseAuthServer } from "@/lib/supabase/auth";

export async function logout() {
  const supabase = await supabaseAuthServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
