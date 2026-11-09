#!/usr/bin/env python3
"""Walk cycle from a generated video (the character walking in place on flat magenta) -> pixel-art frames with the size and the palette of the
pack idle sprite, ready for tools/import_pack.py ("walk_dir"). See docs/SPRITES.md, section "Camminata da un video".
usage: walk_from_video.py <video.mp4 | frames_dir> <idle_x4.png> <out_dir> [--n 8] [--skip 12] [--kmul 1.0] [--start S --end E]
       [--pal other_idle_x4.png --remap '[[[r,g,b],[r,g,b]],...]']
<idle_x4.png>: the pack idle on #FF00FF enlarged 4x (the files idle_<n>_<form>.png of the Gemini folder).
It picks the cleanest stride-to-stride cycle (leg spread maxima), samples --n frames, finds the pixel grid of every frame (min in-block variance),
takes the median colour of each block and maps it to the idle palette in Lab (the background is a candidate too, so magenta fringe goes away).
Writes walk_1..N.png (transparent, cropped), walk_0.png (the idle) and preview.png. Needs numpy, scipy, scikit-image, Pillow (and ffmpeg for .mp4)."""
import sys, glob, os, argparse, json
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.color import rgb2lab

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('idle'); ap.add_argument('out')
ap.add_argument('--n', type=int, default=8); ap.add_argument('--skip', type=int, default=12)
ap.add_argument('--kmul', type=float, default=1.0); ap.add_argument('--start', type=int); ap.add_argument('--end', type=int)
ap.add_argument('--pal', help='take the palette from this idle instead (then --remap)'); ap.add_argument('--remap', help='json [[from rgb],[to rgb]] pairs')
ap.add_argument('--own', action='store_true', help='keep the video colours (own palette) instead of the idle palette')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
if os.path.isfile(a.src):   # a video: its frames into a temporary folder
    import tempfile, subprocess
    td = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', a.src, os.path.join(td, '%04d.png')], check=True); a.src = td

# ---- idle (enlarged x4 on magenta) -> art pixels, mask, palette
iz = np.asarray(Image.open(a.idle).convert('RGB'))[::4, ::4].astype(np.int32)
imask = ~((iz[:, :, 0] == 255) & (iz[:, :, 1] == 0) & (iz[:, :, 2] == 255))
ys, xs = np.where(imask); iy0, iy1, ix0, ix1 = ys.min(), ys.max(), xs.min(), xs.max()
idle = iz[iy0:iy1 + 1, ix0:ix1 + 1]; imask = imask[iy0:iy1 + 1, ix0:ix1 + 1]
IH = idle.shape[0]
pal = np.unique(idle[imask], axis=0)
if a.pal:
    pz = np.asarray(Image.open(a.pal).convert('RGB'))[::4, ::4].astype(np.int32); pm = ~((pz[:, :, 0] == 255) & (pz[:, :, 1] == 0) & (pz[:, :, 2] == 255)); pal = np.unique(pz[pm], axis=0)
pal_lab = rgb2lab(pal[None].astype(np.uint8))[0]

# ---- video frames
fs = sorted(glob.glob(os.path.join(a.src, '*.png')))
A = [np.asarray(Image.open(f).convert('RGB')).astype(np.int32) for f in fs]
e = A[0]; edge = np.concatenate([e[:4].reshape(-1, 3), e[-4:].reshape(-1, 3), e[:, :4].reshape(-1, 3), e[:, -4:].reshape(-1, 3)])
bg = np.median(edge, 0)
M = [np.abs(x - bg).sum(2) > 110 for x in A]
def clean_mask(m):   # biggest blob + its neighbours (drops compression specks far from the body)
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6))
    if n <= 1: return m
    sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); keep = 1 + int(np.argmax(sz))
    return m & (lab == keep)
M = [clean_mask(m) for m in M]
BB = []
for m in M:
    yy, xx = np.where(m); BB.append((xx.min(), yy.min(), xx.max(), yy.max()))
BB = np.array(BB)

