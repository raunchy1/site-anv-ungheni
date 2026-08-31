/**
 * Alertele pe e-mail, prin Resend.
 *
 * TRIMITEREA NU POATE RUPE SINCRONIZAREA. Dacă e-mailul cade, produsele tot s-au
 * importat și jurnalul tot există; funcția nu aruncă niciodată, doar spune ce s-a
 * întâmplat. Aceeași regulă ca la e-mailul de comandă.
 *
 * Se folosește API-ul HTTP direct, nu pachetul `resend`: modulul ăsta rulează și
 * din scripturi `.mjs` din `tools/`, care n-au bundler.
 */
const FROM = process.env.RESEND_FROM ?? 'Anvelope Ungheni <comenzi@anvelope-ungheni.md>';
const FALLBACK_FROM = process.env.RESEND_FALLBACK_FROM;
const FALLBACK_TO = process.env.RESEND_FALLBACK_TO;

function destinatari() {
  const brut = process.env.SYNC_ALERT_EMAIL ?? process.env.ORDER_NOTIFY_EMAIL ?? '';
  return brut.split(',').map((a) => a.trim()).filter(Boolean);
}

async function trimite(key, from, to, subiect, text, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: subiect, text, html }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) return { trimis: false, motiv: `${d.name ?? res.status}: ${d.message ?? ''}`.slice(0, 200) };
  return { trimis: true, id: d.id };
}

export async function alerta(subiect, text, html = null) {
  const key = process.env.RESEND_API_KEY;
  const to = destinatari();
  if (!key || to.length === 0) return { trimis: false, motiv: 'neconfigurat' };

  try {
    const corp = html ?? `<pre style="font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap">${
      String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`;

    const r = await trimite(key, FROM, to, subiect, text, corp);
    if (r.trimis) return r;

    /* Aceeași plasă de siguranță ca la comenzi: cât timp domeniul nu e verificat
       în Resend, trimiterea normală e refuzată din principiu. */
    if (FALLBACK_TO && FALLBACK_FROM) return trimite(key, FALLBACK_FROM, [FALLBACK_TO], subiect, text, corp);
    return r;
  } catch (e) {
    return { trimis: false, motiv: String(e).slice(0, 200) };
  }
}
