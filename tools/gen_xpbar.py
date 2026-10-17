#!/usr/bin/env python3
"""Builds assets/xpbar.png (an atlas of pieces) from assets/src/xpbar_src.png, the EXP bar artwork.

The artwork is one picture on a black background with sample text baked in (LV 1, 12450 / 15000, 85%). The game needs the parts
separately: the medallion + level plates (left cap), the number panel (right cap), the beam (body + head) that fills the bar, and the
two rails that run between the caps. This script cuts them out, makes the black background transparent, erases the sample text and the
beam from the caps (the game draws the real values / the real beam), and writes the atlas + the layout in src/js/xpbar_meta.js
(the build embeds both). Usage: python3 tools/gen_xpbar.py"""
import json, pathlib
import numpy as np
from PIL import Image
import cv2
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'src' / 'xpbar_src.png'
im = Image.open(SRC).convert('RGB')
A = np.array(im).astype(np.int32)
H, W, _ = A.shape
mx = A.max(axis=2)

# ---- 1. transparency: the black background connected to the border (a soft ramp keeps the glow) ----
near = mx < 36
lab, n = ndi.label(near)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
border.discard(0)
bg = np.isin(lab, list(border))
alpha = np.full((H, W), 255, np.uint8)
ramp = np.clip((mx - 8) / 22.0, 0, 1)
alpha[bg] = (ramp[bg] * 255).astype(np.uint8)

rgba = np.dstack([A.astype(np.uint8), alpha])

def box(x0, y0, x1, y1):
    return rgba[y0:y1, x0:x1].copy()

# ---- 2. geometry of the artwork (pixels of the source picture) ----
Y0, Y1 = 171, 399                 # common vertical range of the caps
CH0, CH1 = 257, 314               # inside of the channel (the beam), rows
LX0, LX1 = 44, 436                # left cap: medallion + the two level plates
RX0, RX1 = 655, 968               # right cap: number panel
CHL = 247                         # first column of the channel (just right of the medallion ring)
CHR = 805                         # last column of the beam (the inset panel starts here)

def cleanup_arcs(img, rect, extra=None):
    """remove the electric arcs / sparks (cyan, yellow-white and pure white lines) that cross the frame inside rect, by inpainting"""
    x0, y0, x1, y1 = rect
    sub = img[y0:y1, x0:x1, :3].astype(np.int32)
    r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
    cyan = (b > 170) & (g > 90) & (b - r > 60)
    spark = (r > 215) & (g > 215) & (b < 200)
    m = cyan | spark
    if extra is not None:
        m |= extra(sub)
    m = ndi.binary_dilation(m, iterations=1)
    out = cv2.inpaint(np.ascontiguousarray(sub.astype(np.uint8)), m.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA)
    img[y0:y1, x0:x1, :3] = out
    return m

def flat_fill(img, rect):
    """erase text in rect: every row takes the median of the plate-coloured (navy) pixels of that row inside rect"""
    x0, y0, x1, y1 = rect
    for y in range(y0, y1):
        row = img[y, x0:x1, :3].astype(np.int32)
        ok = (row[:, 2] >= 45) & (row.max(axis=1) < 115) & (row[:, 2] >= row[:, 0] + 12)
        if ok.sum() < 3:
            ok = (row.max(axis=1) < 115) & (row.min(axis=1) > 4)
        col = np.median(row[ok], axis=0) if ok.sum() else np.array([30, 28, 68])
        img[y, x0:x1, :3] = col.astype(np.uint8)
        img[y, x0:x1, 3] = 255

work = rgba.copy()

def glow_off(img, rect, maxv=150, keep_warm=True):
    """the blue halo around the arcs: inside rect, dark bluish pixels fade out by brightness (frame colours - orange, silver - stay)"""
    x0, y0, x1, y1 = rect
    sub = img[y0:y1, x0:x1]
    r, g, b = sub[..., 0].astype(int), sub[..., 1].astype(int), sub[..., 2].astype(int)
    m = np.maximum(np.maximum(r, g), b)
    sel = (m < maxv) & (b > r + 14)
    a = np.clip((m - 75) / 70.0, 0, 1)
    sub[..., 3] = np.where(sel, np.minimum(sub[..., 3], (a * 255).astype(np.uint8)), sub[..., 3])


# ---- 3. left cap: erase "LV 1" and "LEVEL 1", cut the channel hole ----
flat_fill(work, (256, 208, 334, 239))     # LV 1 (plate interior)
flat_fill(work, (256, 326, 352, 349))     # LEVEL 1 (lower plate)
glow_off(work, (338, 180, LX1, 244))
glow_off(work, (338, 326, LX1, 380))
left = work[Y0:Y1, LX0:LX1].copy()
# the channel: transparent, so the game can draw the empty channel + the beam in it
left[CH0 - Y0:CH1 - Y0, CHL - LX0:, 3] = 0
# arcs that leak outside the channel at the right end of the cap
cleanup_arcs(left, (330 - LX0, 190 - Y0, LX1 - LX0, 249 - Y0))
cleanup_arcs(left, (330 - LX0, 320 - Y0, LX1 - LX0, 360 - Y0))

