#!/usr/bin/env python3
"""Builds src/css/skin.css from tools/skin.tpl.css.

The template is plain CSS plus two kinds of placeholders:
  @@NAME@@   -> a generated SVG as a data URI (lightning, flames, mountains, crack texture, chevrons, padlock, tribal pattern)
  cham(N)    -> clip-path polygon with chamfered corners of N
  12u        -> calc(12*var(--u)), one "design pixel" of the end-of-stage mock-up (1024x572), so the whole screen scales like the picture.
Run:  python3 tools/gen_skin.py
"""
import base64, math, random, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def uri(svg):
    return 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode('utf8')).decode('ascii')


def pts(p):
    return ' '.join('%d,%d' % (x, y) for x, y in p)


# ---------------------------------------------------------------- lightning
def bolt(rng, x0, y0, x1, y1, seg, jit, branch=2):
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    p = [(x0, y0)]
    for i in range(1, seg):
        t = i / seg
        o = rng.uniform(-jit, jit)
        p.append((x0 + dx * t + nx * o, y0 + dy * t + ny * o))
    p.append((x1, y1))
    out = [p]
    for _ in range(branch):
        i = rng.randint(2, max(2, len(p) - 3))
        bx, by = p[i]
        a = math.atan2(dy, dx) + rng.choice([-1, 1]) * rng.uniform(.5, 1.0)
        l = L * rng.uniform(.14, .26)
        out.append(bolt(rng, bx, by, bx + math.cos(a) * l, by + math.sin(a) * l, 4, jit * .6, 0)[0])
    return out


def lightning():
    rng = random.Random(7)
    lines = []
    for a in [(108, -10, 196, 590, 15, 24, 3), (-10, 150, 70, 440, 9, 20, 2), (1034, 30, 884, 360, 10, 22, 2),
              (560, 590, 905, 420, 9, 22, 2), (905, 420, 1040, 330, 5, 14, 1), (20, 470, 120, 600, 5, 14, 1)]:
        lines += bolt(rng, *a[:6], branch=a[6])
    g = ''.join('<polyline points="%s" fill="none" stroke="#58c0ff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" opacity=".6"/>' % pts(p) for p in lines)
    c = ''.join('<polyline points="%s" fill="none" stroke="#f2fbff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' % pts(p) for p in lines)
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 572" preserveAspectRatio="xMidYMid slice"><defs><filter id="b"><feGaussianBlur stdDeviation="3.5"/></filter></defs><g filter="url(#b)">%s</g>%s</svg>' % (g, c))


# ------------------------------------------------------------------- flames
def flames(mirror):
    W, H = 330, 232
    rng = random.Random(11)
    # (centre x, half width, height, lean)
    tongues = [(22, 26, 128, 46), (58, 30, 186, 78), (96, 32, 224, 96), (138, 30, 190, 84), (180, 28, 150, 70), (220, 24, 112, 58), (262, 22, 76, 44),
               (40, 20, 92, 30), (78, 20, 140, 54), (118, 20, 120, 40), (160, 18, 96, 44), (200, 18, 70, 34), (240, 16, 52, 26), (300, 18, 40, 30)]
    tongues.sort(key=lambda t: -t[2])
    def tongue(cx, hw, ht, lean, k):
        hw *= k; ht *= k; lean *= k
        return ('M%.1f %d C%.1f %.1f %.1f %.1f %.1f %.1f C%.1f %.1f %.1f %.1f %.1f %d Z' % (
            cx - hw, H, cx - hw * 1.1, H - ht * .30, cx - hw * .2 + lean * .15, H - ht * .70, cx + lean, H - ht,
            cx + lean * .55 + hw * .1, H - ht * .45, cx + hw * 1.1, H - ht * .22, cx + hw, H))
    s = ''
    for cx, hw, ht, ln in tongues:
        s += '<path d="%s" fill="url(#o)" stroke="#9c2a05" stroke-width="2.5" stroke-linejoin="round"/>' % tongue(cx, hw, ht, ln, 1)
        s += '<path d="%s" fill="url(#m)"/>' % tongue(cx + 2, hw, ht, ln * .9, .72)
        s += '<path d="%s" fill="#fff0a2"/>' % tongue(cx + 3, hw, ht, ln * .8, .42)
    tr = ' transform="translate(%d 0) scale(-1 1)"' % W if mirror else ''
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"><defs>'
               '<linearGradient id="o" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d6360a"/><stop offset=".5" stop-color="#ff7a14"/><stop offset="1" stop-color="#ffb02a"/></linearGradient>'
               '<linearGradient id="m" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8a1c"/><stop offset=".6" stop-color="#ffc23a"/><stop offset="1" stop-color="#ffe46a"/></linearGradient>'
               '</defs><g%s>%s</g></svg>' % (W, H, tr, s))


