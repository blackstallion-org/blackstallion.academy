# Ears + poll (Nov 2026, "Ear Refinement & Perfection"). Works on the refined working copy (never on the master).
# The scan's poll was a second, floating shell (ragged open edge at z = 2.008, 7,652 faces incl. both ears) lying over a coarse, faceted
# dome, so no ear built on it could blend into the skull. This script
#   1  removes that shell and subdivides + smooths the bare dome (Taubin, faded out below the brow),
#   2  cuts a clean elliptical root opening for each ear in the dome,
#   3  grows each ear out of that opening: a lyre centre line (a slight outward bow, then a curl that increases toward the tip until the
#      tips nearly meet), a section with a real wall (rounded rim, cupped front, thick cartilage collar at the base that tapers),
#   4  gives the new vertices the skin weights (Head -> Ear_* -> Ear_Tip_*), coat UVs and the `EarMask` set the coat shader reads,
#   5  moves the Ear / Ear_Tip bones to the new roots and centre lines (orientations kept, so the clips turn the ears as before).
# usage: blender -b --factory-startup -P refine_ears.py -- in.blend out.blend
# env (all optional): EAR_SEP (half distance between the root centres, m, 0.043), EAR_W (half width of the root section 0.028), EAR_D (half depth 0.021),
#   EAR_TIP_Z (tip height 2.205), EAR_GAP (closest distance between the two ears' surfaces near the tips, 0.008), EAR_STEP (ring spacing, 0.0035)
import bpy, bmesh, sys, os, math, random
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
E = lambda k, d: float(os.environ.get(k, d))
SEP, W0, D0 = E('EAR_SEP', 0.045), E('EAR_W', 0.029), E('EAR_D', 0.026)
FU, FN = E('EAR_FU', 0.005), E('EAR_FN', 0.010)      # the root opening is this much wider / deeper than the ear's own section: the difference is the fillet
TIP_Z, GAP, RING_STEP = E('EAR_TIP_Z', 2.205), E('EAR_GAP', 0.008), E('EAR_STEP', 0.0045)
STOP = os.environ.get('EAR_STOP', '')
bpy.ops.wm.open_mainfile(filepath=src)
ob = bpy.data.objects['Marwari_Low']; me = ob.data
arm = bpy.data.objects['MarwariRig']; arm.data.pose_position = 'REST'; bpy.context.view_layer.update()
assert ob.matrix_world.is_identity and arm.matrix_world.is_identity, 'world matrices are expected to be identity'
B = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm.data.bones}
gname = {g.index: g.name for g in ob.vertex_groups}; gindex = {g.name: g.index for g in ob.vertex_groups}

def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

bm = bmesh.new(); bm.from_mesh(me)
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
dl = bm.verts.layers.deform.active
uvl = bm.loops.layers.uv['UVMap']
emk = bm.loops.layers.uv['EarMask']

# ------------------------------------------------------------------ 1. remove the floating poll/ear shell
seen, comps = set(), []
for f in bm.faces:
    if f in seen: continue
    st, c = [f], []; seen.add(f)
    while st:
        g = st.pop(); c.append(g)
        for e in g.edges:
            for h in e.link_faces:
                if h not in seen: seen.add(h); st.append(h)
    comps.append(c)
comps.sort(key=len)
shell = comps[0]
zmin = min(v.co.z for f in shell for v in f.verts)
assert len(comps) == 2 and zmin > 1.99, 'unexpected component layout (%s)' % [len(c) for c in comps]
print('shell removed: %d faces' % len(shell))
bmesh.ops.delete(bm, geom=shell, context='FACES')
for v in [v for v in bm.verts if not v.link_faces]: bm.verts.remove(v)
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

# ------------------------------------------------------------------ 1b. the skull top is boxy (a 20 cm plateau with corners): narrow it toward the crown
SQ = E('POLL_SQUEEZE', 0.13)
zs0 = [v for v in bm.verts if 2.0 < v.co.z < 2.045 and -1.25 < v.co.y < -0.95]
mid0 = 0.5 * (min(v.co.x for v in zs0) + max(v.co.x for v in zs0))
for v in bm.verts:
    k = ss(1.915, 2.035, v.co.z) * (1.0 - ss(-0.97, -0.92, v.co.y))
    if k > 0: v.co.x = mid0 + (v.co.x - mid0) * (1.0 - SQ * k)
