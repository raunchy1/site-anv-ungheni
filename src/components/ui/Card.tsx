import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `flat` = doar hairline. `raised` = umbra 1. `sunken` = fundal coborat, fara contur. */
  tone?: "flat" | "raised" | "sunken";
  /** Interactiv: schimba fundalul si conturul la hover. NU se ridica si NU se scaleaza. */
  interactive?: boolean;
  children: ReactNode;
};

/**
 * Un card nu se ridica la hover. Cardurile care plutesc sunt o conventie de
 * landing page, nu de catalog: intr-o grila de 24, jumatate din ecran vibreaza
 * cand treci mouse-ul. Feedback-ul aici e o schimbare de fundal si de contur,
 * in 90ms, fara translatie.
 */
const tones = {
  flat: "border border-[var(--line)] bg-[var(--surface)]",
  raised: "border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-1)]",
  sunken: "border border-transparent bg-[var(--bg-sunken)]",
} as const;

export function Card({
  tone = "flat",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)]",
        tones[tone],
        interactive &&
          "transition-[background-color,border-color] duration-[var(--dur-1)] ease-[var(--ease-out)] " +
            "hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)] " +
            "focus-within:border-[var(--line-strong)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
