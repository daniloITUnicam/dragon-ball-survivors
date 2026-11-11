import numpy as np
from PIL import Image
from scipy import ndimage
A='/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/'
def key(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(np.float32);R,G,B=a[...,0],a[...,1],a[...,2]
    d=np.minimum(R,B)-G;dist=np.sqrt((R-255)**2+G**2+(B-255)**2)
    al=np.clip((dist-60)/90,0,1)*np.clip(1-(d-70)/110,0,1)
    # the art itself is purple: only near-pure magenta is background
    al=np.where((d>150)&(dist<120),0,al)
    al=np.where(dist<70,0,al)
    sp=np.clip(d-60,0,None)*np.where(al<1,1,0)
    out=np.dstack([R-sp*.5,G,B-sp*.5,al*255]).clip(0,255).astype(np.uint8);out[...,3]=np.where(out[...,3]<128,0,255)
    return out
fr=[]
for f in ['e7460414','f03f783f']:
    a=key(A+f+'-image.jpg');H,W=a.shape[:2];m=a[...,3]>0
    # pedestal band: centres per quarter
    y0,y1=int(H*.72),int(H*.88);band=m[y0:y1]
    cs=[]
    for q in range(4):
        xs=np.where(band[:,q*W//4:(q+1)*W//4].any(0))[0]+q*W//4;cs.append((xs.min()+xs.max())/2)
    lab,n=ndimage.label(m);objs=ndimage.find_objects(lab);sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1))
    cms=ndimage.center_of_mass(m,lab,range(1,n+1))
    owner=np.zeros(n+1,int)
    for i in range(n):
        owner[i+1]=int(np.argmin([abs(cms[i][1]-c) for c in cs]))
    big=[(i+1,int(sz[i]),owner[i+1]) for i in range(n) if sz[i]>20000]
    print(f,'centres',[int(c) for c in cs],'big comps',big)
    for q in range(4):
        keep=(owner[lab]==q)&m&(np.isin(lab,[i+1 for i in range(n) if sz[i]>=40]))
        b=a.copy();b[...,3]=np.where(keep,255,0);fr.append((b,cs[q]))
    print(H,W)
np.save('altfr.npy',np.array([0]))
import pickle;pickle.dump(fr,open('altfr.pkl','wb'))