print('crown narrowed by %d%% about x = %.4f' % (round(SQ * 100), mid0))
# ------------------------------------------------------------------ 2. subdivide the dome skin once, smooth it
# the head's own weights: the old cap and its boundary vertices were skinned to Ear_L / Ear_R (the cut roots of the scan's ears); the skull
# top must follow the head, so every Ear_* weight on the body skin goes to Head
ear_groups = {gindex[n] for n in ('Ear_L', 'Ear_R', 'Ear_Tip_L', 'Ear_Tip_R')}
moved = 0
for v in bm.verts:
    ew = sum(w for g, w in v[dl].items() if g in ear_groups)
    if ew > 0:
        for g in [g for g in v[dl].keys() if g in ear_groups]: del v[dl][g]
        v[dl][gindex['Head']] = v[dl].get(gindex['Head'], 0.0) + ew; moved += 1
print('Ear_* weights moved to Head on %d body vertices' % moved)
def poll_zone(f):
    c = f.calc_center_median(); return c.z > 1.975 and -1.30 < c.y < -0.93
ids = [f.index for f in bm.faces if poll_zone(f)]
edges = list({e for i in ids for e in bm.faces[i].edges})
bmesh.ops.subdivide_edges(bm, edges=edges, cuts=1, use_grid_fill=True, use_single_edge=False, use_only_quads=False)
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
print('dome skin subdivided: %d faces' % len(bm.faces))
fade = {}
for v in bm.verts:
    k = ss(1.945, 1.995, v.co.z) * (1.0 - ss(-0.97, -0.92, v.co.y))
    if k > 0.01: fade[v] = k
SM = int(E('POLL_SMOOTH', 24))
for _ in range(SM):
    for step in (0.5, -0.53):
        upd = {}
        for v, k in fade.items():
            nb = [e.other_vert(v).co for e in v.link_edges]
            if not nb: continue
            upd[v] = v.co + (sum(nb, Vector()) / len(nb) - v.co) * step * k
        for v, co in upd.items(): v.co = co
print('dome skin smoothed (%d verts, %d passes)' % (len(fade), SM))

