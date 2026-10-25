"""
The horse field on an early morning, as original generated art (no photograph, no horse):
  ground.webp / ground-n.webp  a seamless tile of mown paddock grass and its normal map
  distant.webp                 a band of soft far hills, a treeline and a few far stable roofs that tiles around the horizon
  mid.webp                     an atlas of cut-outs: mature trees, shrubs, a stable block and a section of post-and-rail fence
  fore.webp                    an atlas of small foreground cut-outs: grass clumps with a few wild flowers, a clover patch
"""
from __future__ import annotations

import math
import sys

import numpy as np
from PIL import Image, ImageDraw

from gen_common import (OUT, Atlas, Canvas, bleed, fbm1, fbm2, hex2rgb, lattice2, mix, rng, save_variants, smoothstep, to_u8,
                        write_atlas_data)
from gen_flora import LIGHT, bush, crown_tree, flower_patch, grass_clump, poplar

WORLD = "field"
HAZE = hex2rgb("#d9e0cd")


# ----------------------------------------------------------------------------------------------- ground
def ground():
    N = 1024
    r = rng(51)
    macro = fbm2(N, N, 3, 4, 0.55, 52)
    meso = fbm2(N, N, 14, 3, 0.5, 53)
    dark, base, light = hex2rgb("#33572a"), hex2rgb("#5a8c36"), hex2rgb("#8db84e")
    col = mix(mix(dark, base, smoothstep(0.25, 0.62, macro)[..., None]), light, (smoothstep(0.55, 0.9, meso) * 0.55)[..., None])
    dry = smoothstep(0.64, 0.82, fbm2(N, N, 2, 3, 0.5, 54))
    col = mix(col, hex2rgb("#a0a257"), (dry * 0.38)[..., None])
    col *= (0.88 + 0.24 * fbm2(N, N, 28, 2, 0.5, 55))[..., None]

    img = Image.fromarray(to_u8(col), "RGB")
    d = ImageDraw.Draw(img)
    hmap = Image.new("L", (N, N), 0)
    hd = ImageDraw.Draw(hmap)

    def offs(v, L):
        o = [0]
        if v < L:
            o.append(N)
        if v > N - L:
            o.append(-N)
        return o

    for _ in range(120000):
        x, y = r.uniform(0, N), r.uniform(0, N)
        a = r.uniform(0, 2 * math.pi)
        L = r.uniform(5, 13)
        local = col[int(y) % N, int(x) % N]
        t = r.uniform(0.62, 1.30)
        c = np.clip(local * t + (np.array([0.02, 0.05, 0.0]) if t > 1.0 else 0), 0, 1)
        fill = tuple(int(v * 255) for v in c)
        hv = int(np.clip(t * 120 + r.normal(0, 14), 20, 255))
        dx, dy = math.cos(a) * L, math.sin(a) * L
        for ox in offs(x, L):
            for oy in offs(y, L):
                d.line([(x + ox, y + oy), (x + ox + dx, y + oy + dy)], fill=fill, width=1)
                hd.line([(x + ox, y + oy), (x + ox + dx, y + oy + dy)], fill=hv, width=1)
    col = np.asarray(img, dtype=np.float32) / 255.0
    # a scatter of clover and daisies, small and few
    for _ in range(170):
        x, y = r.uniform(0, N), r.uniform(0, N)
        white = r.random() < 0.65
        rr = r.uniform(1.0, 2.2)
        c = np.array([0.95, 0.94, 0.86]) if white else np.array([0.91, 0.77, 0.27])
        for ox in offs(x, 4):
            for oy in offs(y, 4):
                yy, xx = np.ogrid[0:N, 0:N]
                m = ((xx - (x + ox)) ** 2 + (yy - (y + oy)) ** 2) < rr * rr
                col[m] = c
    # height field -> normal map (gentle: grass is soft, not rocky)
    from scipy import ndimage

    h = np.asarray(hmap, dtype=np.float32) / 255.0
    h = ndimage.gaussian_filter(h, 0.9, mode="wrap") + (meso - 0.5) * 0.5
    gx = np.gradient(h, axis=1) * N / 22.0
    gy = np.gradient(h, axis=0) * N / 22.0
    k = 0.34
    nx, ny, nz = -gx * k, gy * k, np.ones_like(gx)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([nx * inv * 0.5 + 0.5, ny * inv * 0.5 + 0.5, nz * inv * 0.5 + 0.5], -1)
    return np.clip(col, 0, 1), normal


