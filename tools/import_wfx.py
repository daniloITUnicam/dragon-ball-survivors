#!/usr/bin/env python3
"""Weapon effect sheets (AI art on a black background) -> assets/sprites/armi/wfx<id>.webp + sprites.json entries.
Usage: python3 tools/import_wfx.py "<folder with the .jpg/.png sheets>" [ids...]   (no ids = all of them)

The AI sheets are only roughly a grid: frames drift off their cell, some are wider than it, a row may hold fewer frames than the others.
So every row is cut by one of these layouts (SPEC 'lay', one letter per row, default 'g'):
  g  plain grid: cells of W/cols (the body of a beam, which is meant to tile edge to edge)
  c  the frames are found where the art is (columns with light, sparks merged into the nearest frame) and each one is centred in its cell
  l  same, the frame's left edge on the cell's left (beams that start from the hands: the start must not move from frame to frame)
  r  same, the right edge on the cell's right (the tip of a beam, the head of a comet: it must not jump)
  o  overlapping frames (an explosion wider than its cell): a round window on the cell centre, radius R x cell width, faded at the rim,
     and where two frames overlap each pixel fades toward the frame whose centre is nearer (no straight cut)
  O  same, but the window sits on each frame's own centre of light (frames that drifted off the AI grid: a ball keeps its place)
Options: grow = (boxes) each box also takes that share of its width from the neighbours, keeping only the art connected to the
frame's own centre of light; rclip / sym = (boxes) art further right (and left) than rclip x the ball's height from its centre goes;
gfade = (grid sheets) the beam body row fades out over that share of its top and bottom; cores = write the centre of light of every frame (for balls drawn on their core), clipr = {frame: share of a cell}: in an 'o' window, art further right than that from the centre goes, drop = frames of a one-row sheet to leave out (broken AI frames), bg = the colour of a light background, (r, g, b), or 'auto' for a grey gradient (the commonest grey of every row; with a
plain white sheet give (255, 255, 255): rows full of art would measure their shadows as the background), removed by matte(), halo = how much of the soft glow around the art to keep (0..1), core = the biggest enclosed light area (share of a cell) kept solid, thr = how far from the background a
pixel must be to count as solid paint, satk = also needs this saturation (or to be dark), soft = every frame fades out over that share
of its sides (art whose glow was cut square by the AI's own frame), ord = the order to play the frames in, n = frames in the row when the art has fewer than cols, pad = frames wider than their cell get a bigger cell instead of being cut:
the art is scaled down by pad inside the cell and pad goes in the metadata, so the game draws the cell pad times bigger (same size on screen).
Sheets that are no grid at all (frames of every size, the character drawn next to its beam) are cut by BOXES instead: box = [[x0, y0,
x1, y1], ...] source rectangles in play order (or grid = (cols, rows, [cells]) for the cells of a regular grid), one game row of frames,
anc = where each frame sits in its cell ('c' centre, 'k' centre of light, 'l' left: beams that start at the hands, 'r' right), kgrey = erase the dark grey
silhouettes some AI sheets draw behind the effect. Every box is trimmed to its art; a side that cuts through art fades out.
meta = extra keys for sprites.json (frame ranges the game reads: fly, boom, form, charge, mz, rot, dir).
Cut sides fade out (no square edges). The scale is the same for every frame: frame width in the game sheet / (W / cols) / pad.
A row with fewer frames than cols writes rc (frames per row) in the metadata; the hot spot (hx, hy) is the centre of the brightest
pixels of row 0, as a fraction of the frame."""
import sys, json, pathlib
from PIL import Image
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import wfx_crop
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT/'assets'/'sprites'/'armi'
SPEC = {   # id: (source file, columns, rows, frame width in the game sheet, options: band=(y0, y1) of the source, lay, R)
  'ki':      ('Colpo di ki.jpg', 0, 0, 160, {'anc': 'k', 'grow': .3, 'rclip': .62, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),   # boxes: every ball keeps its centre of light on the same spot
  'homing':  ('Colpi Eccentrici.jpg', 0, 0, 160, {'anc': 'k', 'grow': .3, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'javelin': ('Lancia Ribelle.jpg', 8, 2, 192, {}),
  'disc':    ('disco.jpg', 0, 0, 160, {'anc': 'k', 'grow': .3, 'rclip': .85, 'sym': 1, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'spirit':  ('Genkidama.jpg', 0, 0, 256, {'anc': 'k', 'grow': .3, 'rclip': .6, 'sym': 1, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'aura':    ('Aura.jpg', 8, 1, 320, {}),
  'flare':   ('Taiyoken.jpg', 8, 1, 288, {}),
  'slash':   ('Spada.jpg', 6, 1, 288, {'lay': 'c'}),
  'kame':    ('kamehameha.jpg', 8, 3, 256, {'lay': 'cgr'}),       # row 0 charge + muzzle, row 1 body tiles, row 2 the tip (6 frames)
  'dbeam':   ('Raggio Perforante.jpg', 6, 3, 256, {'lay': 'ggr'}),
  'bigbang': ('Attacco Big Bang.jpg', 8, 1, 256, {'band': (380, 960), 'lay': 'o', 'R': .56}),  # Vegeta - Big Bang Attack (charge 0-3, blast 4, ring 5-7)
  'breaker': ('cannone cancellatore.jpg', 8, 1, 224, {'lay': 'O', 'R': .6, 'cores': 1}),   # Break Cannon: spark, swirl, 3 flying, blast, ring, smoke
  'hakai':   ('sfera della distruzione.jpg', 10, 1, 192, {'bg': (255, 255, 255), 'lay': 'O', 'R': .6, 'core': .015, 'cores': 1}),   # Sphere of Destruction (white background): 0-2 forming, 3-6 flying, 7-9 burst
  # evolutions: the same weapon from its first evolution on (sheet id <weapon>evo: sprite ids are lowercase letters and digits only)
  'kievo':      ('evoluzioni/colpo di ki.jpg', 0, 0, 192, {'anc': 'k', 'grow': .3, 'rclip': .62, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'homingevo':  ('evoluzioni/colpi eccentrici.jpg', 0, 0, 192, {'anc': 'k', 'grow': .3, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'javelinevo': ('evoluzioni/lancia rebelle.jpg', 8, 2, 224, {'soft': .04}),
  'discevo':    ('evoluzioni/disco distruttore.jpg', 0, 0, 192, {'anc': 'k', 'grow': .3, 'rclip': .85, 'sym': 1, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'spiritevo':  ('evoluzioni/genkidama.jpg', 0, 0, 288, {'anc': 'k', 'grow': .3, 'rclip': .6, 'sym': 1, 'grid': (8, 1, [0, 3, 5, 6, 7])}),   # cells 1, 2 and 4 of the AI sheet are smeared or cut
  'auraevo':    ('evoluzioni/aura.jpg', 9, 1, 320, {'bg': (255, 255, 255), 'soft': .06, 'halo': .4, 'satk': .68}),   # white background, 9 frames
  'flareevo':   ('evoluzioni/taiyoken.jpg', 8, 1, 320, {'soft': .1}),
  'slashevo':   ('evoluzioni/spada.jpg', 6, 1, 320, {'lay': 'c', 'pad': 1}),
  'kameevo':    ('evoluzioni/kamehameha.jpg', 8, 3, 256, {'lay': 'cgr'}),
  'dbeamevo':   ('evoluzioni/raggio perforante.jpg', 6, 3, 256, {'lay': 'ggr'}),
  'breakerevo': ('evoluzioni/cannone cancellatore.jpg', 8, 1, 256, {'lay': 'O', 'R': .6, 'cores': 1}),
  'hakaievo':   ('evoluzioni/sfera della distruzione.jpg', 10, 1, 224, {'bg': 'auto', 'lay': 'O', 'R': .6, 'core': .015, 'thr': 60, 'cores': 1}),   # grey gradient background
  # second evolutions (sheet id <weapon>ev2)
  'kiev2':      ('evoluzioni/evoluzioni 2/colpo di ki.jpg', 0, 0, 208, {'anc': 'k', 'grow': .3, 'rclip': .62, 'lmax': .98, 'grid': (8, 1, [0, 1, 2, 3, 4, 5, 6, 7])}),
  'homingev2':  ('evoluzioni/evoluzioni 2/colpi eccentrici.jpg', 0, 0, 208, {'anc': 'k', 'grow': .3, 'grid': (8, 1, [0, 1, 2, 3, 5, 6, 7])}),   # cell 4 is a swirl, not an orb
  'javelinev2': ('evoluzioni/evoluzioni 2/lancia ribelle.jpg', 0, 0, 240, {'anc': 'k', 'grow': .2, 'band': (330, 704), 'grid': (8, 1, list(range(8)))}),   # the lower row (black background), 8 spears
  'discev2':    ('evoluzioni/evoluzioni 2/disco distruttore.jpg', 0, 0, 208, {'anc': 'k', 'grow': .3, 'rclip': .85, 'sym': 1, 'grid': (9, 1, [0, 1, 2, 3, 4, 5, 6, 7, 8])}),
  'spiritev2':  ('evoluzioni/evoluzioni 2/genkidama.jpg', 0, 0, 304, {'anc': 'k', 'grow': .3, 'rclip': .6, 'sym': 1, 'grid': (11, 1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 'meta': {'loop': [1, 4]}}),   # the falling sphere loops the swirls 1-4
  'auraev2':    ('evoluzioni/evoluzioni 2/aura.jpg', 10, 1, 336, {'bg': 'auto', 'soft': .06, 'halo': .4, 'satk': .68}),
  'flareev2':   ('evoluzioni/evoluzioni 2/taiyoken.jpg', 8, 1, 336, {'soft': .1}),
  'slashev2':   ('evoluzioni/evoluzioni 2/spada.jpg', 8, 1, 336, {'lay': 'c', 'pad': 1}),
  'kameev2':    ('evoluzioni/evoluzioni 2/kamehameha.jpg', 10, 3, 256, {'lay': 'ggr', 'n': [10, 10, 6], 'gfade': .16, 'meta': {'ch': [0, 6], 'mz': [5, 6], 'body': [1, 9], 'tx': [.03, .5], 'tip': [0, 5], 'thk': .85}}),   # row 0: 7 charge frames + 3 beam starts; the body tiles have a head on the right: only their left half tiles
  'dbeamev2':   ('evoluzioni/evoluzioni 2/raggio perforante.jpg', 6, 3, 256, {'lay': 'cgr', 'n': [6, 6, 5], 'gfade': .2, 'meta': {'mz': [0, 2], 'tip': [0, 2], 'thk': .5}}),
  'breakerev2': ('evoluzioni/evoluzioni 2/cannone cancellatore.jpg', 0, 0, 272, {'anc': 'k', 'kgrey': 1, 'meta': {'fly': [2, 5], 'boom': [6, 11]}, 'box': [
      [1629, 29, 1803, 206], [470, 282, 661, 492], [629, 556, 1032, 790], [1202, 556, 1581, 790], [1823, 556, 2129, 790], [2290, 556, 2685, 790],
      [48, 870, 484, 1113], [645, 815, 1210, 1113], [1335, 815, 1960, 1129], [2008, 830, 2710, 1137], [73, 1185, 589, 1508], [694, 1150, 1339, 1524]]}),
  'hakaiev2':   ('evoluzioni/evoluzioni 2/sfera della distruzione.jpg', 0, 0, 240, {'anc': 'k', 'grid': (6, 4, list(range(22))), 'meta': {'form': [0, 5], 'fly': [6, 15], 'boom': [16, 21]}}),
  'bigbangev2': ('evoluzioni/evoluzioni 2/attacco big bang.jpg', 0, 0, 288, {'anc': 'k', 'meta': {'charge': [0, 3], 'fly': [4, 5], 'boom': [6, 9]}, 'box': [
      [82, 182, 291, 400], [400, 145, 664, 436], [764, 91, 1164, 500], [1236, 64, 1718, 527], [1782, 55, 2300, 564], [2345, 27, 3045, 618],
      [45, 718, 745, 1209], [818, 618, 1564, 1336], [1600, 636, 2364, 1300], [2418, 655, 3091, 1273]]}),
  # Galick Gun (Vegeta): the charge at the hand ('k'), the beam frames ('l': they start at the hands), the second evolution's blast
  'galick':     ('Cannone Garlick.jpg', 0, 0, 192, {'anc': 'k', 'grid': (6, 2, [0, 1])}),   # (cell 2 already has the beam coming out)
  'galickb':    ('Cannone Garlick.jpg', 0, 0, 512, {'anc': 'l', 'grid': (6, 2, [3, 4, 5, 6, 7, 8, 9, 10, 11]), 'meta': {'loop': [1, 4], 'end': [5, 8]}}),
  'galickev2':  ('evoluzioni/evoluzioni 2/garlick gun.jpg', 0, 0, 192, {'anc': 'k', 'grid': (8, 2, [0, 1, 2, 3, 4])}),
  'galickbev2': ('evoluzioni/evoluzioni 2/garlick gun.jpg', 0, 0, 512, {'anc': 'l', 'grid': (8, 2, [5, 6, 7, 8, 9, 10]), 'meta': {'loop': [1, 5]}}),
  'galickxev2': ('evoluzioni/evoluzioni 2/garlick gun.jpg', 0, 0, 256, {'anc': 'k', 'grid': (8, 2, [12, 13, 14, 15])}),
  # character abilities (key R)
  'abff':    ('Lampo Finale.jpg', 4, 2, 320, {'lay': 'll', 'pad': 1}),     # Vegeta - Final Flash
  'abnova':  ('Supernova.jpg', 4, 2, 288, {'lay': 'cc'}),        # Frieza / Cooler - Supernova
  'abdb':    ('Raggio Letale.jpg', 8, 1, 256, {'band': (540, 800)}),   # Frost - Death Beam
  'absbc':   ('Raggio Speciale.jpg', 8, 1, 256, {'band': (470, 870), 'lay': 'l', 'n': 7, 'pad': 1}), # Piccolo - Special Beam Cannon (7 frames, the last one long)
  'abkib':   ('Lama di Ki.jpg', 8, 1, 256, {'band': (380, 980), 'lay': 'o', 'R': .62}),      # Goku Black - Ki Blade
  'abdodon': ('Raggio Dodon.jpg', 2, 4, 384, {'band': (212, 1157)}),   # Tenshinhan / Chiaotzu - Dodon Ray
  'abmasenko': ('Masenko.jpg', 4, 2, 320, {'lay': 'll', 'pad': 1}),        # Gohan - Masenko
  'abmeteor': ('Meteora Gigante.jpg', 4, 2, 320, {'lay': 'rr'}), # Broly - Gigantic Meteor (comet flying right)
  # final forms of the abilities (sheet id <ability>2): only the effect, the character drawn in the AI sheet is left out
  'abff2':      ('evoluzioni/evoluzioni 2/lampo finale.jpg', 0, 0, 640, {'anc': 'l', 'xr': 24, 'box': [
      [1232, 380, 1800, 722], [1890, 385, 2745, 695], [222, 728, 1345, 1122], [1582, 735, 2745, 1150], [205, 1148, 1372, 1522], [1538, 1175, 2600, 1505]]}),
  'abmasenko2': ('evoluzioni/evoluzioni 2/masenko.jpg', 0, 0, 640, {'anc': 'l', 'xr': 24, 'box': [
      [150, 630, 945, 832], [1085, 630, 1752, 832], [1892, 610, 2705, 852], [150, 880, 962, 1140], [1085, 875, 1800, 1162], [1838, 875, 2712, 1168],
      [150, 1212, 962, 1502]]}),
  'abdodon2':   ('evoluzioni/evoluzioni 2/raggio dodon.jpg', 0, 0, 640, {'anc': 'l', 'xr': 24, 'box': [[48, 498, 1121, 905], [1226, 482, 2669, 921], [80, 958, 1516, 1494], [1613, 1071, 2565, 1389]]}),
  'absbc2':     ('evoluzioni/evoluzioni 2/raggio speciale.jpg', 0, 0, 512, {'anc': 'l', 'box': [   # 0-1 the charge on the fingers, then the spiral beam
      [86, 20, 610, 498], [758, 2, 1428, 513], [1512, 27, 2901, 501], [3010, 8, 4128, 506], [0, 519, 1040, 1011], [1068, 525, 2085, 1005], [2120, 528, 3030, 992], [3070, 516, 4128, 1024]]}),
  'abdb2':      ('evoluzioni/evoluzioni 2/raggio letale.jpg', 0, 0, 512, {'anc': 'l', 'box': [
      [790, 468, 1250, 677], [1395, 435, 2040, 702], [2202, 435, 2742, 702], [65, 855, 621, 1052], [718, 840, 1331, 1078], [1403, 832, 2032, 1086], [2097, 785, 2734, 1132],
      [24, 1170, 653, 1520], [750, 1195, 1347, 1497], [1516, 1205, 2016, 1495], [2250, 1212, 2685, 1465]]}),
  'abnova2':    ('evoluzioni/evoluzioni 2/supernova.jpg', 0, 0, 320, {'anc': 'k', 'grid': (4, 3, list(range(12)))}),
  'abkib2':     ('evoluzioni/evoluzioni 2/lama di ki.jpg', 0, 0, 320, {'anc': 'c', 'kgrey': 1, 'black': 40, 'xr': 30, 'box': [
      [976, 112, 1210, 318], [1597, 66, 1960, 318], [2185, 100, 2640, 326], [185, 440, 640, 712], [734, 380, 1350, 745], [1411, 380, 2060, 760], [2105, 372, 2750, 760],
      [48, 762, 688, 1156], [2105, 778, 2745, 1132], [97, 1190, 648, 1518], [774, 1205, 1293, 1488]]}),
  'abmeteor2':  ('evoluzioni/evoluzioni 2/meteora gigante.jpg', 0, 0, 320, {'anc': 'k', 'grid': (4, 4, list(range(15))), 'meta': {'rot': -.68}}),   # the comet flies down-right in the art
}
BLACK = 16   # JPEG noise under this level is background
LIT = 40     # a column belongs to a frame when it has a few pixels brighter than this
def frames_of(m, cols):
    """x ranges of the frames of one row (m = brightest channel): runs of lit columns; small bits (sparks) go to the nearest frame
    until there are no more than cols"""
    occ = (m > LIT).sum(axis=0); on = occ > 2; W = len(on); s = []; i = 0
    while i < W:
        if not on[i]: i += 1; continue
        j = i
        while j < W and on[j:j+10].any(): j += 1
        s.append([i, j]); i = j
    while len(s) > cols:
        k = min(range(len(s)), key=lambda q: s[q][1]-s[q][0])
        if k == 0: n = 1
        elif k == len(s)-1: n = k-1
        else: n = k-1 if s[k][0]-s[k-1][1] < s[k+1][0]-s[k][1] else k+1
        a, b = sorted((k, n)); s[a] = [s[a][0], s[b][1]]; del s[b]
    return s
def alpha_of(cell, bgc=None):
    a = np.asarray(cell).astype(np.float32)
    if bgc is None:   # black background: alpha = brightest channel, colour un-premultiplied
        m = a.max(axis=2); al = np.clip((m-BLACK)/(255-BLACK), 0, 1)
        rgb = np.where(al[..., None] > 0, np.clip(a/np.maximum(m[..., None], 1)*255, 0, 255), 0)
        return np.dstack([rgb, al*255])
    B = np.asarray(bgc).astype(np.float32); d = a-B   # colour-to-alpha against the measured background B (C = a*F + (1-a)*B)
    ac = np.where(d > 0, d/np.maximum(255-B, 1), np.where(d < 0, -d/np.maximum(B, 1), 0)); raw = np.clip(ac.max(axis=2), 0, 1)
    F = np.clip(B+d/np.maximum(raw[..., None], 1e-3), 0, 255); al = np.clip((raw-BLACK/255)/(1-BLACK/255), 0, 1)
    return np.dstack([np.where(al[..., None] > 0, F, 0), al*255])
def matte(im, bgi, cell, halo=1.0, core=.002, thr=110, satk=0):
    """art on a light background, as premultiplied RGBA at the source size. Colour-to-alpha alone makes light art translucent (the white
    core of a flame, the light eye of a sphere), so the solid part is found first: the strongly coloured pixels (outlines, saturated
    paint), closed, plus the holes they enclose when a hole is tiny (an eye) or coloured (a yellow core); a pale hole (the floor inside
    a ring of fire) stays see-through. The solid part keeps the source colour at full opacity; the rest (glow, halo) is colour-to-alpha"""
    from scipy import ndimage
    a = np.asarray(im).astype(np.float32); B = np.asarray(bgi).astype(np.float32)
    rgba = alpha_of(a.astype(np.uint8), B.astype(np.uint8)); A = rgba[..., 3:]/255
    F = rgba[..., :3]; satF = (F.max(axis=2)-F.min(axis=2))/np.maximum(F.max(axis=2), 1)
    A = A*np.clip(satF/.45, 0, 1)[..., None]*halo   # a glow keeps its colour; grey left in it (the sheet's drop shadow, paper white) goes; halo < 1 thins it
    mx = a.max(axis=2); sat = (mx-a.min(axis=2))/np.maximum(mx, 1)
    strong = np.abs(a-B).max(axis=2) > thr
    if satk: strong &= (sat > satk) | (mx < 130) | ((mx > 225) & (sat > .3))   # saturated paint, a dark outline or a hot core (a muted pink halo is none of them)
    strong = ndimage.binary_closing(strong, structure=np.ones((5, 5)))
    lab, n = ndimage.label(~strong); solid = strong.copy()
    if n:
        area = np.bincount(lab.ravel(), minlength=n+1); edge = np.zeros(n+1, bool)
        for e in (lab[0], lab[-1], lab[:, 0], lab[:, -1]): edge[np.unique(e)] = True
        hs = ndimage.mean(a.max(axis=2)-a.min(axis=2), lab, np.arange(n+1))   # a coloured hole (a yellow core) is paint, a pale one (a pink floor) is glow
        fill = (~edge) & ((area < cell*core) | ((area < cell*.03) & (hs > 55))); fill[0] = False; solid |= fill[lab]
    solid = ndimage.binary_erosion(solid, structure=np.ones((3, 3)), iterations=2) | (solid & (A[..., 0] > .9))   # the anti-aliased rim (paint mixed with the background) comes from the colour-to-alpha
    k = ndimage.gaussian_filter(solid.astype(np.float32), 1.0)[..., None]
    col = rgba[..., :3]*A*(1-k)+a*k; al = A*(1-k)+k   # premultiplied mix of the colour-to-alpha and the opaque source
    return np.dstack([col, al*255])
def background(im):
    """the background colour of every row (white, or a grey gradient): the commonest grey of the row, smoothed over the rows"""
    a = np.asarray(im).astype(np.int16); H = a.shape[0]; grey = (a.max(axis=2)-a.min(axis=2)) < 14; v = a.mean(axis=2).astype(np.int16)
    rows = np.full(H, -1.0)
    for y in range(H):
        g = v[y][grey[y]]
        if g.size > a.shape[1]*.15: rows[y] = np.bincount(g, minlength=256).argmax()
    ok = rows >= 0
    rows = np.interp(np.arange(H), np.nonzero(ok)[0], rows[ok]) if ok.any() else np.full(H, 255.0)
    k = 15; rows = np.array([np.median(rows[max(0, y-k):y+k+1]) for y in range(H)])
    return Image.fromarray(np.repeat(np.repeat(rows[:, None, None], a.shape[1], axis=1), 3, axis=2).astype(np.uint8), 'RGB')
def strays(px):
    """bits of a neighbouring frame that reach into the round window (the tail or the edge of the next ball) go"""
    from scipy import ndimage
    al = px[..., 3] > 70; lab, n = ndimage.label(al, structure=np.ones((3, 3)))   # pieces are found on the solid art (glow would join them to the ball)
    if n < 2: return px
    h, w = al.shape; yy, xx = np.mgrid[0:h, 0:w]; d = np.hypot(xx-w/2, yy-h/2)/(min(w, h)/2)
    area = np.bincount(lab.ravel(), minlength=n+1); idx = np.arange(n+1); dmin = ndimage.minimum(d, lab, idx); dmax = ndimage.maximum(d, lab, idx); big = area[1:].max()
    gone = (dmin > .5) & ((area < big*.04) | (dmax > .85)); gone[0] = False   # far from the centre and small, or reaching the rim (a piece of the next frame)
    if not gone.any(): return px
    g = ndimage.binary_dilation(gone[lab], iterations=max(2, h//60)); px[..., 3] *= 1-ndimage.gaussian_filter(g.astype(np.float32), max(1, h/200)); return px   # its glow goes too
def fade(px, sides, k=.07):
    """sides 'lrtb' that were cut: alpha goes to 0 over the last k of the frame"""
    h, w = px.shape[:2]; x = np.arange(w)[None, :]; y = np.arange(h)[:, None]; f = np.ones((h, w), np.float32)
    if 'l' in sides: f = np.minimum(f, np.clip(x/(k*w), 0, 1))
    if 'r' in sides: f = np.minimum(f, np.clip((w-1-x)/(k*w), 0, 1))
    if 't' in sides: f = np.minimum(f, np.clip(y/(k*h), 0, 1))
    if 'b' in sides: f = np.minimum(f, np.clip((h-1-y)/(k*h), 0, 1))
    px[..., 3] *= f; return px
def cut(src, cols, rows, fw, opt):
    im = Image.open(src).convert('RGB'); band = opt.get('band')
    if band: im = im.crop((0, band[0], im.width, band[1]))
    W, H = im.size; cw, ch = W/cols, H/rows; lay = (opt.get('lay') or 'g').ljust(rows, 'g')
    bg = opt.get('bg'); soft = opt.get('soft', 0)
    bgi = background(im) if bg == 'auto' else Image.new('RGB', im.size, bg) if isinstance(bg, tuple) else None
    m_all = np.asarray(im).max(axis=2) if bgi is None else np.abs(np.asarray(im).astype(np.int16)-np.asarray(bgi).astype(np.int16)).max(axis=2)   # how far from the background
    if bgi is not None:
        import cv2
        PM = matte(im, bgi, cw*ch, opt.get('halo', 1.0), opt.get('core', .002), opt.get('thr', 110), opt.get('satk', 0))   # premultiplied: resized as it is, then un-premultiplied (no dark or light fringes)
        def a2(box, size):
            x0, y0, x1, y1 = box; pad = np.zeros((y1-y0, x1-x0, 4), np.float32); sx0, sy0 = max(0, x0), max(0, y0); sx1, sy1 = min(W, x1), min(H, y1)
            if sx1 > sx0 and sy1 > sy0: pad[sy0-y0:sy1-y0, sx0-x0:sx1-x0] = PM[sy0:sy1, sx0:sx1]
            r = cv2.resize(pad, size, interpolation=cv2.INTER_AREA); al = np.clip(r[..., 3:], 0, 255)
            return np.dstack([np.clip(r[..., :3]*255/np.maximum(al, 1e-3), 0, 255)*(al > 0), al])
    else:
        a2 = lambda box, size: alpha_of(im.crop(box).resize(size, Image.LANCZOS))
    def spans_of(r):
        y0, y1 = round(r*ch), round((r+1)*ch); mode = lay[r]
        if mode == 'g': return [(round(c*cw), round((c+1)*cw)) for c in range(cols)]
        if mode == 'o': return [(round((c+.5)*cw)-round(opt['R']*cw), round((c+.5)*cw)+round(opt['R']*cw)) for c in range(cols)]
        if mode == 'O':   # centre of light of every detected frame
            band = m_all[y0:y1].astype(np.float32); out = []
            for a, b in frames_of(band, opt.get('n', cols)):
                w = np.where(band[:, a:b] > LIT, band[:, a:b], 0).sum(axis=0); cx = a+(w*np.arange(b-a)).sum()/max(w.sum(), 1)
                out.append((round(cx)-round(opt['R']*cw), round(cx)+round(opt['R']*cw)))
            if len(out) == opt.get('n', cols): return out
            print('  row', r, 'has', len(out), 'frames where it should have', opt.get('n', cols), '- grid centres instead')   # frames that touch: the AI grid is the better guess
            return [(round((c+.5)*cw)-round(opt['R']*cw), round((c+.5)*cw)+round(opt['R']*cw)) for c in range(cols)]
        nn = opt.get('n', cols); nn = nn[r] if isinstance(nn, (list, tuple)) else nn   # n: one count, or one per row
        return [tuple(x) for x in frames_of(m_all[y0:y1], nn)]
    allspans = [spans_of(r) for r in range(rows)]
    dr = opt.get('drop') or (); dmap = dr if isinstance(dr, dict) else {0: dr}   # {row: [frames]} or the frames of row 0
    drop = set(dmap.get(0, ())); cols0 = cols; cols = max(len(allspans[r])-len(dmap.get(r, ())) for r in range(rows)) if dmap else cols   # dropped frames still count as neighbours of the 'o' windows
    pad = 1.0
    if opt.get('pad') or 'o' in lay or 'O' in lay:   # the widest frame decides how much bigger the cell has to be
        pad = max([1.0]+[(b-a)/cw*1.02 for r in range(rows) if lay[r] != 'g' for a, b in allspans[r]])
    s = fw/cw/pad
    fh = max(1, round(fw*ch/cw)); out = Image.new('RGBA', (fw*cols, fh*rows)); rc = []; bx = []
    for r in range(rows):
        y0, y1 = round(r*ch), round((r+1)*ch); mode = lay[r]; spans = allspans[r]; fhr = max(1, round((y1-y0)*s))
        rd = set(dmap.get(r, ())); rc.append(len(spans)-len(rd)); oc = -1
        for c0, (a, b) in enumerate(spans):
            if c0 in rd: continue
            oc += 1; c = c0   # c: the frame in the source row, oc: its cell in the game sheet
            if mode in 'oO':   # a square around the frame centre (as tall as the row), shown through a round window
                R = (b-a)/2; cy = (y0+y1)/2
                side = max(1, round(2*R*s))
                px = a2((a, round(cy-R), b, round(cy+R)), (side, side))
                yy, xx = np.mgrid[0:side, 0:side]; d = np.hypot(xx-side/2, yy-side/2)/(side/2)
                own = d*R; near = np.full_like(own, 1e9)   # distance (source px) to this frame's centre and to the nearest other one
                for dc in (-1, 1):
                    if 0 <= c+dc < len(spans): near = np.minimum(near, np.hypot((xx-side/2)/s-((spans[c+dc][0]+spans[c+dc][1])/2-(a+b)/2), (yy-side/2)/s))
                px[..., 3] *= np.clip((1-d)/.22, 0, 1)*np.clip((near-own)/(.18*cw)+.5, 0, 1)
                px = strays(px)
                cr = (opt.get('clipr') or {}).get(c0)
                if cr: px[..., 3] *= np.clip((cr*cw-(xx-side/2)/s)/(.03*cw), 0, 1)   # cut what lies right of cr x cell width from the centre (a piece of the next frame touching this one)
                cell = Image.fromarray(px.astype(np.uint8), 'RGBA')
                out.alpha_composite(cell, (oc*fw+(fw-cell.width)//2, r*fh+(fh-cell.height)//2)); bx.append(.5); continue
            ww = max(1, round((b-a)*s)); px = a2((a, y0, b, y1), (ww, fhr))
            if soft: px = fade(px, 'lrtb', soft)
            sides = ('t' if r > 0 and mode != 'g' else '')+('l' if mode == 'r' else '')   # a tip lies over the beam body: its left side always fades
            if mode != 'g' and ww > fw:   # wider than the cell: keep the side that matters, fade the cut one
                if mode == 'l': px = px[:, :fw]; sides += 'r'
                elif mode == 'r': px = px[:, ww-fw:]; sides += 'l'
                else: o = (ww-fw)//2; px = px[:, o:o+fw]; sides += 'lr'
                ww = fw
            if mode != 'g': px = fade(px, sides.replace('l', '') if mode == 'r' else sides, .05); px = fade(px, 'b' if r < rows-1 and mode != 'g' else '', .05)
            if mode == 'g' and opt.get('gfade') and r == 1: px = fade(px, 'tb', opt['gfade'])   # a beam body whose lightning reaches the cell's top and bottom: no hard edge
            if mode == 'r': px = fade(px, 'l', .22)   # a beam tip lies over the body tiles: a long fade on its left, no visible join
            x = oc*fw+(0 if mode in 'gl' else fw-ww if mode == 'r' else (fw-ww)//2); bx.append(round((x-oc*fw+ww/2)/fw, 3) if mode != 'g' else .5)
            out.alpha_composite(Image.fromarray(px.astype(np.uint8), 'RGBA'), (x, r*fh+(fh-fhr)//2))
    return out, fh, rc, pad, bx
def cores(sheet, fw, fh, n):
    """for every frame of row 0 (fractions of the frame width): the centre of the brightest pixels (where the ball is in a frame that
    also has a tail) and the height of the solid art (how big the ball is: the game sizes every frame by it, so the ball does not
    jump in size when the AI drew it bigger or smaller from frame to frame)"""
    a = np.asarray(sheet).astype(np.float32); out = []
    for c in range(n):
        cell = a[:fh, c*fw:(c+1)*fw]; lum = cell[..., :3].mean(axis=2)*cell[..., 3]/255
        rows = np.nonzero((cell[..., 3] > 140).any(axis=1))[0]; sz = round((rows.max()-rows.min())/fw, 3) if rows.size else .3
        if lum.max() <= 0: out.append([.5, .5, sz]); continue
        yy, xx = np.nonzero(lum >= lum.max()*.8); out.append([round(xx.mean()/fw, 3), round(yy.mean()/fh, 3), sz])
    return out
def cut_boxes(src, fw, opt):
    """frames from explicit source boxes (or grid cells), one game row in play order. Every frame is keyed out (black or light
    background), trimmed to its art, and then laid out so the animation does not jump: anc = 'c' (art centre), 'k' (centre of light:
    a ball keeps its place while its tail or sparks change), 'l' / 'r' (left / right edge on the cell edge, vertically on the centre
    of light: beams that start at the hands, tips that must stay at the end). One scale for every frame. Returns the sheet, the
    frame height, [frames], 1.0, the art centres; the per-frame centre of light and art box go in cut_boxes.info"""
    im = Image.open(src).convert('RGB')
    if opt.get('band'): im = im.crop((0, opt['band'][0], im.width, opt['band'][1]))   # (grid cells count inside the band)
    W, H = im.size
    if opt.get('box'): boxes = [list(b) for b in opt['box']]
    else:
        gc, gr, cells = opt['grid']; cw, ch = W/gc, H/gr
        boxes = [[round((c % gc)*cw), round((c//gc)*ch), round((c % gc + 1)*cw), round((c//gc + 1)*ch)] for c in cells]
    if opt.get('xr'): boxes = [[b[0], b[1], min(W, b[2]+opt['xr']), b[3]] for b in boxes]   # xr: the boxes reach that many px further right (art that ends on the box edge)
    own = [list(b) for b in boxes]   # the frame's own cell; with grow the box reaches into the neighbours to take art that spills over
    g = opt.get('grow', 0)
    if g: boxes = [[max(0, round(b[0]-g*(b[2]-b[0]))), b[1], min(W, round(b[2]+g*(b[2]-b[0]))), b[3]] for b in boxes]
    bg = opt.get('bg'); bgi = background(im) if bg == 'auto' else Image.new('RGB', im.size, bg) if isinstance(bg, tuple) else None
    if bgi is not None:
        PM = matte(im, bgi, (W/8)*(H/2), opt.get('halo', 1.0), opt.get('core', .002), opt.get('thr', 110), opt.get('satk', 0))
        def a1(b):
            r = PM[b[1]:b[3], b[0]:b[2]]; al = np.clip(r[..., 3:], 0, 255)
            return np.dstack([np.clip(r[..., :3]*255/np.maximum(al, 1e-3), 0, 255)*(al > 0), al])
    else:
        blk = opt.get('black', BLACK)
        def a1(b):
            a = np.asarray(im.crop(b)).astype(np.float32); m = a.max(axis=2); al = np.clip((m-blk)/(255-blk), 0, 1)
            rgb = np.where(al[..., None] > 0, np.clip(a/np.maximum(m[..., None], 1)*255, 0, 255), 0)
            return np.dstack([rgb, al*255])
    centres = []   # the centre of light of every frame, found in its own cell (for grow)
    if g:
        Mx = np.asarray(im).astype(np.float32).mean(axis=2) if bgi is None else np.abs(np.asarray(im).astype(np.float32)-np.asarray(bgi).astype(np.float32)).max(axis=2)
        for ob in own:
            c = Mx[ob[1]:ob[3], ob[0]:ob[2]]; yy, xx = np.nonzero(c >= c.max()*.8) if c.max() > 0 else (np.array([c.shape[0]//2]), np.array([c.shape[1]//2]))
            centres.append((ob[0]+xx.mean(), ob[1]+yy.mean()))
    frames = []
    for b, ob in zip(boxes, own):
        px = a1(b)
        if g:   # only the art connected to this frame's own centre of light stays (the tail or the edge of the next ball goes, with its glow)
            from scipy import ndimage
            al = px[..., 3]; lab, nn = ndimage.label(ndimage.binary_dilation(al > 22, iterations=4))
            me = centres[len(frames)]; cx, cy = int(round(me[0]-b[0])), int(round(me[1]-b[1]))
            cx, cy = min(max(cx, 0), al.shape[1]-1), min(max(cy, 0), al.shape[0]-1); keep = lab[cy, cx]
            if not keep:   # the centre fell in a gap: the biggest piece that overlaps the own cell
                sub = lab[:, max(0, ob[0]-b[0]):ob[2]-b[0]]; ids, cnt = np.unique(sub[sub > 0], return_counts=True); keep = ids[np.argmax(cnt)] if ids.size else 0
            if keep and nn > 1:
                m = ndimage.gaussian_filter((lab == keep).astype(np.float32), 1.5); px[..., 3] *= np.clip(m*1.6, 0, 1)
            rc_ = opt.get('rclip')   # a neighbour that touches: cut at the thinnest column between this ball and it (right; left too with sym)
            if rc_:
                col = al[:, max(0, cx-2):cx+3] > 60; rws = np.nonzero(col.any(axis=1))[0]
                hb = (rws.max()-rws.min()) if rws.size else al.shape[0]*.5
                prof = ndimage.uniform_filter1d((al > 40).sum(axis=0).astype(np.float32), max(3, int(hb*.04))); xx = np.arange(al.shape[1])[None, :]; e = hb*.05+2
                for sd in ((1, -1) if opt.get('sym') else (1,)):
                    a0, a1_ = (cx+int(.3*hb), min(al.shape[1], cx+int(rc_*2*hb))) if sd > 0 else (max(0, cx-int(rc_*2*hb)), cx-int(.3*hb))
                    if a1_-a0 < 4: continue
                    k = a0+int(np.argmin(prof[a0:a1_])); 
                    if prof[k] > .55*prof[cx] or prof[k] == 0: continue   # no neighbour there (or already a clean gap)
                    px[..., 3] *= np.clip(((k-xx) if sd > 0 else (xx-k))/e+.5, 0, 1)
                if opt.get('lmax'): px[..., 3] *= np.clip((xx-(cx-opt['lmax']*hb))/e, 0, 1)   # nothing further left than the tail can reach (the previous ball)
        if opt.get('kgrey'):   # the grey figure the AI drew behind the effect: unsaturated and not bright (a white-hot core is unsaturated but bright)
            c = px[..., :3]; raw = np.asarray(im.crop(b)).astype(np.float32); mx = raw.max(axis=2); sat = (mx-raw.min(axis=2))/np.maximum(mx, 1)
            px[..., 3] *= ~((sat < .3) & (mx < 150))
        al = px[..., 3]
        cs = np.nonzero((al > 40).sum(axis=0) > 1)[0]; rs = np.nonzero((al > 40).sum(axis=1) > 1)[0]
        if not cs.size: cs = np.array([0, px.shape[1]-1]); rs = np.array([0, px.shape[0]-1])
        x0, x1, y0, y1 = cs.min(), cs.max()+1, rs.min(), rs.max()+1
        sides = ''.join(k for k, e in (('l', x0 <= 1), ('r', x1 >= px.shape[1]-1), ('t', y0 <= 1), ('b', y1 >= px.shape[0]-1)) if e)
        mg = 4; x0, y0 = max(0, x0-mg), max(0, y0-mg); x1, y1 = min(px.shape[1], x1+mg), min(px.shape[0], y1+mg)
        px = px[y0:y1, x0:x1].copy()
        if sides: px = fade(px, sides, opt.get('edge', .06))   # a side of the box that cuts through art fades out
        lum = px[..., :3].mean(axis=2)*px[..., 3]/255
        if lum.max() > 0: yy, xx = np.nonzero(lum >= lum.max()*.8); kx, ky = float(xx.mean()), float(yy.mean())
        else: kx, ky = px.shape[1]/2, px.shape[0]/2
        frames.append((px, kx, ky))
    anc = opt.get('anc', 'c')
    # the anchor point of every frame (art coordinates) and how far the art reaches around it
    pts = []
    for px, kx, ky in frames:
        h, w = px.shape[:2]
        ax = {'l': 0, 'r': w, 'c': w/2, 'k': kx}[anc]; ay = h/2 if anc == 'c' else ky
        pts.append((ax, ay, w, h))
    if anc == 'l': Ws = max(w for _, _, w, _ in pts); AX = 0
    elif anc == 'r': Ws = max(w for _, _, w, _ in pts); AX = Ws
    else: Ws = 2*max(max(ax, w-ax) for ax, _, w, _ in pts); AX = Ws/2
    Hs = 2*max(max(ay, h-ay) for _, ay, _, h in pts); AY = Hs/2
    sc = fw/Ws; fh = max(1, round(Hs*sc)); n = len(frames)
    out = Image.new('RGBA', (fw*n, fh)); bx = []; info = []
    for i, ((px, kx, ky), (ax, ay, w, h)) in enumerate(zip(frames, pts)):
        ww, hh = max(1, round(w*sc)), max(1, round(h*sc))
        img = Image.fromarray(np.clip(px, 0, 255).astype(np.uint8), 'RGBA').resize((ww, hh), Image.LANCZOS)
        x = round(AX*sc - ax*sc); y = round(AY*sc - ay*sc); x = max(0, min(fw-ww, x)); y = max(0, min(fh-hh, y))
        tile = Image.new('RGBA', (fw, fh)); tile.alpha_composite(img, (x, y)); out.alpha_composite(tile, (i*fw, 0))
        bx.append(round((x+ww/2)/fw, 3))
        info.append({'k': [round((x+kx*sc)/fw, 3), round((y+ky*sc)/fh, 3), round(hh/fw, 3)], 'ab': [round(x/fw, 3), round(y/fh, 3), round((x+ww)/fw, 3), round((y+hh)/fh, 3)]})
    cut_boxes.info = info
    return out, fh, [n], 1.0, bx
def hot(sheet, fw, fh, cols):
    a = np.asarray(sheet).astype(np.float32); xs = ys = n = 0
    for c in range(cols):
        cell = a[:fh, c*fw:(c+1)*fw]; lum = cell[..., :3].mean(axis=2)*cell[..., 3]/255
        if lum.max() <= 0: continue
        yy, xx = np.nonzero(lum >= lum.max()*.85); xs += xx.mean(); ys += yy.mean(); n += 1
    return (round(xs/n/fw, 3), round(ys/n/fh, 3)) if n else (.5, .5)
def main():
    src = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
    js = ROOT/'assets'/'sprites'/'sprites.json'; meta = json.loads(js.read_text(encoding='utf8'))
    only = set(sys.argv[2:])
    for wid, (fn, cols, rows, fw, opt) in SPEC.items():
        if only and wid not in only: continue
        f = src/fn
        if not f.exists(): print('missing', fn); continue
        sheet, fh, rc, pad, bx = (cut_boxes(f, fw, opt) if opt.get('box') or opt.get('grid') else cut(f, cols, rows, fw, opt)); cols = sheet.width//fw; rows = sheet.height//fh; hx, hy = hot(sheet, fw, fh, rc[0])
        sheet.save(OUT/f'wfx{wid}.webp', 'WEBP', quality=82, alpha_quality=90, method=6)
        m = {'cols': cols, 'fw': fw, 'fh': fh, 'rows': rows, 'hx': hx, 'hy': hy, 'ppu': 1, 'has': []}
        if any(n != cols for n in rc): m['rc'] = rc
        if pad > 1.001: m['pad'] = round(pad, 3)
        if any(v != .5 for v in bx): m['bx'] = bx   # centre of the art of every frame (row by row), as a fraction of the frame
        if opt.get('ord'): m['ord'] = opt['ord']
        if opt.get('box') or opt.get('grid'):   # boxes: the centre of light [x, y, art height / frame width] and the art box [x0, y0, x1, y1] of every frame
            m['cores'] = [q['k'] for q in cut_boxes.info]; m['ab'] = [q['ab'] for q in cut_boxes.info]; m['seq'] = 1
        elif opt.get('cores'): m['cores'] = cores(sheet, fw, fh, rc[0])
        m.update(opt.get('meta') or {})
        m['cb'] = wfx_crop.boxes(sheet, fw, fh, cols, rows)
        meta[f'wfx{wid}'] = m
        print(f'wfx{wid}: {cols}x{rows} frames of {fw}x{fh}, frames per row {rc}, pad {pad:.2f}, hot spot {hx},{hy}, {(OUT/f"wfx{wid}.webp").stat().st_size//1024} KB')
    js.write_text(json.dumps(meta, separators=(',', ':')), encoding='utf8')
main()
