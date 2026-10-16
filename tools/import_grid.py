#!/usr/bin/env python3
"""Cuts the hand-made "grid" sheets of a character (one image per form + one image with charge / dash / trail) into numbered frame folders that
tools/import_pack.py reads (map option "grid").

usage: import_grid.py [--src "assets/sprite test/goku"] [--out "assets/sprites/Goku nuovo"] [forms ...]

Expected files in --src (JPG or PNG; layout measured on 1024x572, larger images are the same layout scaled):
  <form>.jpg   3 rows on a flat grey cell background: row 1 'WALK & IDLE' (5 frames: idle + 4 walk), row 2 'KAMEHAMEHA' (8 frames), row 3 'MENU EMOTES' (4 portraits)
  *carica*.jpg one image with 9 rows (BASE, SSJ1, SSJ2, SSJ3, SSJ GOD, SSJ BLUE, UI INCOMPLETO, UI COMPLETO, KAIOKEN) x 3 blocks of 4 frames:
               charge pose of the transformation | dash | trail (trail is not cut: it already contains the character)
Output: <out>/<form>/fNN.png keyed frames (walk 00-04, kamehameha 10-17, charge 20-23, dash 30-33) and <out>/<form>/emote/eN.png (opaque portraits).
Charge and dash frames have auras cut by the cell borders: they get a soft alpha and a feathered edge."""
import sys, os, glob, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

FORMS = ['normal', 'kaioken', 'ssj1', 'ssj2', 'ssj3', 'ssjgod', 'ssjgodssj', 'ultrainstinctsign', 'ultrainstinctcomplete']
AURA_FORMS = ('kaioken', 'ssjgod', 'ssjgodssj', 'ultrainstinctsign', 'ultrainstinctcomplete')   # aura painted into the kamehameha frames: soft key + oval fade
ACTION_ROW = {'normal': 0, 'ssj1': 1, 'ssj2': 2, 'ssj3': 3, 'ssjgod': 4, 'ssjgodssj': 5, 'ultrainstinctsign': 6, 'ultrainstinctcomplete': 7, 'kaioken': 8}
ACTION_X = [(85, 395), (401, 691), (708, 1010)]       # charge | dash | trail blocks, 4 cells each (1024 px wide image)
ACTION_Y0, ACTION_PITCH = 40, 59


def corner_bg(c):
    p = [c[:6, :6], c[:6, -6:], c[-6:, :6], c[-6:, -6:]]
    return np.median(np.concatenate([x.reshape(-1, 3) for x in p]), 0)


def key_cell(im, box, soft=False, feather=0, oval=False):
    c = np.array(im.crop(box).convert('RGB')).astype(int); h, w, _ = c.shape
    bg = corner_bg(c); d = np.abs(c - bg).sum(2)
    if soft:
        a = np.clip((d - 24) / 70.0, 0, 1)
        a = ndi.grey_opening(a, size=(2, 2))
    else:
        fg = ndi.binary_opening(d > 42, iterations=1)
        lab, n = ndi.label(ndi.binary_dilation(fg, iterations=2))
        if n == 0: return None
        sizes = ndi.sum(fg, lab, range(1, n + 1)); keep = [i + 1 for i, s in enumerate(sizes) if s > max(40, sizes.max() * .03)]
        a = (np.isin(lab, keep) & fg).astype(float)
    if oval:                                                       # auras fill the cell: fade them out along an ellipse instead of a hard box edge
        yy, xx = np.mgrid[0:h, 0:w]; r = np.hypot((xx - (w - 1) / 2.0) / (w / 2.0), (yy - (h - 1) / 2.0) / (h / 2.0))
        a *= np.clip((1.0 - r) / 0.22, 0, 1)
    if feather:
        yy = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None]; xx = np.minimum(np.arange(w), np.arange(w)[::-1])[None, :]
        e = np.minimum(yy, xx) / float(feather); a *= np.clip(e, 0, 1)
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = c; out[..., 3] = (a * 255).astype(np.uint8)
    f = Image.fromarray(out); bb = f.getbbox()
    return f.crop(bb) if bb else None


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--src', default='assets/sprite test/goku'); ap.add_argument('--out', default='assets/sprites/Goku nuovo')
    ap.add_argument('only', nargs='*'); a = ap.parse_args()
    act = [f for f in glob.glob(os.path.join(a.src, '*')) if 'carica' in os.path.basename(f).lower()]
    actim = Image.open(act[0]).convert('RGB') if act else None
    for form in FORMS:
        if a.only and form not in a.only: continue
        fs = [f for f in glob.glob(os.path.join(a.src, form + '.*')) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not fs: print('!! missing', form); continue
        im = Image.open(fs[0]).convert('RGB'); W, H = im.size; s = W / 1024.0
        d = os.path.join(a.out, form); os.makedirs(os.path.join(d, 'emote'), exist_ok=True)
        n = 0
        aura = form in AURA_FORMS
        for row, (y0, y1, base, cnt) in enumerate([] if form == 'kaioken' else [(40, 181, 0, 5), (224, 366, 10, 8)]):   # kaioken.jpg has another layout: only emotes are cut
            for i in range(cnt):
                x = 6 + 127 * i
                f = key_cell(im, (int(x * s), int(y0 * s), int((x + 123) * s), int(y1 * s)), soft=aura, oval=aura and row == 1)
                if f: f.save(os.path.join(d, 'f%02d.png' % (base + i))); n += 1
        for i in range(4):                                                      # emote portraits: whole cell, normalised to 166x152
            if form == 'kaioken': box = (19 + 122 * i, 436, 19 + 122 * i + 108, 542)
            else: x = 6 + 169.3 * i; box = (x, 400, x + 166, 552)
            c = im.crop((int(box[0] * s), int(box[1] * s), int(box[2] * s), int(box[3] * s))).resize((166, 152), Image.LANCZOS)
            c.save(os.path.join(d, 'emote', 'e%d.png' % i))
        if actim is not None and form in ACTION_ROW:
            r = ACTION_ROW[form]; AW = actim.width / 1024.0
            for b, (bx0, bx1) in enumerate(ACTION_X[:2]):
                cw = (bx1 - bx0) / 4.0
                for i in range(4):
                    box = (int((bx0 + cw * i) * AW) + (14 if (b == 0 and i == 0) else 4), int((ACTION_Y0 + ACTION_PITCH * r) * AW) + 2, int((bx0 + cw * (i + 1)) * AW) - 2, int((ACTION_Y0 + ACTION_PITCH * (r + 1)) * AW) - 2)
                    f = key_cell(actim, box, soft=True, oval=True)
                    if f: f.save(os.path.join(d, 'f%02d.png' % ((20 if b == 0 else 30) + i))); n += 1
        print(form, n, 'frames')


if __name__ == '__main__':
    main()
