#!/usr/bin/env python3
"""
Spune dacă un logo raster e desenat în alb, deci are nevoie de fundal închis.

Criteriul nu e luminanța medie — un logo galben (Goodyear) are media mare și
totuși se citește perfect pe alb, pentru că are contur întunecat. Criteriul e
CÂT din desen rămâne vizibil pe alb: procentul de pixeli opaci cu luminanță
sub 0,62. Sub 8% înseamnă că logo-ul e practic tot alb și are nevoie de placă
închisă. Pixelii transparenți nu se numără, altfel orice marjă ar strica media.

Ieșire: „light" sau „dark", plus luminanța, pe stdout.
Rulare: python3 is-light.py fisier.png
"""
import sys
from PIL import Image

im = Image.open(sys.argv[1]).convert("RGBA")
im.thumbnail((300, 300))
px = im.load()
vizibili = opaci = 0
for y in range(im.size[1]):
    for x in range(im.size[0]):
        r, g, b, a = px[x, y]
        if a > 40:
            opaci += 1
            if (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.62:
                vizibili += 1
cota = vizibili / opaci if opaci else 1
print(f"{'light' if cota < 0.08 else 'dark'} {cota:.3f}")
