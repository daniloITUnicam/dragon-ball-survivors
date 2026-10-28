"""Snake Way islands (v112): the 2x island sprites, the cut-outs of what stands on them and their footprints.

  python3 tools/gen_isles.py         (needs opencv-python, numpy, Pillow)

Reads   assets/sprites/_sorgenti/isole/<kind>.webp   the painted islands at 1x (full colour, transparent around)
Writes  assets/sprites/props/isle<kind>.webp          the island, 2x: _sorgenti/isole/<kind>_x2.webp when there (Real-ESRGAN, tools/esrgan_np.py),
                                                      otherwise JPEG noise removed (non-local means), Lanczos, unsharp mask
        assets/sprites/props/isleo<kind>.webp         atlas of the cut-outs of the buildings / trees / rocks (2x, alpha = their outline)
        src/js/isle_obj.js                            ISLE_OBJ: per kind, every structure's picture box, atlas rect and footprints

A structure (A below, in px of the 1x sprite with its 2 px border = the ISLE_GEO coordinates): b = box of its picture, f = footprint shapes on the
ground, E(cx,cy,rx,ry) ellipse / R(x0,y0,x1,y1) box / P((x,y),...) polygon; each becomes a convex polygon that nobody walks through. Its outline is
cut by GrabCut inside b (the footprint is sure foreground, everything in front of the footprint is background); g = boxes forced in, x = boxes
forced out (the passage under the Grand Kai gate).
"""
import math, json, pathlib, cv2, numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT/'assets/sprites/_sorgenti/isole', ROOT/'assets/sprites/props'
KINDS = ['kingkai','kami','kame','korin','capsule','grandkai','shrine','nimbus','temple']
SC, PAD = 2, 2
FADE = {'capsule':[0,.16],'grandkai':[.06,.16],'shrine':[0,.16],'temple':[.05,.16]}   # = SnakeArt.FADE
E = lambda cx,cy,rx,ry: ('e',cx,cy,rx,ry)
R = lambda x0,y0,x1,y1: ('r',x0,y0,x1,y1)
P = lambda *pts: ('p',pts)
def RING(cx, cy, rx, ry, h, gx0, gx1, n=32):
    """the wall of a round dais whose top is the ellipse (cx,cy,rx,ry), h px tall: n quads around the top's edge (inside it by 4 px, outside by 8;
    the front ones reach down to the foot of the wall), none where the front of the edge lies between gx0 and gx1 (the stairs)"""
    out = []
    for i in range(n):
        a0, a1 = 2*math.pi*i/n, 2*math.pi*(i+1)/n
        if math.sin((a0+a1)/2) > 0 and gx0 <= cx+rx*math.cos((a0+a1)/2) <= gx1: continue
        q = []
        for a in (a0, a1):
            sn = math.sin(a); q.append((cx+(rx-4)*math.cos(a), cy+(ry-3)*sn))
            q.append((cx+(rx+8)*math.cos(a), cy+(ry+12)*sn if sn < 0 else cy+(ry+3)*sn+h*min(1, sn/.25)))
        out.append(('p', q))
    return out
