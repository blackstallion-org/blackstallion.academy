"""
The Marwar desert at golden hour, as original generated art (no photograph, no horse):
  ground.webp / ground-n.webp  a seamless tile of fine wind-rippled sand and its normal map
  distant.webp                 a band of very low far dunes and scrub that tiles around the horizon
  mid.webp                     an atlas of cut-outs: khejri trees, kair shrubs, dry grass, rock piles
  fore.webp                    an atlas of small foreground cut-outs: grass tufts, pebbles, dry sprigs
"""
from __future__ import annotations

import math

import numpy as np

from gen_common import (OUT, Atlas, Canvas, bezier, bleed, fbm1, fbm2, hex2rgb, lattice2, mix, rng, save_variants, save_webp,
                        smoothstep, write_atlas_data)

WORLD = "desert"
HAZE = hex2rgb("#ecc08c")
LIGHT = np.array([-0.72, -0.69])  # the sun is up and to the left of the picture (x right, y down)


def ground():
    N = 1024
    # ripples: crests run across the direction of travel (along X), meandering and fading in and out
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32) / N
    warp = (fbm2(N, N, 3, 4, 0.55, 11) - 0.5) * 0.10 + (fbm2(N, N, 9, 3, 0.5, 12) - 0.5) * 0.012
    phase = (yy + warp) * 22.0
    ripple = np.sin(2 * np.pi * phase)
    ripple = np.sign(ripple) * np.abs(ripple) ** 0.8  # slightly peaked crests, flatter troughs
    amp = 0.35 + 0.65 * smoothstep(0.30, 0.70, fbm2(N, N, 3, 3, 0.5, 13))
    ripple2 = np.sin(2 * np.pi * ((yy * 1.0 + (fbm2(N, N, 5, 3, 0.5, 14) - 0.5) * 0.2) * 47.0 + xx * 0.5))
    big = ripple * amp * 0.55 + ripple2 * 0.12 * amp
    # small scale texture: grains and pits (strong in the colour, gentle in the normal map so the sand does not glitter)
    fine = (fbm2(N, N, 160, 2, 0.5, 15) - 0.5) * 0.10 + (fbm2(N, N, 40, 3, 0.5, 16) - 0.5) * 0.18
    height = big + fine
    shape = big + fine * 0.30
    # normal map (tangent space, +Y up in the image)
    gx = np.gradient(shape, axis=1) * N / 22.0
    gy = np.gradient(shape, axis=0) * N / 22.0
    k = 0.45
    nx, ny, nz = -gx * k, gy * k, np.ones_like(gx)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([nx * inv * 0.5 + 0.5, ny * inv * 0.5 + 0.5, nz * inv * 0.5 + 0.5], -1)
    # albedo: three sands by height, plus speckle and slow patches
    hn = (height - height.min()) / (height.max() - height.min())
    dark, mid, light = hex2rgb("#8c6a44"), hex2rgb("#b78d5c"), hex2rgb("#d6b182")
    col = mix(mix(dark, mid, smoothstep(0.10, 0.50, hn)[..., None]), light, smoothstep(0.55, 0.92, hn)[..., None])
    patch = fbm2(N, N, 2, 4, 0.55, 17)
    col *= (0.90 + 0.18 * patch)[..., None]
    col = mix(col, col * hex2rgb("#f4e2c4") * 1.05, 0.35)
    speck = lattice2(N, N, 512, 512, 18)
    col[speck > 0.93] *= 0.62  # dark grains
    col[speck < 0.05] = np.minimum(col[speck < 0.05] * 1.22 + 0.03, 1.0)  # quartz glints
    # a few pebbles: soft, a little darker than the sand, lit from the sun side (not black dots; few, so the tile does not repeat visibly)
    r = rng(19)
    for _ in range(15):
        cx, cy = r.integers(0, N), r.integers(0, N)
        rad = r.uniform(1.8, 4.2)
        tone = hex2rgb("#8f7a5c") * r.uniform(0.9, 1.12)
        y0, y1, x0, x1 = int(cy - rad - 3), int(cy + rad + 3), int(cx - rad - 3), int(cx + rad + 3)
        for dy in range(y0, y1):
            for dx in range(x0, x1):
                d = math.hypot((dx - cx) / 1.4, dy - cy)
                if d < rad:
                    shade = 0.80 + 0.22 * (-(dx - cx) * LIGHT[0] - (dy - cy) * LIGHT[1]) / max(rad, 1)
                    col[dy % N, dx % N] = tone * np.clip(shade, 0.6, 1.12)
                elif d < rad + 2.2:  # a thin contact shadow on the side away from the sun
                    side = ((dx - cx) * LIGHT[0] + (dy - cy) * LIGHT[1]) / max(d, 1e-3)
                    if side > 0.2:
                        col[dy % N, dx % N] *= 0.86
    return np.clip(col, 0, 1), normal


