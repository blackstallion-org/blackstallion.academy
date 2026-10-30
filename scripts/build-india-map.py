#!/usr/bin/env python3
"""
Data for the 3D India sculpture on /schools (components/sections/schools/india-map).

Everything the browser needs is baked here, once, from open datasets; nothing is fetched at runtime:

  boundary   Natural Earth 1:10m admin-0 countries, India point of view (public domain). One national outline from one source,
             as drawn by India (the Survey of India depiction); the neighbours come from the same file so their borders agree.
  rivers     Natural Earth 1:10m rivers and lake centrelines (public domain).
  terrain    "Terrain Tiles" (Terrarium encoding) on AWS Open Data: Mapzen's composite of SRTM and other public elevation sources.
             Sources and attribution: https://github.com/tilezen/joerd/blob/master/docs/attribution.md

Pipeline: project everything with the Survey of India Lambert conformal conic (EPSG:7755 parameters) -> resample the elevation onto
a regular 2 km grid -> triangulate the land (India and its neighbours, one slab) with error-driven point insertion, so the mesh is
dense where the relief is (the Himalaya) and sparse on the plains and the plateau -> bake what the shader needs per vertex
(smooth normals from the fine grid, horizon ambient occlusion, signed distance to India's border) -> drape the rivers and the
national border on that exact surface. No noise is added to the terrain.

Output (public/data/india-sculpture):
  terrain-hi.bin.gz, terrain-lo.bin.gz   the land slab, two levels of detail (desktop, phones)
  lines.bin.gz                           rivers and India's border as ribbons' centrelines, on the surface
  meta.json                              projection, scale, bounds, counts, sources

Usage (a venv with numpy, scipy, pillow, shapely and pyproj; first run downloads about 60 MB into --cache):
    python3 scripts/build-india-map.py --cache ~/.cache/bsah-india-map
"""
from __future__ import annotations

import argparse
import gzip
import io
import json
import math
import os
import struct
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

import numpy as np
from PIL import Image, ImageDraw
from pyproj import CRS, Transformer
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates
from scipy.interpolate import LinearNDInterpolator
from scipy.spatial import Delaunay
import shapely
from shapely import segmentize
from shapely.geometry import LineString, MultiLineString, MultiPolygon, Polygon, box, shape
from shapely.ops import unary_union

NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson"
TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
ZOOM = 7

# Survey of India national LCC (EPSG:7755): the projection India's own maps use.
PROJ = "+proj=lcc +lat_1=12.472955 +lat_2=35.172805 +lat_0=24 +lon_0=80 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"

UNIT = 250_000.0      # metres per world unit
EXAGGERATION = 12.0   # vertical exaggeration of the relief
SLAB = 0.10           # thickness of the land above the water, in world units (the coast reads as a cliff, not a line)
FLOOR = -0.34         # underside of the whole block
BEVEL = 0.022         # size of the chamfer along the coast
CLOSE = 3200.0        # inlets narrower than twice this (metres) are closed, and spits narrower than half of it are cut: the coast keeps no detail the chamfer could not follow
CELL = 2000.0         # fine grid spacing, metres
MARGIN = 300_000.0    # plate margin around India's bounding box, metres
LAND_MIN_AREA = 40e6  # m2: smaller islands are dropped (Lakshadweep is below a pixel at this scale)

# (name in Natural Earth, label, importance 1..3 for the line weight, animated flow)
RIVERS = [
    ("Ganges", "Ganga", 3, True), ("Yamuna", "Yamuna", 2, True), ("Brahmaputra", "Brahmaputra", 3, True), ("Yarlung", "Yarlung Tsangpo", 2, False),
    ("Godävari", "Godavari", 3, True), ("Krishna", "Krishna", 3, True), ("Narmada", "Narmada", 3, True), ("Tapi", "Tapi", 2, False),
    ("Cauvery", "Kaveri", 2, False), ("Indus", "Indus", 3, False), ("Sutlej", "Sutlej", 2, False), ("Beas", "Beas", 1, False),
    ("Ravi", "Ravi", 1, False), ("Chenab", "Chenab", 1, False), ("Jhelum", "Jhelum", 1, False), ("Chambal", "Chambal", 1, False),
    ("Betwa", "Betwa", 1, False), ("Son", "Son", 1, False), ("Gandak", "Gandak", 1, False), ("Tista", "Teesta", 1, False),
    ("Brahmani", "Brahmani", 1, False), ("Bhima", "Bhima", 1, False), ("Tungabhadra", "Tungabhadra", 1, False), ("Wainganga", "Wainganga", 1, False),
    ("Penner", "Penna", 1, False), ("Mahi", "Mahi", 1, False), ("Indravati", "Indravati", 1, False),
]


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


# ------------------------------------------------------------------------------------------------ download
def fetch(url: str, path: str) -> str:
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r, open(path + ".part", "wb") as f:
                f.write(r.read())
            os.replace(path + ".part", path)
            return path
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))
    return path


def mercator_px(lon, lat, z=ZOOM):
    n = 256 * 2**z
    x = (np.asarray(lon) + 180.0) / 360.0 * n
    s = np.sin(np.radians(lat))
    y = (0.5 - np.log((1 + s) / (1 - s)) / (4 * np.pi)) * n
    return x, y


