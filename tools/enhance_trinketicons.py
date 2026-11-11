# sharper upscale for the low-resolution trinket icons 71-106 (native ~25 px crops in nat/ -> out2/, 2x of a 64 px grid)
from PIL import Image;import numpy as np,json,cv2,sys
rep=json.load(open('rep.json'));ids=[(r[0],r[1],r[2]) for r in rep if r[0]<=106]
OUT=96
def enhance(p,K=20):
    im=cv2.imread(p);h,w=im.shape[:2]
    # 1) 4x bicubic up, 2) edge-preserving smoothing to kill the JPEG blur/noise, 3) unsharp, 4) up to OUT, 5) colour quantise (pixel-art look)
    u=cv2.resize(im,(w*4,h*4),interpolation=cv2.INTER_CUBIC)
    u=cv2.bilateralFilter(u,7,28,5)
    bl=cv2.GaussianBlur(u,(0,0),2.2);u=cv2.addWeighted(u,2.1,bl,-1.1,0)
    u=cv2.resize(u,(OUT,OUT),interpolation=cv2.INTER_AREA)
    bl=cv2.GaussianBlur(u,(0,0),1.0);u=cv2.addWeighted(u,1.6,bl,-.6,0)
    Z=u.reshape(-1,3).astype(np.float32);crit=(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,20,.5)
    _,lab,cen=cv2.kmeans(Z,K,None,crit,3,cv2.KMEANS_PP_CENTERS)
    q=cen[lab.flatten()].reshape(u.shape).astype(np.uint8)
    # keep a little of the unquantised image so gradients do not band too hard
    q=cv2.addWeighted(q,.7,np.clip(u,0,255).astype(np.uint8),.3,0)
    return Image.fromarray(cv2.cvtColor(q,cv2.COLOR_BGR2RGB))
if __name__=='__main__':
    import os;os.makedirs('out2',exist_ok=True)
    from PIL import ImageDraw
    sel=[71,73,76,80,87,95,101,106]
    W=Image.new('RGB',(len(sel)*200,210),'#120c18')
    for i,n in enumerate(sel):
        idn=[x for x in ids if x[0]==n][0][1]
        old=Image.open('out/'+idn+'.webp').resize((96,96),Image.LANCZOS);new=enhance('nat/'+idn+'.png')
        W.paste(old,(i*200+2,8));W.paste(new,(i*200+100,8))
        ImageDraw.Draw(W).text((i*200+4,110),str(n)+' prima | dopo',fill='#fff')
    W.save('cmp.png')
