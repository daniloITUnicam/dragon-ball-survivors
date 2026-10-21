#!/usr/bin/env python3
"""Tamagami sprite import (v53).  Sources (magenta background, AI generated) in assets/sprites/_sorgenti/boss/:
   sheet_normal.png / sheet_fury.png   3 rows (Tamagami 1, 2, 3) x 9 frames: 0 idle, 1-4 walk, 5 wind-up, 6 strike, 7 special, 8 hit
   statues.png                         the three stone statues on their pedestals
   ref_normal.png                      the three idle poses (only used to scale the statues like the monsters)
Output (assets/sprites/boss/, entries in assets/sprites/sprites.json): tama1 tama2 tama3 (+ f = Fury) = one-row sheets, tamas1..3 = the statues, and their entries in sprites.json.
Frames touch each other in a few places (swords, spears, hammers), so they are cut with component labelling + a few hand-made rules.
Usage: python3 tools/import_tama.py   (Pillow, numpy, scipy)"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SPR = ROOT/'assets'/'sprites'
SRC = SPR/'_sorgenti'/'boss'
OUT = SPR/'boss'
M = np.array([252, 0, 247])
ROWS = [(0, 185), (185, 364), (364, 572)]
TARGET_H = [130, 128, 130]      # on-screen height (px) of the idle body of Tamagami 1, 2, 3 (game px at scale 1)
U = {'tama1': 3.5, 'tama2': 2.7, 'tama3': 2.9, 'tama1f': 3.7, 'tama2f': 2.8, 'tama3f': 3.0}   # BOSSES[..].sp.u: ppu = u gives 1 sheet px = 1 screen px


def load(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.int32)
    d = np.sqrt(((a-M)**2).sum(axis=2))
    fg = d > 80
    # despill: edge pixels keep a magenta tint, pull R/B down towards G where the colour is clearly pinkish
    er = ndi.binary_erosion(fg, iterations=2)
    edge = fg & ~er
    pink = (np.minimum(a[:, :, 0], a[:, :, 2])-a[:, :, 1]) > 35
    fix = edge & pink
    a2 = a.copy()
    for ch in (0, 2):
        a2[:, :, ch] = np.where(fix, np.minimum(a[:, :, ch], a[:, :, 1]+30), a[:, :, ch])
    return a2, fg


def components(fg, y0, y1):
    band = np.zeros_like(fg); band[y0:y1] = fg[y0:y1]      # rows are cut first: tridents / hammers of neighbouring rows may touch
    lab, n = ndi.label(band, structure=np.ones((3, 3)))
    out = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        ys, xs = sl
        m = lab == i
        if m.sum() < 15:
            continue
        out.append((xs.start, m))
    out.sort(key=lambda t: t[0])
    return [m for _, m in out]


def split_window(m, lo, hi):
    """cut a merged component at the emptiest column in [lo, hi)"""
    cols = m.sum(axis=0)
    x = lo+int(np.argmin(cols[lo:hi]))
    L = m.copy(); R = m.copy()
    L[:, x:] = False; R[:, :x] = False
    return L, R


def despeckle(m, small=130):
    """drop the loose bits (a few pixels of the neighbouring frame) that the cuts leave behind"""
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    if n <= 1:
        return m
    sizes = ndi.sum(m, lab, range(1, n+1))
    keep = np.zeros_like(m)
    for i, sz in enumerate(sizes, 1):
        if sz >= small or sz == sizes.max():
            keep |= lab == i
    return keep


def frames_of_row(r, a, fg):
    y0, y1 = ROWS[r]
    comps = components(fg, y0, y1)
    Y, X = np.mgrid[0:fg.shape[0], 0:fg.shape[1]]
    out = []
    if r == 2:      # hammers / fists glue neighbouring frames together: cut at the emptiest column near each seam
        pre = []
        for m in comps:
            xs = np.where(m.any(axis=0))[0]
            x0, x1 = xs.min(), xs.max()
            if x0 < 40 and x1 > 200:
                pre += list(split_window(m, 150, 166))
            elif 440 < x0 < 470 and x1-x0 > 175:
                L = m & ((X < 554) | ((X < 574) & (Y >= 434)))      # no neck here: the toe of frame 4 reaches under the hammer of frame 5
                pre += [L, m & ~L]
            elif 770 < x0 < 800 and x1-x0 > 175:
                pre += list(split_window(m, 878, 906))
            else:
                pre.append(m)
        comps = pre
    if r == 1:      # the Fury sheet has frames 0+1 and 6+7+8 glued together by the tridents
        pre = []
        for m in comps:
            xs = np.where(m.any(axis=0))[0]
            if xs.min() < 60 and xs.max() > 200:
                pre += list(split_window(m, 124, 142))
            elif 670 <= xs.min() < 700 and xs.max() > 990:
                band78 = (Y >= 258) & (Y <= 290)
                f8 = m & ((X >= 920) | ((X >= 901) & ~band78))
                pre += [m & ~f8, f8]
            else:
                pre.append(m)
        comps = pre
    for k, m in enumerate(comps):
        xs = np.where(m.any(axis=0))[0]
        w = xs.max()-xs.min()+1
        if r == 0 and w > 175:      # frame 6 (sword thrust) + frame 7 (jump slash): the blade passes in front of the jumper
            band = m & (X >= 805) & (X < 852) & (Y >= 84) & (Y <= 101)
            f6 = (m & (X < 805)) | band
            f7 = m & ~f6
            # the blade tip is hidden behind the jumper's belt: carry the blade on to x = 866 from the last clean column
            cm = f6.copy()
            colsrc = band[:, 850]
            for x in range(852, 867):
                for y in np.where(colsrc)[0]:
                    a[y, x] = a[y, 850]; cm[y, x] = True
            out += [cm, f7]
        elif r == 1 and w > 175:    # spear thrust + spinning spear: the thrust head (gold / dark pixels in the band) belongs to frame 6
            lum = a.max(axis=2)
            gold = (a[:, :, 0] > a[:, :, 2]+25) | ((lum < 90) & (Y >= 266) & (Y <= 281))      # trident (gold) + the dark shaft only
            band = m & (X >= 783) & (X < 846) & (Y >= 260) & (Y <= 288) & gold
            f6 = (m & (X < 783)) | band
            f7 = m & ~f6
            out += [f6, f7]
        else:
            out.append(m)
    assert len(out) == 9, (r, len(out))
    return [despeckle(m) for m in out]


def crop(a, m):
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max()+1, xs.min(), xs.max()+1
    rgba = np.zeros((y1-y0, x1-x0, 4), np.uint8)
    rgba[:, :, :3] = np.clip(a[y0:y1, x0:x1], 0, 255)
    rgba[:, :, 3] = (m[y0:y1, x0:x1]*255).astype(np.uint8)
    return rgba, (x0, y0, x1, y1)


def anchor_x(m, base, body_h):
    ys, xs = np.where(m)
    sel = (ys >= base-.55*body_h) & (ys <= base-.30*body_h)
    return float(np.median(xs[sel])) if sel.any() else float(np.median(xs))


def build_sheet(sid, r, a, fg, scale_ref=None):
    fr = frames_of_row(r, a, fg)
    boxes = [crop(a, m) for m in fr]
    base = max(b[1][3] for b in boxes[:5])                   # ground line = lowest pixel of idle / walk
    top0 = boxes[0][1][1]
    body_h = base-top0
    if scale_ref is None:
        # T2 carries a tall trident: scale by the body (helmet top), not by the weapon
        body_top = {0: top0, 1: min(b[1][1] for b in boxes[2:5]), 2: min(b[1][1] for b in boxes[2:5])}[r]
        scale_ref = TARGET_H[r]/(base-body_top)
    items = []
    for m, (img, (x0, y0, x1, y1)) in zip(fr, boxes):
        ax = anchor_x(m, base, body_h)
        items.append((img, ax-x0, base-y0, x1-x0, y1-y0))   # image, anchor x in image, baseline y in image
    left = max(i[1] for i in items); right = max(i[3]-i[1] for i in items); up = max(i[2] for i in items); down = max(i[4]-i[2] for i in items)
    W0 = int(np.ceil(2*max(left, right)))+6; H0 = int(np.ceil(up+max(down, 0)))+6
    s = scale_ref
    W = int(round(W0*s)); H = int(round(H0*s))
    sheet = Image.new('RGBA', (W*9, H), (0, 0, 0, 0))
    ay = int(round((up+3)*s))
    for k, (img, ax, by, w, h) in enumerate(items):
        cell = Image.new('RGBA', (W0, H0), (0, 0, 0, 0))
        im = Image.fromarray(img)
        cell.paste(im, (int(round(W0/2-ax)), int(round(up+3-by))), im)
        cell = cell.convert('RGBa').resize((W, H), Image.LANCZOS).convert('RGBA')
        sheet.paste(cell, (k*W, 0))
    return sheet, dict(cols=9, fw=W, fh=H, ax=W//2, ay=ay, ppu=U[sid], has=[7, 8]), scale_ref


def quant(img):
    q = img.quantize(colors=160, method=Image.FASTOCTREE, dither=Image.Dither.NONE)
    return q


def statues(scales):
    a, fg = load(SRC/'statues.png')
    comps = components(fg, 0, 572)
    assert len(comps) >= 3, len(comps)
    comps = sorted(comps, key=lambda m: -m.sum())[:3]
    comps.sort(key=lambda m: np.where(m.any(axis=0))[0].min())
    res = []
    for i, m in enumerate(comps):
        img, (x0, y0, x1, y1) = crop(a, m)
        s = scales[i]
        im = Image.fromarray(img).convert('RGBa').resize((max(1, round(img.shape[1]*s)), max(1, round(img.shape[0]*s))), Image.LANCZOS).convert('RGBA')
        res.append(im)
    return res


def main():
    meta = {}
    sheets = {}
    for tag, f in (('', 'sheet_normal.png'), ('f', 'sheet_fury.png')):
        a, fg = load(SRC/f)
        for r in range(3):
            sid = 'tama%d%s' % (r+1, tag)
            sheet, e, sc = build_sheet(sid, r, a, fg, sheets.get('tama%d' % (r+1), {}).get('sc') if tag else None)
            sheets[sid] = dict(sc=sc)
            q = quant(sheet)
            q.save(OUT/(sid+'.png'), optimize=True)
            meta[sid] = e
            print(sid, sheet.size, 'frame', e['fw'], 'x', e['fh'], 'scale %.3f' % sc, (OUT/(sid+'.png')).stat().st_size, 'bytes')
    # statues: scale each like its monster (reference: idle figure height in ref_normal vs in the sheet)
    a, fg = load(SRC/'ref_normal.png')
    refc = sorted(components(fg, 0, 572), key=lambda m: -m.sum())[:3]
    refc.sort(key=lambda m: np.where(m.any(axis=0))[0].min())
    refh = [np.ptp(np.where(m.any(axis=1))[0])+1 for m in refc]
    sa, sfg = load(SRC/'sheet_normal.png')
    sc = []
    for r in range(3):
        fr = frames_of_row(r, sa.copy(), sfg)
        ys = np.where(fr[0].any(axis=1))[0]
        sc.append(sheets['tama%d' % (r+1)]['sc']*(np.ptp(ys)+1)/refh[r])
    for i, im in enumerate(statues(sc)):
        sid = 'tamas%d' % (i+1)
        q = quant(im); q.save(OUT/(sid+'.png'), optimize=True)
        meta[sid] = dict(cols=1, fw=im.width, fh=im.height, ax=im.width//2, ay=im.height-2, ppu=1, has=[])
        print(sid, im.size, (OUT/(sid+'.png')).stat().st_size, 'bytes')
    p = SPR/'sprites.json'
    d = json.loads(p.read_text(encoding='utf8')) if p.exists() else {}
    d.update(meta)
    p.write_text(json.dumps(d, indent=1), encoding='utf8')


main()
