import { cn } from "@/lib/cn";

/**
 * Fara sclipire care traverseaza elementul: e un gradient in miscare, adica
 * exact ce am interzis. Aici pulseaza opacitatea intre 1 si 0.55, 1.1s,
 * si se opreste complet la `prefers-reduced-motion`.
 */
export function Skeleton({
  className,
  as: As = "div",
}: {
  className?: string;
  as?: "div" | "span";
}) {
  return (
    <As
      aria-hidden="true"
      className={cn(
        "block rounded-[var(--radius-xs)] bg-[var(--surface-2)]",
        "motion-safe:animate-[skeleton_1100ms_var(--ease-in-out)_infinite]",
        className,
      )}
    />
  );
}
