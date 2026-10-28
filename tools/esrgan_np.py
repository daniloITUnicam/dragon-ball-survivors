"""Real-ESRGAN (RRDBNet x4, e.g. RealESRGAN_x4plus_anime_6B.pth) in plain numpy, to upscale the Snake Way islands without PyTorch (v112).

  python3 tools/esrgan_np.py RealESRGAN_x4plus_anime_6B.pth [kind ...]

The model: https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth (not in the repo).
Reads assets/sprites/_sorgenti/isole/<kind>.webp (1x), writes assets/sprites/_sorgenti/isole/<kind>_x2.webp: the colours upscaled x4 by the network and
brought down to x2 (area filter), the outline (alpha) by Lanczos; with the 2 px border of the island sprites. tools/gen_isles.py uses <kind>_x2.webp when
it exists. About 4 minutes per island on 2 CPU cores (tiles of 160 px).
The .pth is read by a restricted unpickler (only tensors and OrderedDict are rebuilt, nothing else from the file is executed).
"""
import pickle, zipfile, collections, sys, time, pathlib
import numpy as np
DT = {'FloatStorage': np.float32, 'HalfStorage': np.float16, 'DoubleStorage': np.float64, 'LongStorage': np.int64, 'IntStorage': np.int32}
class _St:
    def __init__(self, name): self.name = name
def _rebuild(storage, offset, size, stride, *a):
    arr = storage
    if not size: return arr[offset:offset+1].reshape(()).copy()
    it = arr.itemsize
    return np.lib.stride_tricks.as_strided(arr[offset:], shape=tuple(size), strides=tuple(s*it for s in stride)).copy()
def load(path):
    z = zipfile.ZipFile(path); root = z.namelist()[0].split('/')[0]
    class U(pickle.Unpickler):
        def find_class(self, mod, name):
            if (mod, name) == ('collections', 'OrderedDict'): return collections.OrderedDict
            if mod == 'torch._utils' and name in ('_rebuild_tensor_v2', '_rebuild_tensor'): return _rebuild
            if mod == 'torch' and name in DT: return _St(name)
            raise pickle.UnpicklingError(f'blocked {mod}.{name}')
        def persistent_load(self, pid):
            _, st, key, loc, n = pid
            return np.frombuffer(z.read(f'{root}/data/{key}'), dtype=DT[st.name])
    return U(z.open(f'{root}/data.pkl')).load()
def im2col(x):   # (C,H,W) -> (C*9, H*W), order c,ky,kx like torch weights
    C, H, W = x.shape; p = np.pad(x, ((0,0),(1,1),(1,1)))
    c = np.empty((C, 3, 3, H, W), np.float32)
    for ky in range(3):
        for kx in range(3): c[:, ky, kx] = p[:, ky:ky+H, kx:kx+W]
    return c.reshape(C*9, H*W)
class Net:
    def __init__(s, path):
        P = load(path); P = P.get('params_ema', P)
        s.W = {k[:-7]: (P[k].reshape(P[k].shape[0], -1).astype(np.float32), P[k[:-7]+'.bias'].astype(np.float32)[:, None]) for k in P if k.endswith('.weight')}
        s.nb = 1 + max(int(k.split('.')[1]) for k in s.W if k.startswith('body.'))
    def conv(s, name, cols, H, W):   # cols: list of im2col blocks of the concatenated input
        w, b = s.W[name]; acc = None; i = 0
        for c in cols:
            n = c.shape[0]; part = w[:, i:i+n] @ c; acc = part if acc is None else acc + part; i += n
        acc += b; return acc.reshape(-1, H, W)
    @staticmethod
    def lr(x): return np.where(x > 0, x, x*.2)
    def rdb(s, pre, x, H, W):
        cols = [im2col(x)]; f = []
        for j in range(1, 5):
            y = s.lr(s.conv(f'{pre}.conv{j}', cols, H, W)); f.append(y); cols.append(im2col(y))
        return s.conv(f'{pre}.conv5', cols, H, W)*.2 + x
    def forward(s, img):   # img (3,H,W) in 0..1 -> (3,4H,4W)
        _, H, W = img.shape
        feat = s.conv('conv_first', [im2col(img.astype(np.float32))], H, W); x = feat
        for i in range(s.nb):
            y = x
            for r in (1, 2, 3): y = s.rdb(f'body.{i}.rdb{r}', y, H, W)
            x = y*.2 + x
        feat = feat + s.conv('conv_body', [im2col(x)], H, W)
        for n in ('conv_up1', 'conv_up2'):
            feat = feat.repeat(2, 1).repeat(2, 2); H, W = H*2, W*2; feat = s.lr(s.conv(n, [im2col(feat)], H, W))
        return s.conv('conv_last', [im2col(s.lr(s.conv('conv_hr', [im2col(feat)], H, W)))], H, W)
    def run(s, img, tile=160, pad=12, log=None):   # img (H,W,3) float 0..1 -> (4H,4W,3)
        H, W, _ = img.shape; out = np.zeros((H*4, W*4, 3), np.float32); t0 = time.time(); n = 0
        ty = list(range(0, H, tile)); tx = list(range(0, W, tile)); N = len(ty)*len(tx)
        for y0 in ty:
            for x0 in tx:
                y1, x1 = min(H, y0+tile), min(W, x0+tile); a0, b0, a1, b1 = max(0, y0-pad), max(0, x0-pad), min(H, y1+pad), min(W, x1+pad)
                r = s.forward(img[a0:a1, b0:b1].transpose(2, 0, 1)).transpose(1, 2, 0)
                out[y0*4:y1*4, x0*4:x1*4] = r[(y0-a0)*4:(y0-a0)*4+(y1-y0)*4, (x0-b0)*4:(x0-b0)*4+(x1-x0)*4]
                n += 1
                if log: log(f'{n}/{N} tiles, {time.time()-t0:.0f}s')
        return np.clip(out, 0, 1)


ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT/'assets/sprites/_sorgenti/isole'
KINDS = ['kingkai','kami','kame','korin','capsule','grandkai','shrine','nimbus','temple']

def island(net, k, PAD=2):
    import cv2
    from PIL import Image
    C = np.array(Image.open(SRC/f'{k}.webp').convert('RGBA'))
    C = cv2.copyMakeBorder(C, PAD, PAD, PAD, PAD, cv2.BORDER_CONSTANT, value=(0,0,0,0))
    rgb, a = np.ascontiguousarray(C[...,:3]), C[...,3]
    fill = cv2.inpaint(rgb, (a < 128).astype(np.uint8), 3, cv2.INPAINT_TELEA)   # no dark fringe from the transparent pixels
    R = net.run(fill.astype(np.float32)/255, log=lambda m: print(f'  {k}: {m}', flush=True))
    R = cv2.resize(R, (C.shape[1]*2, C.shape[0]*2), interpolation=cv2.INTER_AREA)
    A = cv2.resize(a.astype(np.float32), (C.shape[1]*2, C.shape[0]*2), interpolation=cv2.INTER_LANCZOS4)
    A = np.clip((A-128)*1.6+128, 0, 255)
    out = np.dstack([np.clip(R*255+.5, 0, 255), A]).astype(np.uint8)
    Image.fromarray(out).save(SRC/f'{k}_x2.webp', 'WEBP', quality=96, alpha_quality=100, method=6)

if __name__ == '__main__':
    net = Net(sys.argv[1])
    for k in (sys.argv[2:] or KINDS):
        t = time.time(); island(net, k); print(f'{k}: done in {time.time()-t:.0f} s', flush=True)
