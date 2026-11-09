#!/usr/bin/env python3
"""Puts the face of the pack idle (walk_0.png) on every frame of a walk cycle, aligned on the eye (used for Super Saiyan 3, whose generated
video had a different face). The colours are those of the base / Super Saiyan palette (skin, eyes, mouth); the old face pixels the new one
does not cover are filled from the neighbouring hair / outline.
usage: walk_face.py <dir with walk_0..N.png> [x0 x1 y0 y1: window of the face in walk_0, default 16 30 11 22]"""
import sys, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage

d = sys.argv[1]
X0, X1, Y0, Y1 = (int(v) for v in (sys.argv[2:6] if len(sys.argv) > 5 else (16, 30, 11, 22)))
SKIN = [(247, 218, 179), (222, 157, 132), (164, 77, 89), (250, 153, 106)]
EYE = [(255, 255, 255), (242, 242, 242), (52, 141, 141), (79, 181, 157), (165, 181, 182)]
MOUTH = [(223, 77, 80)]
OUT = [(0, 0, 0), (16, 0, 16)]

def is_in(a, cols):
    m = np.zeros(a.shape[:2], bool)
    for c in cols: m |= (a[..., :3] == np.array(c)).all(2) & (a[..., 3] > 0)
    return m

idle = np.asarray(Image.open(os.path.join(d, 'walk_0.png')).convert('RGBA')).copy()
win = np.zeros(idle.shape[:2], bool); win[Y0:Y1, X0:X1] = True
face_i = (is_in(idle, SKIN) | is_in(idle, EYE) | is_in(idle, MOUTH)) & win
lab, n = ndimage.label(face_i)
eye_i = is_in(idle, EYE) & win
ey, ex = [v.mean() for v in np.where(eye_i)]
keep = set(lab[eye_i].tolist()) - {0}
sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
keep |= {1 + int(np.argmax(sz))}
face_i = np.isin(lab, list(keep))
face_i = ndimage.binary_fill_holes(face_i)
outl = is_in(idle, OUT) & win & ndimage.binary_dilation(face_i, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]]))
patch = face_i | outl
py, px = np.where(patch)
print('idle face', patch.sum(), 'px, eye at', round(ex, 1), round(ey, 1))

for f in sorted(glob.glob(os.path.join(d, 'walk_*.png'))):
    if f.endswith('walk_0.png'): continue
    a = np.asarray(Image.open(f).convert('RGBA')).copy(); h, w = a.shape[:2]
    top = np.zeros((h, w), bool); top[:int(h * .5)] = True
    eye = is_in(a, EYE) & top
    lab2, n2 = ndimage.label(eye)
    if n2 == 0: print(f, 'no eye'); continue
    sz2 = ndimage.sum(np.ones_like(lab2), lab2, range(1, n2 + 1)); eye = lab2 == 1 + int(np.argmax(sz2))
    wy, wx = [v.mean() for v in np.where(eye)]
    dx, dy = int(round(wx - ex)), int(round(wy - ey))
    # the old face: skin / eye / mouth pixels connected to the eye, around it
    fw = (is_in(a, SKIN) | is_in(a, EYE) | is_in(a, MOUTH))
    box = np.zeros((h, w), bool); box[max(0, int(wy) - 7):int(wy) + 6, max(0, int(wx) - 6):int(wx) + 9] = True
    lab3, _ = ndimage.label(fw & box); ids = set(lab3[eye].tolist()) - {0}
    old = np.isin(lab3, list(ids)) if ids else (fw & box)
    old = ndimage.binary_fill_holes(old)
    # paste the idle face (with its outline) over it
    newm = np.zeros((h, w), bool)
    for y, x in zip(py, px):
        yy, xx = y + dy, x + dx
        if 0 <= yy < h and 0 <= xx < w: a[yy, xx] = idle[y, x]; newm[yy, xx] = True
    # what is left of the old face: filled from the neighbouring hair / outline pixels
    left = old & ~newm
    for _ in range(6):
        if not left.any(): break
        src = (a[..., 3] > 0) & ~left & ~newm
        for y, x in zip(*np.where(left)):
            nb = [(y + j, x + i) for j, i in ((0, -1), (-1, 0), (0, 1), (1, 0)) if 0 <= y + j < h and 0 <= x + i < w and src[y + j, x + i]]
            if nb:
                cs = [tuple(a[q][:3]) for q in nb]; c = max(set(cs), key=cs.count); a[y, x, :3] = c; a[y, x, 3] = 255; left[y, x] = False
    Image.fromarray(a).save(f)
    print(os.path.basename(f), 'eye', round(wx, 1), round(wy, 1), 'shift', dx, dy, 'old face', int(old.sum()), 'left', int(left.sum()))