def distant():
    W, H = 4096, 256
    x = np.arange(W)
    base = H - 1
    # two ridges: very far, low and pale; and a nearer one with scrub
    h1 = 52 + 70 * (fbm1(W, 4, 3, 0.35, 21) - 0.30).clip(0, 1) ** 1.05
    h2 = 26 + 48 * (fbm1(W, 7, 3, 0.35, 22) - 0.30).clip(0, 1) ** 1.15
    img = np.zeros((H, W, 4), np.float32)
    yy = np.arange(H)[:, None].astype(np.float32)
    up = base - yy  # pixels above the bottom edge

    def layer(h, colour_lit, colour_shade, haze_mix, seed):
        slope = np.gradient(h)
        slope = ndimage_smooth(slope, 6)
        shade = np.clip(0.5 + slope * 1.7, 0, 1)  # lit where the ground rises toward the right (it faces the sun on the left)
        # antialiased crest
        edge = np.clip(h[None, :] - up + 0.5, 0, 1)
        a = edge
        col = mix(colour_shade, colour_lit, shade[None, :, None])
        depth = np.clip(up / np.maximum(h[None, :], 1), 0, 1)[..., None]
        col = mix(col, colour_lit * 1.08, (smoothstep(0.78, 1.0, depth) * 0.35))  # crest catches the light
        col = mix(HAZE, col, (1.0 - haze_mix))  # atmospheric perspective
        # fade the foot into the haze colour so the layer joins the ground fog without a seam
        foot = smoothstep(0.0, 0.70, up / np.maximum(h[None, :], 1))[..., None]
        col = mix(HAZE, col, foot)
        grain = (lattice2(H, W, 64, 2048, seed) - 0.5)[..., None] * 0.035
        return np.concatenate([np.clip(col + grain, 0, 1), a[..., None]], -1)

    far = layer(h1, hex2rgb("#e4b27a"), hex2rgb("#c8905e"), 0.64, 23)
    near = layer(h2, hex2rgb("#d9a46d"), hex2rgb("#b48454"), 0.48, 24)
    # nearer ridge over the far one
    a = near[..., 3:4]
    img[..., :3] = near[..., :3] * a + far[..., :3] * far[..., 3:4] * (1 - a)
    img[..., 3] = np.clip(a[..., 0] + far[..., 3] * (1 - a[..., 0]), 0, 1)
    img[..., :3] = np.where(img[..., 3:4] > 0.01, img[..., :3] / np.maximum(img[..., 3:4], 1e-3), HAZE)
    # far scrub: tiny dark clumps along the nearer ridge, clustered
    r = rng(25)
    cv = Canvas(W, H, 2)
    for _ in range(230):
        cx = r.integers(0, W)
        if fbm1(W, 14, 3, 0.5, 26)[cx] < 0.45:
            continue
        top = base - h2[cx]
        w = r.uniform(3, 9)
        hh = r.uniform(3, 8)
        tone = mix(hex2rgb("#6e5b3a"), hex2rgb("#8c7a46"), r.random())
        cv.ellipse(cx % W, top - hh * 0.35, w, hh, (*(tone * 255), 150))
        cv.ellipse((cx - w * 0.3) % W, top - hh * 0.55, w * 0.55, hh * 0.7, (*(tone * 1.15 * 255).clip(0, 255), 120))
    scrub = cv.finish()
    sa = scrub[..., 3:4]
    img[..., :3] = img[..., :3] * (1 - sa) + scrub[..., :3] * sa
    img[..., 3] = np.maximum(img[..., 3], sa[..., 0])
    # wrap-around seam check by design: noise is periodic, scrub x is modulo W
    return bleed(img)


