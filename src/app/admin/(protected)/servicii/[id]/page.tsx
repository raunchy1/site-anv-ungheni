import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { ServiceForm } from "../ServiceForm";
import { updateService } from "../actions";

export const metadata: Metadata = { title: "Editează serviciul" };

export default async function ServiciuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const { data, error } = await adminDb().from("services").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  const bound = updateService.bind(null, data.id as number);
  return <ServiceForm service={data} action={bound} title={data.title_ro as string} />;
}
