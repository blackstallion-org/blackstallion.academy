"""usage: montage.py out.jpg cols cell_w label1=path1 label2=path2 ...  -> labelled contact sheet"""
import sys
from PIL import Image, ImageDraw, ImageFont

out, cols, cw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
items = [a.split("=", 1) for a in sys.argv[4:]]
imgs = []
for label, path in items:
    im = Image.open(path).convert("RGB")
    ch = round(im.height * cw / im.width)
    imgs.append((label, im.resize((cw, ch), Image.LANCZOS)))
rows = (len(imgs) + cols - 1) // cols
rh = max(i.height for _, i in imgs) + 22
sheet = Image.new("RGB", (cols * cw, rows * rh), (24, 22, 20))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
except Exception:
    font = ImageFont.load_default()
for n, (label, im) in enumerate(imgs):
    x, y = (n % cols) * cw, (n // cols) * rh
    sheet.paste(im, (x, y + 22))
    d.text((x + 6, y + 3), label, fill=(230, 210, 170), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
