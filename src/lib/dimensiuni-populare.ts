import { sizeTree } from "@/lib/size-tree";

/** Cele mai bine acoperite dimensiuni din catalog — calculate, nu alese pe gust. */
export function topSizes(limit = 8) {
  const out: { width: string; aspect: string; diameter: string; available: number }[] = [];
  for (const [width, [, , aspects]] of Object.entries(sizeTree)) {
    for (const [aspect, [, , diameters]] of Object.entries(aspects)) {
      for (const [diameter, [, available]] of Object.entries(diameters)) {
        out.push({ width, aspect, diameter, available });
      }
    }
  }
  return out.sort((a, b) => b.available - a.available).slice(0, limit);
}