# ----------------------------------------------------------------------------------------------- distant band
def ndimage_smooth(a, s):
    from scipy import ndimage

    return ndimage.gaussian_filter1d(a, s, mode="wrap")


def distant():
    W, H = 4096, 256
    base = H - 1
    yy = np.arange(H)[:, None].astype(np.float32)
    up = base - yy
    img = np.zeros((H, W, 4), np.float32)

    def ridge(h, lit, shade, haze_mix, seed):
        slope = ndimage_smooth(np.gradient(h), 6)
        s = np.clip(0.5 + slope * 1.5, 0, 1)
        a = np.clip(h[None, :] - up + 0.5, 0, 1)
        col = mix(shade, lit, s[None, :, None])
        col = mix(HAZE, col, 1.0 - haze_mix)
        foot = smoothstep(0.0, 0.7, up / np.maximum(h[None, :], 1))[..., None]
        col = mix(HAZE, col, foot)
        grain = (lattice2(H, W, 64, 2048, seed) - 0.5)[..., None] * 0.03
        return np.concatenate([np.clip(col + grain, 0, 1), a[..., None]], -1)

    h1 = 70 + 62 * fbm1(W, 3, 3, 0.45, 61)
    h2 = 40 + 46 * fbm1(W, 5, 3, 0.45, 62)
    far = ridge(h1, hex2rgb("#b6cabf"), hex2rgb("#9bb3a6"), 0.70, 63)
    mid = ridge(h2, hex2rgb("#9bb895"), hex2rgb("#7c9a78"), 0.52, 64)
    a = mid[..., 3:4]
    img[..., :3] = mid[..., :3] * a + far[..., :3] * far[..., 3:4] * (1 - a)
    img[..., 3] = np.clip(a[..., 0] + far[..., 3] * (1 - a[..., 0]), 0, 1)
    img[..., :3] = np.where(img[..., 3:4] > 0.01, img[..., :3] / np.maximum(img[..., 3:4], 1e-3), HAZE)

    # a treeline along a low ridge: rounded crowns, back to front, lit from the upper left, and fading to haze at their feet
    h3 = 20 + 22 * fbm1(W, 9, 3, 0.5, 65)
    r = rng(66)
    cv = Canvas(W, H, 2)
    x = 0.0
    while x < W:
        rad = r.uniform(7, 22)
        top = base - h3[int(x) % W]
        cy = top - rad * 0.4 + r.normal(0, 3)
        t = r.random()
        c = mix(hex2rgb("#3f6040"), hex2rgb("#5f8250"), t) * 255
        cv.ellipse(x % W, cy + rad * 0.2, rad * 1.1, rad, (*c, 255))
        cv.ellipse((x - rad * 0.25) % W, cy - rad * 0.12, rad * 0.78, rad * 0.7, (*np.clip(c * 1.22, 0, 255), 255))
        cv.ellipse((x - rad * 0.42) % W, cy - rad * 0.3, rad * 0.4, rad * 0.34, (*np.clip(c * 1.45, 0, 255), 235))
        x += r.uniform(rad * 0.55, rad * 1.25)
    # a few far poplars and the roofs of far stables
    for _ in range(46):
        px = r.uniform(0, W)
        hh = r.uniform(26, 48)
        top = base - h3[int(px) % W]
        c = hex2rgb("#3c5b3c") * 255
        cv.ellipse(px % W, top - hh * 0.42, hh * 0.1, hh * 0.52, (*c, 255))
        cv.ellipse((px - 1.2) % W, top - hh * 0.5, hh * 0.05, hh * 0.38, (*np.clip(c * 1.35, 0, 255), 220))
    for _ in range(11):
        sx = r.uniform(0, W)
        top = base - h3[int(sx) % W]
        w, hh = r.uniform(34, 64), r.uniform(10, 16)
        cv.rect(sx - w / 2, top - hh * 0.2, sx + w / 2, top + 3, (*(hex2rgb("#e6dfcd") * 255), 255))
        cv.poly([(sx - w / 2 - 3, top - hh * 0.2), (sx + w / 2 + 3, top - hh * 0.2), (sx + w / 2 - 4, top - hh), (sx - w / 2 + 4, top - hh)], (*(hex2rgb("#a8644a") * 255), 255))
    trees = cv.finish()
    ta = trees[..., 3:4]
    depth = np.clip((yy - (base - 60)) / 60.0, 0, 1)  # lower parts sit deeper in the haze
    tc = mix(trees[..., :3], HAZE, (0.38 + 0.22 * depth)[..., None])
    tc = mix(tc, HAZE, (1.0 - smoothstep(0.0, 14.0, up))[..., None] * 0.7)
    img[..., :3] = img[..., :3] * (1 - ta) + tc * ta
    img[..., 3] = np.maximum(img[..., 3], ta[..., 0])
    return bleed(img)


