-- 0022 — Google intră în lista destinatarilor din politica de confidențialitate.
--
-- Secțiunea 5 enumeră cine mai vede datele: Supabase, Vercel, Resend, curierul,
-- WhatsApp. Lipsea Google, deși harta de pe contact îi trimite adresa IP a
-- vizitatorului în momentul în care se încarcă. De la 5 septembrie 2026 harta
-- cere acord (vezi 0021), deci disponibilitatea informației contează și mai
-- mult: omul trebuie să poată citi ce acceptă înainte să apese.
--
-- Ancorat pe textul fiecărei limbi în parte, nu pe cel românesc: rândul de
-- WhatsApp e ultimul din tabel în ambele versiuni, iar noul rând intră după el.

update legal_pages set
  body_ro = replace(body_ro,
    '<tr><td>WhatsApp</td><td>Doar dacă apeși tu butonul de pe ecranul de confirmare: mesajul pleacă din aplicația ta, cu textul comenzii în el</td></tr>',
    '<tr><td>WhatsApp</td><td>Doar dacă apeși tu butonul de pe ecranul de confirmare: mesajul pleacă din aplicația ta, cu textul comenzii în el</td></tr>
    <tr><td>Google</td><td>Doar dacă accepți harta de pe pagina de contact: atunci Google îți vede adresa IP și îți poate pune cookie-urile lui. Fără acordul tău, harta nu se încarcă și Google nu află nimic</td></tr>'),

  body_ru = replace(body_ru,
    '<tr><td>WhatsApp</td><td>Только если вы сами нажмёте кнопку на экране подтверждения: сообщение уходит из вашего приложения, с текстом заказа</td></tr>',
    '<tr><td>WhatsApp</td><td>Только если вы сами нажмёте кнопку на экране подтверждения: сообщение уходит из вашего приложения, с текстом заказа</td></tr>
    <tr><td>Google</td><td>Только если вы разрешите карту на странице контактов: тогда Google видит ваш IP-адрес и может поставить свои cookie. Без вашего согласия карта не загружается и Google не узнаёт ничего</td></tr>'),

  updated_at = now()
where slug_ro = 'politica-de-confidentialitate';
