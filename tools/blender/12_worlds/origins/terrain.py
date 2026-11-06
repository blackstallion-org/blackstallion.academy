"""World 01 Origins: the valley terrain, built procedurally in Blender and exported for the browser.

Run (Blender 5.0 as a Python module):
    OUT=/root/bsah/public/worlds/origins WORK=/root/work/origins ~/bpyenv/bin/python terrain.py

Coordinates: everything below is written in three.js space (x right, y up, z toward the valley); the Blender mesh is built at
(x, -z, y) so the glTF exporter's Y-up conversion lands it back on the same three.js coordinates.

Layout (metres):
  * the vantage hill: a grassy, rocky promontory whose top (the horse's mark) is the origin, ~70 m above the valley floor;
  * the valley opens toward +z: a broad floor with rolling meadows, a river that winds out of the far distance and passes
    ~300 m in front of the hill, the academy on a levelled site at about (-430, 0, 640) with its arena and paddocks;
  * valley walls rise beyond ~0.7-2 km on both sides and a far range (to ~1.4 km high) closes the view 6-10 km out; hills
    climb behind the vantage point so no view runs off the edge of the world.

Writes:
  origins-terrain.glb      radial-grid terrain (a dense disc at the hill, a coarse annulus out to 14 km),
                           COLOR_0 = (rock, sand/path, lush, baked sun visibility) for the browser's terrain shader
  origins-terrain-lo.glb   the same at about half the triangles (phones)
  origins-height.bin       uint16 heights (cm, +0) on a 257 x 257 grid, 1 m spacing, centred on the hill (grass, horse)
  origins-layout.json      river centre line, academy site, tree and rock placements (all with ground heights)
"""
import bpy, bmesh, os, json, math
import numpy as np

OUT = os.environ.get("OUT", "/root/bsah/public/worlds/origins")
WORK = os.environ.get("WORK", "/root/work/origins")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- noise (vectorised gradient noise, deterministic)
rng = np.random.default_rng(1207)
PERM = np.concatenate([rng.permutation(256)] * 2)
ANG = rng.random(256) * 2 * np.pi
GX, GY = np.cos(ANG), np.sin(ANG)


