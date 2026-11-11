# cuts the trinket icons 71-162 out of the three sheets (a regular 6-column grid of cards, each with a gold-framed square icon)
from PIL import Image;import numpy as np,json
A='/mnt/user-data/attachments/1458f158-4bd6-5563-aa89-74d686b26a1a/'
L=json.load(open('../dev/trin.json'))
base=[t for t in L if not t['id'].startswith(('cx_','el_'))];el=[t for t in L if t['id'].startswith('el_')];cx=[t for t in L if t['id'].startswith('cx_')]
O=base+el+cx
# sheet, first number, column xs, row ys, frame size (w,h)
JOBS=[('5761a6ef',71,[19,187,355,523,691,859],[98,151,204,256,309,362],(31,31)),
      ('ecb4e67b',107,[19,186,353,519,686,853],[93,175,257,338,420,502],(59,61)),
      ('8576cf50',143,[20,189,354,519,684,849],[103,222,341,460],(69,73))]
rep=[]
for f,n0,XS,YS,(fw,fh) in JOBS:
    im=Image.open(A+f+'-image.png').convert('RGB');a=np.asarray(im).astype(int);r,g,b=a[...,0],a[...,1],a[...,2]
    gold=(r>120)&(g>75)&(g<215)&(b<140)&(r-b>50)&(r>g+8) if f!='5761a6ef' else (r>125)&(g>95)&(r-b>25)&(r>=g)
    k=0
    for y in YS:
        for x in XS:
            n=n0+k;k+=1
            if n>162:break
            t=O[n-1];pad=max(4,fw//7)
            wx0,wy0=max(0,x-pad),max(0,y-pad);m=gold[wy0:y+fh+pad,wx0:x+fw+pad]
            # the frame: its edges are the outermost columns / rows with a long run of gold
            cs=m.sum(0);rs=m.sum(1);thc=fh*.45;thr=fw*.45
            cols=np.where(cs>=thc)[0];rows=np.where(rs>=thr)[0]
            if len(cols)>=2 and len(rows)>=2 and cols.max()-cols.min()>fw*.75 and rows.max()-rows.min()>fh*.75:
                fx0,fx1,fy0,fy1=wx0+cols.min(),wx0+cols.max()+1,wy0+rows.min(),wy0+rows.max()+1;ok='edge'
            else:fx0,fy0,fx1,fy1=x,y,x+fw,y+fh;ok='grid'
            w=fx1-fx0;h=fy1-fy0;bw=max(3,round(min(w,h)*.085));s=min(w,h)-2*bw
            cx0=fx0+(w-s)//2;cy0=fy0+(h-s)//2
            crop=im.crop((cx0,cy0,cx0+s,cy0+s)).resize((s*2,s*2),Image.LANCZOS)
            crop.save('out/'+t['id']+'.webp',quality=92);rep.append((n,t["id"],t["n"],ok,int(s)))
print(len(rep),[x for x in rep if x[3]=='grid'])
json.dump(rep,open('rep.json','w'))
# contact sheet for checking
W=Image.new('RGB',(12*100,8*118),'#120c18')
from PIL import ImageDraw;d=ImageDraw.Draw(W)
for i,(n,id,nm,ok,s) in enumerate(rep):
    ic=Image.open('out/'+id+'.webp').resize((84,84),Image.NEAREST);x=(i%12)*100+8;y=(i//12)*118+4;W.paste(ic,(x,y));d.text((x,y+86),str(n)+' '+nm[:14],fill='#fff' if ok=='edge' else '#f66');d.text((x,y+98),nm[14:28],fill='#aaa')
W.save('check.png')
