import Image from "next/image";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import { IconArrowRight, IconPhone } from "@/components/icons";
import { WhatsAppButton } from "@/components/product/WhatsAppButton";
import { TabelPreturi } from "./TabelPreturi";
import { TabelFiltrat } from "./TabelFiltrat";
import { text, type Serviciu } from "@/content/servicii";
import { telLink } from "@/lib/format";
import type { Locale } from "@/lib/types";

/**
 * Un capitol din catalogul de servicii.
 *
 * Ritmul paginii vine dintr-o singură regulă: fotografia schimbă partea la
 * fiecare capitol. Nimic altceva nu alternează — aceleași mărimi, aceleași
 * distanțe — deci pagina nu obosește, dar nici nu devine o listă de blocuri
 * identice pe care ochiul le sare.
 *
 * Ierarhia în interiorul capitolului e fixă: numărul (mono, mic), titlul,
 * cârligul la 24px, textul la măsura de citit, ce include, prețurile, îndemnul.
 * Prețul e ultimul lucru dinaintea îndemnului, pentru că exact în ordinea asta
 * se ia decizia.
 */
export function SectiuneServiciu({
  serviciu: s,
  locale,
  telefon,
  telefonAfisat,
  index,
}: {
  serviciu: Serviciu;
  locale: Locale;
  telefon: string;
  telefonAfisat: string;
  index: number;
}) {
  const fotoStanga = index % 2 === 1;
  const indemn = text(s.indemn, locale, telefonAfisat);

  return (
    <section
      id={s.id}
      /* Ancora se oprește sub antetul lipicios de 60px, nu în spatele lui. */
      className="scroll-mt-[var(--sp-16)] border-t border-[var(--line)] pt-[var(--sp-8)]"
      aria-labelledby={`${s.id}-titlu`}
    >
      <div
        className={cn(
          "grid gap-[var(--sp-6)] lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-[var(--sp-8)]",
          fotoStanga && "lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]",
        )}
      >
        {/* ------------------------------------------------------- fotografia */}
        <figure className={cn("min-w-0", fotoStanga ? "lg:order-1" : "lg:order-2")}>
          <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--img-plate)]">
            <Image
              src={`/servicii/${s.foto.fisier}`}
              alt={text(s.foto.alt, locale)}
              fill
              sizes="(min-width: 1024px) 420px, 92vw"
              className="object-cover"
            />
          </div>
          {/* Atribuirea stă sub fotografie, nu într-o pagină de credite:
              licențele CC BY și CC BY-SA o cer lângă imagine. */}
          <figcaption className="mt-[var(--sp-2)] text-[var(--fs-100)] text-[var(--ink-faint)]">
            <a href={s.foto.pagina} target="_blank" rel="noopener nofollow" className="underline-offset-2 hover:underline">
              {s.foto.sursa}
            </a>
            {s.foto.autor && s.foto.autor !== "—" ? ` · ${s.foto.autor}` : ""} · {s.foto.licenta}
          </figcaption>
        </figure>

        {/* ------------------------------------------------------------ textul */}
        <div className={cn("min-w-0", fotoStanga ? "lg:order-2" : "lg:order-1")}>
          <p className="num font-mono text-[var(--fs-200)] text-[var(--ink-faint)]">{s.numar}</p>
          <h2
            id={`${s.id}-titlu`}
            className="optical-left mt-[var(--sp-2)] text-600 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-700"
          >
            {text(s.titlu, locale)}
          </h2>

          <p className="measure mt-[var(--sp-4)] text-500 font-medium leading-snug text-[var(--ink-strong)]">
            {text(s.carlig, locale)}
          </p>
          <p className="measure mt-[var(--sp-4)] text-300 text-[var(--ink)]">{text(s.corp, locale)}</p>

          {s.include ? (
            <div className="mt-[var(--sp-5)]">
              <p className="label">{text(s.include.titlu, locale)}</p>
              <ul className="mt-[var(--sp-3)] space-y-[var(--sp-2)]">
                {s.include.puncte.map((p, i) => (
                  <li key={i} className="measure flex gap-[var(--sp-3)] text-300 text-[var(--ink)]">
                    {/* Bulina e o liniuță scurtă, nu un punct: se aliniază cu
                        rândul de text și nu introduce o formă nouă în pagină. */}
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-[10px] shrink-0 bg-[var(--line-contrast)]" />
                    <span>{text(p, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {s.dbSlug ? (
            <Link
              href={{ pathname: "/[slug]", params: { slug: s.dbSlug } }}
              className="nav-link mt-[var(--sp-5)] inline-flex items-center gap-[var(--sp-2)] text-200"
            >
              {locale === "ru" ? "Отдельная страница услуги" : "Pagina serviciului"}
              <IconArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      </div>

      {/* ------------------------------------------------------------ prețuri
          Tabelul mare primește filtru de diametru; celelalte au 2–5 rânduri și
          un filtru peste ele ar fi mai mult de citit decât de filtrat. */}
      {s.tabele.map((tabel, i) =>
        tabel.randuri.length > 8 ? (
          <TabelFiltrat key={i} tabel={tabel} locale={locale} coloanaEvidentiata={5} />
        ) : (
          <TabelPreturi key={i} tabel={tabel} locale={locale} />
        ),
      )}

      {/* ------------------------------------------------------------- îndemn */}
      <div className="mt-[var(--sp-5)] flex flex-wrap items-center gap-[var(--sp-4)] rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-[var(--sp-5)] py-[var(--sp-4)]">
        <p className="measure min-w-0 flex-1 text-300 text-[var(--ink-strong)]">{indemn}</p>
        <div className="flex flex-wrap gap-[var(--sp-2)]">
          <a
            href={telLink(telefon)}
            className="inline-flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface)] px-[var(--sp-4)] text-300 text-[var(--ink-strong)] transition-colors duration-[var(--dur-1)] hover:border-[var(--ink-strong)]"
          >
            <IconPhone size={16} />
            <span className="num">{telefonAfisat}</span>
          </a>
          <WhatsAppButton
            message={`${text(s.titlu, locale)} — ${locale === "ru" ? "хочу записаться" : "vreau o programare"}`}
            label="WhatsApp"
          />
        </div>
      </div>
    </section>
  );
}
