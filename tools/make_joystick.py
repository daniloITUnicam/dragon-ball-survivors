#!/usr/bin/env python3
"""Touch joystick art for phones (js/mobile.js): assets/sprites/mobile/mobjoy.png + its entry in sprites.json.

  python3 tools/make_joystick.py [<sheet>]      (default: assets/sprites/_sorgenti/mobile/joystick.png)

The source is the 3x3 sheet of the joystick (8 directions + idle) on a flat dark background. Only three cells are needed, because the game
rotates the pieces to the exact angle of the finger (any direction, not just 8):
  ring  = the frame of the IDLE cell with its inside cleared;
  knob  = the ball of the IDLE cell (standing still);
  trail = the flame behind the ball in the RIGHT cell (moving east; the game rotates it and draws the idle ball on it), anchored on the ball's centre;
  ball  = the small Dragon Ball outside the frame in the RIGHT cell (direction marker; the arrow line is drawn by the code).
The background is turned into transparency with a colour-to-alpha (glows and sparks keep their soft edges).
Every measure (centres, radii) is taken from the picture, so a redrawn sheet with the same layout works as it is.
"""
import json, pathlib, sys
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SD = ROOT/'assets'/'sprites'

def c2a(a, bg, dark=True):
    """colour-to-alpha against the flat background colour bg (GIMP's algorithm): returns RGBA float.
    dark=False: pixels darker than the background become transparent too (the inside of the frame is a little darker than the page)"""
    bg = np.asarray(bg, np.float32)
    up = np.where(a > bg, (a-bg)/np.maximum(1, 255-bg), np.where(a < bg, (bg-a)/np.maximum(1, bg), 0) if dark else 0)
    al = up.max(2)
    rgb = np.where(al[..., None] > 0, (a-bg)/np.maximum(al[..., None], 1e-6)+bg, a)
    return np.dstack([np.clip(rgb, 0, 255), al*255])

def spans(v):
    out, s = [], None
    for i, x in enumerate(v):
        if x and s is None: s = i
        if not x and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(v)))
    return out

def interior(a, cx, cy, rmin, rmax, thr):
    """radius of the dark inside of the frame: along 180 rays, the first bright pixel past rmin (median)"""
    rs = []
    for t in np.linspace(0, 2*np.pi, 180, endpoint=False):
        for r in np.arange(rmin, rmax, .5):
            x, y = int(round(cx+np.cos(t)*r)), int(round(cy+np.sin(t)*r))
            if a[y, x].max() > thr: rs.append(r); break
    return float(np.median(rs))

