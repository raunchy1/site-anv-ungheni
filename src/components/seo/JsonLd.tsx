/**
 * Un bloc `application/ld+json`, scris o singură dată.
 *
 * De ce o componentă și nu `<script>` peste tot: `JSON.stringify` pe un obiect
 * cu `undefined` lasă cheia afară — exact ce vrem — dar un `</script>` apărut
 * într-un titlu de produs ar închide blocul și ar injecta HTML în pagină.
 * Scăparea lui `<` e obligatorie și trebuie să fie într-un singur loc.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