def gnoise(x, y):
    xi = np.floor(x).astype(np.int64)
    yi = np.floor(y).astype(np.int64)
    xf = x - xi
    yf = y - yi
    xi &= 255
    yi &= 255

    def g(ix, iy, dx, dy):
        h = PERM[PERM[ix] + iy]
        return GX[h] * dx + GY[h] * dy

    u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    n00 = g(xi, yi, xf, yf)
    n10 = g((xi + 1) & 255, yi, xf - 1, yf)
    n01 = g(xi, (yi + 1) & 255, xf, yf - 1)
    n11 = g((xi + 1) & 255, (yi + 1) & 255, xf - 1, yf - 1)
    return (n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v  # ~[-0.7, 0.7]


def fbm(x, y, oct=5, lac=2.03, gain=0.5, seed=0.0):
    s = np.zeros_like(x)
    a = 1.0
    f = 1.0
    for i in range(oct):
        s += a * gnoise(x * f + seed + i * 17.3, y * f - seed + i * 9.1)
        f *= lac
        a *= gain
    return s


def ridged(x, y, oct=6, seed=0.0):
    s = np.zeros_like(x)
    a = 0.5
    f = 1.0
    w = np.ones_like(x)
    for i in range(oct):
        n = 1 - np.abs(gnoise(x * f + seed + i * 31.7, y * f + seed * 0.7 - i * 13.1) * 1.45)
        n = n * n * w
        w = np.clip(n * 1.6, 0, 1)
        s += n * a
        f *= 2.05
        a *= 0.5
    return s  # ~0..1


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- layout
HILL_TOP = 70.0
ACADEMY = np.array([-430.0, 640.0])
ACADEMY_R = 150.0
RIVER_PTS = np.array([
    [-900, 9000], [-300, 7600], [250, 6400], [-150, 5200], [320, 4100], [-60, 3100], [-380, 2300],
    [-120, 1600], [260, 1150], [120, 720], [-60, 420], [180, 260], [620, 300], [1100, 520], [1700, 480], [2600, 900],
], dtype=np.float64)


def resample(pts, step):
    out = [pts[0]]
    for a, b in zip(pts[:-1], pts[1:]):
        n = max(1, int(np.linalg.norm(b - a) / step))
        for k in range(1, n + 1):
            out.append(a + (b - a) * k / n)
    out = np.array(out)
    # Chaikin smoothing for gentle meanders
    for _ in range(3):
        q = 0.75 * out[:-1] + 0.25 * out[1:]
        r = 0.25 * out[:-1] + 0.75 * out[1:]
        out = np.vstack([out[:1], np.column_stack([q, r]).reshape(-1, 2), out[-1:]])
    return out


RIVER = resample(RIVER_PTS, 120)


def river_dist(x, z):
    """distance (m) from each point to the river centre line, chunked to bound memory"""
    a = RIVER[:-1]
    b = RIVER[1:]
    ab = b - a
    L2 = (ab ** 2).sum(1)
    out = np.full(x.shape, 1e9)
    flat_x = x.ravel()
    flat_z = z.ravel()
    res = np.full(flat_x.shape, 1e9)
    CH = 20000
    for s in range(0, flat_x.size, CH):
        px = flat_x[s:s + CH, None]
        pz = flat_z[s:s + CH, None]
        t = np.clip(((px - a[:, 0]) * ab[:, 0] + (pz - a[:, 1]) * ab[:, 1]) / L2, 0, 1)
        dx = px - (a[:, 0] + t * ab[:, 0])
        dz = pz - (a[:, 1] + t * ab[:, 1])
        res[s:s + CH] = np.sqrt((dx * dx + dz * dz).min(1))
    return res.reshape(x.shape)


def river_width(z):
    return 16 + 10 * smoothstep(0, 6000, z)


def height(x, z, with_masks=False):
    # valley floor and meadows
    base = 1.6 * fbm(x / 420, z / 420, 4, seed=3.1) + 0.5 * fbm(x / 70, z / 70, 3, seed=8.4)
    meadow_hills = 26 * np.clip(fbm(x / 900 + 4.2, z / 900 - 1.3, 4, seed=1.7) + 0.08, 0, None) ** 1.4
    # valley walls (distance from a gently curving valley axis), far range, hills behind the vantage point
    axis = -120 + 260 * np.sin(z / 1700.0)
    side = np.abs(x - axis)
    wall = smoothstep(650, 2300, side + 0.25 * np.maximum(0, -z))
    mx = x + 520 * fbm(x / 2600, z / 2600, 3, seed=71.0)
    mz = z + 520 * fbm(x / 2600 + 7.1, z / 2600, 3, seed=72.0)
    rid = ridged(mx / 2100, mz / 2100, 7, seed=5.5) * 0.85 + 0.15 * (fbm(mx / 600, mz / 600, 4, seed=73.0) + 0.5)
    rid2 = ridged(mx / 3300, mz / 3300, 7, seed=11.2) * 0.85 + 0.15 * (fbm(mx / 900, mz / 900, 4, seed=74.0) + 0.5)
    mt_side = wall * (90 + 720 * rid) * (0.75 + 0.5 * smoothstep(1500, 6000, z))
    far = smoothstep(4200, 8200, z) * (380 + 1100 * rid2)
    behind = smoothstep(150, 1700, -z) * (70 + 380 * rid)
    mountains = np.maximum(np.maximum(mt_side, far), behind)
    # the vantage hill: a bell, a spine running back into the hills behind, a small flat top
    # warp the hill's footprint so it reads as a natural promontory, not a dome
    wx = x + 28 * fbm(x / 110, z / 110, 3, seed=14.0)
    wz = z + 28 * fbm(x / 110 + 3.3, z / 110 - 1.7, 3, seed=15.0)
    top = 1 - smoothstep(6, 26, np.sqrt(x * x + z * z))
    wx = x + (wx - x) * (1 - top)
    wz = z + (wz - z) * (1 - top)
    hz = np.where(wz > 0, wz * 1.35, wz * 0.55)
    d = np.sqrt(wx * wx + hz * hz)
    hill = HILL_TOP * np.exp(-((d / 118) ** 2.1))
    spine = 52 * np.exp(-((x + 0.08 * z) / 95) ** 2) * smoothstep(-20, -260, z) * (1 - smoothstep(600, 1400, -z))
    hill = np.maximum(hill, spine)
    hillmask = smoothstep(0.08, 0.5, hill / HILL_TOP)
    # rough, rocky texture on the hill and a few outcrops on its valley-facing brow
    rough = hillmask * (2.4 * fbm(x / 16, z / 16, 4, seed=21.0) + 0.6 * fbm(x / 3, z / 3, 3, seed=2.2))
    outcrop = hillmask * 6.0 * np.clip(ridged(x / 30, z / 30, 4, seed=40.0) - 0.4, 0, None) * smoothstep(-10, 30, z)
    top_flat = 1 - smoothstep(4, 14, np.sqrt(x * x + z * z))
    h = base + meadow_hills * (1 - wall) * (1 - hillmask) + mountains + hill + (rough + outcrop) * (1 - top_flat * 0.85)
    # river: flatten the floor near it and carve the channel
    rd = river_dist(x, z)
    w = river_width(z)
    bank = 1 - smoothstep(w * 0.5, w * 9.0, rd)
    level = 0.6
    h = h * (1 - bank) + (level + 0.4 + 0.25 * np.maximum(h - level, 0) * smoothstep(w * 0.8, w * 9.0, rd)) * bank
    chan = 1 - smoothstep(w * 0.25, w * 0.62, rd)
    h = h - 2.6 * chan
    # academy site
    ad = np.sqrt((x - ACADEMY[0]) ** 2 + (z - ACADEMY[1]) ** 2)
    pad = 1 - smoothstep(ACADEMY_R, ACADEMY_R + 90, ad)
    h = h * (1 - pad) + 1.1 * pad
    if not with_masks:
        return h
    return h, dict(rd=rd, w=w, chan=chan, pad=pad, ad=ad, hillmask=hillmask, wall=wall, mountains=mountains, top_flat=top_flat)


# ---------------------------------------------------------------- radial grids
# Two radial meshes so the density follows the distance from the hill without decimation (a vertex-group collapse removed the
# far field): a geometric disc to 1.5 km, then an annulus with twice the angular resolution for the mountains (its inner rim,
# at 1.49 km, sunk 1.2 m under the disc as a skirt, so the seam between the two resolutions never opens).
def radial(r_in, r_out, rings, ang_segs, skirt=False):
    k = (r_out / max(r_in, 0.4)) ** (1.0 / (rings - 1))
    radii = max(r_in, 0.4) * k ** np.arange(rings)
    th = np.linspace(0, 2 * np.pi, ang_segs, endpoint=False)
    R, T = np.meshgrid(radii, th, indexing="ij")
    X = (R * np.cos(T)).ravel()
    Z = (R * np.sin(T)).ravel()
    centre = r_in <= 0
    if centre:
        X = np.concatenate([[0.0], X])
        Z = np.concatenate([[0.0], Z])
    faces = []
    n = ang_segs
    off = 1 if centre else 0
    if centre:
        for j in range(n):
            faces.append((0, off + j, off + (j + 1) % n))
    for i in range(rings - 1):
        a0 = off + i * n
        b0 = off + (i + 1) * n
        for j in range(n):
            j1 = (j + 1) % n
            faces.append((a0 + j, b0 + j, b0 + j1, a0 + j1))
    drop = np.zeros_like(X)
    if skirt:
        drop[: n] = 1.2
    return X, Z, faces, drop


# ---------------------------------------------------------------- baked sun visibility (golden-hour shadows across the valley)
# The key light: the panorama's sun azimuth in this world's local frame (the browser turns the valley 0.309 rad under the
# fixed sky), raised to ~11.4 degrees as in the browser. Shadows are marched over two sampled height grids (25 m over the
# whole map, 4 m over the 2.4 km round the hill) rather than the analytic height, which is too slow per step.
SUN_AZ = np.array([0.529, 0.846]) / np.hypot(0.529, 0.846)
SUN_TAN = math.tan(math.radians(11.4))
_grids = []


def _grid(extent, step, cx=0.0, cz=0.0):
    n = int(extent / step) + 1
    g = np.linspace(-extent / 2, extent / 2, n)
    GXg, GZg = np.meshgrid(g + cx, g + cz)
    Hg = height(GXg, GZg)
    return dict(x0=g[0] + cx, z0=g[0] + cz, step=g[1] - g[0], n=n, h=Hg)


def _sample(gr, x, z):
    fx = (x - gr["x0"]) / gr["step"]
    fz = (z - gr["z0"]) / gr["step"]
    inside = (fx >= 0) & (fz >= 0) & (fx < gr["n"] - 1) & (fz < gr["n"] - 1)
    fx = np.clip(fx, 0, gr["n"] - 1.001)
    fz = np.clip(fz, 0, gr["n"] - 1.001)
    ix = fx.astype(int)
    iz = fz.astype(int)
    tx = fx - ix
    tz = fz - iz
    h = gr["h"]
    v = (h[iz, ix] * (1 - tx) + h[iz, ix + 1] * tx) * (1 - tz) + (h[iz + 1, ix] * (1 - tx) + h[iz + 1, ix + 1] * tx) * tz
    return v, inside


def grid_height(x, z):
    if not _grids:
        print("sampling height grids for the shadow bake ...")
        _grids.append(_grid(30000, 30.0))
        _grids.append(_grid(2400, 4.0))
    far, _ = _sample(_grids[0], x, z)
    near, ins = _sample(_grids[1], x, z)
    return np.where(ins, near, far)


def sun_visibility(X, Z, H):
    vis = np.ones_like(X)
    t = 3.0
    while t < 9000:
        px = X + SUN_AZ[0] * t
        pz = Z + SUN_AZ[1] * t
        ray = H + 0.6 + t * SUN_TAN
        gh = grid_height(px, pz)
        # soft penumbra: how far the ray is below the ground, relative to the distance travelled
        occ = np.clip((gh - ray) / (1.5 + 0.015 * t), 0, 1)
        vis = np.minimum(vis, 1 - occ)
        t *= 1.12
    return vis


def build(name, near, far):
    parts = [radial(0, 1500, near[0], near[1]), radial(1490, 14000, far[0], far[1], skirt=True)]
    Xs, Zs, Fs, Ds = [], [], [], []
    base = 0
    for X, Z, F, D in parts:
        Xs.append(X); Zs.append(Z); Ds.append(D)
        Fs += [tuple(v + base for v in f) for f in F]
        base += len(X)
    X = np.concatenate(Xs); Z = np.concatenate(Zs); D = np.concatenate(Ds)
    H, M = height(X, Z, True)
    H = H - D
    e = 1.0
    hx = (height(X + e, Z) - height(X - e, Z)) / (2 * e)
    hz = (height(X, Z + e) - height(X, Z - e)) / (2 * e)
    slope = np.sqrt(hx * hx + hz * hz)
    rock = np.clip(smoothstep(0.55, 1.1, slope) + 0.6 * smoothstep(250, 900, M["mountains"]) * smoothstep(0.3, 0.6, slope), 0, 1)
    rock *= 1 - M["chan"]
    ax, az = X - (ACADEMY[0] + 95), Z - (ACADEMY[1] - 150)
    arena = 1 - smoothstep(0.92, 1.02, np.sqrt((ax / 48) ** 2 + (az / 24) ** 2))
    track = 1 - smoothstep(2.5, 4.5, np.abs(M["ad"] - 128))
    apron = 1 - smoothstep(58, 66, M["ad"])
    gravel = smoothstep(M["w"] * 0.45, M["w"] * 0.6, M["rd"]) * (1 - smoothstep(M["w"] * 0.6, M["w"] * 0.95, M["rd"]))
    sand = np.clip(np.maximum.reduce([arena, track * 0.9, apron * 0.8, gravel * 0.7]), 0, 1)
    lush = np.clip(0.5 + 0.9 * fbm(X / 260, Z / 260, 3, seed=60.0) + 0.5 * (1 - smoothstep(30, 140, M["rd"])), 0, 1)
    # river wetness folds into the sand channel's gravel band; alpha carries the baked sun visibility
    vis = sun_visibility(X, Z, H + D)
    print(name, "sunlit share", float((vis > 0.5).mean()))
    cols = np.column_stack([rock, sand, lush, vis]).astype(np.float32)
    verts = np.column_stack([X, -Z, H])
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], Fs)
    me.update()
    if np.mean([p.normal.z for p in me.polygons[:2000]]) < 0:
        me.flip_normals()
    attr = me.color_attributes.new("Mask", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", cols.ravel())
    me.color_attributes.active_color = attr
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    print(name, "verts", len(me.vertices), "tris", sum(len(p.vertices) - 2 for p in me.polygons))
    return ob


def export(ob, path):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, use_selection=True, export_format="GLB", export_normals=True, export_texcoords=False,
        export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_materials="NONE",
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=16, export_draco_normal_quantization=10, export_draco_color_quantization=8,
        export_apply=True,
    )
    print(path, os.path.getsize(path))


