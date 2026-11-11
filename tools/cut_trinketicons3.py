# icons 89-106 from the regenerated sheet: tiles of 114x120 px on a 170 x 180 px grid starting at (30,47); the 114 px square is cut from y+3
from PIL import Image
XS=[30+170*i for i in range(6)];YS=[47,227,407]
def cut(sheet,ids,out):
    im=Image.open(sheet).convert('RGB')
    for i,idn in enumerate(ids):
        x=XS[i%6];y=YS[i//6];im.crop((x,y+3,x+114,y+117)).save(out+'/'+idn+'.webp',quality=94)
