/**
 * REÎMPROSPĂTAREA CONTOARELOR, după fiecare rulare care schimbă catalogul.
 *
 * `facet_counts` e o vedere materializată, iar `brands.product_count` o coloană
 * denormalizată. Amândouă au funcții de reîmprospătare scrise încă din 0007, cu
 * comentariul „se apelează la finalul fiecărui import" — numai că nimic nu le
 * apela. Măsurat pe 5 septembrie 2026, înainte de a lega apelurile: fațetele
 * spuneau 8.064 de anvelope disponibile, baza avea 8.698.
 *
 * DE CE CONTEAZĂ MAI MULT DECÂT PARE. Numerele alea nu sunt decor: bara de
 * filtre din catalog citește `facet_counts`, deci un brand rămas pe zero nu mai
 * apare deloc ca opțiune de filtrare. Un produs poate fi în bază, activ și pe
 * stoc, și totuși de negăsit prin filtre.
 *
 * Nu aruncă. O rulare de sincronizare care a scris corect 1.200 de produse nu
 * trebuie să se termine cu eroare pentru că un contor n-a putut fi recalculat;
 * se spune în jurnal și se merge mai departe.
 */

async function rpc(nume) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/rpc/${nume}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`${nume}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
}

/** @param {(...a: unknown[]) => void} [log] */
export async function reimprospateazaContoarele(log = console.log) {
  const rezultat = { facete: false, branduri: false, erori: [] };
  for (const [nume, cheie] of [['refresh_facet_counts', 'facete'], ['refresh_brand_counts', 'branduri']]) {
    try {
      await rpc(nume);
      rezultat[cheie] = true;
    } catch (e) {
      rezultat.erori.push(`${nume}: ${e.message}`);
    }
  }
  log(rezultat.erori.length
    ? `· contoare: ${rezultat.erori.join(' | ')}`
    : '· contoare de filtre și de brand: reîmprospătate');
  return rezultat;
}
