import type { Metadata } from "next";
import { adminDb } from "@/lib/supabase/server";
import { ProductCreateForm } from "./ProductCreateForm";

export const metadata: Metadata = { title: "Produs nou" };

export default async function ProdusNouPage() {
  const { data: brands } = await adminDb()
    .from("brands")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return <ProductCreateForm brands={(brands ?? []) as { id: number; name: string }[]} />;
}
