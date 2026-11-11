import sys,numpy as np
from PIL import Image
A='/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/'
M=[('f5a65ee2','actgravity',2,58),('14db850e','brkrock',3,40),('ec2653c2','brklantern',3,56),('8fce4b9c','brkcrystal',3,52),('ba3c9344','brkbarrel',3,46),
('c1867593','actchute',2,64),('8eada316','brkpod',3,38),('7d8fb2e8','actsenzu',4,50),('19442587','brksupply',3,62),('21924180','brkcrate',3,44),('549de87c','brkamphora',3,44),
('36cfe527','brktomb',3,50),('86303ee8','brkscrap',3,40),('8da1f51b','brkbush',3,46),('37cc8ce5','actnest',1,30),('3b17c685','actnimbus',4,30)]
def key(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32);R,G,B=a[...,0],a[...,1],a[...,2]
    d=np.minimum(R,B)-G                      # magenta strength
    dist=np.sqrt((R-255)**2+G**2+(B-255)**2)  # distance to pure magenta
    al=np.clip((dist-60)/90,0,1)*np.clip(1-(d-70)/110,0,1)
    al=np.where(d>30,0,al)
    sp=np.clip(np.minimum(R,B)-G,0,None)*np.where(al<1,1,.35)   # despill
    sp=np.where(d>15,sp,0)
    R2=R-sp;B2=B-sp
    out=np.dstack([R2,G,B2,al*255]).clip(0,255).astype(np.uint8)
    out[...,3]=np.where(out[...,3]<128,0,255)
    return out
def runs(cols):
    r=[];s=None
    for i,v in enumerate(cols):
        if v and s is None:s=i
        if not v and s is not None:r.append([s,i]);s=None
    if s is not None:r.append([s,len(cols)])
    return r
for fid,name,n,gh in M:
    im=Image.open(A+fid+'-image.jpg');a=key(im);H,W=a.shape[:2]
    occ=(a[...,3]>0).sum(0)>=3
    rs=runs(occ)
    rs=[x for x in rs if x[1]-x[0]>=6 or True]
    while len(rs)>n:   # merge across the smallest gap
        gaps=[rs[i+1][0]-rs[i][1] for i in range(len(rs)-1)];i=int(np.argmin(gaps));rs[i]=[rs[i][0],rs[i+1][1]];del rs[i+1]
    cnt=(a[...,3]>0).sum(0)
    while len(rs)<n:   # split the widest run at its thinnest column (middle 25-75%)
        i=max(range(len(rs)),key=lambda j:rs[j][1]-rs[j][0]);x0,x1=rs[i];w=x1-x0;m=x0+w//4+int(np.argmin(cnt[x0+w//4:x1-w//4]));rs[i:i+1]=[[x0,m],[m,x1]];print('  split',name,'at',m)
    crops=[]
    for x0,x1 in rs:
        sub=a[:,x0:x1].copy();from scipy import ndimage
        lab,nl=ndimage.label(sub[...,3]>0);sz=ndimage.sum(np.ones_like(lab),lab,range(1,nl+1));tot=sz.sum()
        small=np.where(sz<tot*(.0005 if name=='actchute' else .004))[0]+1;sub[...,3][np.isin(lab,small)]=0
        rows=np.where((sub[...,3]>0).sum(1)>=2)[0];cols=np.where((sub[...,3]>0).sum(0)>=2)[0]
        y0,y1=rows[0],rows[-1]+1;c0,c1=cols[0],cols[-1]+1;c=sub[y0:y1,c0:c1]
        # foot centre: mean x of opaque pixels in the bottom 12% rows
        bh=max(2,int((y1-y0)*.12));fx=np.where(c[-bh:,:,3]>0)[1].mean()
        crops.append((c,fx))
    h0=crops[0][0].shape[0];sc=gh*3/h0
    sm=[]
    for c,fx in crops:
        im2=Image.fromarray(c,'RGBA');w,h=im2.size;nw,nh=max(1,round(w*sc)),max(1,round(h*sc))
        # premultiplied box downscale
        p=np.asarray(im2).astype(np.float32);p[...,:3]*=p[...,3:4]/255
        q=np.asarray(Image.fromarray(p.astype(np.uint8),'RGBA').resize((nw,nh),Image.BOX)).astype(np.float32)
        al=q[...,3:4];q[...,:3]=np.where(al>0,q[...,:3]*255/np.maximum(al,1),0);thr=25 if name=='actchute' else 90;q[...,3]=np.where(q[...,3]<thr,0,np.where(q[...,3]<90,255,np.minimum(255,q[...,3]*1.15)))
        sm.append((q.clip(0,255).astype(np.uint8),fx*sc))
    half=max(max(fx,s.shape[1]-fx) for s,fx in sm);cw=int(np.ceil(half*2))+4;ch=max(s.shape[0] for s,_ in sm)+2
    out=np.zeros((ch,cw*n,4),np.uint8)
    for i,(s,fx) in enumerate(sm):
        x=int(round(i*cw+cw/2-fx));y=ch-1-s.shape[0];out[y:y+s.shape[0],x:x+s.shape[1]]=s
    Image.fromarray(out,'RGBA').save('out/'+name+'.png',optimize=True)
    print(name,n,'cell',cw,ch,'sc',round(sc,3),[ (r[1]-r[0]) for r in rs])
