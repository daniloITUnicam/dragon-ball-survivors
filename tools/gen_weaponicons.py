import numpy as np
from PIL import Image,ImageFilter
SRC='/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/e6071adf-image.jpg'
IDS=['ki','kame','disc','spirit','aura','flare','slash','homing','dbeam','javelin','dsunday','breaker','spiral','boomer','hellzone','chrono','shock','hakai','chain','meteor','sweep','galick','bigbang','dyn']
TWO={'hakai','sweep'}
im=Image.open(SRC).convert('RGB');a=np.asarray(im).astype(np.float32);H,W=a.shape[:2]
X0=[30+371*c for c in range(7)];Y0=[20,291,561,841]
for i,wid in enumerate(IDS):
    r,c=divmod(i,7);x0=X0[c]+16;x1=min(W-6,X0[c]+330-16);y0=Y0[r]+14;y1=min(H-2,Y0[r]+236)
    h=y1-y0;cut=h-(92 if wid in TWO else 50)
    t=a[y0:y0+cut,x0:x1];hh,ww=t.shape[:2]
    lum=t.mean(-1);wgt=np.clip(lum-70,0,None);cx=(wgt.sum(0)*np.arange(ww)).sum()/max(1,wgt.sum())
    side=int(min(ww,1.22*hh));sx=int(np.clip(cx-side/2,0,ww-side))
    crop=t[:,sx:sx+side]
    # pad to square: replicate the edge rows, darkened toward the borders
    bg=np.median(np.concatenate([t[:3].reshape(-1,3),t[:,:3].reshape(-1,3),t[:,-3:].reshape(-1,3)]),0)
    S=side;out=np.tile(bg,(S,S,1)).astype(np.float32);pt=(S-hh)//2
    cr=crop.copy();F=14
    if pt>0:
        for y in range(F):k=y/F;cr[y]=cr[y]*k+bg*(1-k);cr[hh-1-y]=cr[hh-1-y]*k+bg*(1-k)
    out[pt:pt+hh]=cr
    img=Image.fromarray(out.clip(0,255).astype(np.uint8)).resize((128,128),Image.LANCZOS)
    img.save('wi/'+wid+'.webp',quality=92,method=6)
ims=[Image.open('wi/'+w+'.webp') for w in IDS]
sh=Image.new('RGB',(130*12,130*2),(0,0,0))
for i,m in enumerate(ims):sh.paste(m,((i%12)*130,(i//12)*130))
sh.save('wi_sheet.png')