A={
'kame':[
 dict(n='house',b=[218,72,424,280],g=[R(340,86,362,118)],f=[P((222,232),(290,276),(360,262),(422,256),(416,215),(340,180),(285,165))]),
 dict(n='palm',b=[135,48,242,212],x=[R(207,120,242,215),R(135,130,185,215)],f=[E(200,206,9,5)]),
 dict(n='palm',b=[355,2,462,178],x=[R(411,92,462,178)],f=[E(400,170,8,4)]),
 dict(n='palm',b=[408,92,492,226],x=[R(405,158,427,228),R(444,160,492,228)],f=[E(433,222,8,4)]),
 dict(n='umbrella',b=[134,232,210,318],f=[E(190,305,6,3)]),
 dict(n='umbrella',b=[492,162,570,236],f=[E(520,232,6,3)]),
 dict(n='crate',b=[236,290,293,343],f=[R(240,312,290,340)]),
 dict(n='crate',b=[423,333,473,383],f=[R(426,356,470,380)]),
],
'kingkai':[
 dict(n='dome',b=[226,108,380,266],f=[E(297,230,68,28)]),
 dict(n='car',b=[110,208,183,260],f=[R(113,234,180,256)]),
 dict(n='tree',b=[415,130,487,216],f=[E(452,206,10,5)]),
 dict(n='tree',b=[457,220,512,292],f=[E(484,284,9,4)]),
 dict(n='tree',b=[339,58,371,110],f=[E(357,104,7,3)]),
 dict(n='tree',b=[183,292,223,352],f=[E(203,345,8,4)]),
 dict(n='bush',b=[184,90,245,127],f=[E(214,115,28,9)]),
 dict(n='bush',b=[359,308,429,349],f=[E(394,338,33,9)]),
 dict(n='stone',b=[229,354,270,376],f=[R(231,362,268,374)]),
],
'kami':[
 dict(n='palace',b=[236,4,507,287],f=[P((238,170),(300,110),(445,110),(505,170),(505,240),(445,284),(302,284),(238,240))]),
 dict(n='palm',b=[132,88,226,268],f=[E(178,258,12,5)]),
 dict(n='palm',b=[521,88,616,268],f=[E(562,258,12,5)]),
 dict(n='palm',b=[254,300,289,338],f=[E(270,333,6,3)]),
 dict(n='palm',b=[289,310,321,342],f=[E(305,337,6,3)]),
 dict(n='palm',b=[424,310,456,347],f=[E(440,342,6,3)]),
 dict(n='palm',b=[456,300,494,338],f=[E(475,333,6,3)]),
],
'korin':[
 dict(n='temple',b=[211,4,561,308],f=[P((213,175),(260,110),(500,110),(560,175),(560,248),(490,258),(440,302),(345,302),(300,258),(213,248))]),
 dict(n='jar',b=[288,262,324,316],f=[E(306,306,16,7)]),
 dict(n='jar',b=[464,262,501,316],f=[E(482,306,16,7)]),
],
'capsule':[
 dict(n='dome',b=[171,2,591,392],g=[R(377,3,388,75)],f=[E(382,258,208,102),R(340,330,422,390)]),
 dict(n='pod',b=[126,276,239,357],f=[E(185,338,55,16)]),
 dict(n='pod',b=[524,279,586,341],f=[E(555,330,30,10)]),
 dict(n='tower',b=[574,26,651,217],f=[E(607,210,22,8)]),
 dict(n='dish',b=[439,7,477,59],f=[E(455,55,6,3)]),
 dict(n='antenna',b=[214,40,237,128],f=[E(226,124,8,3)]),
 dict(n='tree',b=[121,189,189,272],f=[E(155,258,14,6)]),
 dict(n='tree',b=[239,334,304,392],f=[E(271,383,14,6)]),
 dict(n='tree',b=[461,317,516,395],f=[E(487,385,14,6)]),
 dict(n='bush',b=[594,249,624,292],f=[E(608,286,12,5)]),
 dict(n='aircar',b=[489,366,591,442],f=[E(540,420,48,16)]),
],
'grandkai':[
 dict(n='hall',b=[209,24,559,278],f=[P((220,150),(550,150),(550,222),(470,240),(418,276),(350,276),(300,240),(220,222))]),
 dict(n='gate',b=[294,274,474,446],x=[R(362,376,408,446)],f=[P((300,350),(360,340),(360,446),(300,446)),P((410,340),(470,350),(470,446),(410,446))]),
 dict(n='wall',b=[109,350,362,412],f=[R(110,385,362,412)]),
 dict(n='wall',b=[410,350,671,412],f=[R(410,385,670,412)]),
 dict(n='pavilion',b=[111,208,203,362],f=[R(116,320,200,356)]),
 dict(n='pavilion',b=[579,208,671,362],f=[R(582,320,668,356)]),
 dict(n='tree',b=[10,58,194,238],f=[E(75,228,18,7)]),
 dict(n='tree',b=[100,100,194,238],f=[E(125,203,14,6)]),
 dict(n='tree',b=[19,234,104,367],f=[E(60,357,14,6)]),
 dict(n='tree',b=[624,84,751,227],x=[R(620,165,668,225)],f=[E(685,217,16,6)]),
 dict(n='tree',b=[674,199,751,332],g=[R(690,220,740,300)],f=[E(717,322,14,6)]),
 dict(n='tree',b=[150,0,330,100],f=[E(287,93,12,5)]),
 dict(n='tree',b=[440,0,540,100],f=[E(487,93,12,5)]),
 dict(n='tree',b=[520,10,625,112],f=[E(567,105,12,5)]),
 dict(n='bonsai',b=[209,226,294,300],g=[R(232,235,262,280)],f=[E(245,292,10,4)]),
 dict(n='tree',b=[529,224,576,300],f=[E(555,293,10,4)]),
 dict(n='lantern',b=[311,249,331,292],f=[E(321,287,7,3)]),
 dict(n='lantern',b=[436,249,456,292],f=[E(446,287,7,3)]),
 dict(n='lantern',b=[481,214,511,264],f=[E(496,259,10,4)]),
 dict(n='car',b=[126,384,259,473],f=[E(192,452,62,16)]),
 dict(n='machine',b=[491,414,554,476],f=[R(494,448,552,474)]),
 dict(n='can',b=[444,449,474,494],f=[E(459,488,13,5)]),
 dict(n='bush',b=[551,386,599,424],f=[E(575,418,20,6)]),
 dict(n='bush',b=[631,401,666,434],f=[E(648,428,15,5)]),
 dict(n='bush',b=[64,369,101,394],f=[E(82,390,15,5)]),
],
'shrine':[
 dict(n='pillar',b=[126,31,161,136],f=[E(143,126,15,6)]),
 dict(n='pillar',b=[278,1,316,59],f=[E(297,52,16,6)]),
 dict(n='pillar',b=[481,4,519,71],f=[E(500,63,16,6)]),
 dict(n='pillar',b=[591,6,629,136],f=[E(610,128,15,6)]),
 dict(n='pillar',b=[124,299,164,446],f=[E(143,438,16,6)]),
 dict(n='pillar',b=[589,361,629,449],f=[E(609,442,16,6)]),
 dict(n='brazier',b=[229,121,274,199],f=[E(251,192,18,6)]),
 dict(n='brazier',b=[484,121,526,199],f=[E(505,192,18,6)]),
 dict(n='brazier',b=[229,291,274,369],f=[E(251,362,18,6)]),
 dict(n='brazier',b=[484,291,526,369],f=[E(505,362,18,6)]),
 dict(n='altar',b=[276,178,479,330],f=RING(380,223,71,39,20,352,404),t=[E(380,223,71,39),R(352,250,404,330)],clip=1),   # walkable top, up the stairs (t: there nobody is hidden by it)
 dict(n='rubble',b=[54,171,84,199],f=[E(69,193,13,5)]),
 dict(n='rubble',b=[46,324,86,361],f=[E(66,352,18,6)]),
 dict(n='rubble',b=[186,449,234,494],f=[E(210,485,22,7)]),
 dict(n='rubble',b=[674,314,724,363],f=[E(699,352,22,6)]),
],
'nimbus':[],
'temple':[
 dict(n='pillar',b=[186,19,261,181],f=[R(188,142,258,178)]),
 dict(n='pillar',b=[519,19,596,181],f=[R(522,142,593,178)]),
 dict(n='pillar',b=[184,314,261,476],f=[R(186,437,258,473)]),
 dict(n='pillar',b=[519,314,596,476],f=[R(522,437,593,473)]),
 dict(n='sword',b=[316,179,474,346],f=[E(386,318,66,20)]),
 dict(n='rock',b=[259,26,326,94],f=[E(292,88,30,8)]),
 dict(n='rock',b=[324,0,446,100],f=[E(385,92,58,12)]),
 dict(n='rock',b=[424,49,524,137],f=[E(474,125,46,10)]),
 dict(n='rock',b=[39,164,166,260],f=[E(102,248,58,12)]),
 dict(n='rock',b=[614,126,714,250],f=[E(664,240,46,10)]),
 dict(n='rock',b=[611,289,699,347],f=[E(655,338,40,9)]),
 dict(n='rock',b=[116,404,159,440],f=[E(137,433,20,6)]),
],
}


