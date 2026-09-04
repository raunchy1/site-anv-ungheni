-- 0017 — pagina de cookie și textele românești ale documentelor de confidențialitate
-- Idempotentă. Rollback: supabase/rollback/0017_texte_legale_ro.down.sql
--
-- Cele patru schelete din 0003 au rămas cu `body` NULL, deci pe `noindex`, iar
-- pagina de cookie nu exista deloc. Aici intră a cincea pagină și textele RO ale
-- celor două documente pe care legea le cere oricărui site care primește comenzi:
-- politica de confidențialitate și politica de cookie.
--
-- TEXTUL DESCRIE SITE-UL ACESTA, NU UNUL GENERIC. Fiecare afirmație a fost
-- verificată în cod înainte de a fi scrisă:
--   * cookie-ul `NEXT_LOCALE` — confirmat cu `curl -I` pe producție;
--   * `au:cos` și `au:size` în localStorage — src/lib/cart/store.tsx, TireFinder.tsx;
--   * câmpurile comenzii — schema Zod din src/lib/orders/plaseaza.ts;
--   * câmpurile programării — src/components/product/BookingForm.tsx;
--   * adresa IP și pragul de 3 cereri pe oră — migrarea 0007;
--   * absența oricărui script terț — antetul CSP `script-src 'self'` din vercel.json;
--   * harta Google, singurul terț încărcat, și numai la derulare — MapEmbed.tsx.
--
-- Ce NU e scris aici, pentru că nu se inventează: denumirea juridică și IDNO-ul
-- societății. Se completează din admin când clientul le confirmă.
--
-- `where coalesce(body_ro, '') = ''` — o rulare repetată nu suprascrie ce a scris
-- clientul între timp din panoul de administrare.

insert into legal_pages (slug_ro, slug_ru, title_ro, title_ru, sort_order) values
  ('politica-cookie', 'politika-cookie', 'Politica de cookie', 'Политика использования cookie', 5)
on conflict (slug_ro) do nothing;

/* ------------------------------------------- politica de confidențialitate */

update legal_pages set
  meta_desc_ro = 'Ce date îți cerem când comanzi anvelope la Ungheni, de ce, cât le păstrăm și cui ajung. Fără urmărire, fără reclame, fără cont.',
  body_ro = $html$
<p><strong>Pe scurt:</strong> nu ai nevoie de cont ca să cumperi de aici. Îți cerem doar datele fără de care comanda nu poate ajunge la tine — nume, telefon și, dacă alegi livrarea, adresa. Nu folosim Google Analytics, nu avem pixeli de publicitate și nu dăm datele tale nimănui în afara celor care duc comanda la bun sfârșit.</p>

<h2>1. Cine răspunde de datele tale</h2>
<p>Operatorul datelor cu caracter personal este atelierul <strong>Anvelope Ungheni</strong>, Strada Decebal 62/1, Ungheni, Republica Moldova.</p>
<ul>
  <li>Telefon: <a href="tel:+37368263644">068 263 644</a></li>
  <li>E-mail: <a href="mailto:info@anvelope-ungheni.md">info@anvelope-ungheni.md</a></li>
</ul>
<p>Prelucrăm datele conform Legii nr. 133 din 8 iulie 2011 privind protecția datelor cu caracter personal.</p>

<h2>2. Ce date colectăm și de ce</h2>

<h3>Când plasezi o comandă</h3>
<table>
  <thead>
    <tr><th>Data</th><th>De ce ne trebuie</th><th>Obligatorie</th></tr>
  </thead>
  <tbody>
    <tr><td>Numele</td><td>Ca să știm a cui e comanda și cum ne adresăm</td><td>Da</td></tr>
    <tr><td>Numărul de telefon</td><td>Confirmăm comanda printr-un apel sau pe WhatsApp. E singurul canal pe care te putem întreba ceva înainte de livrare</td><td>Da</td></tr>
    <tr><td>Adresa de e-mail</td><td>Îți trimitem confirmarea scrisă a comenzii</td><td>Nu</td></tr>
    <tr><td>Localitatea</td><td>Stabilește dacă livrarea e în Ungheni sau în restul țării și cât costă</td><td>Da</td></tr>
    <tr><td>Adresa de livrare</td><td>O primește curierul care aduce anvelopele</td><td>Doar la livrare prin curier</td></tr>
    <tr><td>Observațiile tale</td><td>Ce ne scrii singur: un interval orar, un reper, orice altceva</td><td>Nu</td></tr>
    <tr><td>Produsele, cantitățile și suma</td><td>Comanda propriu-zisă</td><td>Da</td></tr>
  </tbody>
</table>

<h3>Când te programezi la un serviciu</h3>
<p>Numele și telefonul, obligatorii, plus, dacă vrei să ni le spui, modelul mașinii, ziua care ți-ar conveni și o observație. Modelul mașinii ne ajută să pregătim uneltele potrivite înainte să ajungi.</p>