bpy.ops.wm.read_factory_settings(use_empty=True)
hi = build("OriginsTerrain", (180, 270), (85, 540))
export(hi, os.path.join(OUT, "origins-terrain.glb"))
bpy.data.objects.remove(hi)
lo = build("OriginsTerrainLo", (140, 200), (60, 360))
export(lo, os.path.join(OUT, "origins-terrain-lo.glb"))

# ---------------------------------------------------------------- near heightmap for the browser (grass, horse)
N = 257
g = np.arange(N) - (N - 1) / 2
GXg, GZg = np.meshgrid(g, g)  # row = z, col = x
Hn = height(GXg.astype(np.float64), GZg.astype(np.float64))
q = np.clip(np.round(Hn * 100), 0, 65535).astype("<u2")
q.tofile(os.path.join(OUT, "origins-height.bin"))
print("height top", Hn[N // 2, N // 2], "min", Hn.min(), "max", Hn.max())

# ---------------------------------------------------------------- scatter: trees along the river and in clumps, rocks on the hill
rs = np.random.default_rng(77)
cand = rs.uniform([-2400, -500], [2400, 5600], size=(160000, 2))
cx, cz = cand[:, 0], cand[:, 1]
H2, M2 = height(cx, cz, True)
clump = fbm(cx / 230, cz / 230, 3, seed=90.0)
riverside = (1 - smoothstep(M2["w"] * 1.2, M2["w"] * 5.0, M2["rd"])) * (M2["rd"] > M2["w"] * 0.9)
ex = 0.55 * smoothstep(0.12, 0.38, clump) + 0.9 * riverside + 0.03
ex *= (1 - M2["pad"]) * (1 - M2["hillmask"] * 0.9) * (1 - smoothstep(150, 500, M2["mountains"]))
keep = rs.random(len(cx)) < ex * 0.42
# keep the hill's line of sight to the river and the academy open
tx, tz, th = cx[keep], cz[keep], H2[keep]
trees = []
tvis = sun_visibility(tx, tz, th + 6.0)
for x, z, y, v in zip(tx, tz, th, tvis):
    s = float(rs.uniform(0.6, 1.25))
    trees.append([round(float(x), 1), round(float(y), 2), round(float(z), 1), round(s, 2), int(rs.integers(0, 4)), round(float(v), 2)])
trees = trees[:9000]
print("trees", len(trees))

layout = {
    "hillTop": float(height(np.array([0.0]), np.array([0.0]))[0]),
    "heightGrid": {"n": N, "spacing": 1.0, "origin": [-(N - 1) / 2, -(N - 1) / 2], "scale": 0.01},
    "academy": {"x": float(ACADEMY[0]), "z": float(ACADEMY[1]), "y": 1.1, "arena": [float(ACADEMY[0] + 95), float(ACADEMY[1] - 150), 48, 24]},
    "river": [[round(float(x), 1), round(float(z), 1), round(float(river_width(z)), 1)] for x, z in RIVER],
    "riverLevel": 0.6 - 1.05,
    "trees": trees,
}
json.dump(layout, open(os.path.join(OUT, "origins-layout.json"), "w"), separators=(",", ":"))
print("layout bytes", os.path.getsize(os.path.join(OUT, "origins-layout.json")))
