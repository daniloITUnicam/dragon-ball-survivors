#!/usr/bin/env python3
"""Builds assets/hpbar.webp (an atlas of pieces) from assets/src/hpbar_src.png, the HP bar artwork.

The artwork is one picture on a black background with sample content baked in (a Goku portrait, "Lv. 1", "7500 / 7500", lightning arcs
over the frame and across the bar). The game needs the parts separately and without the sample content: the left cap (the medallion with a
transparent hole for the live character portrait + the HP / level plate), the right cap (the Dragon Ball end with spikes and flames), the
red-to-yellow fill (stretched over the channel and clipped to the current HP), and the two rails that run between the caps.
This script removes the arcs (inpainting / tiling the clean rails), erases the sample texts, cuts the pieces, makes the black background
transparent and writes the atlas + the layout in src/js/hpbar_meta.js (the build embeds both). Usage: python3 tools/gen_hpbar.py"""
import json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parent.parent
A = np.array(Image.open(ROOT / 'assets' / 'src' / 'hpbar_src.png').convert('RGB'))
H, W, _ = A.shape
work = A.copy()

# ---- geometry of the artwork (pixels of the source picture) ----
Y0, Y1 = 156, 424                 # common vertical range of both caps
LX0, LX1 = 52, 660                # left cap: medallion + plate + the frame up to where the plain rails start
RX0, RX1 = 846, 990               # right cap: Dragon Ball + spikes + flames (the fill ends at RX0)
CH0, CH1 = 260, 312               # channel rows (the fill)
CHL = 305                         # first column of the channel (inside the medallion frame)
PCX, PCY, PR = 178, 274, 82       # portrait circle (centre, radius): the inside of the medallion ring (the black outline starts at r=82)
TOPR0, TOPR1 = 241, 260           # top rail rows (incl. the channel's black outline)
BOTR0, BOTR1 = 312, 335           # bottom rail rows (incl. the channel's black outline)

# ---- 1. remove the lightning arcs from the frame ----
tileT = A[TOPR0:TOPR1, 600:608].copy()           # clean 8 px of the top rail
tileB = A[BOTR0:BOTR1, 668:676].copy()           # clean 8 px of the bottom rail (no plate below)
tileP = A[BOTR0:342, 560:568].copy()             # clean 8 px of the bottom rail + the lower gold plate's top
work[185:TOPR0, 462:858] = 0                      # above the rail: arcs and the "7500 / 7500" sample text
work[335:390, 668:858] = 0                        # below the rail (right of the lower plate): arcs
for x in range(462, 858):
    work[TOPR0:TOPR1, x] = tileT[:, (x - 462) % 8]
for x in range(530, 858):
    work[BOTR0:BOTR1, x] = tileB[:, (x - 530) % 8]
for x in range(424, 530):
    work[BOTR0:342, x] = tileP[:, (x - 424) % 8]
# the arc that dips into the lower gold plate / the black gap between rail and plate, left of x=668: sample column 560 below row 342 is plate art, untouched
# erase "Lv. 1" (the game draws the live level): the plate's dark interior
plate = np.median(A[372:376, 140:230].reshape(-1, 3), axis=0).astype(np.uint8)
work[375:409, 133:237] = plate

# ---- 2. the fill: the channel with the arcs removed (a horizontal median drops everything thinner than the window) ----
fill_src = A[CH0:CH1, CHL:RX0].astype(np.int32)
med = ndi.median_filter(fill_src, size=(1, 31, 1), mode='nearest')
diff = np.abs(fill_src - med).max(axis=2)
bad = ndi.binary_dilation(diff > 34, structure=np.ones((1, 3), bool))
fill = np.where(bad[..., None], med, fill_src).astype(np.uint8)
fill_rgba = np.dstack([fill, np.full(fill.shape[:2], 255, np.uint8)])

# ---- 3. transparency: the black background connected to the border (a soft ramp keeps the glow of the flames) ----
Wm = work.astype(np.int32)
mx = Wm.max(axis=2)
near = mx < 36
lab, n = ndi.label(near)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
border.discard(0)
bg = np.isin(lab, list(border))
alpha = np.full((H, W), 255, np.uint8)
ramp = np.clip((mx - 8) / 22.0, 0, 1)
alpha[bg] = (ramp[bg] * 255).astype(np.uint8)
rgba = np.dstack([work, alpha])

