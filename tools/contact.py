#!/usr/bin/env python3
"""Contact sheet of a folder of numbered PNG frames (white background keyed out), for choosing poses.
usage: contact.py <frames_dir> <out.png> [scale] [cols]"""
import sys,re,glob,os
from PIL import Image,ImageDraw
def key(im):
    im=im.convert('RGBA');w,h=im.size;px=im.load()
    if px[0,0][3]==0: return im
    bg=px[0,0][:3];seen=[[False]*h for _ in range(w)];st=[]
    for x in range(w):
        st+= [(x,0),(x,h-1)]
    for y in range(h):
        st+= [(0,y),(w-1,y)]
    while st:
        x,y=st.pop()
        if x<0 or y<0 or x>=w or y>=h or seen[x][y]:continue
        p=px[x,y]
        if abs(p[0]-bg[0])+abs(p[1]-bg[1])+abs(p[2]-bg[2])>24:continue
        seen[x][y]=True;px[x,y]=(0,0,0,0)
        st+=[(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
    return im
def num(f):
    m=re.findall(r'(\d+)',os.path.basename(f));return int(m[-1]) if m else 0
if __name__=='__main__':
    d,out=sys.argv[1],sys.argv[2];sc=int(sys.argv[3]) if len(sys.argv)>3 else 2;cols=int(sys.argv[4]) if len(sys.argv)>4 else 10
    fs=sorted(glob.glob(os.path.join(d,'*.png')),key=num)
    ims=[(num(f),key(Image.open(f))) for f in fs]
    if not ims:sys.exit('no frames')
    mw=min(160,max(i.width for _,i in ims));mh=min(190,max(i.height for _,i in ims))
    cw,ch=mw*sc+6,mh*sc+16;rows=(len(ims)+cols-1)//cols
    S=Image.new('RGB',(cw*cols,ch*rows),(70,80,96));dr=ImageDraw.Draw(S)
    for k,(n,im) in enumerate(ims):
        x,y=(k%cols)*cw,(k//cols)*ch
        im2=im.resize((im.width*sc,im.height*sc),Image.NEAREST)
        if im2.width>cw-4 or im2.height>ch-18:
            r=min((cw-4)/im2.width,(ch-18)/im2.height);im2=im2.resize((max(1,int(im2.width*r)),max(1,int(im2.height*r))),Image.NEAREST)
        S.paste(im2,(x+3+(cw-6-im2.width)//2,y+14+(ch-16-im2.height)),im2)
        dr.text((x+3,y+1),str(n),fill=(255,255,0))
    S.save(out);print(out,len(ims),S.size)