# ------------------------------------------------------------------ 3. the flat cap plus a band of skin round it become one crowned patch with two root openings
import numpy as np
from mathutils import geometry as mg
cap = max(bm.faces, key=lambda f: len(f.verts))
assert cap.normal.z > 0.95 and len(cap.verts) >= 38, 'cap face not found'
cap_loop = [l.vert for l in cap.loops]
P_c = np.array([[v.co.x, v.co.y, v.co.z] for v in cap_loop])           # the old cap outline (a flat plateau)
bmesh.ops.delete(bm, geom=[cap], context='FACES_ONLY')
def in_poly(P, x, y):
    inside = False; n = len(P)
    for i in range(n):
        x1, y1, x2, y2 = P[i, 0], P[i, 1], P[(i + 1) % n, 0], P[(i + 1) % n, 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: inside = not inside
    return inside
bm.normal_update()
bvh_pre = BVHTree.FromBMesh(bm)                                         # the skin as it was: the band's own heights
BAND = E('POLL_BAND', 0.024)
def d_cap(x, y): return float(np.hypot(P_c[:, 0] - x, P_c[:, 1] - y).min())
Y_R = E('EAR_Y', -1.094)
MID = mid0                                                              # the crown's own midline, not the opening's bbox centre
CEN = {'L': Vector((MID + SEP, Y_R, 0)), 'R': Vector((MID - SEP, Y_R, 0))}
def n0_of(S): return Vector((S * 0.35, -1.0, 0.0)).normalized()
NR = int(E('EAR_RING_N', 28))
ROOT = {}
for side, S in (('L', 1.0), ('R', -1.0)):
    n0 = n0_of(S); ROOT[side] = dict(S=S, C=CEN[side], n0=n0, u0=Vector((-n0.y, n0.x, 0.0)).normalized(), dirn=1.0)
def ell(side, i, N, ws=0.0, ds=0.0):
    R = ROOT[side]; t = 2 * math.pi * i / N
    p = R['C'] + R['u0'] * ((W0 + FU + ws) * math.cos(t)) + R['n0'] * ((D0 + FN + ds) * math.sin(t))
    return (p.x, p.y)
def in_ell(side, x, y, ws=0.0, ds=0.0):
    R = ROOT[side]; d = Vector((x, y, 0)) - R['C']
    return (d.dot(R['u0']) / (W0 + FU + ws)) ** 2 + (d.dot(R['n0']) / (D0 + FN + ds)) ** 2 <= 1.0
band = [f for f in bm.faces if f.calc_center_median().z > 1.955 and not in_poly(P_c, f.calc_center_median().x, f.calc_center_median().y)
        and d_cap(f.calc_center_median().x, f.calc_center_median().y) < BAND]
RM = E('POLL_RING_MARGIN', 0.016)                                       # skin within this of either root footprint also goes, so the footprints sit well inside the opening
band_set = set(band)
band += [f for f in bm.faces if f not in band_set and f.calc_center_median().z > 1.93
         and any(in_ell(s_, f.calc_center_median().x, f.calc_center_median().y, RM, RM) for s_ in 'LR')]
bmesh.ops.delete(bm, geom=band, context='FACES')
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
# the old cap leaves a scrap of skin (the rim of the old ear roots) hanging off its edge as its own island: remove every face patch
# that is not part of the main skin
def _flood(seed):
    seen = {seed}; st = [seed]
    while st:
        f = st.pop()
        for e in f.edges:
            for g in e.link_faces:
                if g not in seen: seen.add(g); st.append(g)
    return seen
_left = set(bm.faces); _comps = []
while _left:
    _c = _flood(next(iter(_left))); _comps.append(_c); _left -= _c
_comps.sort(key=len, reverse=True)
_scrap = [f for c in _comps[1:] for f in c]
if _scrap:
    print('removed %d scrap faces in %d islands' % (len(_scrap), len(_comps) - 1))
    bmesh.ops.delete(bm, geom=_scrap, context='FACES')
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    _lv = [v for v in bm.verts if not v.link_faces]
    if _lv: bmesh.ops.delete(bm, geom=_lv, context='VERTS')
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
bedges = [e for e in bm.edges if len(e.link_faces) == 1]
adj = {}
for e in bedges:
    a_, b_ = e.verts; adj.setdefault(a_, []).append(b_); adj.setdefault(b_, []).append(a_)
assert all(len(v) == 2 for v in adj.values()), 'the opening is not a simple loop'
start = next(iter(adj)); loop = [start]; prev = None; cur = start
while True:
    nxt = [o for o in adj[cur] if o is not prev]
    nx = nxt[0] if prev is not None or len(nxt) > 0 else None
    if prev is None: nx = adj[cur][0]
    if nx is start: break
    loop.append(nx); prev, cur = cur, nx
    if len(loop) > 2000: raise SystemExit('loop walk failed')
assert len(loop) == len(adj), 'more than one opening (%d of %d verts)' % (len(loop), len(adj))
P_b = np.array([[v.co.x, v.co.y, v.co.z] for v in loop])
nb = len(loop)
# the crown is stitched from separate UV islands (a left half, a right half and a few slivers along the midline): a patch that
# interpolated UVs across them would sample the gutters between islands, so each patch face takes its UVs from ONE island, continued
# from that island's own edge of the opening by a local affine fit
lab = {}
def _uv_of(f, v):
    for l in f.loops:
        if l.vert is v: return l[uvl].uv
nisl = 0
for f0 in bm.faces:
    if f0 in lab: continue
    nisl += 1; lab[f0] = nisl; st_ = [f0]
    while st_:
        f = st_.pop()
        for e in f.edges:
            if len(e.link_faces) != 2: continue
            g = e.link_faces[0] if e.link_faces[1] is f else e.link_faces[1]
            if g in lab: continue
            a_, b_ = e.verts
            if (_uv_of(f, a_) - _uv_of(g, a_)).length < 2e-5 and (_uv_of(f, b_) - _uv_of(g, b_)).length < 2e-5: lab[g] = nisl; st_.append(g)
isl_samples = {}                                   # island -> {vertex: uv} on the opening's edge
for e in bm.edges:
    if len(e.link_faces) == 1:
        f = e.link_faces[0]
        for v in e.verts: isl_samples.setdefault(lab[f], {})[v] = _uv_of(f, v).copy()
big = sorted(isl_samples, key=lambda k: -len(isl_samples[k]))[:2]
assert len(big) == 2, 'expected a left and a right island round the crown'
mean_x = {k: np.mean([v.co.x for v in isl_samples[k]]) for k in big}
ISL = {'R': min(big, key=lambda k: mean_x[k]), 'L': max(big, key=lambda k: mean_x[k])}
print('crown UV islands: R %d (%d boundary verts), L %d (%d), %d others' % (ISL['R'], len(isl_samples[ISL['R']]), ISL['L'], len(isl_samples[ISL['L']]), len(isl_samples) - 2))
ISL_PTS = {s_: (np.array([[v.co.x, v.co.y] for v in isl_samples[ISL[s_]]]), np.array([u[:] for u in isl_samples[ISL[s_]].values()])) for s_ in 'LR'}
def uv_fit(side, x, y, K=14):
    P2, U2 = ISL_PTS[side]
    d = np.hypot(P2[:, 0] - x, P2[:, 1] - y); idx = np.argsort(d)[:K]
    w = 1.0 / (d[idx] ** 2 + 2.5e-5)
    A = np.column_stack([np.ones(len(idx)), P2[idx, 0] - x, P2[idx, 1] - y]); Wm = np.sqrt(w)[:, None]
    lam = np.diag([0.0, 1e-6, 1e-6])
    sol = np.linalg.solve((A * Wm).T @ (A * Wm) + lam, (A * Wm).T @ (U2[idx] * Wm))
    return tuple(sol[0])
UV_REACH = E('POLL_UV_REACH', 0.04)
def uv_patch(side, x, y):
    """UV for a patch point: the island's own mapping continued smoothly past the opening's edge (a local affine fit), but only a short way
    (the mapping freezes beyond POLL_UV_REACH) and never out of the atlas (clamped, so nothing wraps round to the opposite border)"""
    P2, U2 = ISL_PTS[side]
    d = np.hypot(P2[:, 0] - x, P2[:, 1] - y); j = int(np.argmin(d)); dm = float(d[j])
    if dm < 1e-7: return tuple(U2[j])
    uvf = np.array(uv_fit(side, x, y)); uv = U2[j] + (uvf - U2[j]) * (min(dm, UV_REACH) / dm)
    return (float(min(0.996, max(0.004, uv[0]))), float(min(0.996, max(0.004, uv[1]))))
Y_R = E('EAR_Y', -1.094)
MID = mid0                                                              # the crown's own midline, not the opening's bbox centre
CEN = {'L': Vector((MID + SEP, Y_R, 0)), 'R': Vector((MID - SEP, Y_R, 0))}
def n0_of(S): return Vector((S * 0.35, -1.0, 0.0)).normalized()
NR = int(E('EAR_RING_N', 28))
ROOT = {}
for side, S in (('L', 1.0), ('R', -1.0)):
    n0 = n0_of(S); ROOT[side] = dict(S=S, C=CEN[side], n0=n0, u0=Vector((-n0.y, n0.x, 0.0)).normalized(), dirn=1.0)
def ell(side, i, N, ws=0.0, ds=0.0):
    R = ROOT[side]; t = 2 * math.pi * i / N
    p = R['C'] + R['u0'] * ((W0 + FU + ws) * math.cos(t)) + R['n0'] * ((D0 + FN + ds) * math.sin(t))
    return (p.x, p.y)
def in_ell(side, x, y, ws=0.0, ds=0.0):
    R = ROOT[side]; d = Vector((x, y, 0)) - R['C']
    return (d.dot(R['u0']) / (W0 + FU + ws)) ** 2 + (d.dot(R['n0']) / (D0 + FN + ds)) ** 2 <= 1.0
band = [f for f in bm.faces if f.calc_center_median().z > 1.955 and not in_poly(P_c, f.calc_center_median().x, f.calc_center_median().y)
        and d_cap(f.calc_center_median().x, f.calc_center_median().y) < BAND]
RM = E('POLL_RING_MARGIN', 0.016)                                       # skin within this of either root footprint also goes, so the footprints sit well inside the opening
band_set = set(band)
band += [f for f in bm.faces if f not in band_set and f.calc_center_median().z > 1.93
         and any(in_ell(s_, f.calc_center_median().x, f.calc_center_median().y, RM, RM) for s_ in 'LR')]
bmesh.ops.delete(bm, geom=band, context='FACES')
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
# the old cap leaves a scrap of skin (the rim of the old ear roots) hanging off its edge as its own island: remove every face patch
# that is not part of the main skin
def _flood(seed):
    seen = {seed}; st = [seed]
    while st:
        f = st.pop()
        for e in f.edges:
            for g in e.link_faces:
                if g not in seen: seen.add(g); st.append(g)
    return seen
_left = set(bm.faces); _comps = []
while _left:
    _c = _flood(next(iter(_left))); _comps.append(_c); _left -= _c
_comps.sort(key=len, reverse=True)
_scrap = [f for c in _comps[1:] for f in c]
if _scrap:
    print('removed %d scrap faces in %d islands' % (len(_scrap), len(_comps) - 1))
    bmesh.ops.delete(bm, geom=_scrap, context='FACES')
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    _lv = [v for v in bm.verts if not v.link_faces]
    if _lv: bmesh.ops.delete(bm, geom=_lv, context='VERTS')
    bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
bedges = [e for e in bm.edges if len(e.link_faces) == 1]
adj = {}
for e in bedges:
    a_, b_ = e.verts; adj.setdefault(a_, []).append(b_); adj.setdefault(b_, []).append(a_)
assert all(len(v) == 2 for v in adj.values()), 'the opening is not a simple loop'
start = next(iter(adj)); loop = [start]; prev = None; cur = start
while True:
    nxt = [o for o in adj[cur] if o is not prev]
    nx = nxt[0] if prev is not None or len(nxt) > 0 else None
    if prev is None: nx = adj[cur][0]
    if nx is start: break
    loop.append(nx); prev, cur = cur, nx
    if len(loop) > 2000: raise SystemExit('loop walk failed')
assert len(loop) == len(adj), 'more than one opening (%d of %d verts)' % (len(loop), len(adj))
P_b = np.array([[v.co.x, v.co.y, v.co.z] for v in loop])
nb = len(loop)
# the crown is stitched from separate UV islands (a left half, a right half and a few slivers along the midline): a patch that
# interpolated UVs across them would sample the gutters between islands, so each patch face takes its UVs from ONE island, continued
# from that island's own edge of the opening by a local affine fit
lab = {}
def _uv_of(f, v):
    for l in f.loops:
        if l.vert is v: return l[uvl].uv
nisl = 0
for f0 in bm.faces:
    if f0 in lab: continue
    nisl += 1; lab[f0] = nisl; st_ = [f0]
    while st_:
        f = st_.pop()
        for e in f.edges:
            if len(e.link_faces) != 2: continue
            g = e.link_faces[0] if e.link_faces[1] is f else e.link_faces[1]
            if g in lab: continue
            a_, b_ = e.verts
            if (_uv_of(f, a_) - _uv_of(g, a_)).length < 2e-5 and (_uv_of(f, b_) - _uv_of(g, b_)).length < 2e-5: lab[g] = nisl; st_.append(g)
isl_samples = {}                                   # island -> {vertex: uv} on the opening's edge
for e in bm.edges:
    if len(e.link_faces) == 1:
        f = e.link_faces[0]
        for v in e.verts: isl_samples.setdefault(lab[f], {})[v] = _uv_of(f, v).copy()
big = sorted(isl_samples, key=lambda k: -len(isl_samples[k]))[:2]
assert len(big) == 2, 'expected a left and a right island round the crown'
mean_x = {k: np.mean([v.co.x for v in isl_samples[k]]) for k in big}
ISL = {'R': min(big, key=lambda k: mean_x[k]), 'L': max(big, key=lambda k: mean_x[k])}
print('crown UV islands: R %d (%d boundary verts), L %d (%d), %d others' % (ISL['R'], len(isl_samples[ISL['R']]), ISL['L'], len(isl_samples[ISL['L']]), len(isl_samples) - 2))
ISL_PTS = {s_: (np.array([[v.co.x, v.co.y] for v in isl_samples[ISL[s_]]]), np.array([u[:] for u in isl_samples[ISL[s_]].values()])) for s_ in 'LR'}
def uv_fit(side, x, y, K=14):
    P2, U2 = ISL_PTS[side]
    d = np.hypot(P2[:, 0] - x, P2[:, 1] - y); idx = np.argsort(d)[:K]
    w = 1.0 / (d[idx] ** 2 + 2.5e-5)
    A = np.column_stack([np.ones(len(idx)), P2[idx, 0] - x, P2[idx, 1] - y]); Wm = np.sqrt(w)[:, None]
    lam = np.diag([0.0, 1e-6, 1e-6])
    sol = np.linalg.solve((A * Wm).T @ (A * Wm) + lam, (A * Wm).T @ (U2[idx] * Wm))
    return tuple(sol[0])
UV_FOLD = E('POLL_UV_FOLD', 0.018)
def uv_patch(side, x, y):
    """UV for a patch point: the island's own texture folded back across the opening's edge (mirror repeat), so it never leaves the island
    into the atlas border, the gutters or the wrap-around"""
    P2, U2 = ISL_PTS[side]
    d = np.hypot(P2[:, 0] - x, P2[:, 1] - y); j = int(np.argmin(d)); dm = float(d[j])
    if dm < 1e-7: return tuple(U2[j])
    L = UV_FOLD
    fold = L - abs((dm % (2 * L)) - L)
    uvf = np.array(uv_fit(side, x, y)); uv = U2[j] - (uvf - U2[j]) * (fold / dm)
    return (float(min(0.997, max(0.003, uv[0]))), float(min(0.997, max(0.003, uv[1]))))
print('crown opening: %d band faces removed, boundary %d verts, x %.3f..%.3f, z %.3f..%.3f' % (len(band), nb, P_b[:, 0].min(), P_b[:, 0].max(), P_b[:, 2].min(), P_b[:, 2].max()))
CROWN = E('POLL_CROWN', 0.011)
def z_idw(P, x, y):
    d = np.hypot(P[:, 0] - x, P[:, 1] - y); w = 1.0 / (d ** 3 + 1e-12)
    return float((w * P[:, 2]).sum() / w.sum()), float(d.min())
def dome_z(x, y):
    if in_poly(P_c, x, y):
        z0, _ = z_idw(P_c, x, y); k = min(1.0, d_cap(x, y) / 0.075)
        return z0 + CROWN * 0.5 * (1 - math.cos(math.pi * k))
    h = bvh_pre.ray_cast(Vector((x, y, 2.3)), Vector((0, 0, -1)), 0.5)
    if h[0] is not None and h[0].z > 1.95: return h[0].z
    return z_idw(P_b, x, y)[0]
pts = [(P_b[i, 0], P_b[i, 1]) for i in range(nb)]
ring_idx = {}
for side in 'LR':
    ring_idx[side] = []
    for i in range(NR): ring_idx[side].append(len(pts)); pts.append(ell(side, i, NR))
for side in 'LR':
    for i in range(NR): pts.append(ell(side, i, NR, 0.005, 0.005))
H_SP = E('POLL_STEP', 0.0065)
xs, ys = P_b[:, 0], P_b[:, 1]; cnt = 0; j = 0; y = ys.min() + H_SP * 0.5
while y < ys.max():
    x = xs.min() + (H_SP * 0.5 if j % 2 else 0.0)
    while x < xs.max():
        if in_poly(P_b, x, y) and float(np.hypot(P_b[:, 0] - x, P_b[:, 1] - y).min()) > 0.6 * H_SP and not any(in_ell(s_, x, y, 0.0105, 0.0105) for s_ in 'LR'):
            pts.append((x, y)); cnt += 1
        x += H_SP
    y += H_SP * 0.866; j += 1
print('patch points: %d boundary, %d per root ring, %d interior' % (nb, NR, cnt))
edges_in = [(i, (i + 1) % nb) for i in range(nb)]
for side in 'LR': edges_in += [(ring_idx[side][i], ring_idx[side][(i + 1) % NR]) for i in range(NR)]
out = mg.delaunay_2d_cdt([Vector(p) for p in pts], edges_in, [list(range(nb))], 1, 1e-7)
vco, tri, orig_v = out[0], out[2], out[3]
print('CDT: %d verts, %d triangles; vertices without an input vertex: %d' % (len(vco), len(tri), sum(1 for ol in orig_v if not ol)))
assert all(orig_v[k] for k in range(len(vco))), 'constraint edges cross (a root ring leaves the opening)'
bverts = [None] * len(vco)
for k, ol in enumerate(orig_v):
    i = ol[0]
    if i < nb: bverts[k] = loop[i]
    else:
        x, y = vco[k].x, vco[k].y
        v = bm.verts.new(Vector((x, y, dome_z(x, y)))); bverts[k] = v
        d = np.hypot(P_b[:, 0] - x, P_b[:, 1] - y); order = np.argsort(d)[:5]; acc = {}
        for q in order:
            for g, w in loop[q][dl].items(): acc[g] = acc.get(g, 0.0) + w / max(d[q], 1e-4)
        tot = sum(acc.values())
        for g, w in acc.items(): v[dl][g] = w / tot
ringv = {s_: [None] * NR for s_ in 'LR'}
for k, ol in enumerate(orig_v):
    for i in ol:
        for s_ in 'LR':
            if i in ring_idx[s_]: ringv[s_][ring_idx[s_].index(i)] = bverts[k]
for s_ in 'LR': assert all(v is not None for v in ringv[s_]), 'ring vertex missing'
def in_ring_poly(side, x, y):
    ps = [(v.co.x, v.co.y) for v in ringv[side]]; inside = False; n = len(ps)
    for i in range(n):
        x1, y1 = ps[i]; x2, y2 = ps[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: inside = not inside
    return inside
patch = []
for t in tri:
    a_, b_, c_ = [bverts[i] for i in t]
    cx = sum(vco[i].x for i in t) / 3; cy = sum(vco[i].y for i in t) / 3
    if any(in_ring_poly(s_, cx, cy) for s_ in 'LR'): continue
    if (b_.co - a_.co).cross(c_.co - a_.co).z < 0: b_, c_ = c_, b_
    try: f = bm.faces.new((a_, b_, c_)); f.smooth = True; patch.append(f)
    except ValueError: pass
print('patch faces:', len(patch))
for f in patch:
    cx_ = sum(l.vert.co.x for l in f.loops) / 3
    sd = 'L' if cx_ > MID else 'R'
    for lp in f.loops:
        known = isl_samples[ISL[sd]].get(lp.vert)
        lp[uvl].uv = tuple(known) if known is not None else uv_patch(sd, lp.vert.co.x, lp.vert.co.y)
for s_ in 'LR':
    R = ROOT[s_]; R['ring'] = ringv[s_]
    R['uv'] = [uv_patch(s_, v.co.x, v.co.y) for v in R['ring']]
    R['w'] = [{gname[g]: w for g, w in v[dl].items()} for v in R['ring']]
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
# second smoothing pass over the crown, patch and skin together (the root rings take part): rounds the corners and the shelf where the patch meets the skin
fade2 = {v: ss(1.975, 2.03, v.co.z) * (1.0 - ss(-0.97, -0.92, v.co.y)) for v in bm.verts if v.co.z > 1.975}
fade2 = {v: k for v, k in fade2.items() if k > 0.01}
SM2 = int(E('POLL_SMOOTH2', 40))
for _ in range(SM2):
    for step in (0.5, -0.53):
        upd = {}
        for v, k in fade2.items():
            nbv = [e.other_vert(v).co for e in v.link_edges]
            if nbv: upd[v] = v.co + (sum(nbv, Vector()) / len(nbv) - v.co) * step * k
        for v, co in upd.items(): v.co = co
print('crown smoothed again (%d verts, %d passes)' % (len(fade2), SM2))
bm.normal_update()
print('roots ready; ring sizes', {s_: len(ROOT[s_]['ring']) for s_ in 'LR'})
if STOP == 'roots':
    bm.to_mesh(me); me.update(); bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True); raise SystemExit
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'refine_ears_loft.py')).read())
