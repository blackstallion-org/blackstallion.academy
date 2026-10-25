"""
A Marwar village lane in the late afternoon, as original generated art (no photograph, no horse):
  ground.webp / ground-n.webp  a seamless tile of hard-packed lane earth (dust, pebbles, straw, a few dry cracks) and its normal map
  distant.webp                 a band of far rooftops, chhatris, a temple spire and trees that tiles around the horizon
  mid.webp                     an atlas of cut-outs: equal-width house fronts (lime plaster, sandstone, wooden doors, a haveli with
                               a jharokha, huts, a shrine, an alley), trees, and lane props (pots, a stone trough, a haystack)
  fore.webp                    an atlas of small foreground cut-outs: stones, straw, dry grass
"""
from __future__ import annotations

import math
import sys

import numpy as np
from PIL import Image

from gen_common import OUT, Atlas, Canvas, bleed, fbm1, fbm2, hex2rgb, lattice2, mix, rng, save_variants, smoothstep, to_u8, write_atlas_data
from gen_flora import LIGHT, crown_tree, grass_clump, trim
from village_art import (CLAY, CLOTH, DARK, EARTH, IRON, PLASTER, STONE, THATCH, TILE, TRIM, WOOD, Art, arch_pts, c255, charpai, chhatri, door,
                         jali, jharokha, painted_band, parapet, pot, step_slab, thatch_cone, window)

WORLD = "village"
HAZE = hex2rgb("#ecd6ae")
FACADE_W = 600  # pixels (6 m) of every house front, so they stand edge to edge
PXM = 100.0


# ----------------------------------------------------------------------------------------------- ground
def ground():
    N = 1024
    r = rng(71)
    macro = fbm2(N, N, 3, 4, 0.55, 72)
    meso = fbm2(N, N, 12, 4, 0.55, 73)
    fine = lattice2(N, N, 512, 512, 74)
    dark, midc, light = hex2rgb("#8d6b47"), hex2rgb("#b78d5d"), hex2rgb("#d8b988")
    col = mix(mix(dark, midc, smoothstep(0.18, 0.62, macro)[..., None]), light, (smoothstep(0.50, 0.92, meso) * 0.6)[..., None])
    col *= (0.93 + 0.12 * lattice2(N, N, 64, 64, 75))[..., None]
    # dry cracks: a periodic Voronoi network, only in a few low, dry patches
    from scipy.spatial import cKDTree

    k = 24
    pts = (np.stack(np.meshgrid(np.arange(k), np.arange(k)), -1).reshape(-1, 2) + r.random((k * k, 2))) / k
    tree = cKDTree(pts, boxsize=1.0)
    gy, gx = np.mgrid[0:N, 0:N].astype(np.float32) / N
    P = np.stack([gx.ravel(), gy.ravel()], -1)
    d, _ = tree.query(P, k=2, workers=-1)
    edge = (d[:, 1] - d[:, 0]).reshape(N, N)
    crack = 1.0 - smoothstep(0.0, 0.010, edge)
    crack *= smoothstep(0.55, 0.78, fbm2(N, N, 2, 3, 0.5, 76))
    col *= (1.0 - 0.38 * crack)[..., None]
    # two faint cart ruts (long soft streaks along the way of travel, which is the image's vertical)
    wob = (fbm2(N, N, 3, 3, 0.5, 77) - 0.5) * 0.04
    rut = np.exp(-(((gx + wob) - 0.30) / 0.030) ** 2) + np.exp(-(((gx + wob) - 0.74) / 0.030) ** 2)
    rut *= 0.3 + 0.7 * smoothstep(0.35, 0.75, fbm2(N, N, 2, 3, 0.5, 78))
    col *= (1.0 - 0.15 * rut)[..., None]
    col = mix(col, col * hex2rgb("#f4e3c4") * 1.04, 0.3)
    col[fine > 0.94] *= 0.70  # dark grit
    col[fine < 0.04] = np.minimum(col[fine < 0.04] * 1.2 + 0.03, 1.0)
    # straw: short pale strokes scattered over the lane
    from PIL import ImageDraw

    img = Image.fromarray(to_u8(col), "RGB")
    dr = ImageDraw.Draw(img)
    for _ in range(1500):
        x, y = r.uniform(0, N), r.uniform(0, N)
        a = r.uniform(0, math.pi)
        L = r.uniform(6, 16)
        c = tuple(int(v) for v in (hex2rgb("#e0c27a") * 255 * r.uniform(0.82, 1.08)).clip(0, 255))
        for ox in (0, -N, N):
            for oy in (0, -N, N):
                if -20 < x + ox < N + 20 and -20 < y + oy < N + 20:
                    dr.line([(x + ox, y + oy), (x + ox + math.cos(a) * L, y + oy + math.sin(a) * L)], fill=c, width=1)
    col = np.asarray(img, dtype=np.float32) / 255.0
    # pebbles: soft, lit from the sun side
    for _ in range(40):
        cx, cy = int(r.integers(0, N)), int(r.integers(0, N))
        rad = r.uniform(2.0, 5.0)
        tone = hex2rgb("#9b8466") * r.uniform(0.88, 1.12)
        for dy in range(int(-rad - 3), int(rad + 4)):
            for dx in range(int(-rad - 3), int(rad + 4)):
                dd = math.hypot(dx / 1.35, dy)
                if dd < rad:
                    shade = 0.80 + 0.24 * (-dx * LIGHT[0] - dy * LIGHT[1]) / max(rad, 1)
                    col[(cy + dy) % N, (cx + dx) % N] = tone * np.clip(shade, 0.6, 1.12)
                elif dd < rad + 2.2:
                    side = (dx * LIGHT[0] + dy * LIGHT[1]) / max(dd, 1e-3)
                    if side > 0.2:
                        col[(cy + dy) % N, (cx + dx) % N] *= 0.84
    # height: clods and grit, cracks sunk, ruts sunk, pebbles raised
    from scipy import ndimage

    h = (fbm2(N, N, 24, 3, 0.55, 79) - 0.5) * 0.9 + (fine - 0.5) * 0.35 - crack * 0.9 - rut * 0.5 + (fbm2(N, N, 6, 3, 0.5, 80) - 0.5) * 0.5
    h = ndimage.gaussian_filter(h, 0.8, mode="wrap")
    gx_ = np.gradient(h, axis=1) * N / 30.0
    gy_ = np.gradient(h, axis=0) * N / 30.0
    kk = 0.40
    nx, ny, nz = -gx_ * kk, gy_ * kk, np.ones_like(gx_)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([nx * inv * 0.5 + 0.5, ny * inv * 0.5 + 0.5, nz * inv * 0.5 + 0.5], -1)
    return np.clip(col, 0, 1), normal


