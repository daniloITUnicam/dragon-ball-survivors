from PIL import Image;import numpy as np,json
from scipy import ndimage
L=json.load(open('../dev/trin.json'))
base=[t for t in L if not t['id'].startswith(('cx_','el_'))];el=[t for t in L if t['id'].startswith('el_')];cx=[t for t in L if t['id'].startswith('cx_')]
jobs=[('63fca237',base+el),('bc6aae0b',cx[:36])]
out=[]
for f,ids in jobs:
    im=Image.open('/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/'+f+'-image.png').convert('RGB');a=np.asarray(im).astype(int)
    bg=a[5,5];lum=a.mean(-1);card=lum>bg.mean()+6
    lab,n=ndimage.label(ndimage.binary_opening(card,iterations=2))
    boxes=[(o[1].start,o[0].start,o[1].stop,o[0].stop) for o in ndimage.find_objects(lab) if (o[1].stop-o[1].start)>120 and (o[0].stop-o[0].start)>30]
    rows=sorted(set(b[1]//15 for b in boxes))
    boxes=sorted(boxes,key=lambda b:(round(b[1]/15),b[0]))
    assert len(boxes)==len(ids),(len(boxes),len(ids))
    for b,t in zip(boxes,ids):
        x0,y0,x1,y1=b;h=y1-y0;wl=int(h*(.79 if f=='63fca237' else .82))
        sq=a[y0+2:y1-2,x0+2:x0+wl];cb=np.median(a[y0+3:y1-3,x1-12:x1-4].reshape(-1,3),0).mean()
        m=sq.mean(-1)>cb+40;ys,xs=np.where(m)
        bx0,by0,bx1,by1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
        side=min(bx1-bx0,by1-by0)
        bw=max(2,round(side*.09))
        cx0=x0+2+bx0+bw;cy0=y0+2+by0+bw;s=side-2*bw
        crop=im.crop((cx0,cy0,cx0+s,cy0+s))
        crop=crop.resize((s*2,s*2),Image.LANCZOS)
        crop.save('ti3/'+t['id']+'.webp',quality=92)
        out.append((t['id'],s))
print(len(out),out[:5],out[-3:])