# ----------------------------------------------------------------------------------------------- cut-outs
def noise_mod(arr: np.ndarray, seed: int, amount: float = 0.14, cells=(48, 48)) -> np.ndarray:
    h, w = arr.shape[:2]
    n = lattice2(h, w, cells[0], cells[1], seed)
    out = arr.copy()
    out[..., :3] = np.clip(out[..., :3] * (1.0 - amount / 2 + amount * n)[..., None], 0, 1)
    return out


def fence(seed: int, W: int, H: int) -> np.ndarray:
    """One section of post-and-rail fence, with a post at each end drawn half so that neighbours join into whole posts."""
    r = rng(seed)
    cv = Canvas(W, H, 3)
    px = W / 4.0
    base = H - 3
    wood, lit, shade = hex2rgb("#85715b") * 255, hex2rgb("#b9a283") * 255, hex2rgb("#4d4033") * 255
    post_w, post_h = 0.15 * px, 1.30 * px
    for x in (0.0, float(W)):
        cv.ellipse(x, base, post_w * 1.3, post_w * 0.35, (30, 30, 20, 120))
    for k, yc in enumerate((1.12, 0.78, 0.44)):
        y = base - yc * px
        t = 0.085 * px
        cv.rect(0, y - t, W, y + t, (*wood, 255))
        cv.rect(0, y - t, W, y - t * 0.35, (*lit, 255))
        cv.rect(0, y + t * 0.55, W, y + t, (*shade, 255))
        cv.ellipse(W * r.uniform(0.2, 0.8), y, 3.0, 1.6, (*shade, 200))  # a knot
    for x in (0.0, float(W)):
        cv.rect(x - post_w / 2, base - post_h, x + post_w / 2, base, (*wood, 255))
        cv.rect(x - post_w / 2, base - post_h, x - post_w * 0.15, base, (*lit, 255))
        cv.rect(x + post_w * 0.25, base - post_h, x + post_w / 2, base, (*shade, 255))
        cv.poly([(x - post_w / 2, base - post_h), (x + post_w / 2, base - post_h), (x + post_w * 0.32, base - post_h - post_w * 0.32), (x - post_w * 0.32, base - post_h - post_w * 0.32)], (*lit, 255))
    arr = cv.finish()
    grain = lattice2(H, W, 3, 90, seed + 5)
    arr[..., :3] = np.clip(arr[..., :3] * (0.9 + 0.2 * grain)[..., None], 0, 1)
    return arr