# ----------------------------------------------------------------- mountains
def mountains():
    rng = random.Random(5)
    back = 'M0 220V96L70 70 130 98 210 44 290 92 370 58 450 104 540 50 620 96 700 40 790 90 880 56 960 98 1024 70V220Z'
    front = 'M0 220V138L110 112 210 146 330 106 460 150 580 112 700 152 830 118 940 148 1024 124V220Z'
    cr = ''
    for _ in range(14):
        x, y = rng.uniform(0, 1000), rng.uniform(110, 200)
        p = [(x, y)]
        for _ in range(4):
            x += rng.uniform(-26, 26); y += rng.uniform(6, 20)
            p.append((x, y))
        cr += '<polyline points="%s" fill="none" stroke="#1c1020" stroke-width="2" opacity=".35"/>' % pts(p)
    rays = ''
    for k in range(-9, 10):
        xb = 512 + k * 118
        rays += '<polygon points="%d,-300 %d,220 %d,220" fill="#ffcf4a" opacity=".62"/>' % (512 + k * 6, xb - 30, xb + 30)
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 220" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a08aa2"/><stop offset="1" stop-color="#4c3a50"/></linearGradient></defs>'
               '<path d="%s" fill="#82708a"/><path d="%s" fill="url(#g)"/>%s%s</svg>' % (back, front, cr, rays))


# ------------------------------------------------------------- button cracks
def cracks():
    rng = random.Random(21)
    s = ''
    for _ in range(5):
        x, y = rng.uniform(0, 200), rng.uniform(0, 60)
        p = [(x, y)]
        for _ in range(rng.randint(3, 6)):
            x += rng.uniform(-14, 14); y += rng.uniform(-9, 9)
            p.append((x, y))
        s += '<polyline points="%s" fill="none" stroke="#120400" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".5"/>' % pts(p)
    for _ in range(0):
        s += '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#000" opacity=".16"/>' % (rng.uniform(0, 200), rng.uniform(0, 60), rng.uniform(.4, 1.1))
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" preserveAspectRatio="none">%s</svg>' % s)


# --------------------------------------------------------------------- icons
CHEVRON = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 48"><defs><filter id="b"><feGaussianBlur stdDeviation="2.2"/></filter></defs>'
              '<g filter="url(#b)" fill="#ffe08a"><polygon points="3,4 17,4 31,24 17,44 3,44 17,24"/><polygon points="17,4 31,4 45,24 31,44 17,44 31,24"/></g>'
              '<g fill="#fff3cc" stroke="#e8a030" stroke-width="1.4" stroke-linejoin="round"><polygon points="3,4 17,4 31,24 17,44 3,44 17,24"/><polygon points="17,4 31,4 45,24 31,44 17,44 31,24"/></g></svg>')
PADLOCK = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 46"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe35a"/><stop offset="1" stop-color="#e49a0c"/></linearGradient></defs>'
              '<path d="M10 20V13a10 10 0 0 1 20 0v7" fill="none" stroke="#5a3604" stroke-width="8" stroke-linecap="round"/>'
              '<path d="M10 20V13a10 10 0 0 1 20 0v7" fill="none" stroke="#f0b81c" stroke-width="4.6" stroke-linecap="round"/>'
              '<rect x="3" y="19" width="34" height="25" rx="5" fill="url(#g)" stroke="#5a3604" stroke-width="2.6"/>'
              '<circle cx="20" cy="29" r="3.6" fill="#4a2a04"/><rect x="18.3" y="30" width="3.4" height="8" rx="1.4" fill="#4a2a04"/></svg>')
TRIBAL = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 130"><g fill="#a24f1c" opacity=".8">'
             '<path d="M14 104C62 100 100 66 150 58 192 52 222 32 254 6 242 40 216 66 180 78 142 90 98 96 58 112Z"/>'
             '<path d="M62 120C108 114 150 98 192 102 218 104 238 96 256 84 240 110 208 124 170 126 132 128 98 126 62 120Z"/>'
             '<path d="M92 60C74 42 92 18 124 22 104 32 102 46 118 54 110 54 100 56 92 60ZM138 58C150 40 176 34 204 40 182 44 168 54 162 66ZM30 86C44 70 66 66 90 72 70 76 54 82 46 96Z"/>'
             '<circle cx="132" cy="88" r="9" fill="none" stroke="#a24f1c" stroke-width="5"/>'
             '</g></svg>')
