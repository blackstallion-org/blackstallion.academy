# L4/L5: the tail and mane cards, reshaped. The original object is kept (hidden, excluded from export) as `Marwari_Hair_Original`.
#
# TAIL (rebuilt, Nov 2026, "Tail Refinement & Perfection" sheet). The 72 original tail ribbons keep their vertex count, order, UVs and skin
# weights; only their rest positions change. A second, removable object `Marwari_Hair_Add_Tail` carries extra locks (new cards, their own
# UVs and weights) that export_refined.py joins into the one hair mesh the loader expects. Together they make one bundle:
#   1 root      every lock starts inside the croup at the dock (x = 0.055, the midline of the quarters, not the rig's x = 0), comes out
#               through the surface as a tight rounded collar about 7 cm across and opens from there: no gap, no flat plate on the croup
#   2 layering  three depth layers (dark core of wide locks, a middle layer, an outer layer of narrower longer locks), each lock with its
#               own width, length, phase and a gentle S-curve; neighbouring locks wave together so they read as clumps, not as noise
#   3 volume    the bundle's cross-section is an ellipse that opens from 7 cm at the dock to about 25 cm across and 23 cm deep, and flares a
#               little at the ends, as in the reference photographs
#   4 taper     each lock keeps its full width over the upper two thirds and narrows smoothly to a point; lock lengths differ (tips 10 to
#               35 cm above the ground, a few shorter under-locks), so the lower end is soft and not cut
#   5 flow      the path follows the tail bones (back from the dock, then down, a little further back at the bottom); the S-curves grow
#               toward the tips; the runtime spring adds the motion
# Skin weights of the added locks come from their height against the tail bones (Tail_1 .. Tail_4, blended across each joint).
#
# MANE: the 53 ribbons are lengthened a little and draped onto the neck (kept 8 to 14 mm off the skin) instead of standing off it like
# blades; the forelock ribbons are left alone so they keep clear of the eyes and the blaze.
import bpy, bmesh, math, random, collections
from mathutils import Vector
from mathutils.bvhtree import BVHTree

X0 = 0.055            # midline of the quarters (the body sits 5.5 cm off the rig's x = 0 at the croup)
# (s, y, z) of the bundle's axis: inside the croup, out through its surface, back, then down. z at s = 1 is replaced per lock by its own tip height
KEY = [(0.00, 0.495, 1.445), (0.06, 0.538, 1.425), (0.12, 0.582, 1.380), (0.22, 0.645, 1.275), (0.36, 0.712, 1.100),
       (0.52, 0.755, 0.920), (0.70, 0.775, 0.660), (0.85, 0.790, 0.460), (1.00, 0.800, 0.200)]
ZREF = 0.20

def sm(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def lerp(a, b, t): return a + (b - a) * t

def catmull(p0, p1, p2, p3, t):
    t2, t3 = t * t, t * t * t
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)

def axis(s, zt):
    """point on the bundle's axis at parameter s (0 dock .. 1 tip) for a lock whose tip is zt metres above the ground"""
    s = min(1.0, max(0.0, s))
    k = 0
    while k < len(KEY) - 2 and s > KEY[k + 1][0]: k += 1
    (s0, y0, z0), (s1, y1, z1) = KEY[k], KEY[k + 1]
    ym = KEY[k - 1] if k > 0 else (s0 - (s1 - s0), y0 - (y1 - y0), z0 - (z1 - z0))
    yp = KEY[k + 2] if k + 2 < len(KEY) else (s1 + (s1 - s0), y1 + (y1 - y0), z1 + (z1 - z0))
    t = (s - s0) / (s1 - s0)
    y = catmull(ym[1], y0, y1, yp[1], t); z = catmull(ym[2], z0, z1, yp[2], t)
    z += (zt - ZREF) * (max(0.0, (s - 0.25) / 0.75) ** 1.25)
    return Vector((X0 + 0.012 * s + 0.016 * math.sin(2 * math.pi * (0.85 * s + 0.12)) * sm(0.15, 0.7, s), y, z))   # one slow shared bow so the whole tail is not a ruled column

def rx(s): return 0.026 + 0.082 * sm(0.04, 0.55, s) + 0.020 * sm(0.5, 1, s)    # half width of the bundle
def ry(s): return 0.024 + 0.088 * sm(0.04, 0.55, s) + 0.030 * sm(0.5, 1, s)    # half depth of the bundle

def prof(s):
    """width of a lock along its length: narrow and buried at the dock, full over the upper two thirds, then to a point"""
    if s < 0.34: return 0.24 + 0.76 * sm(0.03, 0.34, s) ** 1.2   # a tight collar at the dock that opens as it falls
    return 1.0 - 0.62 * (sm(0.66, 0.985, s) ** 1.15) - (0.22 * sm(0.94, 1.0, s))