def stable(seed: int, W: int, H: int) -> np.ndarray:
    """A long, low stable block seen from the side of its doors: lime-washed walls, terracotta roof, five dutch doors."""
    r = rng(seed)
    cv = Canvas(W, H, 2)
    px = W / 10.0
    base = H - 2
    plinth, wall, wall_sh = hex2rgb("#8f8878") * 255, hex2rgb("#ebe4d0") * 255, hex2rgb("#cfc6ad") * 255
    wall_top = base - 2.7 * px
    ridge = base - 4.0 * px
    # walls with a darker band along the top, where the eaves shade them
    cv.rect(0.45 * px, wall_top, 9.55 * px, base - 0.35 * px, (*wall, 255))
    cv.rect(0.45 * px, wall_top, 9.55 * px, wall_top + 0.35 * px, (*wall_sh, 255))
    cv.rect(0.45 * px, base - 0.35 * px, 9.55 * px, base, (*plinth, 255))
    # doors
    door_w, door_h = 1.15 * px, 2.15 * px
    for i in range(5):
        x0 = 0.95 * px + i * 1.78 * px
        y1 = base - 0.35 * px
        y0 = y1 - door_h
        frame, plank, plank_lit, inside = hex2rgb("#40291b") * 255, hex2rgb("#6a4a33") * 255, hex2rgb("#8b6446") * 255, hex2rgb("#1c1712") * 255
        cv.rect(x0 - 0.07 * px, y0 - 0.07 * px, x0 + door_w + 0.07 * px, y1, (*frame, 255))
        cv.rect(x0, y0, x0 + door_w, y0 + door_h * 0.45, (*inside, 255))  # the top half stands open
        cv.rect(x0, y0 + door_h * 0.45, x0 + door_w, y1, (*plank, 255))
        for k in range(1, 5):
            xx = x0 + door_w * k / 5
            cv.line(xx, y0 + door_h * 0.45, xx, y1, 1.0, (*frame, 255))
        cv.rect(x0, y0 + door_h * 0.45, x0 + door_w * 0.2, y1, (*plank_lit, 160))
        cv.rect(x0 + door_w * 0.4, y0 + door_h * 0.45 - 2, x0 + door_w * 0.62, y0 + door_h * 0.45 + 2, (40, 40, 40, 255))  # the latch
        # a lantern over each door
        cv.rect(x0 + door_w * 0.5 - 2, y0 - 0.5 * px, x0 + door_w * 0.5 + 2, y0 - 0.36 * px, (32, 28, 24, 255))
    # roof: a long front slope with courses of tile, overhanging the walls a little
    roof_l, roof_r = 0.05 * px, 9.95 * px
    cv.poly([(roof_l, wall_top), (roof_r, wall_top), (roof_r - 0.5 * px, ridge), (roof_l + 0.5 * px, ridge)], (*(hex2rgb("#b2593a") * 255), 255))
    rows = 11
    for k in range(rows):
        t = (k + 1) / rows
        y = wall_top + (ridge - wall_top) * t
        xl = roof_l + (0.5 * px) * t
        xr = roof_r - (0.5 * px) * t
        cv.line(xl, y, xr, y, 1.2, (*(hex2rgb("#7e3b25") * 255), 255))
        yl = wall_top + (ridge - wall_top) * (k + 0.5) / rows
        cv.line(xl, yl, xr, yl, 0.8, (*(hex2rgb("#cf7a52") * 255), 150))
    cv.rect(roof_l - 0.1 * px, wall_top - 0.05 * px, roof_r + 0.1 * px, wall_top + 0.14 * px, (*(hex2rgb("#6f3a28") * 255), 255))  # the eave's edge
    cv.poly([(roof_l + 0.5 * px, ridge), (roof_r - 0.5 * px, ridge), (roof_r - 0.55 * px, ridge - 0.14 * px), (roof_l + 0.55 * px, ridge - 0.14 * px)], (*(hex2rgb("#5e2f20") * 255), 255))
    # a small cupola with a weather vane on the ridge
    cx = 5.0 * px
    cv.rect(cx - 0.45 * px, ridge - 0.8 * px, cx + 0.45 * px, ridge, (*wall, 255))
    cv.rect(cx - 0.3 * px, ridge - 0.7 * px, cx + 0.3 * px, ridge - 0.25 * px, (*(hex2rgb("#2a211b") * 255), 255))
    cv.poly([(cx - 0.6 * px, ridge - 0.8 * px), (cx + 0.6 * px, ridge - 0.8 * px), (cx, ridge - 1.3 * px)], (*(hex2rgb("#8e4630") * 255), 255))
    cv.line(cx, ridge - 1.3 * px, cx, ridge - 1.6 * px, 1.5, (30, 28, 26, 255))
    arr = cv.finish()
    arr = noise_mod(arr, seed + 3, 0.16, (60, 120))
    # damp darkens the foot of the wall; the eave shades the top
    yy = np.arange(H)[:, None].astype(np.float32)
    f = 1.0 - 0.16 * smoothstep(base - 1.2 * px, base, yy) - 0.0
    arr[..., :3] = np.clip(arr[..., :3] * f[..., None], 0, 1)
    return arr


