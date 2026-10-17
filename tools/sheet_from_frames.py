#!/usr/bin/env python3
"""Builds a sprite sheet (one row of frames) for the game from a folder of single frames, e.g. the images made with an AI image generator.

    python3 tools/sheet_from_frames.py goku  frames/goku  [--fh 192] [--write-json]

- frames/goku holds one PNG per frame, numbered 0..15 in the name (00.png, 1_walk.png, goku_12.png ... any name with ONE number in it).
  Frame numbers are the ones of docs/SPRITES.md: 0 idle, 1-4 walk, 5-6 attack, 7-9 optional, 10-15 weapon poses (docs/SPRITES_AI.md).
- The background can be transparent or one flat colour (e.g. magenta #FF00FF): it is taken from the corners and removed.
- Marker pixels: in the frames 10, 12, 13, 14 (also 11, 15) paint one small spot of pure cyan (#00FFFF) where the hand / the energy ball is:
  the spot is erased and its position goes to sprites.json as "hand" (the game draws the ball there / the shot leaves from there).
- All frames get the same scale (frame 0 decides it), are aligned by the feet and by the centre of the legs, and are written to
  assets/sprites/<id>.png. The script prints the sprites.json entry; with --write-json it is merged into assets/sprites/sprites.json.
Needs Pillow and numpy."""
import argparse, json, pathlib, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parent.parent
MARK = np.array([0, 255, 255])


def load_frames(folder):
    out = {}
    for f in sorted(pathlib.Path(folder).glob('*.png')):
        nums = re.findall(r'\d+', f.stem)
        if len(nums) != 1:
            print('skipped', f.name, '(the name must contain exactly one number)')
            continue
        n = int(nums[0])
        if n in out:
            print('WARNING: two files for frame', n, '- using', f.name)
        out[n] = Image.open(f).convert('RGBA')
    return out


def clear_background(im):
    """transparent if it already is; otherwise the flat colour of the corners (flood-filled from the border) becomes transparent"""
    a = np.array(im)
    if (a[..., 3] < 250).mean() > .1:
        return a
    h, w, _ = a.shape
    corners = np.array([a[0, 0, :3], a[0, -1, :3], a[-1, 0, :3], a[-1, -1, :3]]).astype(int)
    bg = np.median(corners, axis=0)
    dist = np.abs(a[..., :3].astype(int) - bg).max(axis=2)
    near = dist < 40
    lab, _ = ndi.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    a[np.isin(lab, list(border)), 3] = 0
    return a


def take_marker(a):
    """finds the cyan marker, erases it (transparent) and returns its centre (x, y) or None"""
    m = (np.abs(a[..., :3].astype(int) - MARK).max(axis=2) < 70) & (a[..., 3] > 0)
    if m.sum() < 2:
        return None
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=1))
    sizes = ndi.sum(m, lab, range(1, n + 1))
    k = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero((lab == k))
    cx, cy = float(xs.mean()), float(ys.mean())
    a[ndi.binary_dilation(m, iterations=2), 3] = 0
    return cx, cy


