/**
 * CINE ARE VOIE SĂ PARCURGĂ CELE 37.000 DE PAGINI.
 *
 * Catalogul are ~18.400 de produse în două limbi. Fiecare adresă distinctă pe
 * care o cere un robot și care nu e încă în cache se randează o dată și se
 * scrie o dată — o scriere ISR și ~400 KB de stocare (255 KB de HTML plus 145
 * KB de payload RSC, măsurat pe o fișă reală). O singură parcurgere completă a
 * catalogului costă deci ~37.000 de scrieri din bugetul lunar de 200.000.
 *
 * Măsurat pe 11 septembrie 2026, ora 21: 231 de randări de fișă pe oră, adică
 * ~186.000 pe lună. Nu de la vizitatori — de la roboți care merg prin catalog
 * metodic, câte o pagină la câteva secunde, zi și noapte.
 *
 * Nouă roboți care parcurg tot catalogul = nouă parcurgeri = 333.000 de
 * scrieri. Exact cifra la care ajunsese contul.
 *
 * Deci distincția care contează nu e „robot bun / robot rău", ci:
 *
 *   PARCURG TOT, DIN PROPRIE INIȚIATIVĂ  — costă o parcurgere completă fiecare
 *   CER O PAGINĂ, CÂND UN OM ÎNTREABĂ    — costă o pagină
 *
 * Regula de dinainte îi invita pe toți la fel, cu un comentariu care spunea de
 * ce: vrem ca un asistent întrebat „unde cumpăr anvelope în Moldova" să ne
 * poată cita cu preț și disponibilitate. Intenția aia se păstrează întreagă mai
 * jos — agenții care aduc omul la noi rămân. Pleacă doar cei care copiază
 * catalogul pentru antrenament, și roboții de SEO, care parcurg tot și nu aduc
 * niciun client.
 */

/**
 * Cer o pagină pentru că un om tocmai a întrebat ceva. Rămân — asta e exact
 * traficul pentru care s-a scris regula inițială.
 */
export const AGENTI_LA_CERERE = [
  "OAI-SearchBot", "ChatGPT-User",      // OpenAI, căutare și navigare la cerere
  "Claude-User", "Claude-SearchBot",    // Anthropic, idem
  "Perplexity-User",                    // Perplexity, la cererea unui om
];

/**
 * Parcurg catalogul întreg ca să-l copieze. Fiecare dintre ei costă o
 * parcurgere completă — și niciunul nu trimite pe nimeni în atelier.
 *
 * Cele două intrări `*-Extended` nu sunt roboți: sunt jetoane pe care Google și
 * Apple le citesc din robots.txt ca să știe dacă pot folosi la antrenament ce
 * au luat deja cu Googlebot și Applebot. Se refuză aici, nu în filtrul de mai
 * jos, fiindcă nicio cerere nu vine vreodată cu numele ăsta.
 */
export const CRAWLERE_DE_ANTRENAMENT = [
  "GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Applebot-Extended",
  "meta-externalagent", "Amazonbot", "Bytespider", "cohere-ai", "YouBot",
  "Kimi-Bot", "CCBot", "Diffbot", "omgili", "ImagesiftBot", "Timpibot",
];

/**
 * Roboți de analiză SEO. Parcurg tot catalogul lunar ca să vândă rapoarte
 * despre el altcuiva. Costul e al nostru, raportul e al lor.
 */
export const CRAWLERE_SEO = [
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot",
  "BLEXBot", "Barkrowler", "SeekportBot", "PetalBot", "serpstatbot",
];

/**
 * Cei pe care îi refuzăm și în fapt, nu doar în robots.txt.
 *
 * robots.txt e o rugăminte. Bytespider e cunoscut că o ignoră, și nu e singurul
 * — iar o rugăminte ignorată costă exact cât una nerespectată niciodată. Aici
 * cererea se oprește în middleware, înainte de randare: rămâne o cerere la
 * margine (buget de 1.000.000) în loc de o scriere ISR (buget de 200.000).
 *
 * Jetoanele `*-Extended` nu intră în listă — n-ar prinde nimic și ar risca să
 * lovească Googlebot sau Applebot, care trebuie să intre.
 */
const DE_OPRIT = [...CRAWLERE_DE_ANTRENAMENT, ...CRAWLERE_SEO]
  .filter((nume) => !nume.endsWith("-Extended"));

const TIPAR_DE_OPRIT = new RegExp(DE_OPRIT.join("|"), "i");

/**
 * Googlebot, Bingbot, YandexBot, Applebot, DuckDuckBot și roboții de previzualizare
 * a linkurilor (WhatsApp, Facebook, Telegram) NU sunt pe listă și nu vor fi:
 * ei sunt cum ne găsesc clienții.
 */
export function eDeOprit(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return TIPAR_DE_OPRIT.test(userAgent);
}
