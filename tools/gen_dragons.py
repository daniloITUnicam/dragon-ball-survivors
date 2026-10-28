"""The summoned dragons (v113): Shenron and Porunga, 3 frames each, from the pictures on magenta in assets/sprites/_sorgenti/draghi/.

  python3 tools/gen_dragons.py        (needs opencv-python, numpy, Pillow)

Reads   <id>_0.webp (frame 0, one figure) and <id>_12.webp (frames 1 and 2 side by side)
Writes  assets/sprites/effetti/<id>.webp: the 3 frames side by side (sprites.json cols 3), same size, the figure DRAG_H px tall, aligned on frame 0
        (the alpha masks are matched by trying small shifts), magenta keyed out and its fringe removed.
"""
import pathlib, numpy as np, cv2
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT/'assets/sprites/_sorgenti/draghi', ROOT/'assets/sprites/effetti'
DRAG_H, PAD = 640, 6

def key(rgb):
    """magenta -> transparent: how far min(R,B) stands above G (the backdrop is ~250 / 0 / 250, JPEG-noisy)"""
    f = rgb.astype(np.float32); m = np.minimum(f[...,0], f[...,2]) - f[...,1]
    a = np.clip((170 - m)/70, 0, 1)                          # m > 170 backdrop, < 100 figure
    a[(f[...,0] < 150) | (f[...,2] < 150)] = np.maximum(a[(f[...,0] < 150) | (f[...,2] < 150)], 1)
    # magenta spill (edges, thin whiskers): those pixels take the colour of the figure next to them
    pink = ((m > 22) & (a > 0)).astype(np.uint8)
    f[a == 0] = (28, 24, 34)   # the backdrop around them counts as the dark outline, not as magenta
    f = cv2.inpaint(np.clip(f, 0, 255).astype(np.uint8), cv2.dilate(pink, np.ones((2,2), np.uint8)), 3, cv2.INPAINT_TELEA).astype(np.float32)
    a = cv2.morphologyEx((a*255).astype(np.uint8), cv2.MORPH_OPEN, np.ones((2,2), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 60).astype(np.uint8))
    keep = np.isin(lab, [j for j in range(1, n) if st[j,4] > 400]); a[~keep] = 0   # specks of noise
    return np.dstack([np.clip(f, 0, 255), a]).astype(np.uint8)

def figures(rgba, n):
    """the n figures of a sheet, left to right, each cropped to its box"""
    cols = (rgba[...,3] > 60).sum(0); W = rgba.shape[1]
    if n == 1: cuts = [(0, W)]
    else:   # the emptiest column near the middle splits the two
        mid = W//2; lo, hi = int(W*.35), int(W*.65); c = lo + int(np.argmin(cols[lo:hi])); cuts = [(0, c), (c, W)]
    out = []
    for x0, x1 in cuts:
        a = rgba[:, x0:x1, 3] > 60; ys, xs = np.nonzero(a)
        out.append(rgba[ys.min():ys.max()+1, x0+xs.min():x0+xs.max()+1])
    return out

def scale(fig):
    k = DRAG_H/fig.shape[0]
    pm = fig.astype(np.float32); pm[...,:3] *= pm[...,3:4]/255
    r = cv2.resize(pm, (max(1, round(fig.shape[1]*k)), DRAG_H), interpolation=cv2.INTER_AREA)
    r[...,:3] /= np.maximum(r[...,3:4], 1)/255
    return np.clip(r, 0, 255).astype(np.uint8)

def align(ref, f, W, H):
    """place f on a W x H canvas where its mask overlaps ref's the most (ref is centred)"""
    best, bp = -1, (0, 0)
    ra = ref[...,3] > 60
    for dy in range(-24, 25, 3):
        for dx in range(-40, 41, 3):
            c = place(f, W, H, dx, dy)[...,3] > 60; s = (c & ra).sum()/max(1, (c | ra).sum())
            if s > best: best, bp = s, (dx, dy)
    return place(f, W, H, *bp), best

def place(f, W, H, dx=0, dy=0):
    c = np.zeros((H, W, 4), np.uint8); x = (W - f.shape[1])//2 + dx; y = H - PAD - f.shape[0] + dy
    xs, ys = max(0, x), max(0, y); xe, ye = min(W, x+f.shape[1]), min(H, y+f.shape[0])
    c[ys:ye, xs:xe] = f[ys-y:ye-y, xs-x:xe-x]; return c

def main():
    for did in ('shenron', 'porunga'):
        f0 = figures(key(np.array(Image.open(SRC/f'{did}_0.webp').convert('RGB'))), 1)
        f12 = figures(key(np.array(Image.open(SRC/f'{did}_12.webp').convert('RGB'))), 2)
        F = [scale(f) for f in f0 + f12]
        W = max(f.shape[1] for f in F) + 2*PAD + 40; H = DRAG_H + 2*PAD + 30
        ref = place(F[0], W, H); fr = [ref]
        for f in F[1:]:
            a, iou = align(ref, f, W, H); fr.append(a); print(f'{did}: frame aligned, overlap {iou:.2f}')
        sheet = np.concatenate(fr, 1)
        Image.fromarray(sheet).save(OUT/f'{did}.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
        print(f'{did}: {sheet.shape[1]}x{sheet.shape[0]} ({(OUT/f"{did}.webp").stat().st_size//1024} KB)')

if __name__ == '__main__':
    main()