def lock_rows(prm, ss):
    """(centre, unit width direction, half width) for each parameter s of a lock"""
    out = []
    for s in ss:
        C = axis(s, prm['zt'])
        T = (axis(min(1.0, s + 0.01), prm['zt']) - axis(max(0.0, s - 0.01), prm['zt'])).normalized()
        X = Vector((1, 0, 0))
        U = (X - T * X.dot(T)).normalized()
        V = T.cross(U).normalized()
        a = prm['ang'] + prm['twist'] * s
        off = U * (rx(s) * prm['rad'] * math.cos(a)) + V * (ry(s) * prm['rad'] * math.sin(a))
        wa = prm['wdir']
        wav = (U * math.cos(wa) + V * math.sin(wa)) * (prm['amp'] * sm(0.08, 0.5, s) * math.sin(2 * math.pi * (prm['freq'] * s + prm['phase'])))
        flare = 1.0 + 0.5 * sm(0.5, 1.0, s) * prm['rad']                 # the outer locks open out near the ends
        M = C + off * flare + wav
        b = a + math.pi / 2 + prm['jit'] + 0.25 * math.sin(2 * math.pi * (0.7 * s + prm['phase']))
        d = (U * math.cos(b) + V * math.sin(b)).normalized()
        out.append((M, d, 0.5 * prm['w0'] * prof(s)))
    return out

def lock_params(n, rnd):
    """n locks spread over the cross-section by the golden angle (even cover, no rows), with layer, size, phase, curl"""
    prms = []
    for i in range(n):
        rad = math.sqrt((i + 0.5) / n) * 0.98
        ang = i * 2.399963 + 0.35 * (rnd.random() - 0.5)
        layer = 'core' if rad < 0.42 else ('mid' if rad < 0.75 else 'outer')
        short = rnd.random() < (0.10 if layer != 'outer' else 0.04)
        # lengths are staggered (most long, fewer short) so the lower end thins out and the tips are soft, not cut
        zt = (0.40 + 0.18 * rnd.random()) if short else {'core': 0.15 + 0.32 * rnd.random() ** 1.5, 'mid': 0.11 + 0.38 * rnd.random() ** 1.7, 'outer': 0.10 + 0.42 * rnd.random() ** 1.8}[layer]
        w0 = {'core': 0.100, 'mid': 0.082, 'outer': 0.062}[layer] * (0.8 + 0.4 * rnd.random())
        prms.append(dict(rad=rad, ang=ang, layer=layer, zt=zt, w0=w0, amp=0.016 + 0.026 * rnd.random(), freq=0.75 + 0.75 * rnd.random(),
                         phase=(ang / (2 * math.pi)) * 0.7 + 0.22 * (rnd.random() - 0.5), wdir=0.5 * ang + 1.2 * rnd.random(),
                         twist=0.8 * (rnd.random() - 0.5), jit=(math.radians(-38 + 76 * rnd.random()) if layer == 'outer' else math.radians(-90 + 180 * rnd.random()))))
    return prms

def ribbons(ob):
    me = ob.data
    parent = list(range(len(me.vertices)))
    def f(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]; a = parent[a]
        return a
    for e in me.edges: parent[f(e.vertices[0])] = f(e.vertices[1])
    comps = collections.defaultdict(list)
    for v in me.vertices: comps[f(v.index)].append(v.index)
    uv = me.uv_layers[0].data
    vuv = {}
    for l in me.loops: vuv[l.vertex_index] = uv[l.index].uv.copy()
    names = {g.index: g.name for g in ob.vertex_groups}
    out = []
    for idx in comps.values():
        w = collections.Counter()
        for i in idx:
            for g in me.vertices[i].groups: w[names[g.group]] += g.weight
        kind = 'tail' if w.most_common(1)[0][0].startswith('Tail') else 'mane'
        rows = collections.defaultdict(list)
        for i in idx: rows[round(vuv[i].y, 4)].append(i)
        order = sorted(rows, reverse=True)       # v = 1 at the root, 0 at the tip (in Blender; three.js reads it the other way round)
        out.append((kind, [sorted(rows[k], key=lambda i: vuv[i].x) for k in order], [1 - k for k in order], w))
    return out

def tail_weights(z):
    """(Tail_1 .. Tail_4 weights) for a rest height: the bone joints are at z = 1.10, 0.85 and 0.60, blended over +-0.06 each"""
    b = [sm(jz - 0.06, jz + 0.06, z) for jz in (1.10, 0.85, 0.60)]       # 1 well above the joint, 0 well below
    w = [b[0], (1 - b[0]) * b[1], (1 - b[1]) * b[2], 1 - b[2]]
    tot = sum(w)
    return [x / tot for x in w]

def push_off_body(bvh, p, s, margin):
    if s < 0.09: return p
    hit = bvh.find_nearest(p)
    if hit[0] is None: return p
    loc, nor, _, dist = hit
    inside = (p - loc).dot(nor) < margin
    if inside: return loc + nor * margin
    return p

