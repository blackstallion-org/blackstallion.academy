"""World 04 Beyond: a procedural spiral galaxy sprite (face-on, RGBA WebP), drawn with numpy.
Two logarithmic arms (pitch ~13 deg) of blue-white stars over a warm bulge, dust lanes on the arms' inner edges, and scattered
knots; colours kept to ivory, warm gold and a muted blue (no magenta). The runtime tilts and scales it.
Run: python3 tools/blender/12_worlds/beyond/make_galaxy.py  (writes public/worlds/beyond/galaxy.webp)
"""
import numpy as np
from PIL import Image
import os

S = 1024
rng = np.random.default_rng(11)
y, x = np.mgrid[-1:1:S * 1j, -1:1:S * 1j]
r = np.hypot(x, y) + 1e-6
th = np.arctan2(y, x)
pitch = np.radians(13.0)
k = 1 / np.tan(pitch)

def armfield(offset, width):
    phase = th - k * np.log(r) + offset
    d = np.angle(np.exp(1j * 2 * phase)) / 2  # distance to the nearest of two arms (radians)
    return np.exp(-(d / width) ** 2)

def noise(scale, oct=5):
    acc = np.zeros((S, S))
    amp = 1.0
    for o in range(oct):
        n = rng.random((scale * 2 ** o + 1, scale * 2 ** o + 1))
        im = Image.fromarray((n * 255).astype(np.uint8)).resize((S, S), Image.BICUBIC)
        acc += amp * (np.asarray(im) / 255.0)
        amp *= 0.5
    return acc / acc.max()

n1 = noise(6)
n2 = noise(24, 3)
disk = np.exp(-r / 0.3) * (r < 1.0)
arms = armfield(0.0, 0.5 + 0.15 * r) * (0.5 + 0.8 * n1)
lanes = armfield(-0.32, 0.12) * np.clip(r * 3, 0, 1)
bulge = np.exp(-(r / 0.085) ** 2) * 1.6 + np.exp(-(r / 0.2) ** 2) * 0.5
lum = disk * (0.3 + 2.4 * arms) * (1 - 0.65 * lanes * n2) + bulge
# star knots on the arms
knots = np.zeros((S, S))
for _ in range(900):
    rr = rng.uniform(0.08, 0.85)
    t = rng.uniform(0, 2 * np.pi)
    # put most knots on arms
    t = (k * np.log(rr) + rng.choice([0, np.pi]) + rng.normal(0, 0.25))
    cx, cy = int((rr * np.cos(t) + 1) * S / 2), int((rr * np.sin(t) + 1) * S / 2)
    if 2 <= cx < S - 2 and 2 <= cy < S - 2:
        knots[cy - 1:cy + 2, cx - 1:cx + 2] += rng.uniform(0.3, 1.0) * np.array([[0.3, 0.6, 0.3], [0.6, 1, 0.6], [0.3, 0.6, 0.3]])
lum += knots * disk * 2.5
warm = np.array([1.0, 0.80, 0.55])
cool = np.array([0.72, 0.80, 1.0])
mixw = np.clip(bulge / (bulge + 0.5 * arms * disk + 1e-4), 0, 1)[..., None]
col = lum[..., None] * (mixw * warm + (1 - mixw) * cool)
col = col / np.percentile(col, 99.7)
col = np.clip(col, 0, 1) ** 0.85
alpha = np.clip(lum / np.percentile(lum, 99.0), 0, 1) ** 0.7 * np.clip((1.0 - r) * 4, 0, 1)
rgba = np.concatenate([col, alpha[..., None]], -1)
out = os.path.join(os.path.dirname(__file__), "../../../../public/worlds/beyond/galaxy.webp")
Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").resize((768, 768), Image.LANCZOS).save(out, quality=85, method=6)
print("WROTE", os.path.abspath(out), os.path.getsize(out))