def load_dem(cache: str, lon_min, lon_max, lat_min, lat_max):
    """Mosaic of Terrarium tiles covering the box; returns (elevation metres, x0, y0) in Mercator pixels at ZOOM."""
    x0, y0 = mercator_px(lon_min, lat_max)
    x1, y1 = mercator_px(lon_max, lat_min)
    tx0, tx1 = int(x0 // 256), int(x1 // 256)
    ty0, ty1 = int(y0 // 256), int(y1 // 256)
    tiles = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
    log(f"elevation tiles: {len(tiles)} at z{ZOOM}")

    def get(t):
        x, y = t
        return fetch(TILE_URL.format(z=ZOOM, x=x, y=y), os.path.join(cache, "tiles", f"{ZOOM}_{x}_{y}.png"))

    with ThreadPoolExecutor(8) as ex:
        paths = list(ex.map(get, tiles))
    mosaic = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    for (x, y), p in zip(tiles, paths):
        a = np.asarray(Image.open(p).convert("RGB"), np.float32)
        mosaic[(y - ty0) * 256:(y - ty0 + 1) * 256, (x - tx0) * 256:(x - tx0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    return mosaic, tx0 * 256, ty0 * 256


# ------------------------------------------------------------------------------------------------ geometry
def to_polys(geom):
    if geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    return [g for g in getattr(geom, "geoms", []) for g in to_polys(g)]


# ------------------------------------------------------------------------------------------------ the mesh
def sample(C, arr, x, y):
    """Bilinear lookup in a fine-grid array at projected coordinates (metres)."""
    return map_coordinates(arr, [(np.asarray(y) - C.Y0) / CELL - 0.5, (np.asarray(x) - C.X0) / CELL - 0.5], order=1, mode="nearest")


def horizon_visibility(z, cell, steps=(1, 2, 3, 5, 7, 10, 14, 19, 26, 35), directions=8):
    """Share of the sky a point sees over the relief around it (1 = open plain, lower in a valley): the sine of the horizon angle
    in eight directions. `z` is the exaggerated height in metres."""
    ny, nx = z.shape
    pad = max(steps)
    zp = np.pad(z, pad, mode="edge")
    occ = np.zeros_like(z)
    for a in range(directions):
        dx, dy = math.cos(2 * math.pi * a / directions), math.sin(2 * math.pi * a / directions)
        best = np.zeros_like(z)
        for s in steps:
            ox, oy = int(round(dx * s)), int(round(dy * s))
            shifted = zp[pad + oy:pad + oy + ny, pad + ox:pad + ox + nx]
            best = np.maximum(best, (shifted - z) / (cell * math.hypot(ox, oy)))
        occ += np.sin(np.arctan(best))
    return np.clip(1 - occ / directions, 0, 1)


def line_points(geom, step):
    pts = []
    for g in getattr(geom, "geoms", [geom]):
        if g.is_empty:
            continue
        if g.geom_type == "Polygon":
            g = g.boundary
        for part in getattr(g, "geoms", [g]):
            if part.length > 0:
                pts.extend(segmentize(part, step).coords)
    return np.array(pts, float).reshape(-1, 2)


def triangulate(C, grids, tol_india, tol_other, boundary_step, max_points, blocks):
    """Error-driven point insertion: start from the outline and a coarse seed grid, then repeatedly add a vertex wherever the
    mesh is furthest from the elevation grid, until it is within tolerance everywhere (or the budget is spent)."""
    land_pg = C.land
    shapely.prepare(land_pg)
    pts = [line_points(land_pg.boundary, boundary_step)]
    # India's land border (it is interior to the slab, so the outline does not carry it)
    border = C.india.boundary.intersection(unary_union(C.others).buffer(2500))
    border_pts = line_points(border, boundary_step)
    pts.append(border_pts)
    from scipy.spatial import cKDTree  # noqa: PLC0415
    outline = cKDTree(np.vstack([pts[0], border_pts]))

    def off_outline(p):
        """Interior points closer to the outline than 0.8 of its spacing would stop outline edges being Delaunay edges."""
        return p[outline.query(p)[0] > 0.8 * boundary_step] if len(p) else p

    seed_x, seed_y = np.meshgrid(np.arange(C.X0 + 30e3, C.X0 + C.w, 60e3), np.arange(C.Y0 + 30e3, C.Y0 + C.h, 60e3))
    sx, sy = seed_x.ravel(), seed_y.ravel()
    keep = shapely.contains_xy(land_pg, sx, sy)
    pts.append(off_outline(np.column_stack([sx[keep], sy[keep]])))
    pts = np.unique(np.round(np.vstack(pts), 0), axis=0)

    ly, lx = np.nonzero(C.land_m)
    ex = C.X0 + (lx + 0.5) * CELL
    ey = C.Y0 + (ly + 0.5) * CELL
    ez = grids["elev"][ly, lx]
    tol = np.where(C.india_m[ly, lx], tol_india, tol_other).astype(np.float32)

    for rnd, block in enumerate(blocks):
        tri = Delaunay(pts)
        vals = sample(C, grids["elev"], pts[:, 0], pts[:, 1])
        interp = LinearNDInterpolator(tri, vals, fill_value=np.nan)
        stride = 2 if rnd < len(blocks) - 2 else 1
        sel = np.arange(0, ex.size, 1) if stride == 1 else np.flatnonzero(((lx % stride) == 0) & ((ly % stride) == 0))
        hm = interp(ex[sel], ey[sel])
        err = np.abs(hm - ez[sel])
        err[np.isnan(err)] = 0
        bad = np.flatnonzero(err > tol[sel])
        log(f"  round {rnd}: {len(pts)} points, {bad.size} cells above tolerance, worst {err.max():.0f} m")
        if bad.size == 0 or len(pts) >= max_points:
            break
        order = bad[np.argsort(-err[bad])]
        taken = set()
        add = []
        for i in order:
            j = sel[i]
            key = (int(ex[j] // block), int(ey[j] // block))
            if key in taken:
                continue
            taken.add(key)
            add.append((ex[j], ey[j]))
            if len(pts) + len(add) >= max_points:
                break
        pts = np.unique(np.round(np.vstack([pts, off_outline(np.array(add))]), 0), axis=0)
    return pts, border_pts


def morton(ix, iy):
    def part(v):
        v = v.astype(np.uint32) & 0xFFFF
        v = (v | (v << 8)) & 0x00FF00FF
        v = (v | (v << 4)) & 0x0F0F0F0F
        v = (v | (v << 2)) & 0x33333333
        v = (v | (v << 1)) & 0x55555555
        return v
    return part(ix) | (part(iy) << 1)


def build_variant(C, name, grids, tol_india, tol_other, boundary_step, max_points, blocks):
    log(f"[{name}] triangulating")
    pts, border_pts = triangulate(C, grids, tol_india, tol_other, boundary_step, max_points, blocks)
    # Morton order for locality (smaller index deltas, kinder to the GPU's vertex cache); triangulate once, in that order
    qx = np.clip((pts[:, 0] - C.X0) / C.w * 65535, 0, 65535)
    qy = np.clip((pts[:, 1] - C.Y0) / C.h * 65535, 0, 65535)
    pts = pts[np.argsort(morton(qx, qy), kind="stable")]
    tri = Delaunay(pts)
    simp = tri.simplices
    cen = pts[simp].mean(axis=1)
    keep = shapely.contains_xy(C.land, cen[:, 0], cen[:, 1])
    # drop slivers that bridge across water: a land triangle's edge midpoints are on land too (within the coast's tolerance)
    grown = C.land.buffer(900)
    shapely.prepare(grown)
    for a, b in ((0, 1), (1, 2), (2, 0)):
        m = (pts[simp[:, a]] + pts[simp[:, b]]) / 2
        keep &= shapely.contains_xy(grown, m[:, 0], m[:, 1])

    # Three outline points on one straight stretch of coast or plate edge make a flat triangle: it draws nothing and the position
    # quantisation can tip it over. It lies on the outline, so dropping it cannot open a crack in the surface.
    from scipy.spatial import cKDTree  # noqa: PLC0415
    outline_pts = np.vstack([line_points(C.land.boundary, boundary_step), border_pts])
    on_outline = cKDTree(outline_pts).query(pts)[0] < 1.0
    ab = pts[simp[:, 1]] - pts[simp[:, 0]]
    ac = pts[simp[:, 2]] - pts[simp[:, 0]]
    bc = pts[simp[:, 2]] - pts[simp[:, 1]]
    area2 = np.abs(ab[:, 0] * ac[:, 1] - ab[:, 1] * ac[:, 0])
    longest = np.maximum.reduce([np.hypot(*ab.T), np.hypot(*ac.T), np.hypot(*bc.T)])
    flat = on_outline[simp].all(axis=1) & (area2 / np.maximum(longest, 1.0) < 200.0)
    log(f"[{name}] flat outline triangles dropped: {int((flat & keep).sum())}")
    keep &= ~flat

    # per-vertex bake for every point (the rivers are draped on this same triangulation)
    x, y = pts[:, 0], pts[:, 1]
    hv = sample(C, grids["elev"], x, y)
    Yall = SLAB + EXAGGERATION * hv / UNIT
    surface = dict(tri=tri, keep=keep, Yall=Yall)

    used = np.unique(simp[keep])
    remap = -np.ones(len(pts), np.int64)
    remap[used] = np.arange(len(used))
    tris = remap[simp[keep]]
    px, py = x[used], y[used]
    log(f"[{name}] {len(used)} vertices, {len(tris)} triangles")

    nrm = np.stack([sample(C, grids["nx"], px, py), np.ones(len(px)), sample(C, grids["nz"], px, py)], 1)
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)
    ao = sample(C, grids["ao"], px, py)
    sd = sample(C, grids["sd"], px, py)
    sd = np.where(cKDTreeQuery(border_pts, np.column_stack([px, py])) < 400, 0.0, sd)

    # world frame: X east, Y up, Z south; the plate is centred on the origin
    X = (px - C.cx) / UNIT
    Z = -(py - C.cy) / UNIT
    Y = Yall[used]
    P = np.stack([X, Y, Z], 1)
    a, b, c = (P[tris[:, k]] for k in range(3))
    flip = np.cross(b - a, c - a)[:, 1] < 0  # front faces up
    tris[flip] = tris[flip][:, [0, 2, 1]]

    # error report against the fine grid (land cells, India and elsewhere)
    interp = LinearNDInterpolator(tri, hv, fill_value=np.nan)
    ly, lx = np.nonzero(C.land_m)
    hm = interp(C.X0 + (lx + 0.5) * CELL, C.Y0 + (ly + 0.5) * CELL)
    err = np.abs(hm - grids["elev"][ly, lx])
    valid = ~np.isnan(err)
    ind = C.india_m[ly, lx] & valid
    report = {
        "india_p50_m": float(np.percentile(err[ind], 50)), "india_p95_m": float(np.percentile(err[ind], 95)),
        "india_p99_m": float(np.percentile(err[ind], 99)), "india_max_m": float(err[ind].max()),
        "other_p95_m": float(np.percentile(err[valid & ~C.india_m[ly, lx]], 95)),
    }
    log(f"[{name}] vertical error vs the 2 km grid, India: median {report['india_p50_m']:.0f} m, 95% {report['india_p95_m']:.0f} m, 99% {report['india_p99_m']:.0f} m, max {report['india_max_m']:.0f} m")
    return dict(X=X, Y=Y, Z=Z, nrm=nrm, ao=ao, sd=sd, tri=tris, surface=surface, report=report)


def cKDTreeQuery(a, b):
    from scipy.spatial import cKDTree  # noqa: PLC0415
    return cKDTree(a).query(b)[0] if len(a) else np.full(len(b), 1e9)


def walls(C, v):
    """Coast and plate walls with a chamfer: ring A (the terrain edge), ring B (a little outward and down), ring C (the floor)."""
    simp = v["tri"]
    e = np.vstack([simp[:, [0, 1]], simp[:, [1, 2]], simp[:, [2, 0]]])
    # winding is for +Y up in (X, Z); boundary edges appear once, and their reverse never
    keys = {}
    for a, b in e:
        keys[(int(a), int(b))] = True
    boundary = [(a, b) for (a, b) in keys if (b, a) not in keys]
    nxt = {}
    for a, b in boundary:
        nxt.setdefault(a, []).append(b)
    loops = []
    seen = set()
    for a, b in boundary:
        if (a, b) in seen:
            continue
        loop = [a]
        cur, prev = b, a
        seen.add((a, b))
        while cur != loop[0]:
            loop.append(cur)
            options = [n for n in nxt.get(cur, []) if (cur, n) not in seen] or nxt.get(cur, [])
            if not options:
                break
            n = options[0]
            seen.add((cur, n))
            prev, cur = cur, n
            if len(loop) > 200000:
                break
        if len(loop) >= 3:
            loops.append(loop)
    log(f"  boundary loops: {len(loops)}, {sum(len(l) for l in loops)} vertices")

    X, Y, Z = v["X"], v["Y"], v["Z"]
    lo_x, hi_x, lo_z, hi_z = (C.X0 - C.cx) / UNIT, (C.X0 + C.w - C.cx) / UNIT, -(C.Y0 + C.h - C.cy) / UNIT, -(C.Y0 - C.cy) / UNIT
    pos, nrm, ao, sd, idx = [], [], [], [], []
    flips = 0  # how often the owner of the coast changes along a wall: only where India's coast meets a neighbour's
    base = len(X)
    for loop in loops:
        L = len(loop)
        P = np.stack([X[loop], Z[loop]], 1)
        nxt_p = np.roll(P, -1, axis=0)
        prv_p = np.roll(P, 1, axis=0)

        def edge_out(p, q):
            d = q - p
            n = np.stack([-d[:, 1], d[:, 0]], 1)  # candidate perpendicular
            return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        n1 = edge_out(P, nxt_p)
        n0 = edge_out(prv_p, P)
        out = n1 + n0  # (-dz, dx) points away from the land for front-face-up triangles with Z south
        out = out / np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-9)
        # smooth the outward direction along the loop (a jagged boundary would otherwise throw neighbouring offsets across each other)
        for _ in range(4):
            out = out + 0.9 * (np.roll(out, 1, axis=0) + np.roll(out, -1, axis=0))
            out = out / np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-9)
        on_edge = (np.abs(P[:, 0] - lo_x) < 1e-3) | (np.abs(P[:, 0] - hi_x) < 1e-3) | (np.abs(P[:, 1] - lo_z) < 1e-3) | (np.abs(P[:, 1] - hi_z) < 1e-3)
        bev = np.where(on_edge, 0.0, BEVEL)
        o3 = np.stack([out[:, 0], np.zeros(L), out[:, 1]], 1)
        up = np.array([0, 1, 0.0])
        A = np.stack([X[loop], Y[loop], Z[loop]], 1)
        B = A + o3 * bev[:, None] + up * (-bev * 0.9)[:, None]
        Cc = np.stack([B[:, 0], np.full(L, FLOOR), B[:, 2]], 1)
        nA = (up * 0.7 + o3 * 0.3)
        nB = (up * 0.7 + o3 * 0.7) * np.where(on_edge, 0, 1)[:, None] + o3 * np.where(on_edge, 1, 0)[:, None]
        nB /= np.maximum(np.linalg.norm(nB, axis=1, keepdims=True), 1e-9)
        nA /= np.maximum(np.linalg.norm(nA, axis=1, keepdims=True), 1e-9)
        s = v["sd"][loop]
        flips += int(np.count_nonzero(np.diff(np.signbit(np.append(s, s[0])).astype(int))))
        start = base + sum(len(p) for p in pos)
        pos += [A, B, Cc]
        nrm += [nA, nB, o3]
        ao += [np.full(L, 1.0), np.full(L, 0.95), np.full(L, 0.74)]
        sd += [s, s, s]
        ia = start + np.arange(L)
        ib, ic = ia + L, ia + 2 * L
        jn = lambda arr: np.roll(arr, -1)  # noqa: E731
        for lower, upper in ((ib, ia), (ic, ib)):
            q = [(upper, jn(upper), jn(lower)), (upper, jn(lower), lower)]
            for t in q:
                tri = np.stack(t, 1)
                idx.append(tri)
    pos = np.vstack(pos); nrm = np.vstack(nrm)
    tri = np.vstack(idx)
    # make every wall triangle face away from the land: compare with the outward normal at its vertices
    allpos = np.vstack([np.stack([X, Y, Z], 1), pos])
    allnrm = np.vstack([v["nrm"], nrm])
    a, b, c = (allpos[tri[:, k]] for k in range(3))
    fn = np.cross(b - a, c - a)
    avg = allnrm[tri].mean(axis=1)
    flip = (fn * avg).sum(axis=1) < 0
    tri[flip] = tri[flip][:, [0, 2, 1]]
    return dict(pos=pos, nrm=nrm, ao=np.concatenate(ao), sd=np.concatenate(sd), tri=tri, flips=flips)


def quantise_unit(a, lo, hi, dtype):
    info = np.iinfo(dtype)
    return np.round((np.clip(a, lo, hi) - lo) / (hi - lo) * (info.max - info.min) + info.min).astype(dtype)


def write_bin(path, header, arrays):
    blobs, offset = [], 0
    meta = {}
    for name, arr in arrays.items():
        arr = np.ascontiguousarray(arr)
        pad = (-offset) % 4
        blobs.append(b"\0" * pad)
        offset += pad
        meta[name] = {"type": arr.dtype.name, "offset": offset, "length": int(arr.size)}
        blobs.append(arr.tobytes())
        offset += arr.nbytes
    head = json.dumps({**header, "arrays": meta}, separators=(",", ":")).encode()
    head += b" " * ((-len(head)) % 4)
    raw = b"IND1" + struct.pack("<I", len(head)) + head + b"".join(blobs)
    with open(path, "wb") as f:
        f.write(gzip.compress(raw, 9, mtime=0))
    return len(raw), os.path.getsize(path)


def rivers_on(C, v):
    """Rivers (and nothing else) on the exact surface of the mesh."""
    feats = json.load(open(fetch(f"{NE}/ne_10m_rivers_lake_centerlines.geojson", os.path.join(C.cache, "ne_10m_rivers_lake_centerlines.geojson"))))["features"]
    surf = v["surface"]
    tri, keep, Yall = surf["tri"], surf["keep"], surf["Yall"]
    land = C.land
    out = []
    for name, label, rank, flow in RIVERS:
        parts = []
        for f in feats:
            p = f["properties"]
            if f["geometry"] is None or (p.get("name") != name and p.get("name_en") != name):
                continue
            g = shape(f["geometry"])
            parts.append(g)
        if not parts:
            log(f"  river {name}: not in the dataset")
            continue
        merged = shapely.line_merge(unary_union(parts))
        from shapely.ops import transform  # noqa: PLC0415
        merged = transform(lambda x, y, z=None: C.fwd.transform(x, y), merged)
        clipped = merged.intersection(land)
        for part in getattr(clipped, "geoms", [clipped]):
            if part.is_empty or part.geom_type != "LineString" or part.length < 60e3:
                continue
            d = np.arange(0, part.length, 3500.0)
            d = np.append(d, part.length)
            xy = np.array([part.interpolate(t).coords[0] for t in d])
            # light smoothing so the course does not stair-step
            for _ in range(2):
                xy[1:-1] = (xy[:-2] + 2 * xy[1:-1] + xy[2:]) / 4
            sid = tri.find_simplex(xy)
            good = (sid >= 0)
            good[good] = keep[sid[good]]
            if good.sum() < 6:
                continue
            xy, sid = xy[good], sid[good]
            T = tri.transform[sid]
            bary2 = np.einsum("nij,nj->ni", T[:, :2, :], xy - T[:, 2, :])
            bary = np.column_stack([bary2, 1 - bary2.sum(1)])
            ys = (Yall[tri.simplices[sid]] * bary).sum(1)
            X = (xy[:, 0] - C.cx) / UNIT
            Z = -(xy[:, 1] - C.cy) / UNIT
            seg = np.concatenate([[0], np.cumsum(np.hypot(np.diff(X), np.diff(Z)))])
            out.append({"id": name.lower().replace("ä", "a"), "name": label, "rank": rank, "flow": flow, "length_km": round(part.length / 1e3), "p": np.column_stack([X, ys, Z, seg]).astype(np.float32)})
    out.sort(key=lambda r: -r["rank"])
    return out


def bake(C):
    # India's relief at full detail; the neighbours' relief is simplified the further it is from India's border, so the Himalaya runs
    # on without the plateau beyond it competing with the country the model is about
    near = gaussian_filter(C.elev, 1.0)
    far = gaussian_filter(C.elev, 3.2)
    km_from_india = distance_transform_edt(~C.india_m) * CELL / 1e3
    w = np.clip((km_from_india - 70) / 240, 0, 1).astype(np.float32)
    sm = near * (1 - w) + far * w
    grids = {"elev": sm}
    dzdE = np.gradient(sm, CELL, axis=1) * EXAGGERATION
    dzdN = np.gradient(sm, CELL, axis=0) * EXAGGERATION
    grids["nx"], grids["nz"] = -dzdE, dzdN  # normal = normalize(-dh/dX, 1, -dh/dZ) with Z = -north
    log("ambient occlusion (horizon sky visibility)")
    grids["ao"] = horizon_visibility(EXAGGERATION * sm, CELL).astype(np.float32)
    # signed distance to India's land border (kilometres, positive inside); the coast is not a border
    neigh = np.zeros_like(C.india_m)
    other = C.land_m & ~C.india_m
    from scipy.ndimage import binary_dilation  # noqa: PLC0415
    border_cells = binary_dilation(other, iterations=1) & C.india_m
    d_in = distance_transform_edt(~border_cells) * CELL / 1e3
    # Who owns a cell is extended over the sea to the nearest land, so a vertex on the coast (and the wall below it) always takes the
    # sign of its own country; the sea counting as "not India" would flip it from one sample to the next.
    _, (near_y, near_x) = distance_transform_edt(~C.land_m, return_indices=True)
    sign = np.where(C.india_m[near_y, near_x], 1.0, -1.0)
    grids["sd"] = (sign * d_in).astype(np.float32)
    del neigh

    variants = {
        "hi": dict(tol_india=85.0, tol_other=420.0, boundary_step=2600.0, max_points=118_000, blocks=[60e3, 38e3, 24e3, 15e3, 9e3, 6e3, 4.2e3, 3.2e3, 2.6e3, 2.2e3]),
        "lo": dict(tol_india=240.0, tol_other=700.0, boundary_step=6500.0, max_points=34_000, blocks=[70e3, 44e3, 28e3, 18e3, 11e3, 7e3, 5e3]),
    }
    meta = {
        "version": 1, "projection": {"proj4": PROJ, "centre_m": [C.cx, C.cy]}, "unit_m": UNIT, "exaggeration": EXAGGERATION, "slab": SLAB, "floor": FLOOR,
        "bevel": BEVEL, "plate": {"x": [(C.X0 - C.cx) / UNIT, (C.X0 + C.w - C.cx) / UNIT], "z": [-(C.Y0 + C.h - C.cy) / UNIT, -(C.Y0 - C.cy) / UNIT]},
        "max_elevation_m": float(C.elev.max()), "grid_cell_m": CELL,
        "sources": [
            {"what": "National outline and neighbours", "name": "Natural Earth 1:10m admin-0 countries, India point of view", "licence": "public domain", "url": "https://www.naturalearthdata.com/"},
            {"what": "Rivers", "name": "Natural Earth 1:10m rivers and lake centrelines", "licence": "public domain", "url": "https://www.naturalearthdata.com/"},
            {"what": "Terrain", "name": "Terrain Tiles (Terrarium, zoom 7): SRTM and other public sources, composited by Mapzen", "licence": "open data, attribution required", "url": "https://github.com/tilezen/joerd/blob/master/docs/attribution.md"},
        ],
        "variants": {},
    }
    ib = C.india.bounds
    meta["india"] = {"x": [(ib[0] - C.cx) / UNIT, (ib[2] - C.cx) / UNIT], "z": [-(ib[3] - C.cy) / UNIT, -(ib[1] - C.cy) / UNIT]}
    meta["places"] = places_on(C)
    results = {}
    for name, params in variants.items():
        v = build_variant(C, name, grids, **params)
        w_ = walls(C, v)
        nt = len(v["X"])
        nw = len(w_["pos"])
        X = np.concatenate([v["X"], w_["pos"][:, 0]]); Y = np.concatenate([v["Y"], w_["pos"][:, 1]]); Z = np.concatenate([v["Z"], w_["pos"][:, 2]])
        NR = np.vstack([v["nrm"], w_["nrm"]])
        AO = np.concatenate([v["ao"], w_["ao"]]); SD = np.concatenate([v["sd"], w_["sd"]])
        tris = np.vstack([v["tri"], w_["tri"]]).astype(np.int64)
        px_lo, px_hi = (C.X0 - C.cx) / UNIT - 0.2, (C.X0 + C.w - C.cx) / UNIT + 0.2
        pz_lo, pz_hi = -(C.Y0 + C.h - C.cy) / UNIT - 0.2, -(C.Y0 - C.cy) / UNIT + 0.2
        y_lo, y_hi = FLOOR - 0.01, SLAB + EXAGGERATION * float(C.elev.max()) / UNIT + 0.05
        flat_idx = tris.reshape(-1)
        delta = np.diff(flat_idx, prepend=0).astype(np.int32)
        arrays = {
            "x": quantise_unit(X, px_lo, px_hi, np.uint16), "y": quantise_unit(Y, y_lo, y_hi, np.uint16), "z": quantise_unit(Z, pz_lo, pz_hi, np.uint16),
            "normal": np.round(np.clip(NR, -1, 1) * 127).astype(np.int8),
            "ao": np.round(np.clip(AO, 0, 1) * 255).astype(np.uint8),
            "sd": np.round(np.clip(SD, -300, 300) * 10).astype(np.int16),
            "index_delta": delta,
        }
        header = {"counts": {"terrainVertices": nt, "wallVertices": nw, "vertices": nt + nw, "terrainTriangles": int(len(v["tri"])), "triangles": int(len(tris)), "indices": int(flat_idx.size)},
                  "bounds": {"x": [px_lo, px_hi], "y": [y_lo, y_hi], "z": [pz_lo, pz_hi]}}
        raw, gz = write_bin(os.path.join(C.out, f"terrain-{name}.bin.gz"), header, arrays)
        log(f"[{name}] wrote terrain-{name}.bin.gz: {raw / 1e6:.2f} MB raw, {gz / 1e6:.2f} MB gzip")
        meta["variants"][name] = {"vertices": int(nt + nw), "triangles": int(len(tris)), "bytes_gzip": gz, "error": v["report"], "coast_sign_flips": w_["flips"]}
        log(f"[{name}] coast owner changes along the walls: {w_['flips']}")
        results[name] = v
    # rivers on the hi mesh (the low mesh has the same shape within its own tolerance; the browser lifts the lines slightly)
    rivers = rivers_on(C, results["hi"])
    arrays, table, off = {}, [], 0
    pts_all = np.vstack([r["p"] for r in rivers])
    for r in rivers:
        table.append({"id": r["id"], "name": r["name"], "rank": r["rank"], "flow": r["flow"], "length_km": r["length_km"], "start": off, "count": len(r["p"])})
        off += len(r["p"])
    raw, gz = write_bin(os.path.join(C.out, "lines.bin.gz"), {"rivers": table}, {"points": pts_all.astype(np.float32)})
    log(f"wrote lines.bin.gz: {len(rivers)} river lines, {len(pts_all)} points, {gz / 1e3:.0f} kB gzip")
    meta["rivers"] = [{k: r[k] for k in ("id", "name", "rank", "flow", "length_km")} for r in rivers]
    meta["coast"] = coast_field(C, meta)
    with open(os.path.join(C.out, "meta.json"), "w") as f:
        json.dump(meta, f, indent=1)
    log("done")


def places_on(C):
    """The markers' positions in the world frame, checked: each must lie inside India's outline."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib", "content", "india-map-places.json")
    out = []
    for p in json.load(open(path)):
        x, y = C.fwd.transform(p["lon"], p["lat"])
        pt = shapely.Point(x, y)
        inside = bool(C.india.contains(pt))
        elev = float(sample(C, C.elev, [x], [y])[0])
        assert inside, f"{p['id']} is outside India's outline"
        log(f"  place {p['id']:<10} {p['lat']:.3f}N {p['lon']:.3f}E  inside India: {inside}  DEM {elev:.0f} m  world ({(x - C.cx) / UNIT:.3f}, {-(y - C.cy) / UNIT:.3f})")
        out.append({"id": p["id"], "lon": p["lon"], "lat": p["lat"], "x": (x - C.cx) / UNIT, "z": -(y - C.cy) / UNIT, "elevation_m": round(elev), "inside_india": inside})
    return out


def coast_field(C, meta):
    """A small greyscale field (distance from the coast, over water) the ocean shader uses for its shallow-water glow."""
    k = 8
    ocean = ~C.land_m
    d = distance_transform_edt(ocean) * CELL / 1e3  # km from land
    small = d[k // 2::k, k // 2::k]
    val = np.clip(1 - small / 220.0, 0, 1) ** 1.6
    img = np.flipud(val)  # row 0 = north
    Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(C.out, "coast.png"), optimize=True)
    return {"file": "coast.png", "width": int(img.shape[1]), "height": int(img.shape[0]), "falloff_km": 220}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=os.path.expanduser("~/.cache/bsah-india-map"))
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "public", "data", "india-sculpture"))
    ap.add_argument("--preview", help="write a hillshade preview PNG here and stop after the grid stage")
    args = ap.parse_args()
    cache, out = args.cache, os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)

    fwd = Transformer.from_crs("EPSG:4326", CRS.from_proj4(PROJ), always_xy=True)
    inv = Transformer.from_crs(CRS.from_proj4(PROJ), "EPSG:4326", always_xy=True)

    # ---- boundary: India and its neighbours, projected
    countries = json.load(open(fetch(f"{NE}/ne_10m_admin_0_countries_ind.geojson", os.path.join(cache, "ne_10m_admin_0_countries_ind.geojson"))))
    india_ll = None
    others_ll = []
    for f in countries["features"]:
        g = shape(f["geometry"])
        if f["properties"].get("ADMIN") == "India":
            india_ll = g
        else:
            others_ll.append(g)
    assert india_ll is not None

    def project_geom(g):
        from shapely.ops import transform
        return transform(lambda x, y, z=None: fwd.transform(x, y), g)

    india = project_geom(india_ll)
    # keep what matters at this scale: the mainland, the Andaman and Nicobar islands, no specks
    india = unary_union([p for p in to_polys(india) if p.area >= LAND_MIN_AREA])
    minx, miny, maxx, maxy = india.bounds
    rect = box(minx - MARGIN, miny - MARGIN, maxx + MARGIN, maxy + MARGIN)
    # make the plate a whole number of cells, centred on the middle of India's box
    cx, cy = (rect.bounds[0] + rect.bounds[2]) / 2, (rect.bounds[1] + rect.bounds[3]) / 2
    w = math.ceil((rect.bounds[2] - rect.bounds[0]) / CELL / 8) * 8 * CELL
    h = math.ceil((rect.bounds[3] - rect.bounds[1]) / CELL / 8) * 8 * CELL
    X0, Y0 = cx - w / 2, cy - h / 2
    rect = box(X0, Y0, X0 + w, Y0 + h)
    log(f"plate {w / 1e3:.0f} x {h / 1e3:.0f} km, India box {(maxx - minx) / 1e3:.0f} x {(maxy - miny) / 1e3:.0f} km")

    near = [project_geom(g).intersection(rect.buffer(50_000)) for g in others_ll if g.distance(india_ll) < 20]
    land = unary_union([india.intersection(rect)] + [g for g in near if not g.is_empty])
    land = unary_union([p for p in to_polys(land) if p.area >= LAND_MIN_AREA])
    land = land.buffer(CLOSE).buffer(-CLOSE).buffer(-CLOSE / 2).buffer(CLOSE / 2).simplify(1200, preserve_topology=True).intersection(rect)
    land = unary_union([p for p in to_polys(land) if p.area >= LAND_MIN_AREA])
    india_s = india.buffer(CLOSE).buffer(-CLOSE).buffer(-CLOSE / 2).buffer(CLOSE / 2).simplify(1200, preserve_topology=True).intersection(rect)
    log(f"land polygons: {len(to_polys(land))}, India: {len(to_polys(india_s))} parts")

    # ---- the fine grid: elevation, land mask, India mask
    nx, ny = int(w / CELL), int(h / CELL)
    gx = X0 + (np.arange(nx) + 0.5) * CELL
    gy = Y0 + (np.arange(ny) + 0.5) * CELL  # south -> north
    GX, GY = np.meshgrid(gx, gy)
    lon, lat = inv.transform(GX, GY)
    mosaic, mx0, my0 = load_dem(cache, lon.min() - 0.3, lon.max() + 0.3, lat.min() - 0.3, lat.max() + 0.3)
    px, py = mercator_px(lon, lat)
    elev = map_coordinates(mosaic, [py - my0, px - mx0], order=1, mode="nearest").astype(np.float32)
    del mosaic, lon, lat, px, py

    def raster(geom):
        im = Image.new("L", (nx, ny), 0)
        d = ImageDraw.Draw(im)
        for p in to_polys(geom):
            d.polygon([((x - X0) / CELL - 0.5, (Y0 + h - y) / CELL - 0.5) for x, y in p.exterior.coords], fill=255)
            for r in p.interiors:
                d.polygon([((x - X0) / CELL - 0.5, (Y0 + h - y) / CELL - 0.5) for x, y in r.coords], fill=0)
        return np.flipud(np.asarray(im) > 127)  # row 0 = south

    land_m = raster(land)
    india_m = raster(india_s)
    elev = np.where(land_m, np.maximum(elev, 0), 0).astype(np.float32)
    log(f"grid {nx} x {ny}; land {land_m.mean() * 100:.0f}%; India {india_m.mean() * 100:.0f}%; max elevation {elev.max():.0f} m")

    if args.preview:
        sm = gaussian_filter(elev, 1.0)
        dzdx = np.gradient(sm, axis=1) / CELL * EXAGGERATION
        dzdy = np.gradient(sm, axis=0) / CELL * EXAGGERATION
        nzv = 1 / np.sqrt(1 + dzdx**2 + dzdy**2)
        lx, ly, lz = np.array([-0.55, 0.55, 0.62]) / np.linalg.norm([-0.55, 0.55, 0.62])
        shade = np.clip((-dzdx * nzv * lx - dzdy * nzv * ly + nzv * lz), 0, 1)
        img = np.where(land_m, 0.25 + 0.75 * shade, 0.06)
        rgb = np.stack([img * np.where(india_m, 0.95, 0.55), img * np.where(india_m, 0.88, 0.62), img * np.where(india_m, 0.68, 0.64)], -1)
        Image.fromarray((np.flipud(rgb) * 255).astype(np.uint8)).save(args.preview)
        log("preview written", args.preview)
        return

    C = SimpleNamespace(
        cache=cache, out=out, fwd=fwd, inv=inv, land=land, india=india_s, rect=rect, X0=X0, Y0=Y0, w=w, h=h, nx=nx, ny=ny,
        elev=elev, land_m=land_m, india_m=india_m, cx=X0 + w / 2, cy=Y0 + h / 2, others=near,
    )
    bake(C)


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