SPEED = uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" preserveAspectRatio="none"><g fill="#9b5a26">'
            + ''.join('<rect x="0" y="%d" width="40" height="1.6" opacity="%.2f"/>' % (i * 2.5, .9 - i * .08) for i in range(8)) + '</g></svg>')


# ------------------------------------------------- pixel flames / small bolts (character screen)
def pixflames(mirror):
    W, H, P = 130, 572, 6
    rng = random.Random(31 if not mirror else 47)
    paths = {c: [] for c in ('#c42a08', '#ff7a14', '#ffc42a', '#fff0a0')}
    # (centre x, base y, height, half width, lean)
    clusters = [(40, 372, 300, 44, 26), (70, 372, 170, 24, -8), (36, 572, 210, 42, 22), (74, 572, 120, 22, 14), (44, 480, 130, 26, 16)]
    cols = [('#c42a08', 1.0), ('#ff7a14', .8), ('#ffc42a', .56), ('#fff0a0', .3)]
    for cx, yb, ht, hw, lean in clusters:
        for col, k in cols:
            y = yb
            while y > yb - ht:
                t = (yb - y) / ht
                w = hw * k * (1 - t ** 1.5) + rng.uniform(-3, 3) * (1 - t)
                if w > 2:
                    c = cx + lean * t ** 1.4 + math.sin(t * 9 + cx) * 4 * t
                    x0 = round((c - w) / P) * P
                    x1 = round((c + w) / P) * P
                    if x1 > x0:
                        paths[col].append('M%d %dh%dv%dh-%dz' % (x0, y - P, x1 - x0, P, x1 - x0))
                y -= P
    s = ''.join('<path fill="%s" d="%s"/>' % (c, ''.join(d)) for c, d in paths.items())
    tr = ' transform="translate(%d 0) scale(-1 1)"' % W if mirror else ''
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" shape-rendering="crispEdges"><g%s>%s</g></svg>' % (W, H, tr, s))


def bolts2():
    rng = random.Random(3)
    lines = []
    for a in [(700, 150, 690, 90, 5, 9, 1), (885, 10, 860, 110, 6, 10, 1), (990, 280, 975, 360, 5, 9, 1), (60, 300, 20, 400, 4, 8, 0)]:
        lines += bolt(rng, *a[:6], branch=a[6])
    g = ''.join('<polyline points="%s" fill="none" stroke="#7ad4ff" stroke-width="6" stroke-linejoin="round" opacity=".55"/>' % pts(p) for p in lines)
    c = ''.join('<polyline points="%s" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"/>' % pts(p) for p in lines)
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 572" preserveAspectRatio="xMidYMid slice"><defs><filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs><g filter="url(#b)">%s</g>%s</svg>' % (g, c))

ASSETS = {'LIGHT': lightning(), 'FLAMEL': flames(False), 'FLAMER': flames(True), 'MOUNT': mountains(), 'CRACK': cracks(),
          'PIXL': pixflames(False), 'PIXR': pixflames(True), 'BOLTS2': bolts2(), 'CHEVRON': CHEVRON, 'PADLOCK': PADLOCK, 'TRIBAL': TRIBAL, 'SPEED': SPEED}


def build():
    t = (ROOT / 'tools/skin.tpl.css').read_text(encoding='utf8')
    t = re.sub(r'cham\(([^)]+)\)', lambda m: 'polygon({0} 0,calc(100% - {0}) 0,100% {0},100% calc(100% - {0}),calc(100% - {0}) 100%,{0} 100%,0 calc(100% - {0}),0 {0})'.format(m.group(1)), t)
    t = re.sub(r'(?<![\w.#-])(-?\d+(?:\.\d+)?)u\b', lambda m: 'calc(%s*var(--u))' % m.group(1), t)
    t = re.sub(r'@@(\w+)@@', lambda m: ASSETS[m.group(1)], t)
    (ROOT / 'src/css/skin.css').write_text(t, encoding='utf8')
    print('skin.css written (%d KB)' % (len(t) // 1024))


if __name__ == '__main__':
    build()
