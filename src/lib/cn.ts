/** Concatenare de clase. Cat ne trebuie, nimic mai mult — `clsx` ar fi o dependinta pentru 6 randuri. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
