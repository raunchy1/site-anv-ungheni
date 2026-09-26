/**
 * INDEXNOW: „am schimbat pagina asta, vino s-o citești".
 *
 * Google așteaptă să treacă singur pe la noi; Bing, Yandex, Seznam și Naver
 * primesc lista de adrese și le reindexează în câteva minute. Contează dublu
 * pentru că indexul Bing e cel din care răspund ChatGPT Search și Copilot.
 *
 * Cheia nu e secretă — protocolul cere să fie publicată la `/<cheie>.txt`
 * (ruta de alături). Dovedește doar că cine trimite lista controlează
 * domeniul. Trimiterea o face `tools/seo/indexnow.mjs`, care citește cheia de
 * aici.
 */
export const INDEXNOW_KEY = "db7c2364ae191ed27277da32744f924b";
