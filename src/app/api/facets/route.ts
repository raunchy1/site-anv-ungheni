import { NextResponse } from "next/server";
import { getSizeFacets } from "@/lib/db/queries";
import { sizeExists } from "@/lib/size-tree";

/**
 * Optiunile pasilor 4 si 5 din selector, pentru o dimensiune data.
 * Se cere din client dupa ce diametrul e ales; raspunsul se poate pastra la
 * margine o ora — catalogul se schimba la import, nu la fiecare cerere.
 */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const width = Number(p.get("latime"));
  const aspect = Number(p.get("inaltime"));
  const diameter = p.get("diametru");

  if (!width || !aspect || !diameter) {
    return NextResponse.json({ error: "latime, inaltime si diametru sunt obligatorii" }, { status: 400 });
  }

  /* Dimensiunea trebuie sa existe in catalog. Fara asta, ruta e o cale deschisa
     spre o scanare de 20.000 de randuri cu orice trei numere inventate, si nici
     macar nu se poate pastra la margine — fiecare combinatie noua e o cerere
     noua. Arborele de dimensiuni raspunde in memorie. */
  if (!sizeExists(width, aspect, diameter.toUpperCase())) {
    return NextResponse.json({ error: "dimensiune inexistenta" }, { status: 404 });
  }

  const facets = await getSizeFacets({ width, aspect, diameter: diameter.toUpperCase() });
  return NextResponse.json(facets, {
    headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
