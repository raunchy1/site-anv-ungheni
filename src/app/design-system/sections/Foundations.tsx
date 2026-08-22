import { cn } from "@/lib/cn";
import { TreadRule } from "@/components/icons";
import {
  IconAllSeason, IconAlert, IconArrowRight, IconCart, IconCheck, IconChevronDown,
  IconChevronLeft, IconChevronRight, IconClose, IconCompare, IconFavorite,
  IconFilter, IconInfo, IconMinus, IconPhone, IconPlus, IconSearch, IconStock,
  IconSummer, IconTyre, IconWinter,
} from "@/components/icons";
import { products } from "@/lib/sample-products";
import { formatSize, formatIndex, formatPrice, normalizeSpeedIndex } from "@/lib/format";

export function Swatch({
  name, hex, note, contrast,
}: { name: string; hex: string; note?: string; contrast?: string }) {
  return (
    <div className="flex items-start gap-[var(--sp-3)] border-b border-[var(--line)] py-[var(--sp-3)]">
      <span
        className="mt-[2px] size-10 shrink-0 rounded-[var(--radius-xs)] border border-[var(--line-strong)]"
        style={{ backgroundColor: hex }}
      />
      <div className="min-w-0">
        <p className="text-300 font-semibold text-[var(--ink-strong)]">{name}</p>
        <p className="num font-mono text-200 text-[var(--ink-muted)]">{hex}</p>
        {contrast ? (
          <p className="num font-mono text-200 text-[var(--ink)]">{contrast}</p>
        ) : null}
        {note ? (
          <p className="measure mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

const neutrals: Array<[string, string, string]> = [
  ["--n-0", "#FAF8F5", "Fundal de pagină, light. Off-white cald — nu #FFFFFF."],
  ["--n-50", "#F2EFEA", "Singurul gri cald pentru suprafețe secundare."],
  ["--n-100", "#E6E2DB", "Hairline implicit."],
  ["--n-200", "#CBC6BC", "Contur de câmp, separator de bloc."],
  ["--n-300", "#9B968C", "Text secundar pe dark (6,37:1)."],
  ["--n-400", "#6C6862", "Text secundar pe light (5,22:1)."],
  ["--n-500", "#494640", "Suprafață 2, dark."],
  ["--n-600", "#2E2C29", "Linia de contrast, light."],
  ["--n-700", "#1C1B19", "Text principal, light (16,24:1)."],
  ["--n-800", "#121211", "Fundal de pagină, dark."],
  ["--n-900", "#0A0A09", "Cifre și titluri, light (18,68:1)."],
];

export function ColorSection() {
  return (
    <div className="grid gap-[var(--sp-8)] lg:grid-cols-2">
      <div>
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          Grafit cald / negru-cauciuc — 11 trepte
        </h3>
        <p className="measure mt-[var(--sp-2)] text-300 text-[var(--ink-muted)]">
          Nicio treaptă nu e gri neutru: toate poartă H≈78–107 în OKLCH. Un gri rece
          lângă un roșu cald arată ca două sisteme lipite unul de altul.
        </p>
        <div className="mt-[var(--sp-4)]">
          {neutrals.map(([n, hex, note]) => (
            <Swatch key={n} name={n} hex={hex} note={note} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          Semnale de sezon și de stare
        </h3>
        <p className="measure mt-[var(--sp-2)] text-300 text-[var(--ink-muted)]">
          Desaturate deliberat și mereu în pereche light/dark. Iarna e ardezie rece
          la 0,09 chroma, nu albastru electric. Sezonul e o etichetă, nu un accent.
        </p>
        <div className="mt-[var(--sp-4)]">
          <Swatch name="--season-summer  light" hex="#8A6A2A" contrast="4,74:1 pe #FAF8F5" />
          <Swatch name="--season-summer  dark" hex="#C8A75E" contrast="8,16:1 pe #121211" />
          <Swatch name="--season-winter  light" hex="#3F6274" contrast="6,17:1 pe #FAF8F5" />
          <Swatch name="--season-winter  dark" hex="#8FB2C4" contrast="8,33:1 pe #121211" />
          <Swatch name="--season-all  light" hex="#4F6350" contrast="6,13:1 pe #FAF8F5" />
          <Swatch name="--season-all  dark" hex="#9DB39E" contrast="8,37:1 pe #121211" />
          <Swatch name="--ok  light / dark" hex="#2F6A45" contrast="6,06:1 · varianta dark #79B894, 8,12:1" />
          <Swatch name="--warn  light / dark" hex="#8A5A16" contrast="5,57:1 · varianta dark #D4A254, 8,12:1" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ tipografie -- */

const scale: Array<[string, string, string]> = [
  ["--fs-1000", "47,8px", "Display. Un singur loc pe site: cifra din selectorul de dimensiune."],
  ["--fs-900", "39,8px", "Preț pe pagina de produs, desktop."],
  ["--fs-800", "33,2px", "H1."],
  ["--fs-700", "27,6px", "H1 mobil / H2 desktop."],
  ["--fs-600", "23px", "H2."],
  ["--fs-500", "19,2px", "H3, preț pe card."],
  ["--fs-400", "16px", "Corp, valoare în tabel."],
  ["--fs-300", "14px", "UI dens, titlu de card, rând de tabel."],
  ["--fs-200", "13px", "Meta, contor, notă."],
  ["--fs-100", "11px", "Etichetă de coloană, versale."],
];

export function TypeSection() {
  const twenty = products.filter((p) => p.sizeRaw).slice(0, 20);

  return (
    <div className="grid gap-[var(--sp-10)] lg:grid-cols-2">
      <div className="min-w-0">
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          Scară modulară — rație 1,2, bază 16px
        </h3>
        <div className="mt-[var(--sp-4)] border-t border-[var(--line)]">
          {scale.map(([tok, px]) => (
            <div
              key={tok}
              className="flex items-baseline gap-[var(--sp-4)] border-b border-[var(--line)] py-[var(--sp-3)]"
            >
              <span
                className="min-w-0 flex-1 truncate font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]"
                style={{ fontSize: `var(${tok})` }}
              >
                Anvelope Ungheni
              </span>
              <span className="num shrink-0 text-right font-mono text-200 text-[var(--ink-muted)]">
                {px}
              </span>
            </div>
          ))}
        </div>
        <dl className="mt-[var(--sp-4)] grid grid-cols-[auto_1fr] gap-x-[var(--sp-4)] gap-y-[var(--sp-1)] text-200">
          {scale.map(([tok, , use]) => (
            <div key={tok} className="contents">
              <dt className="num font-mono text-[var(--ink-muted)]">{tok}</dt>
              <dd className="text-[var(--ink-muted)]">{use}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="min-w-0">
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          20 de dimensiuni reale, una sub alta
        </h3>
        <p className="measure mt-[var(--sp-2)] text-300 text-[var(--ink-muted)]">
          Proba de foc a tipografiei acestui site. Cifrele au lățime fixă în ambele
          familii, deci „/” cade în aceeași coloană pe fiecare rând, iar formatul
          imperial `31x10.50 R15` nu sparge coloana. Prețurile se aliniază la dreapta
          pe ultima cifră, nu pe primul caracter.
        </p>
        <div className="mt-[var(--sp-4)] border-t border-[var(--line)]">
          {twenty.map((p) => (
            <div
              key={p.slug}
              className="flex items-baseline justify-between gap-[var(--sp-4)] border-b border-[var(--line)] py-[var(--sp-2)]"
            >
              <span className="num shrink-0 font-mono text-300 text-[var(--ink-strong)]">
                {formatSize(p)}
              </span>
              <span className="num shrink-0 font-mono text-200 text-[var(--ink-muted)]">
                {formatIndex(p.loadIndex, normalizeSpeedIndex(p.speedIndex)) ?? "—"}
              </span>
              <span className="min-w-0 flex-1 truncate text-right text-200 text-[var(--ink-muted)]">
                {p.brand}
              </span>
              <span className="num w-[7ch] shrink-0 text-right font-mono text-300 font-semibold text-[var(--ink-strong)] tabular-nums">
                {p.price ? formatPrice(p.price) : "—"}
              </span>
            </div>
          ))}
        </div>

        <h3 className="mt-[var(--sp-8)] text-500 font-semibold text-[var(--ink-strong)]">
          Chirilic și latin, aceeași calitate
        </h3>
        <div className="mt-[var(--sp-3)] grid gap-[var(--sp-4)] sm:grid-cols-2">
          <div>
            <p className="label">RO · latin-ext</p>
            <p className="mt-[var(--sp-2)] text-600 tracking-[var(--tr-title)] text-[var(--ink-strong)]">
              Ășțîâ ĂȘȚÎÂ
            </p>
            <p className="mt-[var(--sp-2)] text-300 text-[var(--ink)]">
              Indice de sarcină și viteză. Anvelope de iarnă în stoc la furnizor.
            </p>
          </div>
          <div>
            <p className="label">RU · cyrillic</p>
            <p className="mt-[var(--sp-2)] text-600 tracking-[var(--tr-title)] text-[var(--ink-strong)]">
              ЖЙЩЪЫЭЮЯ жйщъыэюя
            </p>
            <p className="mt-[var(--sp-2)] text-300 text-[var(--ink)]">
              Индекс нагрузки и скорости. Зимние шины на складе поставщика.
            </p>
          </div>
        </div>
        <p className="measure mt-[var(--sp-3)] text-200 text-[var(--ink-muted)]">
          Verificat pe fișierele woff2 servite efectiv de Google Fonts, nu pe fișa de
          produs: zero glife lipsă din setul RO și din alfabetul chirilic, în ambele
          familii. Ș și Ț sunt formele cu virgulă dedesubt (U+0218…U+021B), nu cu sedilă.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------ spatiu, forma, miscare -- */

export function SystemSection() {
  const steps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32];
  return (
    <div className="grid gap-[var(--sp-8)] lg:grid-cols-3">
      <div>
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          Spațiu — grila de 4px
        </h3>
        <div className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-2)]">
          {steps.map((s) => (
            <div key={s} className="flex items-center gap-[var(--sp-3)]">
              <span className="num w-[6ch] shrink-0 font-mono text-200 text-[var(--ink-muted)]">
                {s * 4}
              </span>
              <span
                className="h-3 bg-[var(--ink-strong)]"
                style={{ width: `var(--sp-${s})` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          Formă — raze mici
        </h3>
        <p className="measure mt-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
          Un catalog tehnic nu are colțuri rotunde. 2px pe controale, 3 pe carduri,
          4 pe containere mari. Pilula există pentru un singur element: contorul numeric.
        </p>
        <div className="mt-[var(--sp-4)] flex flex-wrap gap-[var(--sp-3)]">
          {[
            ["--radius-xs", "2px"],
            ["--radius-sm", "3px"],
            ["--radius-md", "4px"],
          ].map(([tok, px]) => (
            <div key={tok} className="text-center">
              <div
                className="size-16 border border-[var(--line-strong)] bg-[var(--surface-2)]"
                style={{ borderRadius: `var(${tok})` }}
              />
              <p className="num mt-[var(--sp-1)] font-mono text-200 text-[var(--ink-muted)]">
                {px}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-[var(--sp-8)] text-500 font-semibold text-[var(--ink-strong)]">
          Exact trei umbre
        </h3>
        <div className="mt-[var(--sp-4)] flex flex-wrap gap-[var(--sp-4)]">
          {[
            ["--shadow-1", "control ridicat"],
            ["--shadow-2", "meniu, toast"],
            ["--shadow-3", "modal, drawer"],
          ].map(([tok, use]) => (
            <div key={tok} className="text-center">
              <div
                className="size-16 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)]"
                style={{ boxShadow: `var(${tok})` }}
              />
              <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{use}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-500 font-semibold text-[var(--ink-strong)]">
          Mișcare — trei durate, nimic peste 200ms
        </h3>
        <dl className="mt-[var(--sp-4)] border-t border-[var(--line)] text-200">
          {[
            ["--dur-1", "90ms", "culoare, focus"],
            ["--dur-2", "140ms", "meniu, tab"],
            ["--dur-3", "190ms", "drawer, modal — maximul admis"],
          ].map(([tok, v, use]) => (
            <div key={tok} className="flex justify-between gap-[var(--sp-3)] border-b border-[var(--line)] py-[var(--sp-2)]">
              <dt className="num font-mono text-[var(--ink-strong)]">{tok}</dt>
              <dd className="num font-mono text-[var(--ink-muted)]">{v}</dd>
              <dd className="flex-1 text-right text-[var(--ink-muted)]">{use}</dd>
            </div>
          ))}
        </dl>
        <p className="measure mt-[var(--sp-3)] text-200 text-[var(--ink-muted)]">
          La <code className="font-mono">prefers-reduced-motion</code> toate trei devin
          1ms, iar animația de skeleton se oprește complet. Nu se reduce — se stinge.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- iconite ---- */

const iconList = [
  ["IconTyre", IconTyre], ["IconSummer", IconSummer], ["IconWinter", IconWinter],
  ["IconAllSeason", IconAllSeason], ["IconStock", IconStock], ["IconPhone", IconPhone],
  ["IconCart", IconCart], ["IconFilter", IconFilter], ["IconCompare", IconCompare],
  ["IconFavorite", IconFavorite], ["IconSearch", IconSearch], ["IconChevronDown", IconChevronDown],
  ["IconChevronRight", IconChevronRight], ["IconChevronLeft", IconChevronLeft],
  ["IconCheck", IconCheck], ["IconClose", IconClose], ["IconMinus", IconMinus],
  ["IconPlus", IconPlus], ["IconAlert", IconAlert], ["IconInfo", IconInfo],
  ["IconArrowRight", IconArrowRight],
] as const;

export function IconSection() {
  return (
    <div>
      <p className="measure text-300 text-[var(--ink-muted)]">
        Un singur set, desenat pentru acest proiect. Grilă 24×24, contur 1,5,
        capete drepte, îmbinări în unghi, zero umpluturi. Capetele drepte sunt
        decizia care le ține împreună: amestecul dintre capete rotunde și drepte
        e cel mai rapid semn că iconițele vin din două surse.
      </p>
      <div className="mt-[var(--sp-5)] grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4 lg:grid-cols-7">
        {iconList.map(([name, C]) => (
          <div
            key={name}
            className="flex flex-col items-center gap-[var(--sp-2)] bg-[var(--surface)] p-[var(--sp-4)]"
          >
            <C size={24} className="text-[var(--ink-strong)]" />
            <span className="w-full truncate text-center font-mono text-[10px] text-[var(--ink-muted)]">
              {name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-[var(--sp-6)] flex flex-wrap items-end gap-[var(--sp-6)]">
        {[14, 16, 20, 24, 32].map((s) => (
          <div key={s} className="text-center">
            <IconTyre size={s} className="text-[var(--ink-strong)]" />
            <span className="num mt-[var(--sp-1)] block font-mono text-[10px] text-[var(--ink-muted)]">
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------- elementul-semnatura -- */

export function SignatureSection() {
  return (
    <div className="grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div>
        <p className="measure text-300 leading-normal text-[var(--ink)]">
          Profilul benzii de rulare, desfășurat pe orizontală: lugurile înclinate
          la 20° și coasta longitudinală continuă de sub ele. E singurul element
          grafic recurent al site-ului.
        </p>
        <p className="measure mt-[var(--sp-4)] text-300 leading-normal text-[var(--ink-muted)]">
          De ce el și nu altceva: mărcile n-au logo, produsele n-au descriere, nu
          există fotografie de atmosferă și nu există conținut editorial. Site-ul
          are nevoie de un semn care să spună „anvelope” fără să fie o ilustrație
          și fără să consume culoare. Un profil de bandă e literal amprenta
          produsului și rămâne recognoscibil la 96px lățime.
        </p>
        <p className="measure mt-[var(--sp-4)] text-300 leading-normal text-[var(--ink-muted)]">
          Regula de folosire: maximum două apariții pe ecran. Una ca marcaj sub
          titlul principal, una ca separator între două blocuri majore. A treia
          apariție îl transformă din semnătură în tapet.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--sp-8)]">
        <div>
          <p className="label">Marcaj de titlu — în accent</p>
          <h4 className="optical-left mt-[var(--sp-2)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
            Michelin Primacy 4
          </h4>
          <TreadRule variant="mark" width={104} className="mt-[var(--sp-3)] text-[var(--accent)]" />
        </div>

        <div>
          <p className="label">Separator de secțiune — în linie neutră</p>
          <div className="mt-[var(--sp-3)] text-[var(--line-strong)]">
            <TreadRule variant="full" />
          </div>
        </div>

        <div>
          <p className="label">Scări</p>
          <div className="mt-[var(--sp-3)] flex flex-col gap-[var(--sp-3)] text-[var(--ink-strong)]">
            <TreadRule variant="mark" width={64} />
            <TreadRule variant="mark" width={104} />
            <TreadRule variant="mark" width={168} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoDont({
  doText, dontText, className,
}: { doText: string; dontText: string; className?: string }) {
  return (
    <div className={cn("grid gap-[var(--sp-4)] sm:grid-cols-2", className)}>
      <div className="border-l-2 border-[var(--ok)] pl-[var(--sp-3)]">
        <p className="label" style={{ color: "var(--ok)" }}>Așa</p>
        <p className="mt-[var(--sp-1)] text-200 text-[var(--ink)]">{doText}</p>
      </div>
      <div className="border-l-2 border-[var(--ink-faint)] pl-[var(--sp-3)]">
        <p className="label">Nu așa</p>
        <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{dontText}</p>
      </div>
    </div>
  );
}