# the blue blob where the first arc starts, and stray pixels above / below the cap: transparent (the cap's gold trims are warm colours and stay)
lx = left[:, 400 - LX0:]
for (ya, yb) in ((190, 243), (330, 380)):
    sub = lx[ya - Y0:yb - Y0 if yb < Y1 else None]
    r_, g_, b_ = sub[..., 0].astype(int), sub[..., 1].astype(int), sub[..., 2].astype(int)
    kill = (b_ > r_ + 20) | (np.minimum(np.minimum(r_, g_), b_) > 190)
    sub[kill, 3] = 0
left[(350 - Y0):, 330 - LX0:, 3] = 0
left[:(200 - Y0), 340 - LX0:, 3] = 0
left[..., 3] = np.where(left[..., 3] < 70, 0, left[..., 3])

# ---- 4. right cap: erase the numbers, remove arcs and the beam head, cut the channel hole ----
flat_fill(work, (716, 212, 922, 246))     # 12450 / 15000
flat_fill(work, (808, 259, 922, 311))     # 85%
glow_off(work, (RX0, 180, 712, 248))
glow_off(work, (RX0, 328, 830, 400))
right = work[Y0:Y1, RX0:RX1].copy()
right[CH0 - Y0:CH1 - Y0, 0:CHR - RX0, 3] = 0       # channel hole (where the beam runs)
def extra_r(sub):
    return np.zeros(sub.shape[:2], bool)
_rt = rgba[244:258, 326:334]; _rb = rgba[312:326, 326:334]
for x in range(0, CHR - RX0):
    right[244 - Y0:258 - Y0, x] = _rt[:, x % 8]
    right[312 - Y0:326 - Y0, x] = _rb[:, x % 8]
_bl = right[196 - Y0:250 - Y0, 0:22]
_k = (_bl[..., 2].astype(int) > _bl[..., 0].astype(int) + 20) & (_bl[..., :3].max(axis=2) > 90) | (_bl[..., :3].min(axis=2) > 190)
_bl[_k, 3] = 0
cleanup_arcs(right, (0, 196 - Y0, 60, 252 - Y0))
cleanup_arcs(right, (0, 312 - Y0, 190, 372 - Y0))
cleanup_arcs(right, (0, 240 - Y0, 160, 260 - Y0))
# anything bright and bluish/yellow left over below the lower rail, left of the +EXP plate -> transparent
sub = right[330 - Y0:Y1 - Y0 - 20, 0:150]
rr, gg, bb = sub[..., 0].astype(int), sub[..., 1].astype(int), sub[..., 2].astype(int)
junk = (np.maximum(np.maximum(rr, gg), bb) > 60)
junk &= ~((rr > 160) & (gg < 140) & (bb < 90))     # keep the orange line
sub[junk, 3] = 0
sub[..., 3] = np.where(sub[..., 3] < 90, 0, sub[..., 3])

# ---- 5. beam: body (stretched in the game) and head (fixed size) ----
beam = rgba[CH0:CH1, 256:CHR].copy()
beam[..., 3] = 255
body = beam[:, 0:640 - 256].copy()
head = beam[:, 640 - 256:].copy()
for i in range(14):
    head[:, head.shape[1] - 1 - i, 3] = int(255 * (i / 14.0) ** 1.3)   # soft tip

# ---- 6. rails that run between the caps ----
rail_t = rgba[244:258, 326:334].copy()
rail_b = rgba[312:328, 326:334].copy()

# ---- 7. atlas ----
pieces = [('left', left), ('right', right), ('body', body), ('head', head), ('railT', rail_t), ('railB', rail_b)]
aw = max(p.shape[1] for _, p in pieces)
ah = sum(p.shape[0] + 2 for _, p in pieces)
atlas = np.zeros((ah, aw, 4), np.uint8)
meta = {}
y = 0
for name, p in pieces:
    atlas[y:y + p.shape[0], 0:p.shape[1]] = p
    meta[name] = [0, y, p.shape[1], p.shape[0]]
    y += p.shape[0] + 2
meta['ch'] = {'y0': CH0 - Y0, 'y1': CH1 - Y0, 'x0': CHL - LX0, 'rx': CHR - RX0, 'railT': 244 - Y0, 'railB': 312 - Y0, 'h': Y1 - Y0}
out = ROOT / 'assets' / 'xpbar.webp'
Image.fromarray(atlas, 'RGBA').save(out, lossless=True, quality=100, method=6)
(ROOT / 'src' / 'js' / 'xpbar_meta.js').write_text('/* generated by tools/gen_xpbar.py - layout of the EXP bar atlas (assets/xpbar.webp) */\nconst XPB_META=' + json.dumps(meta, separators=(',', ':')) + ';\n')
print('xpbar atlas', atlas.shape[1], 'x', atlas.shape[0], out.stat().st_size, 'bytes', meta)
