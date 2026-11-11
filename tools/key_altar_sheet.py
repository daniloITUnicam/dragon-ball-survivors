import numpy as np,pickle
from PIL import Image
fr=pickle.load(open('altfr.pkl','rb'))
order=[4,3,5,0,1,6,2,7]
F=[fr[i] for i in order];H=F[0][0].shape[0]
def bbox(a):m=a[...,3]>0;ys=np.where(m.any(1))[0];xs=np.where(m.any(0))[0];return xs.min(),xs.max()+1,ys.min(),ys.max()+1
b0=bbox(F[0][0]);top=min(bbox(a)[2] for a,_ in F);bot=max(bbox(a)[3] for a,_ in F)
from scipy import ndimage
G=[]
for i,(a,c) in enumerate(F):
    m=a[...,3]>0;lab,n=ndimage.label(m);sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1));big=int(np.argmax(sz))+1
    cms=ndimage.center_of_mass(np.ones_like(lab),lab,range(1,n+1));keep=np.zeros(n+1,bool);keep[big]=True
    if i in (3,4,6,7):
        for k in range(n):
            if abs(cms[k][1]-c)<300 and sz[k]>=40:keep[k+1]=True
    b=a.copy();b[...,3]=np.where(keep[lab]&m,255,0);G.append((b,c))
F=G
half=max(max(c-bbox(a)[0],bbox(a)[1]-c) for a,c in F)
for i in (2,4):
    a,c=F[i];a[:, :max(0,int(c-0.87*half)),3]=0
GH=150*2.4;sc=GH/(b0[3]-b0[2])
cw=int(np.ceil(2*half*sc))+4;ch=int(np.ceil((bot-top)*sc))+2
out=np.zeros((ch,cw*8,4),np.uint8)
for i,(a,c) in enumerate(F):
    x0=int(c-half);x1=int(c+half);crop=np.zeros((bot-top,x1-x0,4),np.uint8)
    sx0=max(0,x0);sx1=min(a.shape[1],x1);crop[:,sx0-x0:sx1-x0]=a[top:bot,sx0:sx1]
    p=crop.astype(np.float32);p[...,:3]*=p[...,3:4]/255
    q=np.asarray(Image.fromarray(p.astype(np.uint8),'RGBA').resize((cw-4,ch-2),Image.BOX)).astype(np.float32)
    al=q[...,3:4];q[...,:3]=np.where(al>0,q[...,:3]*255/np.maximum(al,1),0);q[...,3]=np.where(q[...,3]<90,0,np.minimum(255,q[...,3]*1.15))
    out[1:ch-1,i*cw+2:i*cw+cw-2]=q.clip(0,255).astype(np.uint8)
Image.fromarray(out,'RGBA').save('out/altar.png',optimize=True)
print('cell',cw,ch,'sc',round(sc,3))
s=Image.new('RGBA',(out.shape[1],out.shape[0]),(46,84,52,255));s.alpha_composite(Image.fromarray(out,'RGBA'));s.save('altchk.png')
