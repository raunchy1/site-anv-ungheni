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
  flat: "",
  raised: "card-raised",
  sunken: "card-sunken",
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
      className={cn("card", tones[tone], interactive && "card-interactive", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
