import numpy as np,time
from PIL import Image
from scipy import ndimage
A='/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/'
exec(open('alt.py').read().split('fr=[]')[0])
frames=[]
for f in ['e7460414','f03f783f']:
    a=key(A+f+'-image.jpg');H,W=a.shape[:2];m=a[...,3]>0
    y0,y1=int(H*.72),int(H*.88)
    L=np.zeros((H,W),np.int8);cs=[]
    for q in range(4):
        x0,x1=q*W//4,(q+1)*W//4;xs=np.where(m[y0:y1,x0:x1].any(0))[0]+x0;cs.append((xs.min()+xs.max())/2)
        sub=np.zeros_like(m);sub[y0:y1,x0:x1]=m[y0:y1,x0:x1];L[sub]=q+1
    t=time.time();it=0
    while True:
        it+=1;mx=ndimage.maximum_filter(L,3);free=(L==0)&m&(mx>0)
        if not free.any():break
        # prefer the neighbour label: max-filter; also try min of positive labels to be fair at contacts
        L[free]=mx[free]
    print(f,'grow its',it,round(time.time()-t,1),'s')
    # leftovers (detached bits): nearest centre by component centroid
    lab,n=ndimage.label(m&(L==0))
    if n:
        cms=ndimage.center_of_mass(np.ones_like(lab),lab,range(1,n+1));sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1))
        for i in range(n):
            if sz[i]<40:continue
            q=int(np.argmin([abs(cms[i][1]-c) for c in cs]));L[lab==i+1]=q+1
    for q in range(4):
        b=a.copy();b[...,3]=np.where(L==q+1,255,0);frames.append((b,cs[q]))
import pickle;pickle.dump(frames,open('altfr.pkl','wb'))
