import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
# parachute: redraw the cords from the canopy rim to the bottom-centre point of frame 0
im=Image.open('out/actchute.png');a=np.array(im);ch,W=a.shape[:2];cw=W//2
f=a[:,:cw];lab,n=ndimage.label(f[...,3]>0);sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1));big=int(np.argmax(sz))+1
keep=lab==big;f[...,3][~keep]=0
ys,xs=np.where(keep);y1=ys.max();x0,x1=xs.min(),xs.max()
tip=(cw/2,ch-2)
d=ImageDraw.Draw(Image.fromarray(f));img=Image.fromarray(f);d=ImageDraw.Draw(img)
for t in [0,.17,.38,.62,.83,1]:
    x=x0+2+(x1-x0-4)*t
    col=np.where(keep[:,int(round(x))])[0];yy=col.max() if len(col) else y1
    d.line([(x,yy-1),tip],fill=(58,63,74,255),width=3)
a[:,:cw]=np.array(img);Image.fromarray(a).save('out/actchute.png',optimize=True)
# bush: fill the see-through holes of the damaged frame with a dark leaf green
im=Image.open('out/brkbush.png');a=np.array(im);m=a[...,3]>0;fl=ndimage.binary_fill_holes(m);h=fl&~m
a[h]=(44,96,40,255);Image.fromarray(a).save('out/brkbush.png',optimize=True)
print('holes',h.sum())
