import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconMinus, IconPlus } from "@/components/icons";

export type AccordionItem = { id: string; title: string; content: ReactNode };

/**
 * `<details>` nativ. Se deschide fara JavaScript, e cautabil de Ctrl+F in
 * browserele care implementeaza `hidden=until-found`, si e accesibil din start.
 * Un accordion rescris in React ar fi 80 de randuri ca sa reproduca prost
 * ceva ce browserul face corect.
 *
 * Semnul e plus/minus, nu chevron rotit: rotatia e o animatie in plus pentru
 * aceeasi informatie.
 */
export function Accordion({
  items,
  className,
  defaultOpen,
}: {
  items: readonly AccordionItem[];
  className?: string;
  defaultOpen?: string;
}) {
  return (
    <div className={cn("border-t border-[var(--line)]", className)}>
      {items.map((it) => (
        <details
          key={it.id}
          name="accordion"
          open={it.id === defaultOpen}
          className="group border-b border-[var(--line)]"
        >
          <summary
            className={cn(
              "flex min-h-11 cursor-pointer list-none items-center justify-between gap-[var(--sp-4)]",
              "py-[var(--sp-3)] text-300 font-semibold text-[var(--ink-strong)]",
              "[&::-webkit-details-marker]:hidden",
              // Fara rosu pe hover de rand: rosul pe hover multiplicat cu 9 randuri e
              // rosu peste tot. Semnalul e sublinierea.
              "underline decoration-transparent decoration-1 underline-offset-[5px]",
              "transition-[text-decoration-color] duration-[var(--dur-1)] hover:decoration-[var(--line-strong)]",
            )}
          >
            {it.title}
            <span className="shrink-0 text-[var(--ink-muted)]">
              <IconPlus size={16} className="group-open:hidden" />
              <IconMinus size={16} className="hidden group-open:block" />
            </span>
          </summary>
          <div className="measure pb-[var(--sp-4)] text-300 leading-normal text-[var(--ink)]">
            {it.content}
          </div>
        </details>
      ))}
    </div>
  );
}
