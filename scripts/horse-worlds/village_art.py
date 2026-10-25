"""
Drawing toolkit for the Marwar village sprites (used by gen_village.py): a layered canvas that remembers which material every
pixel is made of (lime plaster, sandstone, wood, thatch...), so each material can be given its own texture afterwards, plus the
architectural parts a Rajasthani village is made of: arched doors, jharokha balconies, parapets, chhatris, jali screens, huts.

Everything is drawn from scratch with simple shapes and noise. Light comes from the upper left of the picture, as in every
other world's cut-outs. All sizes are in pixels at 100 px per metre.
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw

from gen_common import bezier, fbm2, hex2rgb, lattice2, mix, rng, smoothstep

# material ids
NONE, PLASTER, STONE, WOOD, IRON, THATCH, TRIM, DARK, EARTH, CLOTH, CLAY, TILE = range(12)


def c255(h: str, k: float = 1.0) -> tuple[int, int, int]:
    v = hex2rgb(h) * 255 * k
    return tuple(int(x) for x in np.clip(v, 0, 255))


class Art:
    """A colour canvas and a material canvas drawn together (both supersampled), plus shade passes applied at the end."""

    def __init__(self, W: int, H: int, seed: int, ss: int = 2):
        self.W, self.H, self.ss, self.seed = W, H, ss, seed
        self.col = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
        self.mat = Image.new("L", (W * ss, H * ss), 0)
        self.dc = ImageDraw.Draw(self.col)
        self.dm = ImageDraw.Draw(self.mat)
        self.fx: list[tuple] = []  # shading passes
        self.r = rng(seed)

    # -- primitives ---------------------------------------------------------------------------------------------------
    def _p(self, pts):
        s = self.ss
        return [(x * s, y * s) for x, y in pts]

    def poly(self, pts, colour, material: int = PLASTER):
        c = colour if isinstance(colour, tuple) else c255(colour)
        self.dc.polygon(self._p(pts), fill=(*c[:3], 255))
        self.dm.polygon(self._p(pts), fill=material)

    def rect(self, x0, y0, x1, y1, colour, material: int = PLASTER):
        self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], colour, material)

    def ellipse(self, cx, cy, rx, ry, colour, material: int = PLASTER):
        s = self.ss
        c = colour if isinstance(colour, tuple) else c255(colour)
        box = [(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s]
        self.dc.ellipse(box, fill=(*c[:3], 255))
        self.dm.ellipse(box, fill=material)

    def line(self, x0, y0, x1, y1, width, colour, material: int | None = None):
        s = self.ss
        c = colour if isinstance(colour, tuple) else c255(colour)
        self.dc.line([(x0 * s, y0 * s), (x1 * s, y1 * s)], fill=(*c[:3], 255), width=max(1, int(width * s)))
        if material is not None:
            self.dm.line([(x0 * s, y0 * s), (x1 * s, y1 * s)], fill=material, width=max(1, int(width * s)))

    def erase_poly(self, pts):
        """Cuts a hole (transparent, no material): used for open arcades and gaps between buildings."""
        s = self.ss
        self.dc.polygon(self._p(pts), fill=(0, 0, 0, 0))
        self.dm.polygon(self._p(pts), fill=NONE)

    # -- shade passes (applied after texturing) ------------------------------------------------------------------------
    def eave(self, x0, x1, y, h, s=0.5):
        """A shadow under an overhang: darkest at y, fading out over h pixels below."""
        self.fx.append(("eave", x0, x1, y, h, s))

    def shade_x(self, x0, x1, y0, y1, s, left_dark=True):
        """A horizontal gradient: dark on one side (inside a door frame, beside a projection)."""
        self.fx.append(("sidex", x0, x1, y0, y1, s, left_dark))

    def box_shadow(self, x0, y0, x1, y1, s=0.35, soft=6):
        """A soft dark rectangle (a recess, the shade a balcony throws)."""
        self.fx.append(("box", x0, y0, x1, y1, s, soft))

    def highlight(self, x0, y0, x1, y1, s=0.18, soft=4):
        self.fx.append(("hi", x0, y0, x1, y1, s, soft))

    # -- finishing ----------------------------------------------------------------------------------------------------
    def finish(self, grime: float = 1.0) -> np.ndarray:
        W, H, ss = self.W, self.H, self.ss
        img = self.col.resize((W, H), Image.LANCZOS)
        rgba = np.asarray(img, dtype=np.float32) / 255.0
        mat = np.asarray(self.mat)[ss // 2 :: ss, ss // 2 :: ss][:H, :W]
        rgb = rgba[..., :3].copy()
        rgb = texture(rgb, mat, self.seed, W, H, grime)
        rgb = apply_fx(rgb, self.fx, W, H)
        out = np.concatenate([np.clip(rgb, 0, 1), rgba[..., 3:4]], -1)
        return out


# ----------------------------------------------------------------------------------------------- material textures
def _blocks(H: int, W: int, seed: int, course: float, bw: tuple[float, float], tone: float, joint: float) -> tuple[np.ndarray, np.ndarray]:
    """Coursed masonry: a per-pixel tone multiplier (each block its own tone) and a mortar-line mask."""
    r = rng(seed)
    tone_a = np.ones((H, W), np.float32)
    joints = np.zeros((H, W), np.float32)
    y = 0.0
    j = 0
    while y < H:
        ch = course * r.uniform(0.85, 1.15)
        y0, y1 = int(y), int(min(H, y + ch))
        x = -r.uniform(0, bw[1])
        while x < W:
            w = r.uniform(*bw)
            x0, x1 = int(max(0, x)), int(min(W, x + w))
            if x1 > x0:
                tone_a[y0:y1, x0:x1] = 1.0 + r.normal(0, tone)
                joints[y0:y1, x0 : min(W, x0 + 1)] = 1.0 if x > 0 else 0.0
            x += w
        joints[y0 : min(H, y0 + 1), :] = 1.0
        y += ch
        j += 1
    return tone_a, joints


def texture(rgb: np.ndarray, mat: np.ndarray, seed: int, W: int, H: int, grime: float = 1.0) -> np.ndarray:
    n_big = fbm2(H, W, 4, 4, 0.55, seed + 1, aspect=W / H)
    n_mid = fbm2(H, W, 14, 3, 0.55, seed + 2, aspect=W / H)
    grain = lattice2(H, W, max(2, H // 2), max(2, W // 2), seed + 3)
    streak = lattice2(H, W, 3, max(4, W // 16), seed + 4)  # long vertical stains (rain running off the roof edge)
    sweep = lattice2(H, W, max(2, H // 2), max(2, W // 14), seed + 5)  # fine horizontal strands (straw)
    yy = (np.arange(H, dtype=np.float32) / H)[:, None]

    out = rgb.copy()
    m = mat == PLASTER
    if m.any():
        lum = 1.0 + 0.16 * (n_big - 0.5) + 0.10 * (n_mid - 0.5) + 0.06 * (grain - 0.5)
        stain = smoothstep(0.66, 0.92, streak) * 0.10 * grime * (1 - yy) ** 0.7
        damp = smoothstep(0.80, 1.0, yy) * 0.18 * grime  # damp and splashes near the ground
        rubbed = smoothstep(0.70, 0.86, n_mid * 0.6 + n_big * 0.4) * smoothstep(0.55, 0.95, yy) * 0.40 * grime
        base = out * (lum * (1 - stain) * (1 - damp))[..., None]
        under = np.array([0.74, 0.60, 0.45], np.float32)  # the sandy mud under a worn lime wash
        base = mix(base, base * 0.55 + under * 0.45, rubbed[..., None])
        out = np.where(m[..., None], base, out)
    m = mat == STONE
    if m.any():
        tone_a, joints = _blocks(H, W, seed + 7, course=34, bw=(55, 96), tone=0.06, joint=1.0)
        lum = tone_a * (1.0 + 0.12 * (n_mid - 0.5) + 0.08 * (grain - 0.5))
        base = out * lum[..., None] * (1.0 - 0.38 * joints)[..., None]
        base *= (1.0 - 0.10 * smoothstep(0.7, 1.0, yy))[..., None]
        out = np.where(m[..., None], base, out)
    m = mat == TRIM
    if m.any():
        tone_a, joints = _blocks(H, W, seed + 8, course=18, bw=(26, 52), tone=0.045, joint=1.0)
        lum = tone_a * (1.0 + 0.08 * (n_mid - 0.5) + 0.07 * (grain - 0.5))
        base = out * lum[..., None] * (1.0 - 0.22 * joints)[..., None]
        out = np.where(m[..., None], base, out)
    m = mat == WOOD
    if m.any():
        plank = ((np.arange(W)[None, :] % 15) < 1).astype(np.float32)
        gr = lattice2(H, W, 4, max(8, W // 2), seed + 9)
        gr2 = lattice2(H, W, 14, max(8, W // 3), seed + 10)
        pid = (np.arange(W)[None, :] // 15)
        ptone = 0.88 + 0.24 * ((pid * 2654435761 % 1000) / 1000.0)
        lum = ptone * (0.82 + 0.30 * gr + 0.10 * gr2)
        base = out * lum[..., None] * (1.0 - 0.45 * plank)[..., None]
        out = np.where(m[..., None], base, out)
    m = mat == THATCH
    if m.any():
        lum = 0.74 + 0.48 * sweep + 0.22 * (grain - 0.5)
        warm = np.array([1.05, 1.0, 0.88], np.float32)
        base = out * np.clip(lum, 0.35, 1.5)[..., None] * warm
        out = np.where(m[..., None], base, out)
    m = mat == EARTH
    if m.any():
        lum = 1.0 + 0.20 * (n_big - 0.5) + 0.14 * (n_mid - 0.5) + 0.10 * (grain - 0.5)
        fleck = lattice2(H, W, max(2, H // 2), max(2, W // 9), seed + 6)
        straw = smoothstep(0.80, 0.90, fleck) * 0.10
        base = out * lum[..., None] + straw[..., None] * np.array([0.9, 0.78, 0.45], np.float32)
        out = np.where(m[..., None], base, out)
    m = mat == CLAY
    if m.any():
        lum = 1.0 + 0.12 * (n_mid - 0.5) + 0.10 * (grain - 0.5)
        out = np.where(m[..., None], out * lum[..., None], out)
    m = mat == TILE
    if m.any():
        tone_a, joints = _blocks(H, W, seed + 11, course=11, bw=(14, 22), tone=0.07, joint=1.0)
        lum = tone_a * (1.0 + 0.10 * (n_mid - 0.5))
        out = np.where(m[..., None], out * lum[..., None] * (1.0 - 0.30 * joints)[..., None], out)
    m = mat == CLOTH
    if m.any():
        wv = 1.0 + 0.07 * np.sin(np.arange(W)[None, :] * 1.7) + 0.06 * (grain - 0.5)
        out = np.where(m[..., None], out * wv[..., None], out)
    m = mat == DARK
    if m.any():
        out = np.where(m[..., None], out * (0.85 + 0.30 * n_mid)[..., None], out)
    return out


def apply_fx(rgb: np.ndarray, fx: list, W: int, H: int) -> np.ndarray:
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dark = np.zeros((H, W), np.float32)
    light = np.zeros((H, W), np.float32)
    for f in fx:
        kind = f[0]
        if kind == "eave":
            _, x0, x1, y, h, s = f
            t = np.clip((yy - y) / max(h, 1), 0, 1)
            band = (xx >= x0) & (xx < x1) & (yy >= y)
            dark = np.maximum(dark, np.where(band, s * (1 - t) ** 2, 0))
        elif kind == "sidex":
            _, x0, x1, y0, y1, s, left_dark = f
            t = np.clip((xx - x0) / max(x1 - x0, 1), 0, 1)
            t = 1 - t if left_dark else t
            band = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
            dark = np.maximum(dark, np.where(band, s * t**1.5, 0))
        elif kind in ("box", "hi"):
            _, x0, y0, x1, y1, s, soft = f
            dx = np.minimum(xx - x0, x1 - xx)
            dy = np.minimum(yy - y0, y1 - yy)
            d = np.minimum(dx, dy)
            v = np.clip(d / max(soft, 1), 0, 1) * s
            v = np.where((xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1), v, 0)
            if kind == "box":
                dark = np.maximum(dark, v)
            else:
                light = np.maximum(light, v)
    warm_shadow = np.array([0.30, 0.20, 0.14], np.float32)  # shade is a warm brown, never black
    out = mix(rgb, rgb * 0.55 + warm_shadow * 0.45 * rgb.mean(-1, keepdims=True) * 2.0, dark[..., None])
    out = out * (1.0 - 0.0 * dark[..., None])
    out = mix(out, np.minimum(out * 1.25 + 0.04, 1.0), light[..., None])
    return out


# ----------------------------------------------------------------------------------------------- architectural parts
def arch_pts(x0, x1, y_spring, y_bottom, kind: str = "round", n: int = 18):
    """The outline of an arched opening (a door, a niche): up the left jamb, over the arch, down the right jamb."""
    cx, rx = (x0 + x1) / 2, (x1 - x0) / 2
    pts = [(x0, y_bottom)]
    if kind == "round":
        for i in range(n + 1):
            a = math.pi - math.pi * i / n
            pts.append((cx + math.cos(a) * rx, y_spring - math.sin(a) * rx))
    elif kind == "pointed":
        rise = rx * 1.15
        for i in range(n + 1):
            t = i / n
            a = math.pi * (1 - t)
            # two arcs that meet at the apex: sharpen the round arch by lifting its crown
            px = cx + math.cos(a) * rx
            py = y_spring - math.sin(a) * rise * (0.55 + 0.45 * abs(math.cos(a)) ** 0.0)
            pts.append((px, py - rx * 0.28 * math.sin(a) ** 3))
    elif kind == "cusped":
        for i in range(n * 3 + 1):
            t = i / (n * 3)
            a = math.pi - math.pi * t
            sc = 1.0 - 0.07 * abs(math.sin(a * 4.0))
            pts.append((cx + math.cos(a) * rx * sc, y_spring - math.sin(a) * rx * sc))
    else:  # flat lintel
        pts.append((x0, y_spring))
        pts.append((x1, y_spring))
    pts.append((x1, y_bottom))
    return pts


def door(art: Art, x0, x1, y0, y1, wood="#33605b", arch="round", frame="#a8603f", studs=True, leaf_split=True):
    """A pair of studded wooden leaves in an arched stone frame, with the dark of the doorway showing at the jambs."""
    fw = 11
    art.poly(arch_pts(x0 - fw, x1 + fw, y0 + (x1 - x0) / 2, y1 + 1, arch), frame, TRIM)
    spring = y0 + (x1 - x0) / 2
    art.poly(arch_pts(x0, x1, spring, y1 + 1, arch), "#1d1510", DARK)
    inset = 5
    art.poly(arch_pts(x0 + inset, x1 - inset, spring + 1, y1 + 1, arch), wood, WOOD)
    cx = (x0 + x1) / 2
    if leaf_split:
        art.line(cx, spring - (x1 - x0) / 2 * 0.9, cx, y1, 2.0, "#1b130c")
    if studs:
        rows = max(3, int((y1 - spring) / 26))
        for k in range(rows):
            y = spring + 14 + k * (y1 - spring - 24) / max(rows - 1, 1)
            for side in (-1, 1):
                for dx in (22, (x1 - x0) / 2 - 12):
                    art.ellipse(cx + side * dx, y, 2.6, 2.6, "#30291f", IRON)
                    art.ellipse(cx + side * dx - 0.7, y - 0.7, 1.0, 1.0, "#8a7d68", IRON)
        # a ring handle on each leaf
        for side in (-1, 1):
            art.ellipse(cx + side * 9, spring + (y1 - spring) * 0.55, 4.5, 4.5, "#3a3228", IRON)
            art.ellipse(cx + side * 9, spring + (y1 - spring) * 0.55, 2.4, 2.4, "#1f1812", DARK)
    art.shade_x(x0, x0 + 20, spring, y1, 0.45, True)  # the jamb throws a shadow onto the leaf
    art.box_shadow(x0 + inset, y0 + 1, x1 - inset, spring + 6, 0.22, 10)


def step_slab(art: Art, x0, x1, y, h=9, colour="#b9946f"):
    art.rect(x0, y - h, x1, y, colour, STONE)
    art.rect(x0, y - h, x1, y - h + 2, c255(colour, 1.18), STONE)


def window(art: Art, x0, y0, x1, y1, frame="#e9e0cc", shutter="#3d6a64", open_shutters=True, bars=True, arch=False):
    """A small barred window with painted shutters folded open on either side."""
    fw = 6
    if arch:
        art.poly(arch_pts(x0 - fw, x1 + fw, y0 + (x1 - x0) / 2, y1 + fw, "round"), frame, PLASTER)
        art.poly(arch_pts(x0, x1, y0 + (x1 - x0) / 2, y1, "round"), "#1d1510", DARK)
    else:
        art.rect(x0 - fw, y0 - fw, x1 + fw, y1 + fw + 2, frame, PLASTER)
        art.rect(x0, y0, x1, y1, "#1d1510", DARK)
    if bars:
        for x in np.linspace(x0 + 4, x1 - 4, 4):
            art.line(x, y0 + 1, x, y1, 1.6, "#2d2722", IRON)
    if open_shutters:
        w = (x1 - x0) / 2
        art.rect(x0 - fw - w, y0 - 2, x0 - fw, y1 + 2, shutter, WOOD)
        art.rect(x1 + fw, y0 - 2, x1 + fw + w, y1 + 2, shutter, WOOD)
    art.box_shadow(x0, y0, x1, y1, 0.0, 1)
    art.shade_x(x0, x0 + (x1 - x0) * 0.5, y0, y1, 0.35, True)


def parapet(art: Art, x0, x1, y_top, h=30, wall="#e8dcc2", coping="#c79b78", merlons=False):
    """A roof-edge wall with a stone coping; optionally cut into merlons."""
    art.rect(x0, y_top, x1, y_top + h, wall, PLASTER)
    art.rect(x0 - 3, y_top - 7, x1 + 3, y_top + 2, coping, TRIM)
    if merlons:
        step = 40
        x = x0 + 8
        while x + 22 < x1:
            art.rect(x, y_top - 24, x + 22, y_top - 6, wall, PLASTER)
            art.rect(x - 2, y_top - 30, x + 24, y_top - 22, coping, TRIM)
            x += step
    art.eave(x0, x1, y_top + h - 2, 36, 0.45)


def chhatri(art: Art, cx, base_y, w=96, h=118, dome="#e6d8bd", stone="#b85d40"):
    """A small domed pavilion on four columns, as it stands on a roof corner."""
    pw = w
    # platform
    art.rect(cx - pw / 2 - 6, base_y - 10, cx + pw / 2 + 6, base_y, stone, TRIM)
    # columns
    col_h = h * 0.45
    for k, dx in enumerate((-pw / 2 + 5, -pw / 6, pw / 6, pw / 2 - 5)):
        art.rect(cx + dx - 4, base_y - 10 - col_h, cx + dx + 4, base_y - 10, stone, TRIM)
        art.rect(cx + dx - 4, base_y - 10 - col_h, cx + dx - 1.5, base_y - 10, c255("#d98a66"), TRIM)
    art.rect(cx - pw / 2 - 2, base_y - 10 - col_h - 8, cx + pw / 2 + 2, base_y - 10 - col_h, stone, TRIM)
    # the dome
    top = base_y - 10 - col_h - 8
    pts = [(cx - pw / 2, top)]
    for i in range(0, 25):
        a = math.pi - math.pi * i / 24
        pts.append((cx + math.cos(a) * pw / 2 * 1.04, top - math.sin(a) * h * 0.42))
    pts.append((cx + pw / 2, top))
    art.poly(pts, dome, PLASTER)
    art.highlight(cx - pw / 2 + 4, top - h * 0.38, cx - 2, top - 3, 0.2, 8)
    art.box_shadow(cx + pw * 0.12, top - h * 0.30, cx + pw / 2, top, 0.28, 10)
    # finial
    art.rect(cx - 1.6, top - h * 0.42 - 16, cx + 1.6, top - h * 0.42 + 2, "#2b2420", IRON)
    art.ellipse(cx, top - h * 0.42 - 18, 3.4, 3.8, "#c9a34a", IRON)
    art.box_shadow(cx - pw / 2 + 6, top + 8, cx + pw / 2 - 6, base_y - 12, 0.0, 1)


def jharokha(art: Art, cx, y_bottom, w=210, h=168, stone="#b95e42", dome="#e6d8bd"):
    """A projecting stone balcony window: brackets, a floor slab, slender columns round a dark opening, and a small domed roof."""
    x0, x1 = cx - w / 2, cx + w / 2
    # corbel brackets: stepped, narrowing downward
    for k in range(4):
        art.rect(x0 + 10 + k * 16, y_bottom - 8 - (3 - k) * 10 + 24, x1 - 10 - k * 16, y_bottom - (3 - k) * 10 + 24, stone, TRIM)
    art.rect(x0 - 8, y_bottom - 20, x1 + 8, y_bottom - 4, stone, TRIM)  # the floor slab
    top = y_bottom - 20
    body_h = h * 0.58
    # the opening and its screen of columns
    art.rect(x0 + 6, top - body_h, x1 - 6, top, "#241a14", DARK)
    n = 5
    for k in range(n):
        x = x0 + 6 + k * (w - 12 - 10) / (n - 1)
        art.rect(x, top - body_h, x + 10, top, stone, TRIM)
        art.rect(x, top - body_h, x + 3.5, top, c255("#d98a66"), TRIM)
    # a railing across the lower part
    art.rect(x0 + 6, top - 34, x1 - 6, top - 26, stone, TRIM)
    for x in np.arange(x0 + 14, x1 - 10, 9):
        art.line(x, top - 26, x, top, 2.0, stone, TRIM)
    # eave slab and dome
    roof_y = top - body_h
    art.rect(x0 - 12, roof_y - 12, x1 + 12, roof_y, stone, TRIM)
    pts = [(x0 - 4, roof_y - 12)]
    for i in range(0, 25):
        a = math.pi - math.pi * i / 24
        pts.append((cx + math.cos(a) * (w / 2 + 2), roof_y - 12 - math.sin(a) * h * 0.30))
    pts.append((x1 + 4, roof_y - 12))
    art.poly(pts, dome, PLASTER)
    art.highlight(x0 + 4, roof_y - 12 - h * 0.27, cx - 4, roof_y - 14, 0.18, 8)
    art.box_shadow(cx + w * 0.15, roof_y - 12 - h * 0.25, x1, roof_y - 12, 0.26, 10)
    art.rect(cx - 1.6, roof_y - 12 - h * 0.30 - 14, cx + 1.6, roof_y - 12 - h * 0.30 + 2, "#2b2420", IRON)
    art.ellipse(cx, roof_y - 12 - h * 0.30 - 16, 3.2, 3.6, "#c9a34a", IRON)
    art.eave(x0 - 12, x1 + 12, roof_y, 22, 0.40)
    art.shade_x(x0 + 6, x0 + 6 + (w - 12) * 0.55, roof_y, top, 0.5, True)


def jali(art: Art, x0, y0, x1, y1, stone="#c7926e"):
    """A pierced stone screen: a panel with a grid of small diamond holes."""
    art.rect(x0, y0, x1, y1, stone, TRIM)
    step = 13
    for yy in np.arange(y0 + 8, y1 - 8, step):
        for xx in np.arange(x0 + 8, x1 - 8, step):
            d = 4.2
            art.poly([(xx, yy - d), (xx + d, yy), (xx, yy + d), (xx - d, yy)], "#241a14", DARK)
    art.rect(x0, y0, x1, y0 + 6, c255(stone, 0.85), TRIM)
    art.rect(x0, y1 - 6, x1, y1, c255(stone, 0.85), TRIM)


def painted_band(art: Art, x0, x1, y, colour="#f7f1e2", kind="dots", scale=1.0):
    """The white painted patterns on a mud wall: a row of dots, diamonds or zig-zag."""
    r = art.r
    if kind == "dots":
        for x in np.arange(x0 + 8, x1 - 8, 15 * scale):
            art.ellipse(x, y, 3.4 * scale, 3.4 * scale, colour, PLASTER)
    elif kind == "diamonds":
        for x in np.arange(x0 + 12, x1 - 12, 28 * scale):
            d = 8 * scale
            art.poly([(x, y - d), (x + d, y), (x, y + d), (x - d, y)], colour, PLASTER)
    else:
        pts = []
        for i, x in enumerate(np.arange(x0 + 6, x1 - 6, 11 * scale)):
            pts.append((x, y + (-7 if i % 2 else 7) * scale))
        for a, b in zip(pts[:-1], pts[1:]):
            art.line(a[0], a[1], b[0], b[1], 2.4 * scale, colour, PLASTER)
    _ = r


def pot(art: Art, cx, base_y, h=44, w=34, colour="#b8643e", band=True):
    """An earthen water pot (matka)."""
    pts = []
    for i in range(0, 25):
        t = i / 24
        yy = base_y - t * h
        prof = math.sin(math.pi * (0.12 + 0.82 * t) ** 0.9)  # round belly, narrow neck
        xr = (0.28 + 0.72 * prof) * w / 2 * (1.0 if t < 0.88 else 0.62)
        pts.append((cx + xr, yy))
    left = [(2 * cx - x, y) for x, y in reversed(pts)]
    art.poly(pts + left, colour, CLAY)
    art.highlight(cx - w * 0.38, base_y - h * 0.8, cx - w * 0.12, base_y - h * 0.25, 0.28, 6)
    art.box_shadow(cx + w * 0.12, base_y - h * 0.85, cx + w * 0.5, base_y - 2, 0.30, 10)
    if band:
        art.rect(cx - w * 0.30, base_y - h * 0.58, cx + w * 0.30, base_y - h * 0.52, "#f1e4cc", PLASTER)
    art.ellipse(cx, base_y - h + 1, w * 0.18, 3.2, "#3a2418", DARK)


def charpai(art: Art, x0, y, w=120, h=26):
    """A rope bed on four legs, seen from the side."""
    art.rect(x0, y - h, x0 + w, y - h + 6, "#6b4a2d", WOOD)
    art.rect(x0 + 4, y - h + 6, x0 + w - 4, y - h + 10, "#c9b98a", CLOTH)
    for dx in (6, w - 12):
        art.rect(x0 + dx, y - h + 6, x0 + dx + 6, y, "#5a3a22", WOOD)


def thatch_cone(art: Art, cx, base_y, w, h, colour="#b99552"):
    """A conical thatched roof (a hut's roof), with a slight overhang and a tuft at the top."""
    pts = [(cx - w / 2, base_y), (cx - 4, base_y - h), (cx + 4, base_y - h), (cx + w / 2, base_y)]
    # slightly concave sides
    left = bezier((cx - w / 2, base_y), (cx - w * 0.18, base_y - h * 0.42), (cx - 4, base_y - h), 16)
    right = bezier((cx + 4, base_y - h), (cx + w * 0.18, base_y - h * 0.42), (cx + w / 2, base_y), 16)
    art.poly(left + right, colour, THATCH)
    art.poly([(cx - w / 2, base_y), (cx + w / 2, base_y), (cx + w / 2 - 6, base_y + 10), (cx - w / 2 + 6, base_y + 10)], c255(colour, 0.6), THATCH)
    art.eave(cx - w / 2 + 6, cx + w / 2 - 6, base_y + 4, 28, 0.5)
    art.rect(cx - 3, base_y - h - 12, cx + 3, base_y - h + 4, colour, THATCH)
    art.shade_x(cx + w * 0.05, cx + w / 2, base_y - h, base_y + 10, 0.40, False)
    art.highlight(cx - w / 2 + 14, base_y - h * 0.7, cx - 6, base_y - 6, 0.12, 12)
    _ = pts