# ---- 4. left cap: the channel and the portrait become transparent holes ----
left = rgba[Y0:Y1, LX0:LX1].copy()
left[CH0 - Y0:CH1 - Y0, CHL - LX0:, 3] = 0
yy, xx = np.mgrid[Y0:Y1, LX0:LX1]
rr = np.hypot(xx - PCX, yy - PCY)
# the HP tab of the plate (black outline included) stays in front of the portrait
tab = (((yy >= 331) & (yy <= 332) & (xx >= 157) & (xx <= 211)) | ((yy >= 333) & (yy <= 334) & (xx >= 154) & (xx <= 215)) | ((yy >= 335) & (xx >= 152) & (xx <= 218)))
hole = (rr < PR) & ~tab
# the black outline ring around the portrait is closed art: keep it opaque (the flood fill of the background leaks into it through the gap by the tab) and
# turn the orange remnants of the old portrait at its inner edge black
ann = (rr >= PR) & (rr <= 90) & ~tab
left[ann, 3] = 255
inner = ann & (rr < 85.5)
left[inner, 0:3] = np.array([8, 6, 8], np.uint8)
left[hole, 3] = 0
right = rgba[Y0:Y1, RX0:RX1].copy()

# ---- 5. rails that run between the caps ----
def tile(rows, x0):
    t = rgba[rows[0]:rows[1], x0:x0 + 8].copy()
    return t
rail_t = tile((TOPR0, TOPR1), 600)
rail_b = tile((BOTR0, BOTR1), 668)

# ---- 6. atlas ----
pieces = [('left', left), ('right', right), ('fill', fill_rgba), ('railT', rail_t), ('railB', rail_b)]
aw = max(p.shape[1] for _, p in pieces)
ah = sum(p.shape[0] + 2 for _, p in pieces)
atlas = np.zeros((ah, aw, 4), np.uint8)
meta = {}
y = 0
for name, p in pieces:
    atlas[y:y + p.shape[0], 0:p.shape[1]] = p
    meta[name] = [0, y, p.shape[1], p.shape[0]]
    y += p.shape[0] + 2
meta['ch'] = {'y0': CH0 - Y0, 'y1': CH1 - Y0, 'x0': CHL - LX0, 'h': Y1 - Y0, 'railT': TOPR0 - Y0, 'railB': BOTR0 - Y0}
meta['pt'] = {'cx': PCX - LX0, 'cy': PCY - Y0, 'r': PR}                      # portrait circle (left-cap pixels)
meta['plate'] = [133 - LX0, 375 - Y0, 237 - 133, 409 - 375]                   # the level plate's dark interior (left-cap pixels)
meta['hpText'] = {'x1': 855 - RX0, 'y': 224 - Y0}                          # "cur / max" is right-aligned above the rail: x relative to the right cap's left edge, y relative to the top
out = ROOT / 'assets' / 'hpbar.webp'
Image.fromarray(atlas, 'RGBA').save(out, lossless=True, quality=100, method=6)
(ROOT / 'src' / 'js' / 'hpbar_meta.js').write_text('/* generated by tools/gen_hpbar.py - layout of the HP bar atlas (assets/hpbar.webp) */\nconst HPB_META=' + json.dumps(meta, separators=(',', ':')) + ';\n')
print('hpbar atlas', atlas.shape[1], 'x', atlas.shape[0], out.stat().st_size, 'bytes')
# preview of the pieces assembled flat (for a quick look)
prev = np.zeros((Y1 - Y0, 760 + 100, 4), np.uint8)
prev[:, :, :3] = (60, 60, 70); prev[:, :, 3] = 255
def over(dst, src, x0, y0):
    a = src[..., 3:4].astype(np.float32) / 255
    h, w = src.shape[:2]
    dst[y0:y0 + h, x0:x0 + w, :3] = (src[..., :3] * a + dst[y0:y0 + h, x0:x0 + w, :3] * (1 - a)).astype(np.uint8)
mid = 100
fl = np.array(Image.fromarray(fill_rgba, 'RGBA').resize((LX1 - LX0 + mid - (CHL - LX0), CH1 - CH0), Image.BILINEAR))
over(prev, fl, CHL - LX0, CH0 - Y0)
over(prev, left, 0, 0)
for x in range(0, mid):
    over(prev, rail_t[:, x % 8:x % 8 + 1], LX1 - LX0 + x, TOPR0 - Y0)
    over(prev, rail_b[:, x % 8:x % 8 + 1], LX1 - LX0 + x, BOTR0 - Y0)
over(prev, right, LX1 - LX0 + mid, 0)
Image.fromarray(prev[..., :3]).save('/tmp/hp/preview_flat.png')
