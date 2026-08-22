import Link from "next/link";
import { TreadRule } from "@/components/icons";
import { SizeSelector } from "@/components/ui/SizeSelector";

/**
 * Placeholder de faza 2. Pagina reala se construieste in faza urmatoare;
 * aici sta doar piesa centrala, ca sa nu ramana template-ul `create-next-app`.
 */
export default function Home() {
  return (
    <main className="shell flex flex-col gap-[var(--sp-10)] py-[var(--sp-16)]">
      <header>
        <p className="label">Ungheni · Republica Moldova</p>
        <h1 className="optical-left mt-[var(--sp-3)] text-800 font-semibold leading-tight tracking-[var(--tr-display)] text-[var(--ink-strong)] sm:text-900">
          Anvelope Ungheni
        </h1>
        <TreadRule variant="mark" width={132} className="mt-[var(--sp-4)] text-[var(--accent)]" />
      </header>

      <SizeSelector locale="ro" />

      <p className="text-300 text-[var(--ink-muted)]">
        <Link
          href="/design-system"
          className="underline decoration-[var(--line-strong)] decoration-1 underline-offset-[5px] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)] hover:decoration-[var(--ink-strong)]"
        >
          Design system
        </Link>
      </p>
    </main>
  );
}
