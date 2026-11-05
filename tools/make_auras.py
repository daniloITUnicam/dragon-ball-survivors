#!/usr/bin/env python3
"""Painted ki auras (js/renderer.js Renderer.auraSprite): assets/sprites/aure/aura<id>.png + their entries in sprites.json.

  python3 tools/make_auras.py            (sources: assets/sprites/_sorgenti/aure/<id>.jpg|png)

Each source is a 4 x 2 grid of the 8 frames of a looping aura on a black background (docs/gemini_goku/AURE_GEMINI.md):
  base (white, the game tints it), kaio, kaio2 (Kaioken x10 / x20), ssj, ssj2, ssj3, god, blue, uis, mui.
- the black becomes transparency with a colour-to-alpha (the glow keeps its soft edges; the game adds the aura as light);
- every frame is cut with the same box (the union of the 8 frames, measured from the bottom of the flame), so the base never jumps;
- scaled so that the flame is H px tall, 8 frames in one row.
Meta: cols 8, fw / fh, base = the flame's base (px from the top of the frame), art = the flame's height in px."""
import json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SD = ROOT/'assets'/'sprites'
SRC = SD/'_sorgenti'/'aure'
H = 168          # flame height in the sheet (px): drawn at about 70 game units, sharp up to ~2.4 canvas px per unit

def frames(path):
    a = np.asarray(Image.open(path).convert('RGB'), np.float32)
    h, w, _ = a.shape; cw, ch = w/4, h/2
    return [a[int(r*ch):int((r+1)*ch), int(c*cw):int((c+1)*cw)] for r in range(2) for c in range(4)]

def c2a(f):
    m = f.max(2); al = np.clip((m-14)/(255-14), 0, 1)                 # the jpeg's near-black noise stays transparent
    rgb = np.where(al[..., None] > 0, f/np.maximum(al[..., None], 1e-3), 0)
    return np.dstack([np.clip(rgb, 0, 255), al*255])

def main():
    js = json.loads((SD/'sprites.json').read_text(encoding='utf8'))
    od = SD/'aure'; od.mkdir(parents=True, exist_ok=True)
    for src in sorted(SRC.glob('*.*')):
        sid = 'aura'+src.stem
        F = [c2a(f) for f in frames(src)]
        fh0, fw0 = F[0].shape[:2]
        # the union box of the 8 frames (alpha > 4%), with the same offsets in every frame
        ys, xs = [], []
        for f in F:
            yy, xx = np.nonzero(f[..., 3] > 10)
            if len(yy): ys += [yy.min(), yy.max()]; xs += [xx.min(), xx.max()]
        y0, y1, x0, x1 = min(ys), max(ys), min(xs), max(xs)
        cx = (x0+x1)/2; half = max(cx-x0, x1-cx)+2; x0, x1 = int(max(0, cx-half)), int(min(fw0, cx+half))
        k = H/(y1-y0+1)
        tw, th = max(1, round((x1-x0+1)*k)), max(1, round((y1-y0+1)*k))
        pad = 2; cw, chh = tw+2*pad, th+2*pad
        sheet = Image.new('RGBA', (cw*8, chh), (0, 0, 0, 0))
        for i, f in enumerate(F):
            im = Image.fromarray(f[y0:y1+1, x0:x1+1].astype(np.uint8), 'RGBA')
            # premultiplied resize (no dark fringes from the transparent black)
            pm = np.asarray(im, np.float32); pm[..., :3] *= pm[..., 3:]/255
            r = Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((tw, th), Image.LANCZOS)
            q = np.asarray(r, np.float32); al = q[..., 3:]; q[..., :3] = np.where(al > 0, q[..., :3]*255/np.maximum(al, 1), 0)
            sheet.paste(Image.fromarray(np.clip(q, 0, 255).astype(np.uint8), 'RGBA'), (i*cw+pad, pad))
        # a 96-colour palette (with its alpha levels): about 5x smaller in the page, the same look at this size
        sheet = sheet.quantize(colors=96, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA')
        sheet.save(od/(sid+'.png'), optimize=True)
        js[sid] = {'cols': 8, 'fw': cw, 'fh': chh, 'ax': cw/2, 'ay': pad+th, 'art': th, 'k': 1}
        print(sid, sheet.size, 'frame', cw, 'x', chh)
    (SD/'sprites.json').write_text(json.dumps(js, ensure_ascii=False, separators=(',', ':')), encoding='utf8')

if __name__ == '__main__': main()
