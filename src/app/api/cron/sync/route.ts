import { NextResponse } from "next/server";

/**
 * Cronul de sincronizare cu pandashop.
 *
 * Detectează anvelopele noi și le importă. NU atinge niciunul din produsele
 * existente: pipeline-ul din `tools/sync/pandashop/` nu conține nicio operație
 * de UPDATE sau DELETE pe `products`, iar modulul de scriere o refuză explicit.
 *
 * Ruta e apelată de Vercel Cron (vezi `vercel.json`). Autentificarea e stratul
 * dintre un job programat și o rută care scrie în catalog: Vercel trimite
 * `Authorization: Bearer $CRON_SECRET`, iar fără el ruta răspunde 401.
 *
 * Node.js, nu edge: pipeline-ul citește fișiere și rulează zeci de secunde.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function autorizat(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  /* Fără secret configurat, ruta nu se deschide „ca să meargă": rămâne închisă. */
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!autorizat(request)) {
    return NextResponse.json({ error: "neautorizat" }, { status: 401 });
  }

  const url = new URL(request.url);
  const full = url.searchParams.get("full") === "1";
  /* `?dry=1` rulează fără să scrie — util ca să verifici ruta pe producție. */
  const apply = url.searchParams.get("dry") !== "1";

  /* Importurile sunt în corp, nu în capul fișierului: ruta răspunde 401 fără să
     încarce tot pipeline-ul, iar o eroare de configurare din module nu poate
     transforma un 401 într-un 500. */
  const { ruleazaCuLacat } = await import("../../../../../tools/sync/pandashop/import.mjs");
  const { alerta } = await import("../../../../../tools/sync/pandashop/alert.mjs");
  const { oreDeTacere } = await import("../../../../../tools/sync/pandashop/lock.mjs");

  const inceput = Date.now();
  const linii: string[] = [];

  try {
    const r = await ruleazaCuLacat({
      apply,
      full,
      actor: full ? "cron:sync:full" : "cron:sync:new",
      log: (...a: unknown[]) => linii.push(a.join(" ")),
    });

    if (r.oprit === "lacat_ocupat") {
      return NextResponse.json({ ok: true, sarit: "o altă rulare e în curs" });
    }
    if (r.oprit === "din_admin") {
      return NextResponse.json({ ok: true, sarit: "sincronizarea e oprită din admin" });
    }

    const noi = r.importate?.length ?? 0;
    const carantina = r.carantina?.length ?? 0;
    const faraPret = r.faraPret?.length ?? 0;

    /* Se scrie doar când e ceva de spus. O alertă la fiecare 3 ore, cu „0 produse
       noi", ar fi ignorată în două zile, iar apoi ar fi ignorată și cea care
       contează. */
    if (noi > 0 || carantina > 0) {
      const lista = (r.importate ?? [])
        .map((x: { rand: { title_ro: string; price_mdl: number; slug_ro: string } }) =>
          `· ${x.rand.title_ro} — ${x.rand.price_mdl} MDL\n  https://anvelope-ungheni.md/${x.rand.slug_ro}`)
        .join("\n");
      const cara = (r.carantina ?? [])
        .map((c: { id: string; titlu: string; motive: string[] }) => `· ${c.titlu} (${c.id}) → ${c.motive.join("; ")}`)
        .join("\n");

      await alerta(
        `Sincronizare pandashop: ${noi} anvelope noi${carantina ? `, ${carantina} în carantină` : ""}`,
        [
          noi ? `${noi} produse noi importate:\n${lista}` : "Niciun produs nou importat.",
          carantina ? `\n${carantina} în carantină, de verificat în admin:\n${cara}` : "",
          faraPret ? `\n${faraPret} fără preț la ei — se reverifică la următoarea rulare.` : "",
        ].filter(Boolean).join("\n"),
      );
    }

    /* Tăcerea e cel mai periculos mod de eșec: un sistem oprit arată exact ca un
       sistem fără produse noi. Dacă n-a mai reușit nimic de 48h, se anunță — chiar
       dacă rularea de acum a mers, pentru că poate merge fără să facă nimic. */
    const tacere = await oreDeTacere();
    if (tacere > 48) {
      await alerta(
        "Sincronizare pandashop: nicio rulare reușită de peste 48h",
        `Ultima rulare reușită a fost acum ${Number.isFinite(tacere) ? `${Math.round(tacere)} ore` : "— niciodată"}.\nVerifică jobul din Vercel Cron și jurnalul din import_runs.`,
      );
    }

    return NextResponse.json({
      ok: true, noi, carantina, faraPret,
      erori: r.erori?.length ?? 0,
      durata_s: Math.round((Date.now() - inceput) / 1000),
      dryRun: !apply,
    });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    /* Întrerupătorul ajunge aici. Se oprește FĂRĂ să scrie și anunță. */
    await alerta(
      "Sincronizare pandashop: RULARE OPRITĂ",
      `${mesaj}\n\nJurnalul rulării:\n${linii.join("\n")}`,
    ).catch(() => {});
    console.error("[sync] rulare eșuată:", mesaj);
    return NextResponse.json({ ok: false, eroare: mesaj }, { status: 500 });
  }
}