def ndimage_smooth(a, s):
    from scipy import ndimage

    return ndimage.gaussian_filter1d(a, s, mode="wrap")


# ----------------------------------------------------------------------------------------------- sprites
BARK = np.array([66, 52, 40], np.float32)
BARK_LIT = np.array([176, 130, 82], np.float32)


def leaf_tone(lit: float, r: np.random.Generator) -> tuple:
    shade, mid, rim = hex2rgb("#3d4a2a") * 255, hex2rgb("#6b7a3c") * 255, hex2rgb("#d4c067") * 255
    t = float(np.clip(lit, 0, 1))
    c = mix(shade, mid, smoothstep(0.0, 0.6, t)) if t < 0.6 else mix(mid, rim, smoothstep(0.6, 1.0, t))
    c = c * (0.92 + 0.16 * r.random())
    return (*np.clip(c, 0, 255), 255)


def tuft(cv: Canvas, r, x, y, rad, leaves=46):
    for _ in range(leaves):
        a = r.uniform(0, 2 * math.pi)
        d = rad * math.sqrt(r.random())
        ox, oy = math.cos(a) * d, math.sin(a) * d * 0.62
        lit = 0.5 + 0.5 * (ox / rad * -LIGHT[0] * -1 * 0 + (-ox / rad) * 0.7 * -LIGHT[0] * 0 )  # placeholder, replaced below
        # brightness: lit on the side toward the sun (up-left), with noise
        lit = 0.5 + 0.5 * ((ox * LIGHT[0] + oy * LIGHT[1]) / max(rad, 1)) + r.normal(0, 0.12)
        ang = r.uniform(-0.9, 0.9) + (math.pi / 2 if r.random() < 0.5 else 0)
        L = r.uniform(rad * 0.16, rad * 0.30)
        x0, y0 = x + ox, y + oy
        cv.line(x0, y0, x0 + math.cos(ang) * L, y0 + math.sin(ang) * L * 0.8, max(1.4, rad * 0.045), leaf_tone(lit, r))