<h3>Fără să ne dai tu ceva</h3>
<ul>
  <li><strong>Adresa IP</strong> — se reține în clipa în care trimiți un formular, ca să limităm la trei comenzi pe oră de la aceeași conexiune. E singura apărare împotriva comenzilor false trimise automat. Se șterge după 24 de ore și nu e legată de comanda ta.</li>
  <li><strong>Jurnalele serverului</strong> — adresa cerută, ora și tipul browserului. Le păstrează furnizorul de găzduire pentru diagnostic tehnic; nu le folosim ca să identificăm pe cineva.</li>
</ul>

<h3>Ce nu facem</h3>
<ul>
  <li>nu ai cont pe site și nu-ți cerem parolă;</li>
  <li>nu avem Google Analytics, Facebook Pixel sau alt instrument de urmărire — site-ul nu încarcă niciun script de la terți, iar asta e impusă de o regulă de securitate a serverului, nu doar de o promisiune scrisă aici;</li>
  <li>nu construim profiluri și nicio decizie despre tine nu se ia automat;</li>
  <li>nu vindem, nu închiriem și nu facem schimb de date cu nimeni.</li>
</ul>

<h2>3. Pe ce temei le prelucrăm</h2>
<ul>
  <li><strong>Executarea contractului</strong> — comanda și programarea la atelier. Fără nume, telefon și adresă nu avem cum să livrăm sau să montăm.</li>
  <li><strong>Obligația legală</strong> — documentele contabile ale vânzării.</li>
  <li><strong>Interesul legitim</strong> — oprirea comenzilor false și securitatea site-ului.</li>
</ul>

<h2>4. Cât le păstrăm</h2>
<ul>
  <li><strong>Comenzile</strong> — pe durata garanției produselor, doi ani, plus termenul cerut de legislația contabilă. O comandă ștearsă mai devreme înseamnă o garanție pe care nu ți-o mai putem dovedi.</li>
  <li><strong>Programările la serviciu</strong> — douăsprezece luni de la data programării.</li>
  <li><strong>Adresele IP din limitatorul de cereri</strong> — douăzeci și patru de ore.</li>
</ul>

<h2>5. Cine mai vede datele</h2>
<p>Doar cine are nevoie de ele ca să-ți ajungă comanda:</p>
<table>
  <thead>
    <tr><th>Cui</th><th>Ce vede</th></tr>
  </thead>
  <tbody>
    <tr><td>Supabase, furnizorul bazei de date</td><td>Comenzile și programările, stocate pe servere din Irlanda</td></tr>
    <tr><td>Vercel, furnizorul de găzduire</td><td>Jurnalele tehnice ale site-ului</td></tr>
    <tr><td>Resend, serviciul de e-mail</td><td>Confirmarea comenzii, atunci când ne-ai lăsat o adresă</td></tr>
    <tr><td>Curierul</td><td>Numele, telefonul și adresa, cât să livreze</td></tr>
    <tr><td>WhatsApp</td><td>Doar dacă apeși tu butonul de pe ecranul de confirmare: mesajul pleacă din aplicația ta, cu textul comenzii în el</td></tr>
  </tbody>
</table>
<p>Niciunul dintre ei nu are voie să folosească datele în scopuri proprii.</p>

<h2>6. Ies datele din Republica Moldova?</h2>
<p>Parțial, da: baza de date și găzduirea site-ului sunt pe servere din Uniunea Europeană, iar serviciul de e-mail poate prelucra mesajul și în afara ei. Alegem furnizori care oferă garanțiile contractuale standard pentru protecția datelor.</p>

<h2>7. Cookie-uri</h2>
<p>Site-ul folosește un singur cookie propriu, cel care ține minte limba pe care ai ales-o. Nu avem cookie-uri de urmărire sau de publicitate. Detaliile stau în <a href="/politica-cookie">Politica de cookie</a>.</p>

<h2>8. Drepturile tale</h2>
<ul>
  <li><strong>Să afli</strong> ce date avem despre tine.</li>
  <li><strong>Să le corectezi</strong>, dacă am scris greșit ceva.</li>
  <li><strong>Să ceri ștergerea</strong>, dacă nu mai avem un motiv legal să le ținem.</li>
  <li><strong>Să te opui</strong> prelucrării.</li>
  <li><strong>Să reclami</strong> la Centrul Național pentru Protecția Datelor cu Caracter Personal (<a href="https://datepersonale.md" rel="noopener">datepersonale.md</a>), dacă răspunsul nostru nu te mulțumește.</li>
</ul>
<p>Scrie la <a href="mailto:info@anvelope-ungheni.md">info@anvelope-ungheni.md</a> sau sună la <a href="tel:+37368263644">068 263 644</a>. Răspundem în cel mult 15 zile. Ca să nu dăm datele cuiva care se dă drept tine, îți putem cere să confirmi numărul de telefon de pe comandă.</p>

<h2>9. Cum le ținem în siguranță</h2>
<ul>
  <li>tot site-ul merge pe HTTPS;</li>
  <li>comenzile se citesc doar din panoul de administrare, cu autentificare; regulile de acces sunt scrise în baza de date însăși, nu doar în aplicație, deci o pagină adăugată din greșeală nu le poate ocoli;</li>
  <li>prețurile și totalurile se recalculează pe server la fiecare comandă, deci o comandă nu poate fi falsificată din browser.</li>