# ----------------------------------------------------------------------------------------------- distant band
def distant():
    W, H = 4096, 256
    base = H - 1
    r = rng(91)
    plaster = [hex2rgb(c) for c in ("#eadfc6", "#e2c28f", "#dcae8e", "#d6d9d2", "#f0e8d6", "#e7cfa0")]
    roofs = [hex2rgb(c) for c in ("#b8704c", "#c28a60")]
    img = np.zeros((H, W, 4), np.float32)

    def skyline(seed, hmin, hmax, wmin, wmax, haze_mix, windows, trees_every):
        rr = rng(seed)
        cv = Canvas(W, H, 2)
        x = rr.uniform(0, 30)
        items = []
        while x < W:
            w = rr.uniform(wmin, wmax)
            h = rr.uniform(hmin, hmax)
            items.append((x, w, h))
            x += w + rr.uniform(-2, 10)
        for (x, w, h) in items:
            col = plaster[int(rr.integers(0, len(plaster)))] * rr.uniform(0.94, 1.04)
            for off in (0, -W):
                xx = x + off
                if xx + w < -2 or xx > W + 2:
                    continue
                top = base - h
                cv.rect(xx, top, xx + w, base + 2, (*np.clip(col * 255, 0, 255), 255))
                # shaded right-hand side and a light parapet line
                cv.rect(xx + w * 0.78, top, xx + w, base + 2, (*np.clip(col * 255 * 0.86, 0, 255), 255))
                cv.rect(xx - 0.8, top - 1.6, xx + w + 0.8, top + 0.6, (*np.clip(col * 255 * 1.05, 0, 255), 255))
                kind = rr.random()
                if kind < 0.18 and w > 18:  # a chhatri on the roof
                    cxm = xx + w * rr.uniform(0.25, 0.75)
                    cv.rect(cxm - 4, top - 6, cxm + 4, top - 1, (*np.clip(col * 255 * 0.9, 0, 255), 255))
                    cv.ellipse(cxm, top - 6, 4.6, 4.2, (*np.clip(col * 255 * 1.02, 0, 255), 255))
                    cv.rect(cxm - 0.4, top - 12, cxm + 0.4, top - 8, (60, 50, 40, 255))
                elif kind < 0.26:  # a stair-head or a rooftop room
                    cv.rect(xx + w * 0.2, top - 6, xx + w * 0.5, top, (*np.clip(col * 255 * 0.95, 0, 255), 255))
                elif kind < 0.31:  # a water tank
                    cv.ellipse(xx + w * 0.5, top - 4, 3.8, 3.6, (150, 150, 140, 255))
                if windows and rr.random() < 0.7 and h > 12:
                    for k in range(int(w // 9)):
                        wx = xx + 4 + k * 9
                        wy = top + rr.uniform(3, 6)
                        cv.rect(wx, wy, wx + 2.8, wy + 4.5, (74, 52, 38, 255))
                if rr.random() < 0.18 and w > 14:  # a doorway at the foot
                    cv.poly([(xx + w * 0.4, base), (xx + w * 0.4, base - 9), (xx + w * 0.4 + 2.5, base - 11.5), (xx + w * 0.4 + 5, base - 9), (xx + w * 0.4 + 5, base)], (70, 48, 34, 255))
        # the tower of a temple, tall and curved, now and then
        for _ in range(7):
            tx = rr.uniform(0, W)
            hh = rr.uniform(hmax * 1.1, hmax * 1.7)
            ww = rr.uniform(9, 14)
            col = np.array([232, 196, 150], np.float32)
            for off in (0, -W):
                xx = tx + off
                if xx + ww < -2 or xx > W + 2:
                    continue
                pts = []
                for i in range(0, 17):
                    t = i / 16
                    half = ww / 2 * (1.0 - t**1.7)
                    pts.append((xx + ww / 2 - half, base - hh * t))
                pts2 = [(xx + ww / 2 + (xx + ww / 2 - px), py) for px, py in reversed(pts)]
                cv.poly(pts + pts2, (*col, 255))
                cv.rect(xx + ww / 2, base - hh * 0.0, xx + ww / 2 + 0.01, base, (*col, 255))
                cv.rect(xx - 1, base - hh * 0.26, xx + ww + 1, base + 2, (*np.clip(col * 0.95, 0, 255), 255))
                cv.ellipse(xx + ww / 2, base - hh - 1.5, 1.7, 2.2, (214, 168, 80, 255))
                cv.line(xx + ww / 2, base - hh - 3, xx + ww / 2, base - hh - 9, 0.7, (80, 60, 50))
                cv.poly([(xx + ww / 2, base - hh - 9), (xx + ww / 2 + 5, base - hh - 7), (xx + ww / 2, base - hh - 5.6)], (214, 110, 50, 255))
        # trees between the roofs
        for _ in range(int(W / trees_every)):
            tx = rr.uniform(0, W)
            rad = rr.uniform(6, 13)
            col = mix(hex2rgb("#436238"), hex2rgb("#5f7f46"), rr.random()) * 255
            for off in (0, -W):
                xx = tx + off
                if xx + rad < -2 or xx > W + 2:
                    continue
                cv.ellipse(xx, base - rad * 0.9, rad * 1.1, rad, (*col, 255))
                cv.ellipse(xx - rad * 0.28, base - rad * 1.15, rad * 0.75, rad * 0.65, (*np.clip(col * 1.22, 0, 255), 255))
                cv.rect(xx - 0.9, base - rad * 0.9, xx + 0.9, base + 1, (74, 56, 40, 255))
        arr = cv.finish()
        a = arr[..., 3:4]
        up = (base - np.arange(H, dtype=np.float32))[:, None, None]
        rgb = mix(arr[..., :3], HAZE, haze_mix)
        rgb = mix(rgb, HAZE, (1.0 - smoothstep(0.0, 9.0, up)) * 0.6)  # the foot melts into the haze
        return np.concatenate([rgb, a], -1)

    far = skyline(92, 7, 17, 14, 36, 0.60, False, 90)
    near = skyline(93, 10, 25, 18, 46, 0.40, True, 60)
    a = near[..., 3:4]
    img[..., :3] = near[..., :3] * a + far[..., :3] * far[..., 3:4] * (1 - a)
    img[..., 3] = np.clip(a[..., 0] + far[..., 3] * (1 - a[..., 0]), 0, 1)
    img[..., :3] = np.where(img[..., 3:4] > 0.01, img[..., :3] / np.maximum(img[..., 3:4], 1e-3), HAZE)
    return bleed(img)


# ----------------------------------------------------------------------------------------------- house fronts
def _wall(art: Art, y_top, y_bot, colour, material=PLASTER):
    art.rect(0, y_top, FACADE_W, y_bot, colour, material)


def house_a(seed: int, plaster="#e9dcc0", door_col="#33605b", band="#c7a36c", H=440, trim_col="#cda27f", with_stack=True):
    """A single-storey lime-plaster house: parapet, a painted frieze, an arched door on a stone step, a barred window, clay pots."""
    art = Art(FACADE_W, H, seed)
    r = art.r
    gy = H - 4
    roof_y = 120
    if with_stack:  # fodder and thatch bundles stacked on the flat roof, behind the parapet
        for cx, w, h in ((r.uniform(70, 150), 120, 54), (r.uniform(430, 520), 90, 40)):
            art.ellipse(cx, roof_y - 34 - h * 0.25, w / 2, h / 2, "#c9a55e", THATCH)
            art.ellipse(cx - w * 0.15, roof_y - 34 - h * 0.45, w * 0.32, h * 0.32, "#d4b36c", THATCH)
    _wall(art, roof_y, gy, plaster)
    parapet(art, 0, FACADE_W, roof_y - 34, 34, plaster, trim_col)
    art.rect(0, gy - 38, FACADE_W, gy, "#b88862", STONE)
    art.rect(0, gy - 42, FACADE_W, gy - 36, c255("#b88862", 1.16), STONE)
    art.eave(0, FACADE_W, roof_y, 44, 0.42)
    painted_band(art, 10, FACADE_W - 10, roof_y + 28, band, "dots", 1.0)
    painted_band(art, 10, FACADE_W - 10, roof_y + 56, band, "zigzag", 0.9)
    door(art, 262, 372, gy - 232, gy - 10, door_col, "round", "#c4936e")
    step_slab(art, 238, 396, gy, 10)
    window(art, 78, roof_y + 96, 142, roof_y + 170, "#f1ead9", "#3d6a64", True, True)
    window(art, 478, roof_y + 96, 532, roof_y + 170, "#f1ead9", "#3d6a64", True, True)
    pot(art, 212, gy - 2, 46, 36, "#b8643e")
    pot(art, 186, gy - 2, 38, 30, "#c1704a")
    pot(art, 424, gy - 2, 52, 40, "#a95a38")
    art.rect(0, 0, 0, 0, "#000000", 0)
    return art.finish()


def haveli(seed: int, plaster="#e2c07e", door_col="#5a3a22", stone="#b95e42", H=680):
    """A two-storey haveli front: a pointed-arch doorway, blind arches, a jharokha balcony in carved stone, a merloned parapet and
    a small domed chhatri at each corner of the roof."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    roof_y = gy - 500
    floor_y = gy - 270
    _wall(art, roof_y, gy, plaster)
    # parapet with merlons, and the corner chhatris behind it
    chhatri(art, 70, roof_y - 30, 100, 126, "#ece0c8", stone)
    chhatri(art, 530, roof_y - 30, 100, 126, "#ece0c8", stone)
    parapet(art, 0, FACADE_W, roof_y - 34, 34, plaster, stone, merlons=True)
    art.eave(0, FACADE_W, roof_y, 50, 0.45)
    art.rect(0, gy - 44, FACADE_W, gy, "#b88862", STONE)
    # the stone string-course between the floors
    art.rect(0, floor_y - 7, FACADE_W, floor_y + 9, stone, TRIM)
    art.eave(0, FACADE_W, floor_y + 9, 36, 0.35)
    painted_band(art, 10, FACADE_W - 10, floor_y + 34, "#9f6b3d" if plaster.startswith("#e") else "#8a5b3a", "diamonds", 0.8)
    # ground floor: the doorway and blind arches either side
    door(art, 256, 346, gy - 214, gy - 10, door_col, "pointed", stone)
    step_slab(art, 236, 366, gy, 10)
    for x0, x1 in ((92, 172), (430, 510)):
        art.poly(arch_pts(x0 - 8, x1 + 8, gy - 232 + (x1 - x0) / 2, gy - 44, "cusped"), stone, TRIM)
        art.poly(arch_pts(x0, x1, gy - 232 + (x1 - x0) / 2, gy - 44, "cusped"), c255(plaster, 0.80), PLASTER)
        art.box_shadow(x0, gy - 232, x1, gy - 44, 0.30, 14)
        art.shade_x(x0, x0 + 26, gy - 232, gy - 44, 0.35, True)
    # first floor: a jharokha in the middle, windows with louvred shutters either side
    jharokha(art, 301, floor_y - 6, 214, 196, stone, "#ece0c8")
    for x0, x1 in ((80, 142), (462, 524)):
        window(art, x0, roof_y + 68, x1, roof_y + 156, "#f3ecdb", "#5a3a22", True, True, True)
    for x0, x1 in ((218, 262), (342, 386)):
        pass
    return art.finish()


def house_b(seed: int, stone="#c99a74", H=470):
    """A sandstone house with a raised veranda (chabutra): coursed masonry, a stone eave on brackets, two pillars, a jali, a rope bed."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    roof_y = 112
    _wall(art, roof_y, gy, stone, STONE)
    art.rect(0, roof_y - 30, FACADE_W, roof_y, stone, STONE)
    art.rect(-4, roof_y - 40, FACADE_W + 4, roof_y - 28, "#b0805e", TRIM)
    art.rect(-8, roof_y - 2, FACADE_W + 8, roof_y + 16, "#a8714f", TRIM)  # the projecting stone eave
    for x in np.arange(30, FACADE_W, 90):
        art.poly([(x, roof_y + 16), (x + 22, roof_y + 16), (x + 11, roof_y + 52), (x + 2, roof_y + 52)], "#a8714f", TRIM)
    art.eave(0, FACADE_W, roof_y + 16, 70, 0.55)
    # the veranda platform
    art.rect(26, gy - 54, 574, gy, "#bd9068", STONE)
    art.rect(26, gy - 60, 574, gy - 52, c255("#bd9068", 1.18), STONE)
    for x in (70, 512):
        art.rect(x, roof_y + 16, x + 24, gy - 54, "#b9876a", TRIM)
        art.rect(x - 6, roof_y + 16, x + 30, roof_y + 30, "#a8714f", TRIM)
        art.rect(x, roof_y + 16, x + 7, gy - 54, c255("#d9a37e"), TRIM)
    # the recess behind the veranda: a dark doorway with a wooden door, a jali panel beside it
    art.rect(100, roof_y + 52, 500, gy - 56, c255(stone, 0.78), STONE)
    art.shade_x(100, 160, roof_y + 52, gy - 56, 0.45, True)
    door(art, 262, 346, gy - 226, gy - 60, "#6a4326", "round", "#a8714f", True)
    jali(art, 134, roof_y + 80, 214, roof_y + 160)
    window(art, 392, roof_y + 80, 456, roof_y + 156, "#c9a07c", "#3d6a64", False, True)
    charpai(art, 380, gy - 58, 124, 28)
    pot(art, 126, gy - 58, 42, 32, "#b8643e")
    pot(art, 160, gy - 58, 34, 28, "#c1704a")
    return art.finish()


def wall_gate(seed: int, H=400):
    """A compound wall of mud plaster with a thatch cap, a studded double gate under a small tiled roof, and trees looking over."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    wall_top = gy - 252
    # trees peeking over the wall
    for cx, w, h in ((96, 190, 170), (506, 200, 150)):
        t = crown_tree(int(seed + cx), w, h, rx=0.40, ry=0.40, cy=0.52, trunk=0.0, lobes=9, palette=("#24401f", "#44742f", "#8fb04a"), leaf=(3.0, 5.0), flat=0.55, lobe_rad=(0.40, 0.52), sub=(4, 6), holes=0.3, limbs=0)
        im = Image.fromarray(to_u8(t), "RGBA").resize((w * art.ss, h * art.ss), Image.BICUBIC)
        art.col.alpha_composite(im, (int((cx - w / 2) * art.ss), int((wall_top - h * 0.62) * art.ss)))
    art.rect(0, wall_top, FACADE_W, gy, "#cdb48a", EARTH)
    art.rect(-4, wall_top - 28, FACADE_W + 4, wall_top + 6, "#b89450", THATCH)
    art.eave(0, FACADE_W, wall_top + 6, 40, 0.42)
    art.rect(0, gy - 36, FACADE_W, gy, "#b88862", STONE)
    painted_band(art, 10, FACADE_W - 10, wall_top + 40, "#f4ecd9", "dots", 1.0)
    # the gate and its little roof
    gx0, gx1 = 218, 384
    art.poly([(gx0 - 40, wall_top - 28), (gx1 + 40, wall_top - 28), (gx1 + 22, wall_top - 74), (gx0 - 22, wall_top - 74)], "#b4603f", TILE)
    art.rect(gx0 - 46, wall_top - 32, gx1 + 46, wall_top - 24, "#7e3b25", TRIM)
    art.rect(gx0 - 28, wall_top - 24, gx1 + 28, wall_top + 60, "#d9c9a6", PLASTER)
    art.eave(gx0 - 28, gx1 + 28, wall_top - 24, 30, 0.35)
    door(art, gx0 + 8, gx1 - 8, wall_top + 40, gy - 8, "#5a3a22", "pointed", "#b0805e")
    step_slab(art, gx0 - 6, gx1 + 6, gy, 10)
    pot(art, 150, gy - 2, 54, 42, "#b8643e")
    pot(art, 450, gy - 2, 44, 34, "#c1704a")
    return art.finish()


def huts(seed: int, H=430):
    """Two round mud huts with conical thatched roofs, white patterns painted round their walls, and a low wall between."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    # a low compound wall behind
    art.rect(0, gy - 96, FACADE_W, gy, "#cbb08a", EARTH)
    art.rect(-4, gy - 112, FACADE_W + 4, gy - 92, "#b89450", THATCH)
    for cx, wall_w, wall_h, roof_w, roof_h in ((188, 238, 138, 330, 168), (460, 176, 112, 252, 134)):
        top = gy - wall_h
        art.rect(cx - wall_w / 2, top, cx + wall_w / 2, gy, "#d2b890", EARTH)
        art.shade_x(cx, cx + wall_w / 2, top, gy, 0.5, False)
        art.highlight(cx - wall_w / 2 + 4, top + 8, cx - wall_w / 2 + 26, gy - 4, 0.14, 8)
        painted_band(art, cx - wall_w / 2 + 14, cx + wall_w / 2 - 14, top + 30, "#f7f0e0", "dots", 0.9)
        painted_band(art, cx - wall_w / 2 + 14, cx + wall_w / 2 - 14, top + 58, "#f7f0e0", "diamonds", 0.7)
        painted_band(art, cx - wall_w / 2 + 14, cx + wall_w / 2 - 14, gy - 22, "#f7f0e0", "zigzag", 0.7)
        # the doorway, a plain arched opening in the plaster with a wooden door
        dw = wall_w * 0.26
        art.poly(arch_pts(cx - dw / 2 - 9, cx + dw / 2 + 9, gy - wall_h * 0.62 + dw / 2, gy, "round"), "#f2e8d0", PLASTER)
        door(art, cx - dw / 2, cx + dw / 2, gy - wall_h * 0.62, gy - 4, "#5a3a22", "round", "#e6d9bc", False)
        art.rect(cx - wall_w / 2 - 10, gy - 8, cx + wall_w / 2 + 10, gy, "#b88862", STONE)
        thatch_cone(art, cx, top + 6, roof_w, roof_h)
    pot(art, 334, gy - 2, 48, 38, "#b8643e")
    return art.finish()


def lane_gap(seed: int, plaster="#e7d7b6", H=470):
    """A narrow passage between two houses, under a stone arch, with a lit wall at its far end."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    ax0, ax1 = 250, 350  # the passage is only a metre wide
    # the two house fronts
    art.rect(0, gy - 350, ax0 + 8, gy, plaster, PLASTER)
    art.rect(ax1 - 8, gy - 310, FACADE_W, gy, c255(plaster, 0.96), PLASTER)
    parapet(art, 0, ax0 + 8, gy - 384, 34, plaster, "#cda27f")
    parapet(art, ax1 - 8, FACADE_W, gy - 344, 34, c255(plaster, 0.96), "#cda27f")
    art.rect(0, gy - 38, ax0 + 8, gy, "#b88862", STONE)
    art.rect(ax1 - 8, gy - 38, FACADE_W, gy, "#b88862", STONE)
    art.eave(0, ax0 + 8, gy - 350, 44, 0.42)
    art.eave(ax1 - 8, FACADE_W, gy - 310, 44, 0.42)
    # a low stone arch spans the passage, a dark mouth beneath it, and the end wall catches the light
    art.poly(arch_pts(ax0 - 12, ax1 + 12, gy - 232, gy, "pointed"), "#a8714f", TRIM)
    art.poly(arch_pts(ax0, ax1, gy - 226, gy, "pointed"), "#1e140e", DARK)
    art.rect(ax0 + 14, gy - 176, ax1 - 14, gy - 28, "#d9ab6c", PLASTER)
    art.poly(arch_pts(ax0 + 34, ax1 - 34, gy - 110, gy - 28, "round"), "#4a2f1c", WOOD)
    art.rect(ax0 + 14, gy - 28, ax1 - 14, gy, "#c9a36e", EARTH)
    art.shade_x(ax0, ax0 + 40, gy - 226, gy, 0.55, True)
    art.shade_x(ax1 - 40, ax1, gy - 226, gy, 0.55, False)
    art.box_shadow(ax0 + 14, gy - 176, ax1 - 14, gy - 110, 0.25, 14)
    window(art, 70, gy - 270, 130, gy - 196, "#f1ead9", "#3d6a64", True, True)
    window(art, 450, gy - 230, 510, gy - 160, "#f1ead9", "#3d6a64", True, True)
    painted_band(art, 8, ax0, gy - 316, "#c7a36c", "dots", 0.9)
    pot(art, 190, gy - 2, 46, 36, "#b8643e")
    return art.finish()


def shrine(seed: int, H=600):
    """A small village temple: a white-washed sanctum under a curved spire, a domed chhatri at each end of its platform, and steps."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    stone = "#b95e42"
    # platform and steps
    art.rect(30, gy - 56, 570, gy, "#c19576", STONE)
    art.rect(30, gy - 62, 570, gy - 54, c255("#c19576", 1.16), STONE)
    for k in range(3):
        art.rect(230 - k * 14, gy - k * 10, 370 + k * 14, gy - k * 10 + 10, "#b88862", STONE)
    chhatri(art, 104, gy - 62, 108, 134, "#efe3cb", stone)
    chhatri(art, 496, gy - 62, 108, 134, "#efe3cb", stone)
    # sanctum
    sx0, sx1 = 212, 388
    sy = gy - 62
    art.rect(sx0, sy - 156, sx1, sy, "#f1e7d0", PLASTER)
    art.rect(sx0 - 8, sy - 164, sx1 + 8, sy - 150, stone, TRIM)
    art.eave(sx0, sx1, sy - 150, 40, 0.4)
    art.poly(arch_pts(264, 336, sy - 112, sy, "cusped"), "#1e140e", DARK)
    art.poly(arch_pts(254, 346, sy - 120, sy, "cusped"), stone, TRIM)
    art.poly(arch_pts(264, 336, sy - 112, sy, "cusped"), "#1e140e", DARK)
    art.ellipse(300, sy - 40, 12, 14, "#d98a3a", CLOTH)  # a lamp / garland in the doorway
    # the shikhara: a curved tower of stacked bands, narrowing to a kalash
    top = sy - 164
    for k in range(7):
        t0, t1 = k / 7, (k + 1) / 7
        w0 = (sx1 - sx0) / 2 * (1 - t0**1.4) + 8
        w1 = (sx1 - sx0) / 2 * (1 - t1**1.4) + 8
        y0, y1 = top - 188 * t0, top - 188 * t1
        art.poly([(300 - w0, y0), (300 + w0, y0), (300 + w1, y1), (300 - w1, y1)], "#e6a463" if k % 2 == 0 else "#d98c4a", PLASTER)
        art.rect(300 - w0 - 2, y0 - 3, 300 + w0 + 2, y0 + 1, stone, TRIM)
    art.shade_x(300, 300 + 100, top - 188, top, 0.40, False)
    art.highlight(300 - 90, top - 160, 300 - 20, top - 10, 0.12, 16)
    art.ellipse(300, top - 196, 9, 8, "#e6a463", PLASTER)
    art.ellipse(300, top - 208, 4.4, 5.6, "#c9a34a", IRON)
    art.line(300, top - 214, 300, top - 252, 1.8, "#4a3a2a", IRON)
    art.poly([(300, top - 250), (336, top - 238), (300, top - 226)], "#d9622a", CLOTH)  # a saffron flag
    return art.finish()


def shed(seed: int, H=340):
    """A cattle shed: timber posts, a deep thatch roof, hay heaped inside, a wooden manger."""
    art = Art(FACADE_W, H, seed)
    gy = H - 4
    # the back wall and the dark inside
    art.rect(14, gy - 200, 586, gy, "#bfa27a", EARTH)
    art.rect(40, gy - 188, 560, gy - 14, "#2a1d14", DARK)
    # hay heaps
    for cx, w, h in ((150, 190, 96), (430, 220, 118)):
        art.ellipse(cx, gy - 12, w / 2, h / 2, "#cfae63", THATCH)
        art.ellipse(cx - w * 0.14, gy - 12 - h * 0.12, w * 0.3, h * 0.3, "#dcbd74", THATCH)
    # the manger
    art.rect(250, gy - 38, 360, gy - 8, "#6a4a2d", WOOD)
    art.rect(246, gy - 44, 364, gy - 36, "#8a6440", WOOD)
    # posts
    for x in (24, 205, 395, 566):
        art.rect(x, gy - 216, x + 18, gy, "#6a4a2d", WOOD)
        art.rect(x, gy - 216, x + 5, gy, c255("#8a6440"), WOOD)
    # the roof: a deep, slightly sagging thatch edge
    art.poly([(-4, gy - 200), (FACADE_W + 4, gy - 200), (FACADE_W + 4, gy - 292), (-4, gy - 292)], "#b99552", THATCH)
    art.poly([(-4, gy - 204), (FACADE_W + 4, gy - 204), (FACADE_W - 10, gy - 176), (10, gy - 176)], "#8f6f36", THATCH)
    art.eave(0, FACADE_W, gy - 176, 60, 0.55)
    for x in np.arange(24, FACADE_W, 38):
        art.line(x, gy - 176, x + 2, gy - 164, 3.0, "#a38043", THATCH)
    return art.finish()


# ----------------------------------------------------------------------------------------------- trees and props
def neem(seed: int, W: int, H: int, **kw):
    return trim(crown_tree(seed, W, H, rx=0.47, ry=0.33, cy=0.38, trunk=0.30, lobes=24, limbs=4, palette=("#22401d", "#42702d", "#8aab45"), **kw))


def khejri(seed: int, W: int, H: int):
    """A khejri: a thin, airy crown of small grey-green leaf masses on a pale, branching trunk."""
    return trim(crown_tree(
        seed, W, H, rx=0.44, ry=0.27, cy=0.34, trunk=0.40, trunk_w=0.05, lobes=15, limbs=5, palette=("#4a5a36", "#7a8a4e", "#b5bd78"),
        bark=("#4a3d30", "#a58a66", "#6f5a44"), leaf=(2.8, 4.8), lobe_rad=(0.30, 0.40), sub=(3, 6), cover=1.1, holes=0.8,
    ))


def trough(seed: int, W=240, H=100):
    """A stone drinking trough with water in it."""
    art = Art(W, H, seed)
    gy = H - 3
    art.rect(8, gy - 56, W - 8, gy, "#bd9068", STONE)
    art.rect(4, gy - 66, W - 4, gy - 52, "#cda07a", TRIM)
    art.rect(18, gy - 62, W - 18, gy - 52, "#5d7d86", CLOTH)
    art.rect(18, gy - 62, W - 18, gy - 58, "#a9c3c8", CLOTH)
    art.box_shadow(W * 0.55, gy - 56, W - 8, gy, 0.32, 14)
    art.highlight(8, gy - 56, 26, gy, 0.15, 8)
    return art.finish()


def pots_stack(seed: int, W=190, H=130):
    art = Art(W, H, seed)
    gy = H - 3
    rows = [(4, [(30, 38), (70, 38), (110, 38), (150, 38)]), (3, [(50, 38), (90, 38), (130, 38)]), (2, [(70, 38), (110, 38)])]
    y = gy
    for n, row in rows:
        for cx, w in row:
            pot(art, cx + 8, y - 2, 44, 36, ("#b8643e", "#c1704a", "#a95a38")[int(art.r.integers(0, 3))])
        y -= 34
    return art.finish()


def haystack(seed: int, W=230, H=200):
    """A round haystack: bell-shaped, bound with straw rope, ragged at the edge, with a pole poking out of the crown."""
    art = Art(W, H, seed)
    r = art.r
    gy = H - 4
    top = 26
    hh = gy - top
    half = W / 2 - 10

    def edge(t):  # half-width at height t (0 at the ground, 1 at the crown): near-vertical, then rolling in to a round top
        return half * (1 - t**2.3) ** 0.6 * (1 + 0.05 * math.sin(math.pi * min(1.0, t * 1.5)))

    right = [(W / 2 + edge(i / 44), gy - i / 44 * hh) for i in range(45)]
    left = [(W - x, y) for x, y in reversed(right)]
    # the pole first, so the crown sits over its foot
    art.rect(W / 2 - 3, top - 18, W / 2 + 3, top + 20, "#6d4f31", WOOD)
    art.poly(right + left, "#a98d52", THATCH)
    for _ in range(110):  # loose wisps along the silhouette
        t = r.uniform(0.02, 0.96)
        side = 1 if r.random() < 0.5 else -1
        x, y = W / 2 + side * edge(t), gy - t * hh
        length = r.uniform(5, 14)
        ang = r.uniform(0.15, 0.95)
        art.line(x - side * 3, y, x + side * math.cos(ang) * length, y + math.sin(ang) * length, 1.5, "#c0a468" if r.random() < 0.5 else "#8f7440", THATCH)
    for t in (0.24, 0.5, 0.74):  # straw rope bands, sagging a little between the sides
        xr = edge(t)
        pts = [(W / 2 + xr * u, gy - t * hh + 5 * (1 - u * u) * (1.0 - 0.5 * t)) for u in np.linspace(-1, 1, 17)]
        for a, b in zip(pts[:-1], pts[1:]):
            art.line(a[0], a[1], b[0], b[1], 3.2, "#7d6334", THATCH)
    art.shade_x(W / 2 + 6, W - 10, top, gy, 0.5, False)
    art.highlight(34, top + 26, W / 2 - 14, gy - 50, 0.14, 16)
    arr = art.finish()
    yy = (np.arange(H, dtype=np.float32) / H)[:, None]
    ao = smoothstep(0.66, 1.0, yy) * 0.34  # the foot of the stack is in its own shade
    arr[..., :3] *= (1.0 - ao)[..., None]
    return arr


def woodpile(seed: int, W=200, H=110):
    art = Art(W, H, seed)
    gy = H - 3
    r = art.r
    for row in range(5):
        n = 9 - row
        for k in range(n):
            cx = W / 2 + (k - (n - 1) / 2) * 20 + r.normal(0, 1)
            cy = gy - 11 - row * 18
            art.ellipse(cx, cy, 11, 10, "#6e4c2e", WOOD)
            art.ellipse(cx, cy, 6.5, 6, "#b88a58", CLAY)
    return art.finish()


# ----------------------------------------------------------------------------------------------- foreground
def stones(seed: int, W=200, H=60, n=7):
    r = rng(seed)
    cv = Canvas(W, H, 3)
    for _ in range(n):
        cx = W / 2 + r.normal(0, W * 0.2)
        rad = r.uniform(7, 18)
        cy = H - 3 - rad * 0.55
        tone = hex2rgb("#9b8466") * r.uniform(0.85, 1.12)
        cv.ellipse(cx + rad * 0.12, cy + rad * 0.2, rad * 1.1, rad * 0.5, (40, 30, 20, 150))
        cv.ellipse(cx, cy, rad, rad * 0.72, (*np.clip(tone * 255 * 0.78, 0, 255), 255))
        cv.ellipse(cx - rad * 0.12, cy - rad * 0.12, rad * 0.78, rad * 0.56, (*np.clip(tone * 255, 0, 255), 255))
        cv.ellipse(cx - rad * 0.3, cy - rad * 0.3, rad * 0.4, rad * 0.26, (*np.clip(tone * 255 * 1.22, 0, 255), 255))
    return cv.finish()


def straw(seed: int, W=180, H=70):
    r = rng(seed)
    cv = Canvas(W, H, 3)
    for _ in range(160):
        x = W / 2 + r.normal(0, W * 0.18)
        y = H - 3 - abs(r.normal(0, H * 0.18))
        a = r.uniform(-0.5, 0.5) + (0.0 if r.random() < 0.5 else math.pi)
        L = r.uniform(18, 46)
        t = r.random()
        c = mix(hex2rgb("#b79446"), hex2rgb("#e6cc82"), t) * 255
        cv.line(x, y, x + math.cos(a) * L, y + math.sin(a) * L * 0.4, r.uniform(1.0, 1.8), (*np.clip(c, 0, 255), 255))
    return cv.finish()


# ----------------------------------------------------------------------------------------------- atlases
def mid_atlas():
    atlas = Atlas(2048)
    cream, ochre, blue = "#e9dcc0", "#e0b878", "#aebfcc"
    spec = [
        ("house-cream", house_a(101, cream, "#33605b", "#c7a36c"), 2.0),
        ("house-ochre", house_a(102, ochre, "#5a3a22", "#fff3d6", 460, "#c79d6b"), 2.0),
        ("house-blue", house_a(103, blue, "#7a4b2a", "#f4efe2", 430, "#d2b79a"), 1.4),
        ("haveli-ochre", haveli(104, "#e2c07e", "#5a3a22", "#b95e42"), 1.4),
        ("haveli-cream", haveli(105, "#ebdfc4", "#33605b", "#b05a3e", 700), 1.0),
        ("sandstone", house_b(106), 1.6),
        ("gate", wall_gate(107), 1.3),
        ("huts", huts(108), 1.2),
        ("alley", lane_gap(109), 0.8),
        ("shrine", shrine(110), 0.45),
        ("shed", shed(111), 0.7),
    ]
    for name, arr, weight in spec:
        atlas.add(arr, {"name": name, "width": round(arr.shape[1] / PXM, 2), "height": round(arr.shape[0] / PXM, 2), "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "mid", img, 88)
    write_atlas_data(WORLD, "mid", (img.shape[1], img.shape[0]), variants)
    print("mid atlas", img.shape[1], img.shape[0], len(variants))


def props_atlas():
    """Trees and lane props, the cut-outs that stand between the horse and the house fronts or behind them."""
    atlas = Atlas(2048)
    spec = [
        ("neem-a", neem(121, 900, 820), 2.0),
        ("neem-b", neem(122, 700, 640), 2.0),
        ("khejri-a", khejri(123, 760, 700), 1.6),
        ("khejri-b", khejri(124, 560, 520), 1.2),
        ("trough", trough(125), 1.0),
        ("pots", pots_stack(126), 1.0),
        ("haystack", haystack(127), 1.0),
        ("woodpile", woodpile(128), 0.8),
    ]
    for name, arr, weight in spec:
        atlas.add(arr, {"name": name, "width": round(arr.shape[1] / PXM, 2), "height": round(arr.shape[0] / PXM, 2), "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "props", img, 88)
    write_atlas_data(WORLD, "props", (img.shape[1], img.shape[0]), variants)
    print("props atlas", img.shape[1], img.shape[0], len(variants))


def fore_atlas():
    """Low ground cover for the edge of the frame; every cut-out is drawn at the same 240 px per metre."""
    atlas = Atlas(1024)
    px = 240.0
    spec = [
        ("stones-a", stones(131, 200, 56, 6), 2.0),
        ("stones-b", stones(132, 150, 50, 4), 2.0),
        ("straw", straw(133, 180, 70), 1.5),
        ("tuft-a", grass_clump(134, 220, 130, blades=110, tall=0.9, dry=0.95, palette=("#7e6a35", "#b49a52", "#e0c880")), 2.0),
        ("tuft-b", grass_clump(135, 170, 140, blades=90, tall=1.0, dry=0.9, palette=("#7e6a35", "#b49a52", "#e0c880")), 1.5),
    ]
    for name, arr, weight in spec:
        atlas.add(arr, {"name": name, "width": round(arr.shape[1] / px, 3), "height": round(arr.shape[0] / px, 3), "weight": weight})
    img, variants = atlas.pack()
    save_variants(OUT / WORLD / "fore", img, 88)
    write_atlas_data(WORLD, "fore", (img.shape[1], img.shape[0]), variants)
    print("fore atlas", img.shape[1], img.shape[0], len(variants))


def main():
    only = set(sys.argv[1:]) or {"ground", "distant", "mid", "props", "fore"}
    if "ground" in only:
        col, nrm = ground()
        print("ground", save_variants(OUT / WORLD / "ground", col, 84), save_variants(OUT / WORLD / "ground-n", nrm, 80))
    if "distant" in only:
        print("distant", save_variants(OUT / WORLD / "distant", distant(), 88))
    if "mid" in only:
        mid_atlas()
    if "props" in only:
        props_atlas()
    if "fore" in only:
        fore_atlas()


if __name__ == "__main__":
    main()
