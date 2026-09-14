import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { LegalForm } from "../LegalForm";
import { updateLegalPage } from "../actions";

export const metadata: Metadata = { title: "Editează pagina legală" };

export default async function PaginaLegalaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const { data, error } = await adminDb().from("legal_pages").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  const bound = updateLegalPage.bind(null, data.id as number);
  return <LegalForm page={data} action={bound} title={data.title_ro as string} />;
}
