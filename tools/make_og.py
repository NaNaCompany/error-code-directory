"""Original code-based cover artwork; no external pictures or font files shipped."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#f3f6f5');d=ImageDraw.Draw(im)
def font(size,bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/'+('malgunbd.ttf' if bold else 'malgun.ttf'),size)
d.rounded_rectangle((66,62,1134,568),28,fill='white',outline='#dce5df',width=2)
d.rounded_rectangle((108,110,182,184),16,fill='#176b55')
d.text((130,108),'!',font=font(52,True),fill='white')
d.text((208,112),'에러 코드 포털',font=font(46,True),fill='#253c31')
d.text((110,217),'코드 · 문제 상황 · 공식 해결 문서',font=font(27),fill='#6b7e72')
d.rounded_rectangle((109,293,1091,371),12,fill='#f7faf8',outline='#b1c6b8',width=2)
d.text((137,309),'0x80070005',font=font(31,True),fill='#176b55')
d.text((785,316),'Windows Win32',font=font(21),fill='#6b7e72')
for x,w,text in [(110,232,'AADSTS50076'),(359,237,'SQLITE_BUSY'),(613,237,'ERR_INVALID_ARG_TYPE'),(867,223,'23505')]:
    d.rounded_rectangle((x,410,x+w,469),8,fill='#edf4ef')
    d.text((x+13,427),text,font=font(14 if len(text)>18 else 18,True),fill='#436751')
d.text((110,507),'Windows  /  Cloud  /  Node.js  /  Database  /  Python',font=font(18),fill='#809285')
im.save(root/'src/og.png',optimize=True)
print('Original OG image: 1200x630 RGB')