def pts(s):
    if s[0] == 'e': _,cx,cy,rx,ry = s; return [(cx+rx*math.cos(a), cy+ry*math.sin(a)) for a in np.linspace(0, 2*math.pi, 16, endpoint=False)]
    if s[0] == 'r': _,x0,y0,x1,y1 = s; return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
    return list(s[1])

def num(v):
    v = round(float(v), 1); return int(v) if v == int(v) else v

def polys(o):
    return [[(num(x), num(y)) for x,y in cv2.convexHull(np.array(pts(s), np.float32))[:,0]] for s in o['f']]

def front(P, w, h):
    """lower edge of the footprints per column (the nearest edge where none)"""
    m = np.zeros((h+40, w), np.uint8)
    for p in P: cv2.fillPoly(m, [np.round(np.array(p)).astype(np.int32)], 1)
    fy = np.full(w, np.nan)
    for x in range(w):
        ys = np.nonzero(m[:,x])[0]
        if len(ys): fy[x] = ys.max()
    v = np.nonzero(~np.isnan(fy))[0]
    return np.interp(np.arange(w), v, fy[v])

def box(g, s, val):
    _,x0,y0,x1,y1 = s; g[y0:y1+1, x0:x1+1] = val

def masks(k, rgb, al):
    h, w = al.shape; out = []
    for o in A[k]:
        x0,y0,x1,y1 = o['b']; x0 = max(0,x0-2); y0 = max(0,y0-2); x1 = min(w-1,x1+2); y1 = min(h-1,y1+2)
        P = polys(o); TP = [[(num(x), num(y)) for x,y in cv2.convexHull(np.array(pts(q), np.float32))[:,0]] for q in o.get('t', [])]
        fy = front(P + TP, w, h)
        g = np.full((h,w), cv2.GC_BGD, np.uint8); g[y0:y1+1, x0:x1+1] = cv2.GC_PR_FGD
        for p in P: cv2.fillPoly(g, [np.round(np.array(p)).astype(np.int32)], cv2.GC_FGD)
        for x in range(x0, x1+1): g[int(fy[x])+3:, x] = cv2.GC_BGD
        for s in o.get('g', []): box(g, s, cv2.GC_FGD)
        for s in o.get('x', []): box(g, s, cv2.GC_BGD)
        g[al < 128] = cv2.GC_BGD
        cv2.grabCut(rgb, g, None, np.zeros((1,65)), np.zeros((1,65)), 6, cv2.GC_INIT_WITH_MASK)
        m = ((g == cv2.GC_FGD) | (g == cv2.GC_PR_FGD)).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3,3), np.uint8))
        if o.get('clip'):   # the outline is exactly the footprints (+ the top): a low structure with nothing standing up from it
            cm = np.zeros_like(m)
            for p in P + TP: cv2.fillPoly(cm, [np.round(np.array(p)).astype(np.int32)], 1)
            m &= cm
        n, lab, st, _ = cv2.connectedComponentsWithStats(m)
        m = np.isin(lab, [j for j in range(1, n) if st[j,4] >= 60]).astype(np.uint8)
        out.append(dict(b=[x0,y0,x1+1,y1+1], f=P, m=m, t=TP))
    return out