def run():
    ob = bpy.data.objects['Marwari_Hair']
    orig = ob.copy(); orig.data = ob.data.copy(); orig.name = 'Marwari_Hair_Original'; orig.data.name = 'Marwari_Hair_Original'
    for c in ob.users_collection: c.objects.link(orig)
    orig.hide_render = True; orig.hide_viewport = True
    me = ob.data
    co = [v.co.copy() for v in me.vertices]
    rib = ribbons(ob)
    body = bpy.data.objects['Marwari_Low']
    bm = bmesh.new(); bm.from_mesh(body.data); bvh = BVHTree.FromBMesh(bm); bm.free()
    rnd = random.Random(2026)
    # ---------------------------------------------------------------- tail: 72 original ribbons + the added locks, placed together
    tails = [r for r in rib if r[0] == 'tail']
    n_add = 104
    prms = lock_params(len(tails) + n_add, rnd)
    order = list(range(len(prms))); rnd.shuffle(order)
    # the originals take the middle and outer layers first (they have 10 rows, the added locks 14): sort the shuffled slots by radius desc
    for (kind, rows, ts, w), pi in zip(sorted(tails, key=lambda r: r[1][0][0]), order[:len(tails)]):
        prm = prms[pi]
        for (M, d, h), row in zip(lock_rows(prm, ts), rows):
            for k, i in enumerate(row):
                sgn = -1 if k == 0 else 1
                me.vertices[i].co = M + d * h * sgn
    # clearance from the body for the original ribbons (rows below the dock)
    for kind, rows, ts, w in tails:
        for row, t in zip(rows, ts):
            for i in row: me.vertices[i].co = push_off_body(bvh, me.vertices[i].co, t, 0.012)
    # the added locks: their own object, new cards
    add = ob.copy(); add.data = ob.data.copy(); add.name = 'Marwari_Hair_Add_Tail'; add.data.name = 'Marwari_Hair_Add_Tail'
    for c in ob.users_collection: c.objects.link(add)
    bmx = bmesh.new(); bmx.from_mesh(add.data)
    bmesh.ops.delete(bmx, geom=list(bmx.verts), context='VERTS')
    uvl = bmx.loops.layers.uv[add.data.uv_layers[0].name]
    dvl = bmx.verts.layers.deform.verify()
    gi = [ob.vertex_groups['Tail_%d' % k].index for k in (1, 2, 3, 4)]
    NR = 15
    ss = [(j / (NR - 1)) ** 1.3 for j in range(NR)]      # rows crowd toward the dock, where the path turns most
    for n, pi in enumerate(order[len(tails):]):
        prm = prms[pi]
        slot = rnd.randrange(8)
        rowsv = []
        for (M, d, h), s in zip(lock_rows(prm, ss), ss):
            pair = []
            for sgn, col in ((-1, 0), (1, 1)):
                p = push_off_body(bvh, M + d * h * sgn, s, 0.012)
                v = bmx.verts.new(p)
                for g, wt in zip(gi, tail_weights(p.z)):
                    if wt > 1e-4: v[dvl][g] = wt
                pair.append(v)
            rowsv.append(pair)
        bmx.verts.ensure_lookup_table()
        for j in range(NR - 1):
            a0, a1 = rowsv[j]; b0, b1 = rowsv[j + 1]
            f = bmx.faces.new((a0, a1, b1, b0)); f.smooth = True
            for loop in f.loops:
                col = 0 if loop.vert in (a0, b0) else 1
                s_ = ss[j] if loop.vert in (a0, a1) else ss[j + 1]
                loop[uvl].uv = ((slot + col) / 8.0, 1.0 - s_)
    bmx.to_mesh(add.data); bmx.free()
    add.data.update()
    # ---------------------------------------------------------------- mane: lengthen and drape onto the neck
    bm = bmesh.new(); bm.from_mesh(body.data); bvh2 = BVHTree.FromBMesh(bm)
    manes = [r for r in rib if r[0] == 'mane']
    for _, rows, ts, w in manes:
        root = (co[rows[0][0]] + co[rows[0][-1]]) / 2
        if root.y < -1.0:
            continue  # forelock: unchanged
        for row, t in zip(rows, ts):
            if t == 0: continue
            mid0 = sum((co[i] for i in row), Vector()) / len(row)
            mid = root + (mid0 - root) * 1.18
            hit = bvh2.find_nearest(mid)
            if hit[0] is not None:
                loc, nor, _, dist = hit
                off = 0.008 + 0.006 * t
                inside = (mid - loc).dot(nor) < off
                target = loc + nor * off
                k = 1.0 if inside else min(1.0, 0.55 * t + 0.25)
                mid = mid.lerp(target, k * min(1, t * 2.5))
            for i in row:
                me.vertices[i].co = mid + (co[i] - mid0) * (1 - 0.15 * t)
    bm.free()
    me.update()
    print('L4/L5 hair: %d tail ribbons reshaped, %d locks added (%d tris), %d mane ribbons reshaped' % (len(tails), n_add, len(add.data.polygons) * 2, len(manes)))
