#!/usr/bin/env python3
"""
Curăță un PNG de logo: fundal alb sau negru -> transparent, apoi decupare la
conținut.

De ce e nevoie: jumătate din logo-urile care circulă vin pe pătrat alb. Pe cardul
de produs, placa din spatele logo-ului e deschisă, deci albul nu se vede — dar în
tema întunecată apare ca un dreptunghi decupat. Un logo negru pe transparent are
problema simetrică. Nu redesenăm nimic: doar scoatem fundalul uniform și tăiem
marginea goală.

Reguli conservatoare, ca să nu stricăm logo-uri legitime:
  - fundalul se scoate DOAR dacă cele patru colțuri au aceeași culoare,
    aproape uniformă (toleranță 12/255);
  - se scot doar alb (>= 243) și negru (<= 12); orice altă culoare de fundal
    e probabil parte din logo și se lasă în pace;
  - dacă imaginea are deja transparență pe margini, se face doar decuparea.

Rulare: python3 normalize-png.py intrare.png iesire.png
Iese cu 0 și scrie ce a făcut pe stdout; 1 doar la eroare reală.
"""
import sys
from PIL import Image

TOL = 12
NEAR_WHITE = 243
NEAR_BLACK = 12


def corners(px, w, h):
    return [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]


def close(a, b, tol=TOL):
    return all(abs(x - y) <= tol for x, y in zip(a[:3], b[:3]))


def main(src, dst):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    actions = []

    c = corners(px, w, h)
    opaque_corners = [p for p in c if p[3] > 8]

    if opaque_corners and all(close(p, opaque_corners[0]) for p in opaque_corners):
        r, g, b, _ = opaque_corners[0]
        is_white = min(r, g, b) >= NEAR_WHITE
        is_black = max(r, g, b) <= NEAR_BLACK
        if is_white or is_black:
            base = (r, g, b)
            out = im.copy()
            opx = out.load()
            for y in range(h):
                for x in range(w):
                    p = opx[x, y]
                    if p[3] > 0 and close(p, base):
                        opx[x, y] = (p[0], p[1], p[2], 0)
            im = out
            actions.append("fundal " + ("alb" if is_white else "negru") + " -> transparent")

    bbox = im.getbbox()
    if bbox and bbox != (0, 0, w, h):
        im = im.crop(bbox)
        actions.append(f"decupat {w}x{h} -> {im.size[0]}x{im.size[1]}")

    im.save(dst, "PNG", optimize=True)
    print("; ".join(actions) if actions else "nimic de curățat")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("folosire: normalize-png.py intrare.png iesire.png", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
