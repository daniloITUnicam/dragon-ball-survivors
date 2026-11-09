#!/usr/bin/env python3
"""Walk strip image (the frames side by side on flat magenta, e.g. made by Gemini) -> pixel-art frames with the size and the palette of the
pack idle, ready for tools/import_pack.py ("walk_dir"). Same block / palette method as walk_from_video.py.
usage: walk_from_strip.py <strip.png> <idle_x4.png> <out_dir>"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.color import rgb2lab

src, idlep, out = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
iz = np.asarray(Image.open(idlep).convert('RGB'))[::4, ::4].astype(np.int32)
imask = ~((iz[:, :, 0] == 255) & (iz[:, :, 1] == 0) & (iz[:, :, 2] == 255))
ys, xs = np.where(imask); idle = iz[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; imask = imask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
IH = idle.shape[0]; pal = np.unique(idle[imask], axis=0); pal_lab = rgb2lab(pal[None].astype(np.uint8))[0]

x = np.asarray(Image.open(src).convert('RGB')).astype(np.int32)
bg = np.median(np.concatenate([x[:3].reshape(-1, 3), x[-3:].reshape(-1, 3)]), 0)
m = np.abs(x - bg).sum(2) > 110
lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=4))
sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
objs = [(i + 1, s) for i, s in enumerate(sz) if s > sz.max() * .2]
fo = ndimage.find_objects(lab); boxes = sorted([fo[i - 1] for i, _ in objs], key=lambda s: s[1].start)
Hs = [int(np.ptp(np.where(m[b].any(1))[0])) + 1 for b in boxes]
k = max(Hs) / IH
print('frames', len(boxes), 'heights', Hs, 'k', round(k, 2))

def to_art(b):
    pad = int(k) + 2
    Y0, Y1, X0, X1 = max(0, b[0].start - pad), min(x.shape[0], b[0].stop + pad), max(0, b[1].start - pad), min(x.shape[1], b[1].stop + pad)
    sub = x[Y0:Y1, X0:X1].astype(np.float64); mm = m[Y0:Y1, X0:X1]; h, w, _ = sub.shape
    lum = sub.mean(2); I1 = np.pad(lum, ((1, 0), (1, 0))).cumsum(0).cumsum(1); I2 = np.pad(lum * lum, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    def edges(o, n_): return np.clip(np.round(o + np.arange(n_ + 1) * k).astype(int), 0, None)
    nx, ny = int(w / k) + 1, int(h / k) + 1; best = None
    for oy in np.arange(0, k, .5):
        ye = edges(oy - k, ny + 1); ye = ye[ye <= h]
        for ox in np.arange(0, k, .5):
            xe = edges(ox - k, nx + 1); xe = xe[xe <= w]
            Ya, Yb, Xa, Xb = ye[:-1][:, None], ye[1:][:, None], xe[:-1][None], xe[1:][None]
            nn = np.maximum((Yb - Ya) * (Xb - Xa), 1)
            s1 = I1[Yb, Xb] - I1[Ya, Xb] - I1[Yb, Xa] + I1[Ya, Xa]; s2 = I2[Yb, Xb] - I2[Ya, Xb] - I2[Yb, Xa] + I2[Ya, Xa]
            v = (s2 - s1 * s1 / nn).sum()
            if best is None or v < best[0]: best = (v, ox, oy)
    _, ox, oy = best
    ye = edges(oy - k, ny + 1); ye = ye[ye <= h]; xe = edges(ox - k, nx + 1); xe = xe[xe <= w]
    rgb = np.zeros((len(ye) - 1, len(xe) - 1, 3)); op = np.zeros(rgb.shape[:2], bool)
    for r in range(len(ye) - 1):
        for c in range(len(xe) - 1):
            ya, yb, xa, xb = ye[r], ye[r + 1], xe[c], xe[c + 1]
            if yb - ya < 2 or xb - xa < 2: continue
            my, mx = max(1, (yb - ya) // 4), max(1, (xb - xa) // 4)
            blk = sub[ya + my:yb - my, xa + mx:xb - mx].reshape(-1, 3); bm = mm[ya + my:yb - my, xa + mx:xb - mx]
            if not blk.size: continue
            bmf = bm.reshape(-1)
            if bmf.mean() <= .5: continue
            col = np.median(blk[bmf], 0); rgb[r, c] = col; op[r, c] = np.abs(col - bg).sum() > 150
    lab_ = rgb2lab(np.clip(rgb, 0, 255).astype(np.uint8)); pl = np.concatenate([pal_lab, rgb2lab(np.array([[bg]], np.uint8))[0]])
    d = ((lab_[:, :, None, :] - pl[None, None]) ** 2).sum(3); am = d.argmin(2); op &= am < len(pal)
    q = pal[np.minimum(am, len(pal) - 1)].astype(np.uint8)
    nb = ndimage.convolve(op.astype(int), np.ones((3, 3), int), mode='constant') - op
    op[op & (nb <= 1)] = False; op[(~op) & (nb >= 7)] = True
    l2, n2 = ndimage.label(op)
    if n2 > 1: s_ = ndimage.sum(np.ones_like(l2), l2, range(1, n2 + 1)); op = l2 == 1 + int(np.argmax(s_))
    rgba = np.zeros(q.shape[:2] + (4,), np.uint8); rgba[..., :3] = q; rgba[..., 3] = op * 255
    yy, xx = np.where(op); return rgba[yy.min():yy.max() + 1, xx.min():xx.max() + 1]

res = [to_art(b) for b in boxes]
for j, r in enumerate(res): Image.fromarray(r).save(os.path.join(out, f'walk_{j + 1}.png'))
ia = np.zeros(idle.shape[:2] + (4,), np.uint8); ia[..., :3] = idle; ia[..., 3] = imask * 255
Image.fromarray(ia).save(os.path.join(out, 'walk_0.png'))
cw = max(r.shape[1] for r in res + [ia]) + 4; Hh = max(r.shape[0] for r in res + [ia]) + 4
P = Image.new('RGBA', (cw * (len(res) + 1), Hh), (255, 0, 255, 255))
for j, r in enumerate([ia] + res):
    im = Image.fromarray(r); P.alpha_composite(im, (j * cw + (cw - im.width) // 2, Hh - 2 - im.height))
P.convert('RGB').resize((P.width * 5, P.height * 5), Image.NEAREST).save(os.path.join(out, 'preview.png'))
print('sizes', [r.shape[:2] for r in res])