def khejri(seed: int, W: int, H: int) -> np.ndarray:
    r = rng(seed)
    cv = Canvas(W, H, 3)
    cx = W * (0.5 + r.uniform(-0.04, 0.04))
    base = H - 3
    trunk_h = H * r.uniform(0.30, 0.40)
    pts = []
    sway = r.uniform(-0.05, 0.05) * W
    for i in range(12):
        t = i / 11
        pts.append((cx + sway * math.sin(t * 2.4) * t + r.normal(0, 0.4), base - t * trunk_h))
    cv.stroke(pts, W * 0.040, W * 0.020, (*BARK, 255))
    cv.stroke([(x - W * 0.008, y) for x, y in pts[2:]], W * 0.014, W * 0.007, (*BARK_LIT, 235))
    tips: list[tuple[float, float]] = []

    def branch(p, ang, length, width, depth):
        n = 8
        x, y = p
        path = [(x, y)]
        a = ang
        for _ in range(n):
            a += r.normal(0, 0.14)
            step = length / n
            x += math.sin(a) * step
            y -= math.cos(a) * step
            path.append((x, y))
        cv.stroke(path, width, width * 0.5, (*BARK, 255))
        if width > 2.2:
            cv.stroke([(px - width * 0.22, py) for px, py in path[1:]], width * 0.34, width * 0.16, (*BARK_LIT, 190))
        if depth > 0:
            for _ in range(2 + int(depth > 1)):
                j = int(r.integers(3, n))
                branch(path[j], a + r.uniform(-1.0, 1.0), length * r.uniform(0.42, 0.68), width * 0.62, depth - 1)
        else:
            tips.append(path[-1])
            tips.append(path[n // 2 + 1])

    top = pts[-1]
    for k in range(int(r.integers(4, 7))):
        ang = (k / 5 - 0.5) * 2.4 + r.normal(0, 0.18)
        branch(top, ang, H * r.uniform(0.26, 0.40), W * 0.026, 2)
    for x, y in tips:
        tuft(cv, r, x, y, W * r.uniform(0.07, 0.115), leaves=int(r.integers(34, 62)))
    arr = cv.finish()
    # roughen the alpha a little so the canopy reads as feathery, not drawn
    return arr


def kair(seed: int, W: int, H: int) -> np.ndarray:
    r = rng(seed)
    cv = Canvas(W, H, 3)
    cx, base = W * 0.5, H - 3
    for _ in range(80):
        ang = r.normal(0, 0.62)
        L = H * r.uniform(0.55, 1.0) * (1 - 0.35 * min(abs(ang), 1.3) / 1.3)
        sx = cx + r.normal(0, W * 0.05)
        p0 = (sx, base)
        p1 = (sx + math.sin(ang) * L * 0.45, base - L * 0.6)
        p2 = (sx + math.sin(ang * 1.5) * L * 0.8, base - math.cos(ang) * L)
        path = bezier(p0, p1, p2, 14)
        lit = 0.5 + 0.5 * ((p2[0] - cx) / W * LIGHT[0] * 1.6 + (p2[1] - base) / H * LIGHT[1])
        tone = mix(hex2rgb("#4f5a38") * 255, hex2rgb("#a8a560") * 255, np.clip(lit, 0, 1) ** 1.5)
        cv.stroke(path, 2.6, 0.9, (*np.clip(tone, 0, 255), 255))
        for j in range(3, 15, 2):
            x, y = path[j]
            if r.random() < 0.8:
                cv.ellipse(x + r.normal(0, 2), y + r.normal(0, 2), r.uniform(1.6, 3.4), r.uniform(1.2, 2.2), (*np.clip(tone * 1.12, 0, 255), 255))
        if r.random() < 0.12:
            x, y = path[-1]
            cv.ellipse(x, y, 3.0, 3.0, (196, 86, 52, 255))
    return cv.finish()


def grass(seed: int, W: int, H: int, blades: int = 150, tall: float = 1.0) -> np.ndarray:
    r = rng(seed)
    cv = Canvas(W, H, 3)
    cx, base = W * 0.5, H - 2
    for _ in range(blades):
        sx = cx + r.normal(0, W * 0.10)
        h = H * r.uniform(0.35, 1.0) * tall * math.exp(-abs(sx - cx) / (W * 0.45))
        bend = r.normal(0, 0.55) * W * 0.12 + (sx - cx) * 0.35
        p0, p1, p2 = (sx, base), (sx + bend * 0.25, base - h * 0.6), (sx + bend, base - h)
        path = bezier(p0, p1, p2, 12)
        lit = 0.5 + 0.5 * ((p2[0] - cx) / (W * 0.5)) * LIGHT[0] * -1 * -1 + r.normal(0, 0.1)
        lit = 0.5 + 0.5 * (-(p2[0] - cx) / (W * 0.5)) * 0.7 + 0.25 * (1 - (p2[1] / H)) + r.normal(0, 0.10)
        tone = mix(hex2rgb("#7e6a35") * 255, hex2rgb("#e8d28a") * 255, np.clip(lit, 0, 1))
        if r.random() < 0.18:
            tone = mix(hex2rgb("#6c7a3a") * 255, hex2rgb("#b6bd6a") * 255, np.clip(lit, 0, 1))
        cv.stroke(path, 2.4, 0.5, (*np.clip(tone, 0, 255), 255))
    return cv.finish()


def rocks(seed: int, W: int, H: int) -> np.ndarray:
    r = rng(seed)
    cv = Canvas(W, H, 3)
    base = H - 3
    for k in range(int(r.integers(3, 6))):
        cx = W * r.uniform(0.2, 0.8)
        rw, rh = W * r.uniform(0.10, 0.22), H * r.uniform(0.25, 0.55)
        n = 9
        pts = []
        for i in range(n):
            a = math.pi + i / (n - 1) * math.pi
            rad = 1 + r.normal(0, 0.12)
            pts.append((cx + math.cos(a) * rw * rad, base + math.sin(a) * rh * rad))
        cv.poly(pts, (*hex2rgb("#6e5a46") * 255, 255))
        # lit facet on the sun side
        lit = [(x * 0.55 + cx * 0.45, y * 0.6 + base * 0.4) for x, y in pts[: n // 2 + 1]]
        cv.poly(pts[: n // 2 + 1] + lit[::-1], (*hex2rgb("#c29b6c") * 255, 215))
        cv.ellipse(cx, base, rw * 1.1, rh * 0.18, (40, 30, 22, 110))
    return cv.finish()


def mid_atlas():
    atlas = Atlas(2048)
    spec = [
        ("khejri-a", khejri(31, 700, 640), 7.0, 6.4, 2.0),
        ("khejri-b", khejri(32, 560, 500), 5.6, 5.0, 2.0),
        ("khejri-c", khejri(33, 400, 360), 4.0, 3.6, 1.5),
        ("kair-a", kair(34, 300, 210), 3.0, 2.1, 3.0),
        ("kair-b", kair(35, 360, 230), 3.6, 2.3, 2.0),
        ("sewan-a", grass(36, 260, 150, 170), 2.6, 1.5, 3.0),
        ("sewan-b", grass(37, 200, 190, 140, 1.15), 2.0, 1.9, 2.0),
        ("rocks", rocks(38, 300, 120), 3.0, 1.2, 1.0),
    ]
    for name, arr, w, h, weight in spec:
        atlas.add(arr, {"name": name, "width": w, "height": h, "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "mid", img, 88)
    write_atlas_data(WORLD, "mid", (img.shape[1], img.shape[0]), variants)
    print("mid atlas", img.shape[1], img.shape[0], len(variants))


def fore_atlas():
    atlas = Atlas(1024)
    spec = [
        ("tuft-a", grass(41, 220, 150, 110, 1.0), 0.95, 0.65, 3.0),
        ("tuft-b", grass(42, 160, 160, 90, 1.1), 0.7, 0.7, 2.0),
        ("tuft-c", grass(43, 280, 120, 130, 0.9), 1.2, 0.52, 2.0),
        ("stones", rocks(44, 200, 60), 0.9, 0.27, 1.5),
        ("sprig", kair(45, 180, 120), 0.8, 0.55, 1.0),
    ]
    for name, arr, w, h, weight in spec:
        atlas.add(arr, {"name": name, "width": w, "height": h, "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "fore", img, 88)
    write_atlas_data(WORLD, "fore", (img.shape[1], img.shape[0]), variants)
    print("fore atlas", img.shape[1], img.shape[0], len(variants))


def main():
    import sys

    only = set(sys.argv[1:]) or {"ground", "distant", "mid", "fore"}
    if "ground" in only:
        col, nrm = ground()
        s1 = save_variants(OUT / WORLD / "ground", col, 84)
        s2 = save_variants(OUT / WORLD / "ground-n", nrm, 80)
        print("ground", s1, s2)
    if "distant" in only:
        d = distant()
        print("distant", save_variants(OUT / WORLD / "distant", d, 88))
    if "mid" in only:
        mid_atlas()
    if "fore" in only:
        fore_atlas()


if __name__ == "__main__":
    main()
