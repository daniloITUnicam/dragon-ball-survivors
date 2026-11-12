import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
im=np.array(Image.open('/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/88757770-image.png').convert('RGB'))
B={'sword':(226,36,278,92),'coin':(386,93,432,147),'fist':(262,452,316,506),'rapid':(220,504,268,552),'risk':(216,560,268,608),
'storm':(72,614,124,664),'heal':(292,667,348,716),'rain':(34,714,88,766),'kai':(95,812,148,866),'hour':(178,866,218,916)}
out={}
for k,(x0,y0,x1,y1) in B.items():
    c=im[y0:y1,x0:x1].astype(np.float32)
    h,w=c.shape[:2]
    border=np.concatenate([c[0],c[-1],c[:,0],c[:,-1]])
    # grabcut with rect = inner box
    mask=np.zeros((h,w),np.uint8)
    rect=(2,2,w-4,h-4)
    bg=np.zeros((1,65),np.float64);fg=np.zeros((1,65),np.float64)
    cv2.grabCut(c.astype(np.uint8),mask,rect,bg,fg,6,cv2.GC_INIT_WITH_RECT)
    a=((mask==1)|(mask==3)).astype(np.uint8)
    # keep largest comps touching center, fill holes
    lab,n=ndi.label(a)
    if n>1:
        sizes=ndi.sum(a,lab,range(1,n+1));keep=[i+1 for i,s in enumerate(sizes) if s>0.08*sizes.max()]
        a=np.isin(lab,keep).astype(np.uint8)
    a=ndi.binary_fill_holes(a).astype(np.uint8)
    rgba=np.dstack([c.astype(np.uint8),a*255])
    out[k]=rgba
    Image.fromarray(rgba).save(f'ic_{k}.png')
# preview
S=6;cols=5;rows=2;cw=60*S;sheet=Image.new('RGB',(cols*cw,rows*cw),(60,60,60))
chk=np.zeros((cw,cw,3),np.uint8)
for i in range(cw):
  for j in range(cw): chk[i,j]=(90,90,90) if ((i//12)+(j//12))%2 else (130,130,130)
for i,(k,r) in enumerate(out.items()):
    t=Image.fromarray(chk).convert('RGBA');p=Image.fromarray(r).resize((r.shape[1]*S,r.shape[0]*S),Image.NEAREST);t.alpha_composite(p,(0,0));sheet.paste(t.convert('RGB'),((i%cols)*cw,(i//cols)*cw))
sheet.save('ic_sheet.png')
