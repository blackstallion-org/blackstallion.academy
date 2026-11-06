"""
World 03 (Legacy) sky: from the Poly Haven HDRI "table_mountain_2_puresky" (CC0) to
  sky-4k.webp / sky-2k.webp  the visible sky, LDR sRGB equirect, graded toward a dusty Rajasthan late afternoon
  env.hdr                    512x256 Radiance HDR (same grade, linear) for image-based lighting
and prints the sun direction (texture space) so the scene's sun light can match it.

Run with the system python (numpy, OpenCV, Pillow):  python3 make_sky.py /path/to/table_mountain_2_puresky_4k.hdr
"""
import json
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

src = sys.argv[1]
out = os.environ.get("LEGACY_OUT", "/root/bsah/public/worlds/legacy")
hdr = cv2.imread(src, cv2.IMREAD_UNCHANGED)[:, :, ::-1].astype(np.float32)  # RGB, linear
H, W, _ = hdr.shape
v = (np.arange(H) + 0.5) / H  # 0 top .. 1 bottom
elev = (0.5 - v) * math.pi  # +pi/2 zenith
E = np.repeat(elev[:, None], W, 1)

# sun (brightest pixel)
lum = hdr @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
sy, sx = np.unravel_index(np.argmax(cv2.GaussianBlur(lum, (31, 31), 0)), lum.shape)
su, sv = (sx + 0.5) / W, (sy + 0.5) / H
# three.js equirect: u = atan(dir.z, dir.x) / 2pi + 0.5 ; v(three, from bottom) = asin(dir.y)/pi + 0.5
phi = (su - 0.5) * 2 * math.pi
th = (0.5 - sv) * math.pi
sun = [math.cos(th) * math.cos(phi), math.sin(th), math.cos(th) * math.sin(phi)]

# angular distance to the sun, for a warm glow around it
U = (np.arange(W) + 0.5) / W
P = np.repeat(((U - 0.5) * 2 * math.pi)[None, :], H, 0)
dx = np.cos(E) * np.cos(P)
dy = np.sin(E)
dz = np.cos(E) * np.sin(P)
cosang = dx * sun[0] + dy * sun[1] + dz * sun[2]

g = hdr.copy()
# grade: dusty gold. A warm cast everywhere, stronger low in the sky and toward the sun; the blue zenith kept but muted.
warm = np.array([1.2, 0.92, 0.62], dtype=np.float32)
low = np.clip(1 - E / 0.55, 0, 1)[..., None]
toward = np.clip((cosang + 0.2) / 1.2, 0, 1)[..., None] ** 2
mix = np.clip(0.6 + 0.3 * low + 0.3 * toward, 0, 1)
g = g * (1 - mix) + g * warm * mix
# a soft dust haze along the horizon band (lifts the band, removes the hard sea-like horizon of the puresky)
haze = np.exp(-np.abs(E) / 0.07)[..., None] * np.array([1.0, 0.66, 0.36], dtype=np.float32) * (0.5 + 0.9 * toward)
g = g + haze * 0.25 * np.median(lum[: H // 2])
# dusty air: the low sky is ochre all round the horizon, not only toward the sun
band = np.clip(1 - E / 0.42, 0, 1)[..., None] ** 1.5 * (E >= 0)[..., None]
g = g * (1 - 0.55 * band) + g * np.array([1.35, 0.95, 0.55], dtype=np.float32) * 0.55 * band
# below the horizon: the plain's dusty glow (the terrain covers it, but reflections and gaps see it)
below = (E < 0)[..., None]
ground = np.array([0.62, 0.45, 0.30], dtype=np.float32) * (0.5 + 0.6 * toward) * np.median(lum[: H // 2]) * 0.8
g = np.where(below, ground * 0.7 + g * 0.3, g)
# a broad warm sun glow
g = g + (np.clip(cosang, 0, 1) ** 24)[..., None] * np.array([2.4, 1.5, 0.6], dtype=np.float32) * np.median(lum[: H // 2]) * 0.8

# LDR: scale so the sky sits mid-grey-ish in linear light, then sRGB encode
k = 0.2 / np.median(lum[: H // 2])
ldr = np.clip(g * k, 0, 1)
srgb = np.where(ldr <= 0.0031308, ldr * 12.92, 1.055 * np.power(ldr, 1 / 2.4) - 0.055)
img = Image.fromarray((srgb * 255 + 0.5).astype(np.uint8))
img.resize((4096, 2048), Image.LANCZOS).save(os.path.join(out, "sky-4k.webp"), quality=84, method=6)
img.resize((2048, 1024), Image.LANCZOS).save(os.path.join(out, "sky-2k.webp"), quality=82, method=6)

# small HDR for lighting (keep the sun's energy)
env = cv2.resize(g * k, (512, 256), interpolation=cv2.INTER_AREA)
cv2.imwrite(os.path.join(out, "env.hdr"), env[:, :, ::-1].astype(np.float32))
meta = {"source": "table_mountain_2_puresky (Poly Haven, CC0)", "sun_dir_texture": sun, "sun_uv": [su, sv], "ldr_scale": float(k)}
json.dump(meta, open(os.path.join(out, "sky.json"), "w"), indent=1)
print(json.dumps(meta))