def upscale(C):
    """C: 1x RGBA with its border -> 2x RGBA. Denoise on a copy whose transparent pixels are filled from their neighbours (no dark fringe), resample premultiplied"""
    rgb, a = C[...,:3], C[...,3:4].astype(np.float32)/255
    fill = cv2.inpaint(np.ascontiguousarray(rgb), (a[...,0] < .5).astype(np.uint8), 3, cv2.INPAINT_TELEA)
    fill = cv2.fastNlMeansDenoisingColored(fill, None, 4, 4, 5, 15).astype(np.float32)
    pm = np.dstack([fill*a, a*255]); h, w = pm.shape[:2]
    U = cv2.resize(pm, (w*SC, h*SC), interpolation=cv2.INTER_LANCZOS4)
    U = np.clip(U + (U - cv2.GaussianBlur(U, (0,0), 1.1))*.8, 0, 255)
    A_ = U[...,3:4]; col = np.where(A_ > 1, U[...,:3]*255/np.maximum(A_, 1), 0)
    A_ = np.clip((A_-128)*1.6+128, 0, 255)
    return np.dstack([np.clip(col,0,255), A_]).astype(np.uint8)

def fade(img, k):
    F = FADE.get(k)
    if not F: return img
    h = img.shape[0]; y = np.arange(h, dtype=np.float32)[:,None]; f = np.ones((h,1), np.float32)
    if F[1]: f *= np.clip((h - y)/(h*F[1]), 0, 1)
    if F[0]: f *= np.clip(y/(h*F[0]), 0, 1)
    img = img.copy(); img[...,3] = (img[...,3]*f).astype(np.uint8); return img

