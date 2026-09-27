/*
 * AL DOILEA NUMĂR DE TELEFON.
 *
 * Atelierul are două linii. Al doilea număr apare unde clientul caută date de
 * contact — subsol, pagina de contact, datele structurate pentru Google — nu și
 * pe butoanele de apel: un buton are o singură acțiune, iar două butoane mari
 * pe fiecare fișă de produs ar încurca, nu ar ajuta.
 *
 * Ambele coloane sunt opționale. Gol înseamnă „o singură linie", iar afișarea
 * dispare de la sine, fără nicio altă schimbare.
 */
alter table settings add column if not exists phone2_display text;
alter table settings add column if not exists phone2_e164    text;

comment on column settings.phone2_display is
  'Al doilea numar, cum se scrie pentru om: „060 711 101". Gol = o singura linie.';
comment on column settings.phone2_e164 is
  'Acelasi numar in format international, pentru link-ul tel: si pentru Google.';

update settings
set phone2_display = '060 711 101',
    phone2_e164    = '+37360711101',
    updated_at     = now()
where id = true;
