"""World 04 Beyond: runtime textures from the downloaded sources (see SOURCES.md). Plain Python + Pillow + numpy.

  SRC=/path/to/downloads python3 tools/blender/12_worlds/beyond/prepare_textures.py

Writes public/worlds/beyond/:
  earth-day-{hi,lo}.webp    the day map (4096x2048 / 2048x1024)
  earth-data-{hi,lo}.webp   packed: R city lights (night map luminance), G clouds, B ocean mask (specular map)
  moon.webp                 1024x512
  stars-{hi,lo}.webp        from the Blender render (render_starfield.py -> STARS png); the low tier keeps faint stars by
                            blending a 2x2 max into the average when downsampling
"""
import os
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
SRC = os.environ.get("SRC", "/root/dl/beyond")
STARS = os.environ.get("STARS", os.path.join(SRC, "stars_4k.png"))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../public/worlds/beyond")
os.makedirs(OUT, exist_ok=True)

day = Image.open(os.path.join(SRC, "8k_earth_daymap.jpg")).convert("RGB")
night = Image.open(os.path.join(SRC, "8k_earth_nightmap.jpg")).convert("L")
clouds = Image.open(os.path.join(SRC, "8k_earth_clouds.jpg")).convert("L")
spec = Image.open(os.path.join(SRC, "8k_earth_specular_map.tif")).convert("L")
for tag, W, q in (("hi", 4096, 74), ("lo", 2048, 80)):
    H = W // 2
    day.resize((W, H), Image.LANCZOS).save(f"{OUT}/earth-day-{tag}.webp", quality=82, method=6)
    d = np.stack([np.array(x.resize((W, H), Image.LANCZOS)) for x in (night, clouds, spec)], -1)
    Image.fromarray(d).save(f"{OUT}/earth-data-{tag}.webp", quality=q, method=6)
Image.open(os.path.join(SRC, "2k_moon.jpg")).convert("RGB").resize((1024, 512), Image.LANCZOS).save(f"{OUT}/moon.webp", quality=80, method=6)

a = np.asarray(Image.open(STARS).convert("RGB")).astype(np.float32) / 255.0
Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(f"{OUT}/stars-hi.webp", quality=88, method=6)
H, W, _ = a.shape
b = a.reshape(H // 2, 2, W // 2, 2, 3)
lo = 0.45 * b.mean((1, 3)) + 0.55 * b.max((1, 3))
Image.fromarray((np.clip(lo, 0, 1) * 255 + 0.5).astype(np.uint8)).save(f"{OUT}/stars-lo.webp", quality=86, method=6)
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)))
