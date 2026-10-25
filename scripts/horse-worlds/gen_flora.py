"""
Plants for the horse environments, drawn from scratch (no photograph, no horse): broad-crowned trees, columnar trees, shrubs,
grass clumps and flower patches. Shared by gen_field.py and gen_village.py. The light is always up and to the left of the
picture, as in the desert sprites, so every world's cut-outs agree about where the sun is.

Foliage is built the way a painter builds it, in three scales:
  1. lobes     big lit spheres that give the crown its shape (and dark crevices between them),
  2. clusters  smaller spheres sitting on the skin of every lobe, which makes the lobes lumpy,
  3. leaves    thousands of small marks on the visible side of each sphere, shaded by the sphere's own normal.
Everything is drawn back to front, so near lobes overlap far ones. Spheres deep inside the crown are darkened (ambient
occlusion), the underside is darker than the top, and a slow noise field lets patches of sun fall across the canopy.
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw

from gen_common import Canvas, bezier, fbm2, hex2rgb, lattice2, mix, rng, smoothstep

LIGHT = np.array([-0.72, -0.69])  # toward the sun: up and to the left (x right, y down)
L3 = np.array([-0.60, 0.62, 0.50])  # the same direction in (x right, y up, z toward the viewer)
L3 = L3 / np.linalg.norm(L3)


def tone(shade, mid, light, t, r, jitter=0.06):
    """A colour along shade -> mid -> light for t in 0..1, as an RGBA tuple in 0..255 with a little random variation."""
    t = float(np.clip(t, 0.0, 1.0))
    c = mix(shade, mid, smoothstep(0.0, 0.55, t)) if t < 0.55 else mix(mid, light, smoothstep(0.55, 1.0, t))
    c = c * (1.0 + r.normal(0, jitter))
    return (*np.clip(c * 255.0, 0, 255), 255)


def tone_arr(shade, mid, light, t):
    """The same ramp for an array t of any shape: returns RGB floats in 0..1 with shape t.shape + (3,)."""
    t = np.clip(t, 0.0, 1.0)[..., None]
    lo = mix(shade, mid, smoothstep(0.0, 0.55, t))
    hi = mix(mid, light, smoothstep(0.55, 1.0, t))
    return np.where(t < 0.55, lo, hi)


def _paste_over(big: Image.Image, patch: Image.Image, x0: int, y0: int) -> None:
    """alpha_composite that tolerates a patch hanging over the edge of the canvas."""
    W, H = big.size
    pw, ph = patch.size
    sx0, sy0 = max(0, -x0), max(0, -y0)
    sx1, sy1 = min(pw, W - x0), min(ph, H - y0)
    if sx1 <= sx0 or sy1 <= sy0:
        return
    crop = patch if (sx0, sy0, sx1, sy1) == (0, 0, pw, ph) else patch.crop((sx0, sy0, sx1, sy1))
    big.alpha_composite(crop, (x0 + sx0, y0 + sy0))


# ----------------------------------------------------------------------------------------------- crown geometry
def fib_sphere(n: int, r) -> np.ndarray:
    """n points spread evenly over a unit sphere, as (x, y up, z toward the viewer)."""
    i = np.arange(n) + 0.5
    phi = np.arccos(1 - 2 * i / n)
    th = math.pi * (1 + 5**0.5) * i + r.uniform(0, 6.283)
    return np.stack([np.cos(th) * np.sin(phi), np.cos(phi), np.sin(th) * np.sin(phi)], -1)


def lobe_spheres(
    r,
    rx: float,
    ry: float,
    rz: float,
    lobes: int,
    *,
    lobe_rad: tuple[float, float] = (0.36, 0.46),
    sub: tuple[int, int] = (6, 10),
    sub_rad: tuple[float, float] = (0.30, 0.46),
    flat: float = 0.78,
    rad_ref: float | None = None,
    profile=None,
    fill: int = 5,
    jitter: float = 0.22,
):
    """Spheres (x, y, z, R) with y up that fill an ellipsoid crown.

    Big lobes are spread evenly over its skin and over a shell inside it (a Fibonacci lattice, jittered), so the whole front
    is covered with no bald patches; every lobe then carries a handful of smaller clusters on its outward side.
    """
    rad_ref = rad_ref or min(rx, ry)
    n_out = max(6, int(round(lobes * 0.68)))
    n_mid = max(3, lobes - n_out)
    centres: list[tuple[float, float, float, float]] = []
    for scale, n in ((1.0, n_out), (0.58, n_mid)):
        for v in fib_sphere(n, r):
            v = v + r.normal(0, jitter, 3)
            v = v / max(float(np.linalg.norm(v)), 1e-6) * scale * (1.0 + r.normal(0, 0.05))
            R = r.uniform(*lobe_rad) * rad_ref
            yv = float(v[1]) * (flat if v[1] < 0 else 1.0)
            if v[1] < -0.2:
                yv += r.normal(0, 0.10)  # a ragged underside
            k = float(profile((yv + 1.0) / 2.0)) if profile else 1.0
            ex, ey, ez = max(rx * k - 1.4 * R, 1.0), max(ry - 1.4 * R, 1.0), max(rz * k - 1.4 * R, 1.0)
            centres.append((float(v[0] * ex), float(yv * ey), float(v[2] * ez), float(R)))
    out: list[tuple[float, float, float, float]] = []
    # a few dark fillers deep inside, so creases between lobes show foliage and not sky
    for _ in range(fill):
        u = r.uniform(-0.45, 0.45, 3)
        out.append((float(u[0] * rx * 0.8), float(u[1] * ry * 0.8), float(-abs(u[2]) * rz * 0.8), float(0.34 * rad_ref)))
    for x, y, z, R in centres:
        out.append((x, y, z, R))
        outward = np.array([x / rx, y / ry, z / rz])
        outward = outward / max(float(np.linalg.norm(outward)), 1e-6)
        for _ in range(int(r.integers(sub[0], sub[1] + 1))):
            v = r.normal(size=3)
            v = v / max(float(np.linalg.norm(v)), 1e-6) + 0.9 * outward
            v = v / max(float(np.linalg.norm(v)), 1e-6)
            q = np.array([x, y, z]) + v * R * r.uniform(0.75, 1.0)
            out.append((float(q[0]), float(q[1]), float(q[2]), float(R * r.uniform(*sub_rad))))
    return out, centres


# ----------------------------------------------------------------------------------------------- the painter
def paint_crown(
    big: Image.Image,
    r,
    spheres,
    centre: tuple[float, float],
    ell: tuple[float, float, float],
    palette,
    leaf: tuple[float, float],
    S: int,
    field: np.ndarray,
    *,
    cover: float = 2.0,
    rough: float = 0.10,
    ao_strength: float = 0.5,
    flowers=None,
    flower_density: float = 0.05,
    contrast: float = 1.0,
):
    """Draws every sphere, far to near, onto the supersampled canvas `big` (RGBA)."""
    shade, mid, light = (hex2rgb(c) for c in palette)
    cx0, cy0 = centre
    rx, ry, rz = ell
    fh, fw = field.shape
    order = sorted(range(len(spheres)), key=lambda i: spheres[i][2])
    leaf_mean = 0.5 * (leaf[0] + leaf[1])
    flower_cols = [hex2rgb(c) for c in flowers] if flowers else None
    ang8 = np.linspace(0, 2 * np.pi, 9)[:-1]
    for i in order:
        x, y, z, R = spheres[i]
        g = np.array([x / rx, y / ry, z / rz])
        gl = float(np.linalg.norm(g))
        gn = g / max(gl, 1e-6)
        gdiff = 0.5 + 0.5 * float(gn @ L3)
        inner = 1.0 - min(gl, 1.0)
        ao = 1.0 - ao_strength * float(smoothstep(0.0, 0.9, inner))
        under = 1.0 - 0.30 * float(smoothstep(0.0, 0.9, -gn[1]))
        gscale = ao * under
        tint = 1.0 + r.normal(0, 0.035)

        Rs = R * S
        half = int(math.ceil(1.2 * Rs + 2.3 * leaf[1] * S)) + 2
        n = 2 * half
        cxp, cyp = (cx0 + x) * S, (cy0 - y) * S
        x0, y0 = int(round(cxp)) - half, int(round(cyp)) - half
        ox, oy = cxp - (x0 + half), cyp - (y0 + half)

        yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
        dx = (xx + 0.5 - half - ox) / Rs
        dy = -(yy + 0.5 - half - oy) / Rs
        rho = np.hypot(dx, dy)
        th = np.arctan2(dy, dx)
        wob = np.ones_like(rho)
        for k in (3, 4, 5, 7, 9):
            wob += r.uniform(0.2, 1.0) * rough / math.sqrt(k) * np.cos(k * th + r.uniform(0, 6.283))
        wob = np.clip(wob, 0.78, 1.3)
        e = rho / wob
        alpha = np.clip((1.0 - e) * Rs * 0.7 + 0.5, 0.0, 1.0)
        nz = np.sqrt(np.clip(1.0 - e * e, 0.0, 1.0))
        nxl, nyl = dx / wob, dy / wob
        nrm = np.sqrt(nxl * nxl + nyl * nyl + nz * nz) + 1e-6
        diff = (nxl * L3[0] + nyl * L3[1] + nz * L3[2]) / nrm
        wrap = 0.5 + 0.5 * diff
        # the sun-patch noise field, sampled around this sphere
        fy = (np.arange(n) + y0) % fh
        fx = (np.arange(n) + x0) % fw
        fld = field[np.ix_(fy, fx)]
        t = (0.45 * wrap + 0.55 * gdiff) * gscale * (1.0 - 0.18 * contrast + 0.36 * contrast * fld)
        hue = r.normal(0, 0.05)
        rgb = tone_arr(shade, mid, light, t) * tint * np.array([1.0 + hue, 1.0, 1.0 - hue], dtype=np.float32)
        rim = smoothstep(0.80, 1.0, e)
        rgb = rgb * (1.0 - 0.20 * rim)[..., None]
        patch = Image.fromarray(np.dstack([np.clip(rgb * 255, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")

        # leaves on the visible side of the sphere
        m = int(cover * R * R / (0.55 * leaf_mean * leaf_mean))
        if m > 0:
            d = ImageDraw.Draw(patch)
            u = r.random(m)
            rr = np.sqrt(u) * (1.0 + 0.16 * (r.random(m) < 0.14))
            ph = r.uniform(0, 2 * np.pi, m)
            lx, ly = rr * np.cos(ph), rr * np.sin(ph)
            lz = np.sqrt(np.clip(1.0 - rr * rr, 0.0, 1.0))
            nl = np.stack([lx, ly, lz], -1) + r.normal(0, 0.30, (m, 3))
            nl = nl / (np.linalg.norm(nl, axis=1, keepdims=True) + 1e-6)
            wl = 0.5 + 0.5 * (nl @ L3)
            px_ = half + ox + lx * Rs
            py_ = half + oy - ly * Rs
            fl = field[(py_.astype(int) + y0) % fh, (px_.astype(int) + x0) % fw]
            tl = (0.45 * wl + 0.55 * gdiff) * gscale * (1.0 - 0.18 * contrast + 0.36 * contrast * fl)
            tl = tl + r.normal(0, 0.085, m)
            spark = r.random(m) < 0.06
            pocket = r.random(m) < 0.07
            tl = np.where(spark, tl + 0.22, tl)
            tl = np.where(pocket, tl - 0.18, tl)
            cols = np.clip(tone_arr(shade, mid, light, tl) * (1.0 + r.normal(0, 0.045, (m, 1))) * 255, 0, 255).astype(np.uint8)
            s = r.uniform(leaf[0], leaf[1], m) * S
            phi = ph + np.pi / 2 + r.normal(0, 0.8, m)
            ca, sa = np.cos(phi), np.sin(phi)
            ex_ = s[:, None] * np.cos(ang8)[None, :]
            ey_ = 0.5 * s[:, None] * np.sin(ang8)[None, :]
            X = px_[:, None] + ex_ * ca[:, None] - ey_ * sa[:, None]
            Y = py_[:, None] + ex_ * sa[:, None] + ey_ * ca[:, None]
            pts = np.stack([X, Y], -1).reshape(m, -1)
            for k in range(m):
                d.polygon(pts[k].tolist(), fill=(int(cols[k, 0]), int(cols[k, 1]), int(cols[k, 2]), 255))
            if flower_cols and gl > 0.35:
                mf = int(m * flower_density)
                for _k in range(mf):
                    j = int(r.integers(0, m))
                    if lz[j] < 0.25 or tl[j] < 0.30:
                        continue
                    fc = flower_cols[int(r.integers(0, len(flower_cols)))] * (0.82 + 0.3 * float(np.clip(tl[j], 0, 1)))
                    rad = r.uniform(1.5, 2.8) * S
                    d.ellipse([px_[j] - rad, py_[j] - rad * 0.9, px_[j] + rad, py_[j] + rad * 0.9], fill=tuple(int(v) for v in np.clip(fc * 255, 0, 255)) + (255,))
        _paste_over(big, patch, x0, y0)


def _offset_curve(pts, widths, a):
    """The polyline `pts` shifted sideways by a * width (a in -0.5..0.5, negative = toward the lit left side)."""
    P = np.array(pts, dtype=np.float64)
    d = np.gradient(P, axis=0)
    d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
    nrm = np.stack([-d[:, 1], d[:, 0]], -1)
    return P + nrm * (np.asarray(widths)[:, None] * a)


def _tube(cv: Canvas, pts, widths, bark, r, steps: int = 9, fissures: int = 5):
    """A tapering, softly shaded tube along a path (trunk or limb): lit on the left, dark on the right, with a few bark fissures."""
    dark, mid, lit = (hex2rgb(c) * 255 for c in (bark[0], bark[2] if len(bark) > 2 else bark[1], bark[1]))
    edges = [-0.5 + k / steps for k in range(steps + 1)]
    for k in range(steps):
        t = (k + 0.5) / steps  # 0 lit left .. 1 dark right
        c = mix(lit, mid, smoothstep(0.0, 0.5, t)) if t < 0.5 else mix(mid, dark, smoothstep(0.35, 1.0, t))
        left = _offset_curve(pts, widths, edges[k])
        right = _offset_curve(pts, widths, edges[k + 1])
        cv.poly([tuple(p) for p in left] + [tuple(p) for p in right[::-1]], (*np.clip(c, 0, 255), 255))
    for _ in range(fissures):
        a = r.uniform(-0.40, 0.40)
        wob = r.uniform(0.02, 0.06)
        ph = r.uniform(0, 6.28)
        n = len(pts)
        line = [tuple(p) for p in _offset_curve(pts, widths, a)]
        line = [(x + math.sin(ph + i * 0.9) * wob * widths[i], y) for i, (x, y) in enumerate(line)]
        lo = int(r.integers(0, n // 3))
        hi = int(r.integers(n * 2 // 3, n))
        cv.stroke(line[lo:hi], 1.6, 0.6, (*np.clip(dark * 0.78, 0, 255), 255))


def _wood(r, W: int, H: int, S: int, base: float, trunk_pts, trunk_w: float, limb_paths, bark, seed: int) -> Image.Image:
    """Trunk, root flare and limbs on their own canvas (with bark streaks), returned supersampled so the crown can sit on top."""
    wood = Canvas(W, H, 2)
    w = W * trunk_w
    for path, w0, w1 in limb_paths:
        n = len(path)
        _tube(wood, path, [w0 + (w1 - w0) * i / (n - 1) for i in range(n)], bark, r, 6, 2)
    n = len(trunk_pts)
    # a trunk that swells into roots at the ground and tapers as it rises
    wid = []
    for i in range(n):
        t = i / (n - 1)
        wid.append(w * (1.0 - 0.26 * t) * (1.0 + 0.95 * math.exp(-t / 0.055)))
    _tube(wood, trunk_pts, wid, bark, r, 10, 6)
    arr = wood.finish()
    streak = lattice2(H, W, 3, max(8, W // 5), seed + 11)
    arr[..., :3] = np.clip(arr[..., :3] * (0.80 + 0.40 * streak)[..., None], 0, 1)
    im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), "RGBA")
    return im.resize((W * S, H * S), Image.BICUBIC)


def _bite(crown: Image.Image, r, S: int, holes: float, floor_y: float | None = None) -> Image.Image:
    """Takes small leaf-sized bites out of the crown, most of them along its edge, so light shows through between leaf masses."""
    from scipy import ndimage

    arr = np.asarray(crown).copy()
    solid = arr[..., 3] > 128
    if not solid.any():
        return crown
    dist = ndimage.distance_transform_edt(solid)  # in supersampled pixels, 0 outside
    cand = (dist > 1.0) & (dist < 70.0 * S / 2)
    if floor_y is not None:
        cand[int(floor_y):, :] = False
    ys, xs = np.nonzero(cand)
    if len(ys) == 0:
        return crown
    w = np.exp(-dist[ys, xs] / (10.0 * S))
    w = w / w.sum()
    n = int(holes * len(ys) / (S * S) / 70.0)
    pick = r.choice(len(ys), size=min(n, len(ys)), p=w)
    mask = Image.new("L", crown.size, 0)
    d = ImageDraw.Draw(mask)
    ang8 = np.linspace(0, 2 * np.pi, 9)[:-1]
    for j in pick:
        edge = dist[ys[j], xs[j]]
        size = r.uniform(2.6, 8.0) * S * (1.0 if edge < 24 * S / 2 else 0.55)
        a = r.uniform(0, 3.1416)
        ex, ey = size * np.cos(ang8), size * 0.6 * np.sin(ang8)
        pts = np.stack([xs[j] + ex * np.cos(a) - ey * np.sin(a), ys[j] + ex * np.sin(a) + ey * np.cos(a)], -1).ravel().tolist()
        d.polygon(pts, fill=255)
    m = np.asarray(mask).astype(np.float32) / 255.0
    arr[..., 3] = (arr[..., 3] * (1.0 - m)).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def crown_tree(
    seed: int,
    W: int,
    H: int,
    *,
    rx: float = 0.46,
    ry: float = 0.34,
    cy: float = 0.40,
    trunk: float = 0.30,
    trunk_w: float = 0.062,
    lobes: int = 24,
    palette=("#2c4829", "#4d7a37", "#8fb34f"),
    bark=("#3b2f25", "#8a6a45", "#5b4531"),
    leaf: tuple[float, float] = (3.0, 5.5),
    lean: float = 0.0,
    limbs: int = 3,
    cover: float = 1.7,
    flat: float = 0.78,
    lobe_rad: tuple[float, float] = (0.36, 0.46),
    sub: tuple[int, int] = (6, 10),
    profile=None,
    flowers=None,
    flower_density: float = 0.05,
    ao_strength: float = 0.5,
    contrast: float = 1.0,
    holes: float = 0.42,
    bite_below: float | None = None,
    S: int = 2,
) -> np.ndarray:
    """A mature tree (oak, neem, mango, peepal, poplar): a trunk and limbs under a crown of lit, shaded lobes and clusters."""
    r = rng(seed)
    Rx, Ry = W * rx, H * ry
    Rz = Rx * 0.85
    cx0, cy0 = W * 0.5 + lean * W, H * cy
    spheres, centres = lobe_spheres(r, Rx, Ry, Rz, lobes, lobe_rad=lobe_rad, sub=sub, flat=flat, rad_ref=min(Rx, Ry), profile=profile)
    field = fbm2(H * S, W * S, 6, 4, 0.55, seed * 5 + 3, aspect=W / H)

    big = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    base = H - 3
    if trunk > 0:
        top = (cx0, base - H * trunk)
        trunk_pts = bezier((W * 0.5, base + 1), (W * 0.5 + r.normal(0, W * 0.008), base - H * trunk * 0.5), top, 24)
        lows = sorted(centres, key=lambda c: c[1])[: max(limbs * 2, 3)]
        r.shuffle(lows)
        limb_paths = []
        attach = trunk_pts[-3]
        for c in lows[:limbs]:
            end = (cx0 + c[0] * 0.85, cy0 - c[1] * 0.85)
            ctrl = (attach[0] + (end[0] - attach[0]) * 0.12, attach[1] + (end[1] - attach[1]) * 0.78)
            limb_paths.append((bezier(attach, ctrl, end, 16), W * trunk_w * 0.80, W * trunk_w * 0.24))
        big.alpha_composite(_wood(r, W, H, S, base, trunk_pts, trunk_w, limb_paths, bark, seed))
    crown = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    paint_crown(
        crown, r, spheres, (cx0, cy0), (Rx, Ry, Rz), palette, leaf, S, field,
        cover=cover, flowers=flowers, flower_density=flower_density, ao_strength=ao_strength, contrast=contrast,
    )
    if holes > 0:
        crown = _bite(crown, r, S, holes, None if bite_below is None else (cy0 + bite_below * Ry) * S)
    big.alpha_composite(crown)
    out = big.resize((W, H), Image.LANCZOS)
    return np.asarray(out, dtype=np.float32) / 255.0


def trim(arr: np.ndarray, pad: int = 2, thresh: float = 0.04) -> np.ndarray:
    """Crops a sprite to the bounding box of its visible pixels (plus a small margin), so the bottom edge is the ground."""
    a = arr[..., 3] > thresh
    ys, xs = np.nonzero(a)
    if len(ys) == 0:
        return arr
    y0, y1 = max(0, ys.min() - pad), min(arr.shape[0], ys.max() + 1 + pad)
    x0, x1 = max(0, xs.min() - pad), min(arr.shape[1], xs.max() + 1 + pad)
    return arr[y0:y1, x0:x1]


def bush(seed: int, W: int, H: int, *, palette=("#2c4829", "#4d7a37", "#8fb34f"), flowers=None, lobes: int = 9, leaf=(2.4, 4.4), flower_density: float = 0.06) -> np.ndarray:
    """A low shrub or hedge: a dome of lobes standing on the ground, optionally in flower. Trimmed so its base is the ground."""
    arr = crown_tree(
        seed, W, H, rx=0.47, ry=0.43, cy=0.56, trunk=0.0, lobes=lobes, palette=palette, leaf=leaf, flat=0.12,
        lobe_rad=(0.34, 0.46), sub=(4, 7), flowers=flowers, flower_density=flower_density, limbs=0, holes=0.30, bite_below=0.05,
    )
    return trim(arr)


def poplar(seed: int, W: int, H: int, palette=("#2c4829", "#4d7a37", "#8fb34f")) -> np.ndarray:
    """A tall slender tree (poplar, ashoka, eucalyptus): a flame of foliage on a short pale trunk."""
    prof = lambda h: 0.30 + 0.70 * math.sin(math.pi * min(1.0, 0.10 + 0.90 * h)) ** 0.8  # noqa: E731
    return crown_tree(
        seed, W, H, rx=0.40, ry=0.43, cy=0.44, trunk=0.22, trunk_w=0.05, lobes=26, palette=palette, leaf=(2.6, 4.6),
        flat=0.95, lobe_rad=(0.40, 0.52), sub=(3, 5), profile=prof, limbs=0, cover=2.0, holes=0.35,
    )


def grass_clump(
    seed: int,
    W: int,
    H: int,
    *,
    blades: int = 140,
    tall: float = 1.0,
    palette=("#33581f", "#5f8f38", "#a6c65a"),
    dry: float = 0.0,
    flowers: list[tuple[str, int]] | None = None,
) -> np.ndarray:
    """A clump of grass blades rising from a point on the ground, with optional flowers on thin stems."""
    r = rng(seed)
    shade, mid, light = (hex2rgb(c) for c in palette)
    cv = Canvas(W, H, 3)
    cx, base = W * 0.5, H - 2
    for _ in range(blades):
        sx = cx + r.normal(0, W * 0.10)
        h = H * r.uniform(0.35, 1.0) * tall * math.exp(-abs(sx - cx) / (W * 0.45))
        bend = r.normal(0, 0.55) * W * 0.12 + (sx - cx) * 0.35
        p0, p1, p2 = (sx, base), (sx + bend * 0.25, base - h * 0.6), (sx + bend, base - h)
        path = bezier(p0, p1, p2, 12)
        lit = 0.5 + 0.5 * (-(p2[0] - cx) / (W * 0.5)) * 0.7 + 0.25 * (1 - p2[1] / H) + r.normal(0, 0.10)
        c = tone(shade, mid, light, lit, r, 0.05)
        if dry and r.random() < dry:
            c = tone(hex2rgb("#7e6a35"), hex2rgb("#b49a52"), hex2rgb("#e8d28a"), lit, r)
        cv.stroke(path, 2.4 * (W / 220) ** 0.5, 0.5, c)
    if flowers:
        for color, count in flowers:
            col = hex2rgb(color) * 255
            for _ in range(count):
                sx = cx + r.normal(0, W * 0.16)
                h = H * r.uniform(0.45, 0.95)
                path = bezier((sx, base), (sx + r.normal(0, 6), base - h * 0.5), (sx + r.normal(0, 8), base - h), 10)
                cv.stroke(path, 1.5, 0.9, (*(shade * 255), 255))
                x, y = path[-1]
                rr = r.uniform(2.6, 4.2) * (H / 150) ** 0.5
                for k in range(6):
                    a = k * math.pi / 3 + r.uniform(0, 0.4)
                    cv.ellipse(x + math.cos(a) * rr, y + math.sin(a) * rr * 0.8, rr * 0.62, rr * 0.5, (*np.clip(col, 0, 255), 255))
                cv.ellipse(x, y, rr * 0.5, rr * 0.45, (236, 190, 70, 255))
    return cv.finish()


def flower_patch(seed: int, W: int, H: int, *, palette=("#3d6a2d", "#69a043", "#a9d065"), flowers=("#f4efe0", "#f0d64a"), density: float = 1.0) -> np.ndarray:
    """A low, ground-hugging patch of small leaves (clover, creeping herbs) with tiny flowers; the outline wanders."""
    r = rng(seed)
    shade, mid, light = (hex2rgb(c) for c in palette)
    S = 2
    big = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    base = H - 2
    prof = lattice2(1, 64, 1, 7, seed + 1)[0]  # a wandering height along the patch
    n = int(W * H * 0.11 * density)
    pts = []
    for _ in range(n):
        u, v = r.uniform(-1, 1), r.uniform(0, 1)
        top = (1 - u * u) ** 0.5 * (0.45 + 0.55 * prof[int((u + 1) * 0.5 * 63)])
        if v > top:
            continue
        pts.append((u, v, top))
    pts.sort(key=lambda p: -p[1])  # high (far side) first, so lower leaves overlap them
    for u, v, top in pts:
        x = W * 0.5 + u * W * 0.49
        y = base - v * H * 0.88
        lit = 0.34 + 0.40 * v / max(top, 1e-3) + 0.16 * (-u) + r.normal(0, 0.10)
        c = tone(shade, mid, light, lit, r, 0.05)
        s_ = r.uniform(2.0, 3.6) * S
        a = r.uniform(0, math.pi)
        ca, sa = math.cos(a), math.sin(a)
        poly = []
        for k in range(8):
            t = 2 * math.pi * k / 8
            ex, ey = s_ * math.cos(t), s_ * 0.62 * math.sin(t)
            poly += [x * S + ex * ca - ey * sa, y * S + ex * sa + ey * ca]
        d.polygon(poly, fill=tuple(int(v_) for v_ in c))
    fcols = [hex2rgb(c) * 255 for c in flowers]
    for _ in range(int(n * 0.03)):
        u = r.uniform(-0.92, 0.92)
        top = (1 - u * u) ** 0.5 * (0.45 + 0.55 * prof[int((u + 1) * 0.5 * 63)])
        v = r.uniform(0.25, 1.0) * top
        x = W * 0.5 + u * W * 0.49
        y = base - v * H * 0.88
        col = fcols[int(r.integers(0, len(fcols)))]
        rr = r.uniform(1.4, 2.4) * S
        d.ellipse([x * S - rr, y * S - rr * 0.9, x * S + rr, y * S + rr * 0.9], fill=(*(int(v_) for v_ in np.clip(col * (0.92 + 0.12 * r.random()), 0, 255)), 255))
    out = big.resize((W, H), Image.LANCZOS)
    return np.asarray(out, dtype=np.float32) / 255.0
