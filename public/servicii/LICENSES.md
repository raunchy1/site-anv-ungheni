# Fotografiile din secțiunea Servicii — sursă și licență

Toate imaginile din `/public/servicii/` vin de pe Wikimedia Commons și sunt
folosite în condițiile licenței lor. Nicio imagine nu e stoc cumpărat, generată
sau preluată de pe agregatoare cu licențiere neclară.

Atribuirea apare **și pe site**, sub fiecare fotografie (`SectiuneServiciu.tsx`,
`<figcaption>`), pentru că licențele CC BY și CC BY-SA o cer lângă imagine, nu
într-o pagină de credite ascunsă. Fișierul de față e evidența, nu atribuirea.

Prelucrare aplicată tuturor: decupare la raport 3:2 și redimensionare la
1200×800 px, recompresie JPEG. Nimic altceva — fără colaje, fără text adăugat,
fără modificări care ar schimba sensul imaginii.

| # | Serviciu | Fișier | Autor | Licență | Pagina originalului |
|---|----------|--------|-------|---------|---------------------|
| 01 | Service roți și vulcanizare | `service-roti.jpg` | Flippin504 | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Tire_Changer.jpg |
| 02 | Umflare cu azot | `azot.jpg` | U.S. Air Force, Airman Frank Snider | Domeniu public (operă a guvernului SUA) | https://commons.wikimedia.org/wiki/File:Tire_pressure_gauge.jpg |
| 03 | Valve și capace | `valve.jpg` | Andrew Pertsev | CC0 | https://commons.wikimedia.org/wiki/File:Tire_Valve_Stem.jpg |
| 04 | Petice și reparații anvelope | `reparatii.jpg` | Björn Appel | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Puncture-repaire-kit.jpg |
| 05 | Senzori de presiune (TPMS) | `tpms.jpg` | TpmsReset | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Tire_pressure_sensor_in_tire.jpg |
| 06 | Reparație și vopsire jante | `jante.jpg` | Envy fstop | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Disc_brakes.jpg |
| 07 | Aer condiționat auto | `clima.jpg` | Werkstattausstattung | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Klimaservicegerät.jpg |
| 08 | Sistem de frânare | `frane.jpg` | User Ballista on en.wikipedia | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Rear_disc_brake_unit.JPG |
| 09 | Hotel anvelope | `hotel-anvelope.jpg` | SAgbley | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Car_Tyres.jpg |
| 10 | Vânzare anvelope | `vanzare.jpg` | Visitor7 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Inside_a_Tire_Shop.jpg |

## Obligații care rămân

- **CC BY-SA** (04, 05, 06, 07, 08, 09, 10): dacă imaginea e modificată dincolo
  de decupare/redimensionare și republicată separat, versiunea modificată se
  distribuie sub aceeași licență.
- **CC BY** (01): atribuire obligatorie, fără obligație de share-alike.
- **CC0 / domeniu public** (02, 03): fără obligații; atribuirea rămâne pe site
  din onestitate, nu din constrângere.
- Dacă se înlocuiește o fotografie, se actualizează **și** `src/content/servicii.ts`
  (câmpul `foto`), **și** tabelul de aici. Atribuirea de pe site se generează din
  primul, deci ele nu au voie să se despartă.