PXM = 100.0  # pixels per metre of the mid-distance sprites


def mid_atlas():
    atlas = Atlas(2048)
    mango = ("#2a4a2a", "#527f38", "#9bbc54")
    spec = [
        ("oak-a", crown_tree(61, 900, 820, rx=0.47, ry=0.33, cy=0.37, trunk=0.32, lobes=26, limbs=4), 3.0),
        ("oak-b", crown_tree(62, 760, 700, rx=0.45, ry=0.34, cy=0.38, trunk=0.30, lean=0.03, lobes=22, limbs=3), 3.0),
        ("round-a", crown_tree(63, 560, 560, rx=0.46, ry=0.40, cy=0.42, trunk=0.26, lobes=18, holes=0.35, palette=mango), 2.0),
        ("slim-a", poplar(64, 300, 720), 1.5),
        ("bush-a", bush(65, 420, 240), 3.0),
        ("bush-b", bush(66, 320, 200, flowers=["#f4efe0", "#f0b6c6"]), 1.5),
        ("stable", stable(67, 1000, 430), 1.0),
        ("fence", fence(68, 400, 140), 1.0),
    ]
    for name, arr, weight in spec:
        atlas.add(arr, {"name": name, "width": round(arr.shape[1] / PXM, 2), "height": round(arr.shape[0] / PXM, 2), "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "mid", img, 88)
    write_atlas_data(WORLD, "mid", (img.shape[1], img.shape[0]), variants)
    print("mid atlas", img.shape[1], img.shape[0], len(variants))


def fore_atlas():
    atlas = Atlas(1024)
    spec = [
        ("tuft-a", grass_clump(81, 240, 160, blades=120, flowers=[("#f4efe0", 3)]), 1.0, 0.65, 3.0),
        ("tuft-b", grass_clump(82, 180, 170, blades=100, tall=1.1), 0.75, 0.7, 2.0),
        ("tuft-c", grass_clump(83, 300, 120, blades=140, tall=0.9, flowers=[("#f0cf4a", 4)]), 1.25, 0.5, 2.0),
        ("clover", flower_patch(84, 260, 90), 0.9, 0.3, 1.5),
    ]
    for name, arr, w, h, weight in spec:
        atlas.add(arr, {"name": name, "width": w, "height": h, "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "fore", img, 88)
    write_atlas_data(WORLD, "fore", (img.shape[1], img.shape[0]), variants)
    print("fore atlas", img.shape[1], img.shape[0], len(variants))


def main():
    only = set(sys.argv[1:]) or {"ground", "distant", "mid", "fore"}
    if "ground" in only:
        col, nrm = ground()
        s1 = save_variants(OUT / WORLD / "ground", col, 84)
        s2 = save_variants(OUT / WORLD / "ground-n", nrm, 80)
        print("ground", s1, s2)
    if "distant" in only:
        print("distant", save_variants(OUT / WORLD / "distant", distant(), 88))
    if "mid" in only:
        mid_atlas()
    if "fore" in only:
        fore_atlas()


if __name__ == "__main__":
    main()