# leg spread (width of the lowest 12%) -> strides = local maxima
sp = []
for m, b in zip(M, BB):
    h = b[3] - b[1]; rows = m[b[3] - int(h * .12):b[3] + 1]; xx = np.where(rows.any(0))[0]; sp.append(xx.max() - xx.min())
sp = ndimage.uniform_filter1d(np.array(sp, float), 3)
mx = [i for i in range(max(a.skip, 1), len(sp) - 1) if sp[i] >= sp[i - 1] and sp[i] > sp[i + 1] and sp[i] > np.percentile(sp, 70)]
# merge maxima closer than 5 frames
mx2 = []
for i in mx:
    if mx2 and i - mx2[-1] < 5:
        if sp[i] > sp[mx2[-1]]: mx2[-1] = i
    else: mx2.append(i)
mx = mx2

def crop_norm(i, W=96, H=128):
    b = BB[i]; im = Image.fromarray(A[i][b[1]:b[3] + 1, b[0]:b[2] + 1].astype(np.uint8))
    r = H / im.height; im = im.resize((max(1, int(im.width * r)), H), Image.BILINEAR)
    c = Image.new('RGB', (W * 2, H), tuple(int(v) for v in bg)); c.paste(im, ((W * 2 - im.width) // 2, 0)); return np.asarray(c).astype(np.float32)

if a.start is not None:
    s0, s1 = a.start, a.end
else:
    best = None
    for j in range(len(mx) - 2):
        s0, s1 = mx[j], mx[j + 2]
        if not (20 <= s1 - s0 <= 40): continue
        d = np.abs(crop_norm(s0) - crop_norm(s1)).mean() + np.abs(crop_norm(mx[j + 1]) - crop_norm(min(len(A) - 1, mx[j + 1] + (s1 - s0)))).mean() * .5
        if best is None or d < best[0]: best = (d, s0, s1)
    _, s0, s1 = best
sel = [int(round(s0 + j * (s1 - s0) / a.n)) for j in range(a.n)]
Hv = max(BB[i][3] - BB[i][1] + 1 for i in sel)
k = Hv / IH * a.kmul
print(f'strides {mx[:12]} cycle {s0}-{s1} ({s1 - s0} f) frames {sel} k={k:.2f}')

# ---- frame -> art pixels: find the block grid phase (min in-block variance), median colour per block
def to_art(i):
    x = A[i]; m = M[i]; b = BB[i]
    pad = int(k) + 2
    X0, Y0, X1, Y1 = max(0, b[0] - pad), max(0, b[1] - pad), min(x.shape[1] - 1, b[2] + pad), min(x.shape[0] - 1, b[3] + pad)
    sub = x[Y0:Y1 + 1, X0:X1 + 1].astype(np.float64); h, w, _ = sub.shape
    lum = sub.mean(2); I1 = np.pad(lum, ((1, 0), (1, 0))).cumsum(0).cumsum(1); I2 = np.pad(lum * lum, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    def edges(o, n): return np.clip(np.round(o + np.arange(n + 1) * k).astype(int), 0, None)
    best = None
    nx = int((w) / k) + 1; ny = int((h) / k) + 1
    for oy in np.arange(0, k, 1.0):
        ye = edges(oy - k, ny + 1); ye = ye[ye <= h]
        for ox in np.arange(0, k, 1.0):
            xe = edges(ox - k, nx + 1); xe = xe[xe <= w]
            Y_a, Y_b = ye[:-1][:, None], ye[1:][:, None]; X_a, X_b = xe[:-1][None], xe[1:][None]
            n = (Y_b - Y_a) * (X_b - X_a); n = np.maximum(n, 1)
            s1 = I1[Y_b, X_b] - I1[Y_a, X_b] - I1[Y_b, X_a] + I1[Y_a, X_a]
            s2 = I2[Y_b, X_b] - I2[Y_a, X_b] - I2[Y_b, X_a] + I2[Y_a, X_a]
            v = (s2 - s1 * s1 / n).sum()
            if best is None or v < best[0]: best = (v, ox, oy)
    _, ox, oy = best
    ye = edges(oy - k, ny + 1); ye = ye[ye <= h]; xe = edges(ox - k, nx + 1); xe = xe[xe <= w]
    out = np.zeros((len(ye) - 1, len(xe) - 1, 3)); op = np.zeros((len(ye) - 1, len(xe) - 1), bool)
    mm = m[Y0:Y1 + 1, X0:X1 + 1]
    for r in range(len(ye) - 1):
        for c in range(len(xe) - 1):
            ya, yb, xa, xb = ye[r], ye[r + 1], xe[c], xe[c + 1]
            if yb - ya < 2 or xb - xa < 2: continue
            my, mxx = max(1, (yb - ya) // 4), max(1, (xb - xa) // 4)
            blk = sub[ya + my:yb - my, xa + mxx:xb - mxx].reshape(-1, 3); bm = mm[ya + my:yb - my, xa + mxx:xb - mxx]
            if not blk.size: continue
            bmf = bm.reshape(-1)
            if bmf.mean() <= .5: continue
            col = np.median(blk[bmf], 0); out[r, c] = col; op[r, c] = np.abs(col - bg).sum() > 150   # bg-tinted fringe blocks stay transparent
    return out, op

def quant(rgb, op):
    q = np.zeros(rgb.shape, np.uint8)
    if a.own: return np.clip(rgb, 0, 255).astype(np.uint8)
    lab = rgb2lab(np.clip(rgb, 0, 255).astype(np.uint8))
    pl = np.concatenate([pal_lab, rgb2lab(np.array([[bg]], np.uint8))[0]])   # the background is a candidate too: magenta-tinted fringe goes transparent
    d = ((lab[:, :, None, :] - pl[None, None]) ** 2).sum(3); am = d.argmin(2); op &= am < len(pal)
    q = pal[np.minimum(am, len(pal) - 1)].astype(np.uint8)
    if a.remap:
        q2 = q.copy()
        for fr, to in json.loads(a.remap): q2[(q == np.array(fr)).all(2)] = to
        q = q2
    return q

def tidy(q, op):
    o = op.copy()
    nb = ndimage.convolve(o.astype(int), np.ones((3, 3), int), mode='constant') - o
    o[(o) & (nb <= 1)] = False                      # lone pixels
    o[(~o) & (nb >= 7)] = True                       # pin holes
    lab, n = ndimage.label(o)
    if n > 1:
        sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); o = lab == 1 + int(np.argmax(sz))
    rgba = np.zeros(q.shape[:2] + (4,), np.uint8); rgba[..., :3] = q; rgba[..., 3] = o * 255
    yy, xx = np.where(o); return rgba[yy.min():yy.max() + 1, xx.min():xx.max() + 1]

res = []
for j, i in enumerate(sel):
    rgb, op = to_art(i); q = quant(rgb, op); fr = tidy(q, op); res.append(fr)
    Image.fromarray(fr).save(os.path.join(a.out, f'walk_{j + 1}.png'))
# the idle itself as frame 0 (scale reference for tools/import_pack.py walk_dir)
ia = np.zeros(idle.shape[:2] + (4,), np.uint8); ia[..., :3] = idle; ia[..., 3] = imask * 255
Image.fromarray(ia).save(os.path.join(a.out, 'walk_0.png'))
json.dump({'sel': sel, 'k': k, 'cycle': [int(s0), int(s1)]}, open(os.path.join(a.out, 'info.json'), 'w'))
# preview: idle + frames on magenta, x5
cw = max(r.shape[1] for r in res + [ia]) + 4; Hh = max(r.shape[0] for r in res + [ia]) + 4
P = Image.new('RGBA', (cw * (len(res) + 1), Hh), (255, 0, 255, 255))
for j, r in enumerate([ia] + res):
    im = Image.fromarray(r); P.alpha_composite(im, (j * cw + (cw - im.width) // 2, Hh - 2 - im.height))
P = P.convert('RGB'); P.resize((P.width * 5, P.height * 5), Image.NEAREST).save(os.path.join(a.out, 'preview.png'))
print('sizes', [r.shape[:2] for r in res], 'idle', ia.shape[:2])
