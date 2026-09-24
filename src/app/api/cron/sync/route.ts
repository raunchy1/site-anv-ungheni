import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Cronul de sincronizare cu pandashop. Două treburi diferite, aceeași rută.
 *
 *   `?mode=refresh`  — confruntă prețul și stocul celor ~15.000 de produse pe
 *                      care le avem deja cu listarea lor de azi. Asta ține
 *                      catalogul viu: fără ea, un produs care revine pe stoc la
 *                      pandashop rămâne ascuns la noi pentru totdeauna, pentru
 *                      că filtrul catalogului cere `stock_status` cumpărabil.
 *                      Scrie prin `sync_refresh_products`, care poate atinge
 *                      exclusiv preț și stoc.
 *
 *   `?mode=new`      — importă anvelopele apărute la ei după fotografia
 *                      inițială. Comportamentul dinainte, neschimbat.
 *
 *   `?mode=pneu`       — pneu.md: fotografia API-ului lor, anvelopele noi, apoi
 *   `?mode=pneuexpert`   prețul și stocul fișelor care le aparțin
 *                      (`tools/sync/surse-cron.mjs`). Pneuexpert durează ~90 de
 *                      minute — cronul de pe server așteaptă cu `--max-time`.
 *
 * Fiecare furnizor scrie doar pe fișele cu `primary_source` al lui, deci
 * rulările nu se calcă între ele.
 *
 * Fără `mode`, rămâne `new` — ca un cron vechi care încă apelează ruta să facă
 * exact ce făcea înainte, nu altceva.
 *
 * Autentificarea e stratul dintre un job programat și o rută care scrie în
 * catalog: Vercel trimite `Authorization: Bearer $CRON_SECRET`, iar fără el ruta
 * răspunde 401.
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
  const cerut = url.searchParams.get("mode");
  const mode = cerut === "refresh" || cerut === "pneu" || cerut === "pneuexpert" ? cerut : "new";
  const full = url.searchParams.get("full") === "1";
  /* `?dry=1` rulează fără să scrie — util ca să verifici ruta pe producție. */
  const apply = url.searchParams.get("dry") !== "1";
  /* Sitemap-ul lor de produse fără stoc are 11 fișiere de ~25 MB. Nu intră într-o
     rulare de 300 de secunde și nu aduce nimic zilnic; se cere explicit. */
  const cuSitemap = url.searchParams.get("sitemap") === "1";

  const inceput = Date.now();
  const linii: string[] = [];
  const log = (...a: unknown[]) => linii.push(a.join(" "));

  /* Importurile sunt în corp, nu în capul fișierului: ruta răspunde 401 fără să
     încarce tot pipeline-ul, iar o eroare de configurare din module nu poate
     transforma un 401 într-un 500. */
  const { alerta } = await import("../../../../../tools/sync/pandashop/alert.mjs");
  const { oreDeTacere } = await import("../../../../../tools/sync/pandashop/lock.mjs");

  try {
    if (mode === "pneu" || mode === "pneuexpert") {
      const { ruleazaSursa } = await import("../../../../../tools/sync/surse-cron.mjs");
      const r = await ruleazaSursa(mode, { apply, log });
      const schimbate: string[] = r.pret?.slugSchimbate ?? [];
      if (apply) {
        if (schimbate.length > 1500) revalidateTag("produse-toate", { expire: 0 });
        else for (const slug of schimbate) revalidateTag(`produs:${slug}`, { expire: 0 });
        if (schimbate.length > 0 || (r.noi ?? 0) > 0) revalidateTag("catalog", { expire: 0 });
      }
      if (r.erori.length) {
        await alerta(`Sincronizare ${mode}: rulare cu erori`, `${r.erori.join("\n")}\n\n${linii.slice(-40).join("\n")}`);
      }
      return NextResponse.json({
        ok: r.erori.length === 0,
        mode,
        noi: r.noi ?? 0,
        carantina: r.carantina ?? 0,
        scumpite: r.pret?.scumpite ?? 0,
        ieftinite: r.pret?.ieftinite ?? 0,
        reactivate: r.pret?.reactivate ?? 0,
        stinse: r.pret?.stinse ?? 0,
        erori: r.erori,
        durata_s: Math.round((Date.now() - inceput) / 1000),
        dryRun: !apply,
      });
    }

    if (mode === "refresh") {
      const { actualizeazaCuLacat } = await import("../../../../../tools/sync/pandashop/refresh.mjs");
      /* Modulul e JS, deci tipul dedus e o reuniune de forme în care TypeScript
         nu poate exclude ramura „oprit" pe baza comparațiilor de mai jos. Forma
         de citit e declarată o dată, aici, în loc de un `as` la fiecare câmp. */
      const r: {
        oprit?: string;
        actualizate?: number;
        reactivate?: number;
        stinse?: number;
        pretSchimbat?: number;
        slugSchimbate?: string[];
      } = await actualizeazaCuLacat({ apply, cuSitemap, actor: "cron:refresh", log });

      if (r.oprit === "lacat_ocupat") return NextResponse.json({ ok: true, sarit: "o altă rulare e în curs" });
      if (r.oprit === "din_admin") return NextResponse.json({ ok: true, sarit: "sincronizarea e oprită din admin" });

      /* Se anunță doar când mișcarea e mare. O actualizare de preț pe câteva sute
         de produse e rutina zilnică și n-are ce căuta în inbox; o reactivare de
         peste 200 de fișe sau o stingere de peste 200 înseamnă că s-a întâmplat
         ceva la ei și merită privit. */
      if ((r.reactivate ?? 0) > 200 || (r.stinse ?? 0) > 200) {
        await alerta(
          `Sincronizare pandashop: ${r.reactivate} anvelope revenite pe stoc, ${r.stinse} stinse`,
          [
            `Actualizate: ${r.actualizate}`,
            `Revenite pe stoc: ${r.reactivate}`,
            `Stinse: ${r.stinse}`,
            `Prețuri schimbate: ${r.pretSchimbat}`,
            "",
            linii.join("\n"),
          ].join("\n"),
        );
      }

      /*
       * SE GOLESC FIȘELE SCHIMBATE, NU CATALOGUL.
       *
       * Varianta de dinainte golea `catalog` ori de câte ori se mișcase ceva.
       * Eticheta aia stătea, prin `getSettings()` din layout, pe toate cele
       * ~37.000 de pagini — deci o zi cu trei prețuri schimbate expira tot
       * site-ul, și fiecare pagină atinsă apoi de un robot se rescria. Jurnalul
       * de sincronizări arată zilele: 10 sept — 3 fișe; 9 sept — 58; 6 sept — 5.
       * Pentru atât, 37.000 de scrieri ISR de fiecare dată.
       *
       * Acum `refresh.mjs` întoarce slug-urile atinse, iar citirea unei fișe
       * după slug poartă eticheta `produs:<slug>` (vezi supabase/server.ts).
       * Golim exact fișele acelea: 3 fișe schimbate = 3 goliri.
       *
       * `catalog` rămâne golit o dată, dar de la fixul din server.ts eticheta
       * nu mai atinge fișele de produs: doar listările, paginile de marcă și
       * cele statice. Alea chiar trebuie să arate prețul nou, sunt câteva sute,
       * și se re-randează o singură dată.
       */
      const schimbate = r.slugSchimbate ?? [];
      const schimbat =
        (r.pretSchimbat ?? 0) > 0 || (r.stinse ?? 0) > 0 || (r.reactivate ?? 0) > 0;

      /* Peste prag, golirea una câte una costă mai mult decât cea în bloc — și
         o zi în care se schimbă 3.000 de fișe nu mai e rutină, e o mișcare mare
         la furnizor. Atunci se golește `produse-toate`, eticheta pe care o
         poartă toate fișele. Sub prag nu se atinge niciodată. */
      const PRAG_BLOC = 1500;
      if (apply) {
        if (schimbate.length > PRAG_BLOC) {
          revalidateTag("produse-toate", { expire: 0 });
        } else {
          for (const slug of schimbate) revalidateTag(`produs:${slug}`, { expire: 0 });
        }
        if (schimbat) revalidateTag("catalog", { expire: 0 });
      }

      return NextResponse.json({
        ok: true,
        mode,
        actualizate: r.actualizate ?? 0,
        reactivate: r.reactivate ?? 0,
        stinse: r.stinse ?? 0,
        preturi: r.pretSchimbat ?? 0,
        fise_golite: apply ? schimbate.length : 0,
        golit_in_bloc: apply && schimbate.length > PRAG_BLOC,
        golit: apply && schimbat,
        durata_s: Math.round((Date.now() - inceput) / 1000),
        dryRun: !apply,
      });
    }

    /* ------------------------------------------------------ produse noi */
    const { ruleazaCuLacat } = await import("../../../../../tools/sync/pandashop/import.mjs");
    const r = await ruleazaCuLacat({
      apply,
      full,
      actor: full ? "cron:sync:full" : "cron:sync:new",
      log,
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

    /* Catalogul se ține acum o zi în cache (`revalidate = 86400`), nu 15 minute:
       la 830 KB pagina, revalidarea deasă era ce a ars bugetul de Fast Origin
       Transfer. Prospețimea vine de aici — importul tocmai a schimbat prețuri
       și stocuri, deci golim eticheta și lăsăm paginile atinse să se
       re-randeze la următoarea cerere. Fără asta, o modificare de preț ar sta
       nevăzută până a doua zi.

       Doar la rulările care chiar scriu: un `?dry=1` n-a schimbat nimic, iar
       invalidarea l-ar pune pe utilizator să plătească randări degeaba.

       Aici golirea în bloc e cea corectă și e ieftină: produsele NOI n-au încă
       fișă în cache — n-are ce fi golit pentru ele — dar trebuie să apară în
       listări, iar `catalog` exact listările le acoperă acum, nu și cele 37.000
       de fișe.

       `expire: 0` fiindcă în Next 16 `revalidateTag` cere un profil de
       `cacheLife`: intrările tocmai au devenit greșite, nu doar bătrâne, deci
       fereastra de învechire acceptată e zero. `updateTag`, varianta cu
       citește-ce-ai-scris, merge doar din Server Actions — aici suntem
       într-o rută. */
    if (apply && noi > 0) revalidateTag("catalog", { expire: 0 });

    return NextResponse.json({
      ok: true, mode, noi, carantina, faraPret,
      erori: r.erori?.length ?? 0,
      durata_s: Math.round((Date.now() - inceput) / 1000),
      dryRun: !apply,
    });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    /* Întrerupătorul ajunge aici. Se oprește FĂRĂ să scrie și anunță. */
    await alerta(
      `Sincronizare ${mode === "pneu" || mode === "pneuexpert" ? mode : `pandashop (${mode})`}: RULARE OPRITĂ`,
      `${mesaj}\n\nJurnalul rulării:\n${linii.join("\n")}`,
    ).catch(() => {});
    console.error("[sync] rulare eșuată:", mesaj);
    return NextResponse.json({ ok: false, mode, eroare: mesaj }, { status: 500 });
  }
}