def pack(rects, W):
    x = y = sh = 0; pos = []
    for w, h in rects:
        if x + w > W: x = 0; y += sh + 2; sh = 0
        pos.append((x, y)); x += w + 2; sh = max(sh, h)
    return pos, y + sh

def webp(img, path, q=90):
    Image.fromarray(img[...,[2,1,0,3]]).save(path, 'WEBP', quality=q, alpha_quality=100, method=6)

def main():
    js = {}
    for k in KINDS:
        C = np.array(Image.open(SRC/f'{k}.webp').convert('RGBA'))[...,[2,1,0,3]]
        C = cv2.copyMakeBorder(C, PAD, PAD, PAD, PAD, cv2.BORDER_CONSTANT, value=(0,0,0,0))
        x2 = SRC/f'{k}_x2.webp'   # made by tools/esrgan_np.py (Real-ESRGAN); without it the classic upscale below
        U = np.array(Image.open(x2).convert('RGBA'))[...,[2,1,0,3]] if x2.exists() else upscale(C)
        assert U.shape[:2] == (C.shape[0]*SC, C.shape[1]*SC), (k, U.shape)
        webp(U, OUT/f'isle{k}.webp')
        (OUT/f'isle{k}.png').unlink(missing_ok=True)
        objs = masks(k, np.ascontiguousarray(C[...,:3]), C[...,3]) if A[k] else []
        if not objs: js[k] = []; continue
        Uf = fade(U, k); cuts = []
        for o in objs:
            x0,y0,x1,y1 = [v*SC for v in o['b']]
            m = cv2.resize(o['m'].astype(np.float32), (U.shape[1], U.shape[0]), interpolation=cv2.INTER_LINEAR)[y0:y1, x0:x1]
            c = Uf[y0:y1, x0:x1].copy(); c[...,3] = (c[...,3]*np.clip(m*1.5-.25, 0, 1)).astype(np.uint8); cuts.append(c)
        W = max(1024, max(c.shape[1] for c in cuts)); pos, H = pack([(c.shape[1], c.shape[0]) for c in cuts], W)
        at = np.zeros((H, W, 4), np.uint8)
        for c, (x, y) in zip(cuts, pos): at[y:y+c.shape[0], x:x+c.shape[1]] = c
        webp(at, OUT/f'isleo{k}.webp', 92)
        js[k] = [dict(b=o['b'], r=[x, y, c.shape[1], c.shape[0]], f=[[v for p in P for v in p] for P in o['f']], t=[[v for p in P for v in p] for P in o['t']]) for o, c, (x, y) in zip(objs, cuts, pos)]
        print(f'{k}: {len(objs)} structures, atlas {W}x{H}')
    line = lambda o: '{b:%s,r:%s,f:%s%s}' % (*(json.dumps(o[q], separators=(',',':')) for q in ('b','r','f')), (',t:'+json.dumps(o['t'], separators=(',',':'))) if o['t'] else '')
    src = ('/* GENERATED by tools/gen_isles.py - do not edit by hand (the structures are described there).\n'
           '   v112: what stands on each Snake Way island, in px of the 1x island sprite (ISLE_GEO coordinates): b = box of its picture [x0,y0,x1,y1],\n'
           '   r = its cut-out in the isleo<kind> atlas [x,y,w,h] (2x px), f = footprints, convex polygons [x,y,x,y,...] (Snake.solid, SnakeArt.occlude),\n'
           '   t = where you stand ON it (the top of the altar and its stairs: walkable, never hidden by it) */\n'
           'const ISLE_OBJ={\n' + ',\n'.join('%s:[%s]' % (k, ',\n  '.join(line(o) for o in v)) for k, v in js.items()) + '};\n')
    (ROOT/'src/js/isle_obj.js').write_text(src, encoding='utf8')

if __name__ == '__main__':
    main()
