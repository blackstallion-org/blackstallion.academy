"""
Shared helpers for the procedural scenery of the horse environments (desert, horse field, village).

Everything here is original, generated from noise and simple drawing; no photograph and none of the supplied reference
images is used, so no horse can end up in a backdrop. Run the world scripts from the repository root:

    python3 scripts/horse-worlds/gen_desert.py
    python3 scripts/horse-worlds/gen_field.py
    python3 scripts/horse-worlds/gen_village.py

Each writes WebP files under public/images/horse-worlds/<world>/ and a TypeScript data file with the sprite rectangles
(components/horse-worlds/atlas-data.ts, merged by gen_atlas_data.py). Then run: node scripts/media-manifest.mjs
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "images" / "horse-worlds"


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def hex2rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255.0


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return a + (b - a) * t


# ----------------------------------------------------------------------------------------------- periodic noise
def lattice2(h: int, w: int, cy: int, cx: int, seed: int) -> np.ndarray:
    """Smooth noise in 0..1 that tiles seamlessly in both directions."""
    g = rng(seed).random((cy, cx)).astype(np.float32)
    out = ndimage.zoom(g, (h / cy, w / cx), order=3, mode="grid-wrap", grid_mode=True)
    return np.clip(out[:h, :w], 0, 1)


def fbm2(h: int, w: int, cells: int = 4, octaves: int = 5, persistence: float = 0.5, seed: int = 1, aspect: float = 1.0) -> np.ndarray:
    total = np.zeros((h, w), np.float32)
    amp = 1.0
    norm = 0.0
    for o in range(octaves):
        cy = max(1, int(round(cells * (2**o))))
        cx = max(1, int(round(cells * aspect * (2**o))))
        total += amp * lattice2(h, w, cy, cx, seed * 101 + o * 7)
        norm += amp
        amp *= persistence
    return total / norm


def fbm1(n: int, cells: int = 6, octaves: int = 5, persistence: float = 0.5, seed: int = 1) -> np.ndarray:
    """1-D periodic fractal noise, 0..1 (a horizon line that closes on itself)."""
    total = np.zeros(n, np.float32)
    amp = 1.0
    norm = 0.0
    for o in range(octaves):
        c = max(2, cells * (2**o))
        g = rng(seed * 131 + o * 11).random(c).astype(np.float32)
        x = ndimage.zoom(g, n / c, order=3, mode="grid-wrap", grid_mode=True)[:n]
        total += amp * np.clip(x, 0, 1)
        norm += amp
        amp *= persistence
    return total / norm


# ----------------------------------------------------------------------------------------------- io
def to_u8(a: np.ndarray) -> np.ndarray:
    return (np.clip(a, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)


def save_webp(path: Path, arr: np.ndarray, quality: int = 86, lossless: bool = False) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = "RGBA" if arr.shape[2] == 4 else "RGB"
    img = Image.fromarray(to_u8(arr), mode)
    img.save(path, "WEBP", quality=quality, method=6, lossless=lossless, exact=True)
    return path.stat().st_size


def save_variants(base: Path, arr: np.ndarray, quality: int = 86, mobile_scale: float = 0.5, lossless: bool = False):
    """Writes name.webp and name-m.webp (a half-size copy for phones). Returns the sizes in bytes."""
    s1 = save_webp(base.with_suffix(".webp"), arr, quality, lossless)
    img = Image.fromarray(to_u8(arr), "RGBA" if arr.shape[2] == 4 else "RGB")
    w, h = img.size
    small = img.resize((max(1, int(w * mobile_scale)), max(1, int(h * mobile_scale))), Image.LANCZOS)
    mp = base.with_name(base.stem + "-m.webp")
    small.save(mp, "WEBP", quality=quality, method=6, lossless=lossless, exact=True)
    return s1, mp.stat().st_size


def bleed(rgba: np.ndarray) -> np.ndarray:
    """Copy the colour of the nearest solid pixel into fully transparent ones, so mip-mapping never pulls in dark fringes."""
    a = rgba[..., 3]
    solid = a > 0.02
    if solid.all() or not solid.any():
        return rgba
    idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    out = rgba.copy()
    out[..., :3] = rgba[idx[0], idx[1], :3]
    return out


# ----------------------------------------------------------------------------------------------- anti-aliased drawing
class Canvas:
    """An RGBA canvas drawn at S x resolution and shrunk on finish() for clean edges."""

    def __init__(self, w: int, h: int, ss: int = 3):
        self.w, self.h, self.ss = w, h, ss
        self.img = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img, "RGBA")
        self.hole: Image.Image | None = None  # an erase layer: whatever is drawn here is cut out of the picture at finish()
        self.hd: ImageDraw.ImageDraw | None = None

    def erase_ellipse(self, cx, cy, rx, ry, amount=255):
        if self.hole is None:
            self.hole = Image.new("L", self.img.size, 0)
            self.hd = ImageDraw.Draw(self.hole)
        s = self.ss
        assert self.hd is not None
        self.hd.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=int(amount))

    def px(self, v: float) -> float:
        return v * self.ss

    def poly(self, pts, fill):
        self.d.polygon([(x * self.ss, y * self.ss) for x, y in pts], fill=tuple(int(c) for c in fill))

    def ellipse(self, cx, cy, rx, ry, fill):
        s = self.ss
        self.d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=tuple(int(c) for c in fill))

    def rect(self, x0, y0, x1, y1, fill):
        s = self.ss
        self.d.rectangle([x0 * s, y0 * s, x1 * s, y1 * s], fill=tuple(int(c) for c in fill))

    def line(self, x0, y0, x1, y1, width, fill):
        s = self.ss
        self.d.line([(x0 * s, y0 * s), (x1 * s, y1 * s)], fill=tuple(int(c) for c in fill), width=max(1, int(width * s)))

    def stroke(self, pts, w0, w1, fill):
        """A tapered stroke along a polyline: width goes from w0 to w1."""
        n = len(pts)
        for i in range(n - 1):
            t0, t1 = i / (n - 1), (i + 1) / (n - 1)
            x0, y0 = pts[i]
            x1, y1 = pts[i + 1]
            seg = max(1, int(math.hypot(x1 - x0, y1 - y0) * 1.5))
            for k in range(seg + 1):
                t = k / seg
                x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
                w = (w0 + (w1 - w0) * (t0 + (t1 - t0) * t)) / 2
                self.ellipse(x, y, w, w, fill)

    def finish(self) -> np.ndarray:
        if self.hole is not None:
            from PIL import ImageChops

            a = self.img.getchannel("A")
            self.img.putalpha(ImageChops.multiply(a, ImageChops.invert(self.hole)))
        small = self.img.resize((self.w, self.h), Image.LANCZOS)
        return np.asarray(small, dtype=np.float32) / 255.0


def bezier(p0, p1, p2, n=20):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
        pts.append((x, y))
    return pts


# ----------------------------------------------------------------------------------------------- atlas packing
class Atlas:
    """Shelf-packs sprites (RGBA float arrays) into one image and remembers each rectangle in pixels."""

    def __init__(self, width: int, pad: int = 4):
        self.width, self.pad = width, pad
        self.items: list[tuple[np.ndarray, dict]] = []

    def add(self, arr: np.ndarray, meta: dict):
        self.items.append((arr, meta))

    def pack(self) -> tuple[np.ndarray, list[dict]]:
        x = y = shelf = 0
        placed = []
        for arr, meta in self.items:
            h, w = arr.shape[:2]
            if x + w + self.pad > self.width:
                x, y, shelf = 0, y + shelf + self.pad, 0
            placed.append((x, y, w, h, arr, meta))
            x += w + self.pad
            shelf = max(shelf, h)
        total_h = y + shelf + self.pad
        # round the height up to a multiple of 4 (friendly to GPU block layouts)
        total_h = (total_h + 3) // 4 * 4
        img = np.zeros((total_h, self.width, 4), np.float32)
        out = []
        for x, y, w, h, arr, meta in placed:
            img[y : y + h, x : x + w] = arr
            out.append({**meta, "rect": [x, y, w, h]})
        return bleed(img), out


def write_atlas_data(world: str, name: str, size: tuple[int, int], variants: list[dict]):
    """Appends this atlas's rectangles to scripts/horse-worlds/atlas-data.json (merged into TypeScript by gen_atlas_data.py)."""
    p = Path(__file__).with_name("atlas-data.json")
    data = json.loads(p.read_text()) if p.exists() else {}
    data[f"{world}.{name}"] = {"size": list(size), "variants": variants}
    p.write_text(json.dumps(data, indent=1, sort_keys=True) + "\n")
