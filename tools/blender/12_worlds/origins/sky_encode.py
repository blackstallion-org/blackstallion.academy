"""Origins sky: Poly Haven `kloppenheim_06_puresky` (CC0) -> web files.

Run:  ORIGINS_DL=/path/to/downloads OUT=/root/bsah/public/worlds/origins ~/bpyenv/bin/python sky_encode.py
Writes:
  sky-env.hdr        512x256 Radiance HDR, image-based light only (PMREM in the browser)
  sky-hi.raw.npy     4096x2048 encoded sky (converted to sky-hi.webp / sky-lo.webp by sky_webp.py with Pillow)
  sky.json           sun direction (texture space) and encoding constants
Encoding (8-bit, linear, NoColorSpace): y = sqrt(h / (h + C)), decoded in the sky shader as r = y^2, h = C r / (1 - r).
It keeps the sun and the bright cloud edges above 1.0 so the bloom and the tone curve see real highlights.
"""
import bpy, os, json, math
import numpy as np

DL = os.environ.get("ORIGINS_DL", "/root/work/origins/dl")
OUT = os.environ.get("OUT", "/root/bsah/public/worlds/origins")
C = 1.0

img = bpy.data.images.load(os.path.join(DL, "sky_4k.hdr"))
w, h = img.size
px = np.empty(w * h * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = px.reshape(h, w, 4)[::-1, :, :3]  # top row first
lum = px @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
iy, ix = np.unravel_index(np.argmax(lum), lum.shape)
# equirect: u = 0.5 + atan2(dir.x, -dir.z)/(2pi) in three.js convention (see EquirectangularReflectionMapping)
u = (ix + 0.5) / w
v = (iy + 0.5) / h
lon = (u - 0.5) * 2 * math.pi
lat = (0.5 - v) * math.pi
info = {"w": w, "h": h, "sunPixel": [int(ix), int(iy)], "sunU": u, "sunV": v, "sunLat": lat, "sunLon": lon,
        "lumMax": float(lum.max()), "lumMedianUpper": float(np.median(lum[: h // 2])), "C": C}
print(json.dumps(info))
enc = np.sqrt(px / (px + C))
enc = np.clip(enc, 0, 254.5 / 255)
np.save("/root/work/origins/sky-hi.raw.npy", (enc * 255 + 0.5).astype(np.uint8))
# small HDR for the environment light
small = bpy.data.images.new("env", 512, 256, alpha=False, float_buffer=True)
src = px[::-1]
# box-filter down by 8
sm = src.reshape(256, h // 256, 512, w // 512, 3).mean(axis=(1, 3))
arr = np.concatenate([sm, np.ones((256, 512, 1), np.float32)], axis=2).astype(np.float32)
small.pixels.foreach_set(arr.ravel())
small.filepath_raw = os.path.join(OUT, "sky-env.hdr")
small.file_format = "HDR"
small.save()
json.dump(info, open(os.path.join("/root/work/origins", "sky.json"), "w"), indent=1)
