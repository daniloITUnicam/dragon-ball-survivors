"""Placeholder pixel art of the map objects (v135): assets/sprites/mappa/brk*.png (breakables) and act*.png (map activities).

Every sheet is one row of equally wide frames, the object standing on the bottom of its frame. The game scales the opaque part of frame 0 to a
fixed world height (src/js/mapobj.js: BRK[...].h, MO_H), so a replacement can have any resolution and any padding, as long as:
  - the frames are all as wide (the sheet width = frames x frame width) and the count matches sprites.json "cols";
  - every frame shares the same foot line (the object stands on the bottom of frame 0, the others are drawn with the same offset).
Run:  python tools/gen_mapobj.py   (writes the placeholders; it never overwrites a file that already exists unless --force)
"""
import math, random, sys, pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT/'assets'/'sprites'/'mappa'


def new(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def hx(c, a=255):
    c = c.lstrip('#'); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


def outline(im, col):
    """1 px outline around the opaque pixels (4-neighbourhood), in place"""
    w, h = im.size; px = im.load(); o = hx(col); add = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 0: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x+dx, y+dy
                if 0 <= X < w and 0 <= Y < h and px[X, Y][3] > 0 and px[X, Y][:3] != o[:3]: add.append((x, y)); break
    for p in add: px[p] = o
    return im


def ell(d, cx, cy, rx, ry, c): d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=hx(c))


def speck(im, box, cols, n, seed, only_opaque=True):
    r = random.Random(seed); px = im.load(); x0, y0, x1, y1 = box
    for _ in range(n):
        x, y = r.randint(x0, x1), r.randint(y0, y1)
        if 0 <= x < im.width and 0 <= y < im.height and (not only_opaque or px[x, y][3] > 0): px[x, y] = hx(r.choice(cols))


def clear(im, pts):
    d = ImageDraw.Draw(im)
    for (x, y, r) in pts: d.ellipse([x-r, y-r, x+r, y+r], fill=(0, 0, 0, 0))


def row(frames):
    w, h = frames[0].size; s = new(w*len(frames), h)
    for i, f in enumerate(frames): s.paste(f, (i*w, 0))
    return s


# ---------------- breakables: intact | damaged | debris ----------------
def bush():
    W, H = 38, 32; G0, G1, G2, G3 = '#2f6e2a', '#4a9a3a', '#6cc04e', '#9be06a'
    def body(miss=()):
        im = new(W, H); d = ImageDraw.Draw(im)
        blobs = [(12, 20, 9), (26, 20, 9), (19, 14, 10), (10, 25, 7), (28, 25, 7), (19, 24, 9)]
        for i, (x, y, r) in enumerate(blobs):
            if i in miss: continue
            ell(d, x, y, r, r*.9, G1)
        for i, (x, y, r) in enumerate(blobs):
            if i in miss: continue
            ell(d, x, y+r*.45, r*.8, r*.35, G0)
            ell(d, x-r*.3, y-r*.35, r*.45, r*.35, G2)
            ell(d, x-r*.45, y-r*.5, r*.15, r*.12, G3)
        speck(im, (2, 4, W-3, H-3), [G0, G2], 70, 3)
        return im
    f0 = body(); d = ImageDraw.Draw(f0)
    for (x, y) in ((14, 16), (24, 22), (18, 26)): ell(d, x, y, 1.6, 1.6, '#d8403a')   # berries
    f1 = body(miss=(2,)); d = ImageDraw.Draw(f1)
    d.line([(19, 30), (17, 14)], fill=hx('#6a4a2a'), width=2); d.line([(18, 20), (13, 13)], fill=hx('#6a4a2a'), width=1); d.line([(19, 18), (24, 11)], fill=hx('#6a4a2a'), width=1)
    clear(f1, [(30, 16, 3), (7, 21, 2)])
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    d.line([(16, 31), (15, 25)], fill=hx('#6a4a2a'), width=2); d.line([(21, 31), (23, 26)], fill=hx('#6a4a2a'), width=2)
    for (x, y) in ((6, 29), (11, 30), (27, 29), (31, 30), (19, 29), (25, 31), (9, 27)): ell(d, x, y, 2.4, 1.4, G1); f2.putpixel((x-1, y-1), hx(G2))
    return [outline(f, '#16301a') for f in (f0, f1, f2)]


