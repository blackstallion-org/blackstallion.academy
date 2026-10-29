"""Before/after contact sheets and compressed copies for docs/qa/horse-realism.
usage: python3 pairs.py <beforeDir> <afterDir> <outDir>
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

before, after, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
places = ["desert", "village", "field"]
devices = ["desktop", "mobile"]
views = ["mane", "tail", "hooves", "trot_side"]
label_names = {"desert": "Desert", "village": "Village", "field": "Horse Field"}

def font(size):
    for p in ["/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

def load(d, place, dev, view):
    p = os.path.join(d, f"{place}_{dev}_{view}.png")
    return Image.open(p).convert("RGB") if os.path.exists(p) else None

total = 0
for place in places:
    for dev in devices:
        cell_w = 640 if dev == "desktop" else 260
        rows = []
        for view in views + (['forelock', 'forelock_side', 'ears', 'eye_muzzle', 'shoulder'] if dev == 'desktop' else []):
            b, a = load(before, place, dev, view), load(after, place, dev, view)
            if b is None or a is None:
                continue
            for tag, im in (("before", b), ("after", a)):
                fn = os.path.join(out, f"{tag}", f"{place}_{dev}_{view}.jpg")
                os.makedirs(os.path.dirname(fn), exist_ok=True)
                im.save(fn, quality=80, optimize=True, progressive=True)
                total += os.path.getsize(fn)
            ratio = cell_w / b.width
            bw, bh = cell_w, int(b.height * ratio)
            rows.append((view, b.resize((bw, bh)), a.resize((bw, bh))))
        if not rows:
            continue
        pad, head = 6, 34
        W = 2 * cell_w + 3 * pad
        if dev == "desktop":
            H = head + sum(r[1].height + head + pad for r in rows)
            sheet = Image.new("RGB", (W, H), (24, 22, 20))
            d = ImageDraw.Draw(sheet)
            d.text((pad, 6), f"{label_names[place]} - {dev}   BEFORE (left)  |  AFTER (right)", fill=(235, 225, 205), font=font(20))
            y = head
            for view, b, a in rows:
                d.text((pad, y + 6), view, fill=(201, 166, 107), font=font(16))
                y += head
                sheet.paste(b, (pad, y)); sheet.paste(a, (2 * pad + cell_w, y))
                y += b.height + pad
        else:
            # mobile: the four views side by side, before row over after row
            Wm = pad + len(rows) * (cell_w + pad)
            Hm = head + 2 * (rows[0][1].height + pad) + head
            sheet = Image.new("RGB", (Wm, Hm), (24, 22, 20))
            d = ImageDraw.Draw(sheet)
            d.text((pad, 6), f"{label_names[place]} - {dev}   top row BEFORE, bottom row AFTER", fill=(235, 225, 205), font=font(20))
            for i, (view, b, a) in enumerate(rows):
                x = pad + i * (cell_w + pad)
                d.text((x, head - 4), view, fill=(201, 166, 107), font=font(15))
                sheet.paste(b, (x, head + 14))
                sheet.paste(a, (x, head + 14 + b.height + pad))
        sheet.save(os.path.join(out, f"sheet_{place}_{dev}.jpg"), quality=82, optimize=True, progressive=True)
print("compressed bytes", total)