def bbox(a):
    ys, xs = np.nonzero(a[..., 3] > 40)
    if not len(xs):
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def feet_x(a, bb):
    """horizontal centre of the legs: the opaque pixels of the lowest 18% of the figure"""
    x0, y0, x1, y1 = bb
    low = a[int(y1 - (y1 - y0) * .18):y1, :, 3] > 40
    ys, xs = np.nonzero(low)
    return float(xs.mean()) if len(xs) else (x0 + x1) / 2


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('id', help='character id (e.g. goku) or form (goku_0)')
    ap.add_argument('folder')
    ap.add_argument('--fh', type=int, default=192, help='height of a frame in px (96 = ppu 2, 192 = ppu 4)')
    ap.add_argument('--fw', type=int, default=0, help='width of a frame (default: 2/3 of the height)')
    ap.add_argument('--margin', type=int, default=10, help='empty px above the tallest figure (frame 0)')
    ap.add_argument('--units', type=float, default=44, help='height of the idle figure in game units (the procedural characters are ~44)')
    ap.add_argument('--nearest', action='store_true', help='scale with nearest neighbour (pixel art) instead of a smooth filter')
    ap.add_argument('--write-json', action='store_true')
    ap.add_argument('--out', default=str(ROOT / 'assets' / 'sprites'))
    o = ap.parse_args()
    frames = load_frames(o.folder)
    if 0 not in frames:
        sys.exit('frame 0 (idle) is required: it decides the scale and the feet position')
    fh = o.fh
    fw = o.fw or int(round(fh * 2 / 3 / 2)) * 2
    raw, marks = {}, {}
    for n, im in frames.items():
        a = clear_background(im)
        mk = take_marker(a)
        if mk:
            marks[n] = mk
        raw[n] = a
    b0 = bbox(raw[0])
    if not b0:
        sys.exit('frame 0 is empty')
    ay = fh - 2
    # one scale for every frame: the tallest thing of any frame (figure or marker: the ball above the head) must fit under the margin
    need = 0.0
    for n, a in raw.items():
        bb = bbox(a)
        if not bb:
            continue
        top = bb[1]
        if n in marks:
            top = min(top, marks[n][1] - 4)
        need = max(need, bb[3] - top)
    scale = (fh - 2 - o.margin) / need
    h0 = (b0[3] - b0[1]) * scale
    resamp = Image.NEAREST if o.nearest else Image.LANCZOS
    ncols = max(frames) + 1
    sheet = Image.new('RGBA', (fw * ncols, fh), (0, 0, 0, 0))
    hand = {}
    ax = fw // 2
    ref_foot = None
    for n in sorted(raw):
        a = raw[n]
        bb = bbox(a)
        if not bb:
            print('frame', n, 'is empty - skipped')
            continue
        # the feet of EVERY frame go to the same place: bottom of the figure = ay, centre of the legs = ax
        fx = feet_x(a, bb)
        im = Image.fromarray(a)
        sw, sh = int(round(im.width * scale)), int(round(im.height * scale))
        im2 = im.resize((sw, sh), resamp)
        ox = ax - fx * scale
        oy = ay - bb[3] * scale
        tile = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        _paste_clipped(tile, im2, int(round(ox)), int(round(oy)))
        sheet.alpha_composite(tile, (n * fw, 0))
        if n in marks:
            mx, my = marks[n]
            hand[str(n)] = [int(round(ox + mx * scale)), int(round(oy + my * scale))]
        if oy < 0 or (n in hand and hand[str(n)][1] < 0):
            print('WARNING: frame', n, 'does not fit under the top edge: raise --margin')
        wpx = (bb[2] - bb[0]) * scale
        if wpx > fw:
            print('WARNING: frame', n, 'is wider than the frame (%.0f > %d px): use a larger --fw' % (wpx, fw))
    out = pathlib.Path(o.out)
    out.mkdir(parents=True, exist_ok=True)
    f = out / (o.id + '.png')
    sheet.save(f)
    has = [n for n in sorted(raw) if n >= 7]
    entry = {'cols': ncols, 'fw': fw, 'fh': fh, 'ppu': round(h0 / o.units, 3), 'ax': ax, 'ay': ay}   # ppu: so that the idle figure is --units game units tall
    if has:
        entry['has'] = has
    if hand:
        entry['hand'] = hand
    missing = [n for n in range(0, 7) if n not in raw]
    if missing:
        print('note: frames', missing, 'are missing (the game repeats the last frame it has for them)')
    print('wrote', f, '(%d x %d, %d frames)' % (sheet.width, sheet.height, ncols))
    print('sprites.json entry:')
    print(json.dumps({o.id: entry}, indent=2))
    if o.write_json:
        jp = out / 'sprites.json'
        data = json.loads(jp.read_text(encoding='utf8')) if jp.exists() else {}
        data[o.id] = entry
        jp.write_text(json.dumps(data, indent=2) + '\n', encoding='utf8')
        print('merged into', jp)


def _paste_clipped(tile, im, ox, oy):
    """alpha_composite that tolerates any offset (the figure is cropped by the frame on every side)"""
    x0, y0 = max(0, ox), max(0, oy)
    x1, y1 = min(tile.width, ox + im.width), min(tile.height, oy + im.height)
    if x1 <= x0 or y1 <= y0:
        return
    tile.alpha_composite(im.crop((x0 - ox, y0 - oy, x1 - ox, y1 - oy)), (x0, y0))


if __name__ == '__main__':
    main()