def main():
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else SD/'_sorgenti'/'mobile'/'joystick.png'
    a = np.asarray(Image.open(src).convert('RGB'), np.float32)
    H, W, _ = a.shape
    bg = np.median(np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), 0)
    lum = a.max(2)
    # the 3 x 3 cells (a label line under each row is skipped: the cell is the tallest span of the row band)
    xs = [s for s in spans((lum > bg.max()+45).sum(0) > 0) if s[1]-s[0] > W*.12]
    ys = [s for s in spans((lum > bg.max()+45).sum(1) > 0) if s[1]-s[0] > H*.12]
    assert len(xs) == 3 and len(ys) == 3, (xs, ys)
    def cell(ix, iy): return xs[ix], ys[iy]
    def centre(ix, iy):   # the frame's centre: circle fitted on the inner edge of its light grey-blue band (rays pass through the orange flame)
        (x0, x1), (y0, y1) = cell(ix, iy)
        sub = (lum[y0:y1, x0:x1] > bg.max()+45) & (a[y0:y1, x0:x1, 2] > a[y0:y1, x0:x1, 0]-10)
        yb, xb = np.nonzero(sub)
        gx0, gy0 = x0+(np.percentile(xb, 2)+np.percentile(xb, 98))/2, y0+(np.percentile(yb, 2)+np.percentile(yb, 98))/2
        P = []
        for t in np.linspace(0, 2*np.pi, 240, endpoint=False):
            for r in np.arange(30, 150, .5):
                x, y = int(round(gx0+np.cos(t)*r)), int(round(gy0+np.sin(t)*r))
                px_ = a[y, x]
                if px_[2] >= px_[0]-6 and px_.max() > 120: P.append((gx0+np.cos(t)*r, gy0+np.sin(t)*r)); break
        P = np.array(P); M = np.c_[2*P[:, 0], 2*P[:, 1], np.ones(len(P))]; bb = (P**2).sum(1)
        for _ in range(3):   # least squares circle, the outliers (sparks, flame tips) dropped
            (ccx, ccy, c0), *_ = np.linalg.lstsq(M, bb, rcond=None); rr = np.sqrt(c0+ccx*ccx+ccy*ccy)
            res = np.abs(np.hypot(P[:, 0]-ccx, P[:, 1]-ccy)-rr); keep = res < max(2, np.percentile(res, 80))
            M, bb, P = M[keep], bb[keep], P[keep]
        return float(ccx), float(ccy), float(rr)
    out = {}
    # ---- IDLE (centre cell): frame + ball ----
    cx, cy, rin = centre(1, 1)
    (x0, x1), (y0, y1) = cell(1, 1)
    sub = a[y0:y1, x0:x1]; core = (sub[..., 0] > 225) & (sub[..., 1] > 140) & (sub[..., 2] < 120)
    yy, xx = np.nonzero(core); d = np.hypot(xx+x0-cx, yy+y0-cy); k = d < 60
    kx, ky = (xx[k]+x0).mean(), (yy[k]+y0).mean(); kr = float(np.percentile(np.hypot(xx[k]+x0-kx, yy[k]+y0-ky), 97))+3
    R = int(rin*1.75)   # crop half-size: the frame, its glow and sparks
    gy, gx = np.mgrid[0:H, 0:W]
    dist = np.hypot(gx-cx, gy-cy)
    rgba = c2a(a, bg); lit = c2a(a, bg, dark=False)
    def crop(rgba_, keep, cxc, cyc, half):
        m = rgba_.copy(); m[..., 3] *= keep
        X0, Y0 = int(round(cxc-half)), int(round(cyc-half)); X1, Y1 = X0+2*half, Y0+2*half
        pad = np.zeros((2*half, 2*half, 4), np.float32)
        sx0, sy0, sx1, sy1 = max(0, X0), max(0, Y0), min(W, X1), min(H, Y1)
        pad[sy0-Y0:sy1-Y0, sx0-X0:sx1-X0] = m[sy0:sy1, sx0:sx1]
        return pad
    inside_cell = (gx >= x0) & (gx < x1) & (gy >= y0) & (gy < y1)
    ring = crop(rgba, np.clip((dist-rin+1)/2, 0, 1)*inside_cell, cx, cy, R)
    kh = int(kr*1.45)
    knob = crop(lit, np.clip((kr*1.4-np.hypot(gx-kx, gy-ky))/3, 0, 1)*(dist < rin-1), kx, ky, kh)
    # ---- RIGHT (middle row, right column): ball + flame, and the small Dragon Ball outside ----
    rx, ry, _ = centre(2, 1)
    (x0, x1), (y0, y1) = cell(2, 1)
    dR = np.hypot(gx-rx, gy-ry)
    # the ball moved east: find it by matching the idle ball (template) along the row, right of the centre
    # the ball moved east until its dark outline touches the inside of the frame: centre = frame centre + (inner radius - outline radius)
    kb = []
    for t in np.linspace(0, 2*np.pi, 120, endpoint=False):
        for r in np.arange(8, kr+8, .5):
            if a[int(round(ky+np.sin(t)*r)), int(round(kx+np.cos(t)*r)), 0] < 190: kb.append(r); break
    kb = float(np.median(kb))
    bx, by = rx+rin-kb, ry
    # only the flame: the inside of the frame minus the ball (the game draws the round idle ball on top of it, so the frame never cuts it)
    trail_keep = np.clip((rin-1-dR)/2, 0, 1)*np.clip((np.hypot(gx-bx, gy-by)-kb+3)/3, 0, 1)*((gx >= x0) & (gx < x1))
    th = int(rin*1.35)
    trail = crop(lit, trail_keep, bx, by, th)
    # the small Dragon Ball: the orange blob outside the frame, on the ball's row (the frame's own flames are above and below it)
    far = (dR > rin*1.45) & (np.abs(gy-by) < kr*.6) & (gx > rx) & (gx < x1)
    ob = far & (a[..., 0] > 190) & (a[..., 1] > 80) & (a[..., 2] < 140)
    oy, ox = np.nonzero(ob)
    ocx, ocy = (ox.min()+ox.max())/2, float(np.median(oy)); orr = (ox.max()-ox.min())/2+1
    far = (dR > rin*1.49) & (gx < x1)
    ball = crop(lit, np.clip((orr*1.6-np.hypot(gx-ocx, gy-ocy))/2.5, 0, 1)*far, ocx, ocy, int(orr*1.7))
    # ---- atlas: one row, pieces side by side ----
    parts = [('ring', ring), ('knob', knob), ('trail', trail), ('ball', ball)]
    aw, ah = sum(p.shape[1] for _, p in parts)+2*len(parts), max(p.shape[0] for _, p in parts)
    atlas = np.zeros((ah, aw, 4), np.float32); x = 0; rects = {}
    for n, p in parts:
        atlas[:p.shape[0], x:x+p.shape[1]] = p; rects[n] = [x, 0, p.shape[1], p.shape[0]]; x += p.shape[1]+2
    img = Image.fromarray(np.clip(atlas+.5, 0, 255).astype(np.uint8), 'RGBA')
    k = 0.6   # the art is drawn at ~70 px of radius on a phone: keep 60% of the source size (sharp enough at 3x screens, small file)
    img = img.resize((max(1, round(img.width*k)), max(1, round(img.height*k))), Image.LANCZOS)
    rects = {n: [round(v*k) for v in r] for n, r in rects.items()}
    od = SD/'mobile'; od.mkdir(parents=True, exist_ok=True); img.save(od/'mobjoy.png', optimize=True)
    # metrics in atlas pixels: frame inner radius, ball radius and travel (the ball touches the inside of the frame), marker distance
    meta = {'cols': 1, 'rects': rects, 'rin': round(rin*k, 2), 'kr': round(kb*k, 2), 'trav': round((bx-rx)*k, 2),
            'mark': round((ocx-rx)*k, 2), 'mr': round(orr*k, 2), 'k': 1}
    js = json.loads((SD/'sprites.json').read_text(encoding='utf8')); js['mobjoy'] = meta
    (SD/'sprites.json').write_text(json.dumps(js, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print('mobjoy', img.size, json.dumps(meta))
    print(f'frame centre idle=({cx:.1f},{cy:.1f}) right=({rx:.1f},{ry:.1f}) inner r={rin:.1f} ball r={kr:.1f} outline {kb:.1f} ball@({bx:.1f},{by:.1f}) marker@({ocx:.1f},{ocy:.1f}) r={orr:.1f}')

if __name__ == '__main__': main()