def crate(big=False):
    W, H = (46, 44) if big else (34, 32)
    L, M, D, B, B2 = ('#f4f6f8', '#dfe4ea', '#b8c0cc', '#3a7ad8', '#2a5aa8')
    def box(dmg=False):
        im = new(W, H); d = ImageDraw.Draw(im); t = 9 if big else 7; x0, x1, y1 = 3, W-4, H-1
        d.polygon([(x0+4, 2), (x1+0, 2), (x1-4+4, t), (x0, t)], fill=hx(L))           # top
        d.rectangle([x0, t, x1, y1], fill=hx(M))                                      # front
        d.rectangle([x1-5, t, x1, y1], fill=hx(D))                                    # shaded side strip
        d.line([(x0, t), (x1, t)], fill=hx(D))
        by = t+(H-t)//2-2; d.rectangle([x0, by, x1, by+3], fill=hx(B)); d.line([(x0, by+3), (x1, by+3)], fill=hx(B2))   # blue band
        cx, cy = (x0+x1)//2-2, t+5 if not big else t+7
        ell(d, cx, cy, 4 if not big else 6, 3 if not big else 5, B); ell(d, cx, cy, 2 if not big else 3, 1.5 if not big else 2.5, L)
        for bx in (x0+2, x1-3):
            for byy in (t+2, y1-2): d.point((bx, byy), fill=hx('#7a8494'))
        if big:   # hazard stripes and straps
            for i in range(x0, x1-4, 6): d.polygon([(i, y1-4), (i+3, y1-4), (i+6, y1), (i+3, y1)], fill=hx('#f0c030'))
            d.rectangle([x0+8, t, x0+10, y1], fill=hx('#5a6474')); d.rectangle([x1-12, t, x1-10, y1], fill=hx('#5a6474'))
        if dmg:
            d.line([(x0+6, t+3), (x0+11, by-1), (x0+8, by+6), (x0+13, y1-3)], fill=hx('#4a5260'), width=1)
            d.line([(x1-9, t+1), (x1-12, t+8)], fill=hx('#4a5260'), width=1)
            d.polygon([(x1-2, t-1), (x1+1, t+6), (x1-4, t+4)], fill=(0, 0, 0, 0))
            d.rectangle([x0+16, by+6, x0+22, by+9], fill=hx('#3a3f4a'))
        return im
    f0, f1 = box(), box(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2); r = random.Random(7)
    for i in range(6 if big else 4):
        x = r.randint(4, W-14); y = H-3-r.randint(0, 5); l = r.randint(8, 14)
        d.polygon([(x, y), (x+l, y-2), (x+l, y+1), (x, y+3)], fill=hx(r.choice([M, L, D])))
    d.rectangle([W//2-6, H-6, W//2+4, H-4], fill=hx(B))
    if big:
        d.polygon([(8, H-1), (W-8, H-1), (W-12, H-10), (12, H-10)], fill=hx(D)); d.rectangle([12, H-12, W-12, H-10], fill=hx('#5a6474'))
    return [outline(f, '#2a3240') for f in (f0, f1, f2)]


def barrel():
    W, H = 28, 34; R0, R1, R2 = '#8a2418', '#c8402a', '#ec6a4a'
    def body(dent=False):
        im = new(W, H); d = ImageDraw.Draw(im); x0, x1 = 4, W-5
        d.rectangle([x0, 5, x1, H-3], fill=hx(R1)); ell(d, (x0+x1)/2, H-3, (x1-x0)/2, 2.5, R1)
        d.rectangle([x0, 5, x0+3, H-3], fill=hx(R0)); d.rectangle([x1-2, 5, x1, H-3], fill=hx(R0)); d.rectangle([x0+6, 6, x0+8, H-5], fill=hx(R2))
        ell(d, (x0+x1)/2, 5, (x1-x0)/2, 3, R0); ell(d, (x0+x1)/2, 5, (x1-x0)/2-2, 1.6, '#5a1810')
        for y in (10, H-9): d.rectangle([x0, y, x1, y+1], fill=hx('#3a3a44'))
        d.rectangle([x0, 15, x1, 19], fill=hx('#f0e8e0')); ell(d, (x0+x1)/2, 17, 2, 2, R1)
        if dent:
            clear(im, [(x1+2, 24, 4)]); d.line([(x0+9, 21), (x0+12, 25), (x0+10, 28)], fill=hx('#4a1008'))
            ell(d, x0+12, 12, 1.6, 1.6, '#2a0806')
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    ell(d, 14, H-2, 12, 2.5, '#6a1a10')
    for (x, y, a) in ((4, H-5, 1), (10, H-6, -1), (17, H-4, 1), (21, H-7, -1)):
        d.polygon([(x, y), (x+5, y-1+a), (x+6, y+2+a), (x+1, y+3)], fill=hx(R1))
    d.rectangle([7, H-9, 19, H-8], fill=hx('#3a3a44'))
    return [outline(f, '#2a0c08') for f in (f0, f1, f2)]


def rock():
    W, H = 38, 30; D, M, L, LL = '#5a564e', '#8a847a', '#aaa498', '#c8c2b4'
    pts = [(3, 29), (2, 20), (7, 11), (15, 5), (25, 4), (32, 10), (36, 19), (35, 29)]
    def body(chunk=False):
        im = new(W, H); d = ImageDraw.Draw(im); d.polygon(pts, fill=hx(M))
        d.polygon([(3, 29), (4, 23), (14, 25), (26, 23), (35, 25), (35, 29)], fill=hx(D))
        d.polygon([(8, 12), (15, 6), (24, 5), (20, 11), (12, 15)], fill=hx(L)); d.line([(15, 6), (21, 6)], fill=hx(LL))
        speck(im, (2, 4, 36, 28), [D, L], 40, 11)
        d.line([(22, 5), (20, 11), (23, 16), (21, 21)], fill=hx('#3a362e'))
        if chunk:
            d.polygon([(25, 3), (37, 3), (37, 16), (31, 14), (28, 8)], fill=(0, 0, 0, 0))
            d.line([(20, 11), (13, 17), (9, 24)], fill=hx('#3a362e')); d.line([(23, 16), (30, 21)], fill=hx('#3a362e'))
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    for (x, y, r) in ((8, 26, 5), (17, 27, 4), (26, 26, 5), (32, 28, 3), (13, 29, 2), (22, 29, 3)):
        ell(d, x, y, r, r*.7, M); ell(d, x-1, y-1, r*.5, r*.3, L)
    return [outline(f, '#2a2620') for f in (f0, f1, f2)]


def amphora():
    W, H = 26, 36; D, M, L, P = '#8a4220', '#c8642e', '#e88a4a', '#2a1a12'
    def body(chip=False):
        im = new(W, H); d = ImageDraw.Draw(im)
        ell(d, 13, 23, 9, 11, M); d.rectangle([10, 5, 16, 13], fill=hx(M)); d.rectangle([8, 3, 18, 5], fill=hx(D))
        ell(d, 13, 33, 5, 2, D); ell(d, 16, 27, 5, 6, D); ell(d, 10, 20, 3, 5, L)
        d.arc([4, 7, 11, 18], 90, 270, fill=hx(D), width=2); d.arc([15, 7, 22, 18], 270, 90, fill=hx(D), width=2)
        d.rectangle([5, 21, 21, 22], fill=hx(P))
        for x in range(6, 21, 3): d.point((x, 24), fill=hx(P))
        if chip:
            d.polygon([(15, 2), (19, 2), (19, 7), (16, 6)], fill=(0, 0, 0, 0))
            d.line([(12, 14), (14, 19), (11, 25), (13, 30)], fill=hx('#3a1a0a'))
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    for (x, y, l) in ((3, 33, 6), (9, 34, 5), (15, 33, 7), (20, 34, 4)): d.polygon([(x, y), (x+l, y-2), (x+l-1, y+1), (x, y+2)], fill=hx(M))
    ell(d, 12, 31, 4, 2, D); d.rectangle([9, 29, 14, 30], fill=hx(P))
    return [outline(f, '#3a1a0a') for f in (f0, f1, f2)]


def crystal():
    W, H = 32, 40; D, M, L, LL = '#1a5a9a', '#3aa0e8', '#7ad8ff', '#e8fbff'
    def prism(d, x, base, w, h, tip=True):
        top = base-h
        d.polygon([(x-w, base), (x-w, top+w), (x, top if tip else top+w), (x+w, top+w), (x+w, base)], fill=hx(M))
        d.polygon([(x, base), (x, top if tip else top+w), (x+w, top+w), (x+w, base)], fill=hx(D))
        d.line([(x-w+1, top+w+1), (x-w+1, base-2)], fill=hx(L)); d.line([(x-1, (top if tip else top+w)+2), (x-1, base-4)], fill=hx(LL))
    def body(broken=False):
        im = new(W, H); d = ImageDraw.Draw(im)
        ell(d, 16, 37, 13, 3, '#5a564e')
        prism(d, 9, 37, 4, 16); prism(d, 23, 37, 4, 20)
        if broken: prism(d, 16, 37, 5, 15, tip=False); d.polygon([(11, 22), (14, 19), (17, 23), (21, 20), (21, 23), (11, 23)], fill=(0, 0, 0, 0))
        else: prism(d, 16, 37, 5, 34)
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    ell(d, 16, 37, 13, 3, '#5a564e')
    for (x, y, s) in ((6, 37, 3), (12, 38, 2), (20, 37, 4), (26, 38, 3)): d.polygon([(x-s, y), (x, y-s*2), (x+s, y)], fill=hx(M)); d.point((x, y-s), fill=hx(LL))
    return [outline(f, '#0a2a4a') for f in (f0, f1, f2)]


def scrap():
    W, H = 38, 30; D, M, L = '#4a525c', '#7a848e', '#a8b0b8'
    def body(dmg=False):
        im = new(W, H); d = ImageDraw.Draw(im)
        d.polygon([(2, 29), (6, 22), (14, 20), (24, 21), (34, 23), (36, 29)], fill=hx(D))
        ell(d, 17, 17, 10, 9, M); ell(d, 14, 13, 5, 4, L); d.rectangle([7, 18, 27, 21], fill=hx(D))
        ell(d, 20, 16, 2.5, 2, '#ff3a2a' if not dmg else '#6a1a14'); d.point((19, 15), fill=hx('#ffd0c0' if not dmg else '#8a2a24'))
        d.line([(27, 12), (34, 6)], fill=hx(L), width=2); ell(d, 34, 6, 2, 2, D)
        d.rectangle([28, 22, 35, 27], fill=hx(M)); d.line([(3, 26), (12, 24)], fill=hx('#c8a050'), width=2)
        for (x, y) in ((9, 25), (22, 25), (31, 25)): d.point((x, y), fill=hx(L))
        if dmg:
            clear(im, [(14, 9, 3)]); d.line([(10, 14), (16, 19), (21, 13)], fill=hx('#22262c'))
            for (x, y) in ((25, 8), (27, 10), (24, 11)): d.point((x, y), fill=hx('#ffe24d'))
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    d.polygon([(4, 29), (8, 25), (18, 24), (22, 29)], fill=hx(D)); ell(d, 27, 27, 5, 3, M); d.rectangle([12, 26, 15, 28], fill=hx(L))
    for (x, y) in ((6, 28), (31, 28), (20, 27)): ell(d, x, y, 1.4, 1.4, L)
    return [outline(f, '#1a1e24') for f in (f0, f1, f2)]


def tomb():
    W, H = 30, 38; D, M, L, MOSS = '#55555f', '#8a8a96', '#b0b0bc', '#5a8a3a'
    def stone(im, d, ang=0):
        d.rectangle([2, 32, 27, 37], fill=hx(D)); d.rectangle([3, 32, 26, 33], fill=hx(M))
        d.rectangle([6, 12, 23, 32], fill=hx(M)); d.pieslice([6, 3, 23, 22], 180, 360, fill=hx(M))
        d.rectangle([7, 12, 9, 31], fill=hx(L)); d.rectangle([20, 12, 23, 32], fill=hx(D))
        d.rectangle([13, 10, 16, 24], fill=hx(D)); d.rectangle([10, 14, 19, 16], fill=hx(D))
        speck(im, (6, 20, 23, 33), [MOSS, '#3a6a2a'], 14, 5)
    f0 = new(W, H); stone(f0, ImageDraw.Draw(f0))
    f1 = new(W, H); stone(f1, ImageDraw.Draw(f1)); d = ImageDraw.Draw(f1)
    d.line([(6, 9), (12, 17), (10, 22), (17, 28)], fill=hx('#2a2a32'), width=1); clear(f1, [(22, 6, 4)])
    f1 = f1.rotate(-6, resample=Image.NEAREST, center=(15, 37))
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    d.rectangle([2, 32, 27, 37], fill=hx(D)); d.rectangle([7, 26, 16, 31], fill=hx(M)); d.polygon([(17, 31), (26, 29), (27, 31)], fill=hx(M))
    d.pieslice([4, 24, 14, 34], 180, 360, fill=hx(L)); d.rectangle([9, 27, 11, 30], fill=hx(D))
    return [outline(f, '#22222a') for f in (f0, f1, f2)]


def lantern():
    W, H = 24, 42; D, M, L, F = '#6a6454', '#a8a08a', '#ccc4ac', '#ffcf5a'
    def body(dmg=False):
        im = new(W, H); d = ImageDraw.Draw(im)
        d.rectangle([5, 37, 18, 41], fill=hx(D)); d.rectangle([8, 24, 15, 37], fill=hx(M)); d.rectangle([8, 24, 9, 37], fill=hx(L))
        d.rectangle([6, 21, 17, 24], fill=hx(D))
        d.rectangle([7, 12, 16, 21], fill=hx(M)); d.rectangle([9, 14, 14, 19], fill=hx(F if not dmg else '#b07a2a')); d.rectangle([10, 15, 13, 18], fill=hx('#fff3b0' if not dmg else '#d09a3a'))
        roof = [(1, 12), (5, 7), (18, 7), (22, 12)]
        if dmg: roof = [(3, 11), (6, 5), (19, 7), (22, 13)]
        d.polygon(roof, fill=hx(D)); d.line([roof[1], roof[2]], fill=hx(L))
        d.rectangle([10, 3, 13, 7], fill=hx(M)); ell(d, 11.5, 3, 2, 2, L)
        if dmg: d.line([(9, 26), (12, 30), (10, 34)], fill=hx('#3a3628'))
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    d.rectangle([5, 37, 18, 41], fill=hx(D)); d.polygon([(2, 41), (6, 36), (11, 38), (9, 41)], fill=hx(M)); d.polygon([(14, 41), (17, 35), (22, 38), (21, 41)], fill=hx(D))
    d.rectangle([9, 33, 14, 37], fill=hx(M))
    return [outline(f, '#2a261a') for f in (f0, f1, f2)]


def pod():
    W, H = 30, 32; D, M, L, GL = '#2a6a1a', '#4aa02a', '#8be04a', '#e8ff7a'
    def body(cr=False):
        im = new(W, H); d = ImageDraw.Draw(im)
        ell(d, 15, 29, 14, 3, '#5a3e24'); ell(d, 15, 17, 10, 13, M); ell(d, 18, 20, 7, 10, D); ell(d, 11, 11, 4, 6, L)
        for (a, b) in (((15, 5), (13, 28)), ((9, 9), (8, 26)), ((21, 9), (22, 26))): d.line([a, b], fill=hx(D))
        ell(d, 15, 29, 14, 2.4, '#7a5a3a'); d.rectangle([3, 29, 27, 31], fill=hx('#5a3e24'))
        if cr:
            d.line([(11, 6), (14, 12), (12, 17), (16, 22)], fill=hx(GL), width=1); d.line([(19, 10), (17, 15)], fill=hx(GL)); d.line([(8, 18), (11, 20)], fill=hx(GL))
        return im
    f0, f1 = body(), body(True)
    f2 = new(W, H); d = ImageDraw.Draw(f2)
    ell(d, 15, 29, 14, 3, '#5a3e24'); ell(d, 15, 27, 6, 2, '#9ad04a')
    d.pieslice([2, 16, 14, 32], 180, 300, fill=hx(M)); d.pieslice([16, 16, 28, 32], 240, 360, fill=hx(D))
    d.rectangle([3, 29, 27, 31], fill=hx('#5a3e24'))
    return [outline(f, '#10300a') for f in (f0, f1, f2)]


# ---------------- activities ----------------
def chute():
    W, H = 60, 46; Wt, B, Bd = '#f4f6f8', '#3a7ad8', '#2a5aa8'
    f0 = new(W, H); d = ImageDraw.Draw(f0)
    d.pieslice([2, 2, W-3, 34], 180, 360, fill=hx(Wt))
    for i, a in enumerate(range(180, 360, 30)):
        if i % 2: d.pieslice([2, 2, W-3, 34], a, a+30, fill=hx(B))
    d.chord([2, 14, W-3, 22], 0, 180, fill=hx(Bd))
    for x in (4, 14, 24, 35, 45, W-5): d.line([(x, 18), (W//2, H-1)], fill=hx('#5a6474'))
    f1 = new(W, H); d = ImageDraw.Draw(f1)
    d.polygon([(4, H-1), (10, H-6), (18, H-4), (26, H-8), (36, H-5), (46, H-8), (55, H-3), (56, H-1)], fill=hx(Wt))
    d.polygon([(18, H-4), (26, H-8), (30, H-1), (20, H-1)], fill=hx(B)); d.polygon([(36, H-5), (46, H-8), (48, H-1), (40, H-1)], fill=hx(B))
    return [outline(f, '#1a2a44') for f in (f0, f1)]


def nest():
    W, H = 84, 36
    im = new(W, H); d = ImageDraw.Draw(im)
    ell(d, 42, 20, 40, 14, '#4a3420'); ell(d, 42, 19, 34, 11, '#6a4a2c'); ell(d, 42, 18, 26, 7, '#3a2814')
    for (x, y) in ((14, 18), (70, 20), (30, 30), (56, 30), (40, 9)): ell(d, x, y, 3, 2, '#8a6a42')
    for (a, b) in (((20, 22), (30, 26)), ((60, 14), (68, 18)), ((46, 26), (52, 31))): d.line([a, b], fill=hx('#2a1a0c'))
    for (x, y) in ((24, 16), (58, 24), (44, 12)): ell(d, x, y, 2.4, 1.4, '#8be04a')
    return [outline(im, '#20140a')]


def nimbus():
    W, H = 56, 28; fr = []
    for k in range(4):
        im = new(W, H); d = ImageDraw.Draw(im); ph = k*math.pi/2
        bl = [(14, 16, 9), (26, 12, 11), (39, 14, 10), (48, 18, 7), (8, 20, 6), (30, 19, 10)]
        for i, (x, y, r) in enumerate(bl):
            r2 = r+0.9*math.sin(ph+i); ell(d, x, y, r2, r2*.8, '#f0b030')
        for i, (x, y, r) in enumerate(bl):
            r2 = r+0.9*math.sin(ph+i); ell(d, x, y-r2*.25, r2*.8, r2*.55, '#ffd84a'); ell(d, x-r2*.3, y-r2*.45, r2*.35, r2*.22, '#fff3b0')
        d.rectangle([4, 23, 52, 27], fill=(0, 0, 0, 0)); ell(d, 28, 22, 22, 3, '#d8901a')
        fr.append(outline(im, '#7a4a0a'))
    return fr


def senzu():
    W, H = 42, 52; fr = []
    for n in (3, 2, 1, 0):
        im = new(W, H); d = ImageDraw.Draw(im); wither = n == 0
        G1, G2, G3 = ('#7a8a3a', '#9aa04a', '#c8b86a') if wither else ('#2f7a2a', '#4aa83a', '#7ad04e')
        ell(d, 21, 50, 10, 2, '#5a3e24'); d.rectangle([19, 30, 23, 50], fill=hx('#7a5230')); d.rectangle([19, 30, 20, 50], fill=hx('#9a6a40'))
        d.line([(21, 36), (13, 28)], fill=hx('#7a5230'), width=2); d.line([(22, 33), (30, 26)], fill=hx('#7a5230'), width=2)
        crown = [(21, 16, 14), (11, 22, 9), (31, 22, 9), (21, 26, 11)]
        if wither: crown = [(21, 20, 11), (12, 26, 7), (30, 26, 7)]
        for (x, y, r) in crown: ell(d, x, y, r, r*.8, G1)
        for (x, y, r) in crown: ell(d, x-r*.2, y-r*.25, r*.7, r*.5, G2); ell(d, x-r*.4, y-r*.45, r*.3, r*.2, G3)
        for (x, y) in ((13, 31), (21, 34), (29, 31))[:n]:
            d.line([(x, y-5), (x, y-2)], fill=hx('#2a5a1a')); ell(d, x, y, 2.6, 3.6, '#5aa02a'); ell(d, x-1, y-1, 1, 1.6, '#c8f08a')
        if wither:
            for (x, y) in ((8, 44), (32, 47), (27, 49)): ell(d, x, y, 2.4, 1.2, G2)
        fr.append(outline(im, '#12300c'))
    return fr


def gravity():
    W, H = 54, 58; fr = []
    for on in (0, 1):
        im = new(W, H); d = ImageDraw.Draw(im)
        for x in (10, 44): d.polygon([(x-3, 50), (x+3, 50), (x+5, 57), (x-5, 57)], fill=hx('#7a8494'))
        d.rectangle([8, 44, 46, 50], fill=hx('#b8c0cc'))
        d.pieslice([4, 6, 50, 58], 180, 360, fill=hx('#eef2f6')); d.rectangle([4, 32, 50, 46], fill=hx('#dfe4ea'))
        d.pieslice([10, 10, 30, 40], 200, 270, fill=hx('#ffffff'))
        d.rectangle([4, 30, 50, 33], fill=hx('#3a7ad8'))
        for x in (10, 20, 34, 44): ell(d, x, 24 if x in (20, 34) else 27, 3.2, 3.2, '#ff5a4a' if on else '#2a3240')
        d.rectangle([22, 35, 32, 46], fill=hx('#9aa4b4')); d.line([(27, 35), (27, 46)], fill=hx('#6a7484'))
        d.rectangle([25, 2, 29, 7], fill=hx('#7a8494')); ell(d, 27, 2, 2.5, 2.5, '#ff3a2a' if on else '#6a1a14')
        fr.append(outline(im, '#1a2232'))
    return fr


def scouter():
    W, H = 28, 16; fr = []
    for k in (0, 1):
        im = new(W, H); d = ImageDraw.Draw(im)
        ell(d, 8, 10, 6, 4, '#6a7484'); ell(d, 8, 9, 4, 2.5, '#9aa4b4'); d.rectangle([12, 8, 20, 10], fill=hx('#6a7484'))
        d.polygon([(17, 3), (26, 5), (26, 12), (17, 13)], fill=hx('#2ac85a' if k else '#1a9a3a'))
        d.line([(19, 5), (24, 6)], fill=hx('#c8ffd8' if k else '#5ae08a'))
        if k: d.point((22, 8), fill=hx('#ffffff'))
        fr.append(outline(im, '#12201a'))
    return fr


def dig():
    W, H = 42, 24
    f0 = new(W, H); d = ImageDraw.Draw(f0)
    ell(d, 21, 16, 19, 7, '#6a4a2c'); ell(d, 21, 13, 14, 6, '#8a6a42'); ell(d, 17, 11, 6, 3, '#a8885a')
    d.line([(14, 9), (28, 17)], fill=hx('#e83a2a'), width=3); d.line([(28, 9), (14, 17)], fill=hx('#e83a2a'), width=3)
    f1 = new(W, H); d = ImageDraw.Draw(f1)
    ell(d, 21, 16, 19, 7, '#6a4a2c'); ell(d, 21, 15, 12, 5, '#1a120a'); ell(d, 21, 16, 9, 3, '#0a0604')
    for (x, y) in ((5, 14), (37, 15), (12, 21), (31, 21)): ell(d, x, y, 3.4, 2.2, '#8a6a42')
    return [outline(f, '#20140a') for f in (f0, f1)]


SHEETS = {
    'brkbush': bush, 'brkcrate': crate, 'brkbarrel': barrel, 'brkrock': rock, 'brkamphora': amphora, 'brkcrystal': crystal, 'brkscrap': scrap,
    'brktomb': tomb, 'brklantern': lantern, 'brkpod': pod, 'brksupply': lambda: crate(True),
    'actchute': chute, 'actnest': nest, 'actnimbus': nimbus, 'actsenzu': senzu, 'actgravity': gravity, 'actscouter': scouter, 'actdig': dig,
}

if __name__ == '__main__':
    force = '--force' in sys.argv; OUT.mkdir(parents=True, exist_ok=True); cols = {}
    for sid, fn in SHEETS.items():
        fr = fn(); cols[sid] = len(fr); f = OUT/(sid + '.png')
        if f.exists() and not force: print('kept', f.name); continue
        row(fr).save(f, optimize=True); print('wrote', f.name, len(fr), 'frames', fr[0].size)
    print('sprites.json cols:', cols)