</ul>
<p>Nicio măsură nu e perfectă. Dacă apare o breșă care îți pune datele în pericol, te anunțăm.</p>

<h2>10. Copii</h2>
<p>Site-ul se adresează adulților. Nu colectăm cu bună știință date despre copii sub 16 ani. Dacă afli că un copil ne-a lăsat datele, scrie-ne și le ștergem.</p>

<h2>11. Modificări</h2>
<p>Când schimbăm ceva în această politică, se schimbă și data de sub titlu. Merită recitită înainte de o comandă nouă.</p>
$html$
where slug_ro = 'politica-de-confidentialitate'
  and coalesce(body_ro, '') = '';

/* ------------------------------------------------------ politica de cookie */

update legal_pages set
  meta_desc_ro = 'Un singur cookie, cel care ține minte limba. Fără Google Analytics, fără pixeli de publicitate, fără bandă de acord care să-ți stea în drum.',
  body_ro = $html$
<p><strong>Pe scurt:</strong> site-ul folosește un singur cookie, cel care ține minte dacă citești în română sau în rusă. Nu avem Google Analytics, nu avem pixeli de publicitate și nu urmărim pe nimeni de la un site la altul. De asta nu-ți sare în față nicio bandă care să-ți ceară acordul — n-avem pentru ce.</p>

<h2>1. Ce este un cookie</h2>
<p>Un fișier mic pe care site-ul îl lasă în browserul tău și pe care îl citește la vizita următoare. Unele sunt necesare ca site-ul să funcționeze; altele, cele mai multe de pe internet, servesc la urmărirea comportamentului pentru publicitate. Noi le folosim doar pe primele.</p>

<h2>2. Cookie-ul pe care îl folosim</h2>
<table>
  <thead>
    <tr><th>Nume</th><th>Cine îl pune</th><th>La ce folosește</th><th>Cât trăiește</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>NEXT_LOCALE</strong></td>
      <td>Noi</td>
      <td>Ține minte limba aleasă din comutatorul RO/RU, ca să nu o alegi la fiecare pagină</td>
      <td>Până închizi browserul</td>
    </tr>
  </tbody>
</table>
<p>Atât. Nu conține numele tău, nu conține un identificator care să te urmărească și nu pleacă nicăieri din browserul tău.</p>

<h2>3. Ce mai ține minte browserul, fără să fie cookie</h2>
<p>Două lucruri stau în memoria locală a browserului. Spre deosebire de cookie-uri, ele nu se trimit niciodată către server — rămân pe dispozitivul tău:</p>
<table>
  <thead>
    <tr><th>Nume</th><th>Ce conține</th><th>De ce</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>au:cos</strong></td><td>Produsele din coș și cantitățile</td><td>Ca să nu-ți pierzi coșul dacă închizi pagina. Prețurile se recalculează oricum pe server când trimiți comanda</td></tr>
    <tr><td><strong>au:size</strong></td><td>Ultima dimensiune căutată, de exemplu 205/55 R16</td><td>Ca formularul de căutare să o aibă deja completată data viitoare</td></tr>
  </tbody>
</table>

<h2>4. Terții</h2>
<p>Site-ul nu încarcă niciun script din afară. Există doar două locuri unde intri în legătură cu un serviciu străin, și în ambele decizi tu:</p>
<ul>
  <li><strong>Harta Google de pe pagina de contact.</strong> Nu se încarcă odată cu pagina: apare abia când derulezi până la ea. Din clipa aceea, Google poate pune propriile cookie-uri, după politica lui. Dacă nu derulezi până la hartă, nu se încarcă nimic de la Google.</li>
  <li><strong>Butonul de WhatsApp</strong> de pe ecranul de confirmare a comenzii. Se deschide abia la clic și te duce în aplicația WhatsApp, cu regulile Meta.</li>
</ul>

<h2>5. De ce nu-ți cerem acordul printr-o bandă</h2>
<p>Acordul se cere pentru cookie-urile care urmăresc, măsoară sau fac publicitate. Singurul nostru cookie face ca site-ul să-ți vorbească în limba pe care ai cerut-o — e strict necesar pentru ce ne-ai cerut tu să facem. O bandă de acord peste un site fără urmărire ar fi doar un obstacol în plus, nu o protecție.</p>
<p>Dacă vom adăuga vreodată statistici sau publicitate, banda apare înainte de primul cookie de acest fel, nu după.</p>

<h2>6. Cum scapi de ele</h2>
<p>Orice browser îți dă voie să vezi, să ștergi și să blochezi cookie-urile, din setări, la capitolul „Confidențialitate". Poți șterge la fel și memoria locală a site-ului.</p>
<p>Ce se strică dacă le blochezi: limba nu se mai ține minte de la o pagină la alta, iar coșul se golește când închizi fila. Restul site-ului merge normal — catalogul, fișele de produs și comanda funcționează și fără ele.</p>

<h2>7. Modificări</h2>
<p>Când lista de mai sus se schimbă, se schimbă și data de sub titlu.</p>
$html$
where slug_ro = 'politica-cookie'
  and coalesce(body_ro, '') = '';
