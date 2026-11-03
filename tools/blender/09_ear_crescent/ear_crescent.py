# Marwari ear crescent (Phase 11, 3 Nov 2026).
# The canonical Marwari's ears were scan tubes ("horns"). This script replaces each ear on the low coat mesh with the breed's
# crescent: a broad base that tapers to a blunt rounded tip, a centre line that curls inward until the tips nearly meet (with a
# small forward lean), a smooth convex back, and a front that is a real cup with a raised rim.
#
#   1. The old ear is traced (its centre line, up the hook at the tip) and cut off at its root: the faces inside a short cylinder
#      round that line are deleted, which leaves one closed ring of vertices where the ear met the head.
#   2. The new ear is lofted straight off that ring (so it is welded to the head, with no seam): ring 0 is the head's own vertices,
#      each following ring blends from the root's shape into the kidney-shaped cross-section (convex back, cupped front,
#      tapering). The tip is closed with a rounded cap.
#   3. Skin weights run from the root's own weights up into Ear_* and Ear_Tip_*; the Ear_Tip_* joints are moved onto the new
#      centre line (their orientation is kept, so the existing clips still turn the ears about the same axes). A second UV layer,
#      `EarMask` (exported as TEXCOORD_1, v flipped by the exporter), carries for the runtime shader: u = cup depth 0..1, v = 0 off
#      the ear, 0.5 on the ear, up to 1 along the rim hairs. The ear's coat UVs continue from the root's coordinates. The old skin
#      round each root is smoothed so the ear grows out of the head without a boss.
#
# usage: blender -b --factory-startup -P ear_crescent.py -- <in.blend> <out.blend>
#   in = the master before ear_cup.py (tools/blender/source/*.pre-ears-2026-11-02.blend, kept out of git), out = the updated master.
#   env: EAR_LEN (arc length from the root, m, default 0.17), EAR_TIP_X (tip centre's distance from the pair's midline, 0.011),
#        EAR_CUT (root cylinder radius, 0.036), EAR_STEP (ring spacing, 0.0035), EAR_BLEND (root blend, 0.45), EAR_SKIRT (edges of old
#        skin smoothed round the root, 9), EAR_H (tip height above the roots, 0.145), EAR_DEBUG=1 prints the root ring
import bpy, bmesh, sys, os, math, random
from mathutils import Vector
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
ARC = float(os.environ.get('EAR_LEN', '0.17'))
TIP_X = float(os.environ.get('EAR_TIP_X', '0.011'))
R_CUT = float(os.environ.get('EAR_CUT', '0.036'))
RING_STEP = float(os.environ.get('EAR_STEP', '0.0035'))
CUP_A = float(os.environ.get('EAR_CUP_A', '0.14'))
CUP_B = float(os.environ.get('EAR_CUP_B', '0.46'))
SMOOTH = int(os.environ.get('EAR_SMOOTH', '14'))
bpy.ops.wm.open_mainfile(filepath=src)
ob = bpy.data.objects['Marwari_Low']
arm = bpy.data.objects['MarwariRig']
arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
mw, mwi = ob.matrix_world, ob.matrix_world.inverted()
B = {b.name: (arm.matrix_world @ b.head_local, arm.matrix_world @ b.tail_local) for b in arm.data.bones}
gname = {g.index: g.name for g in ob.vertex_groups}
gindex = {g.name: g.index for g in ob.vertex_groups}
rng = random.Random(11)


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def trace_centerline(P, c, T, step=0.004, slab=0.007, rmax=0.03):
    """March up the old ear tube: at each step recentre on the vertices in a thin slab perpendicular to the heading."""
    pts, tans = [c.copy()], [T.copy()]
    for _ in range(80):
        c1 = c + T * step
        sel = [p for p in P if abs((p - c1).dot(T)) < slab and ((p - c1) - T * (p - c1).dot(T)).length < rmax]
        if len(sel) < 5:
            break
        cen = sum(sel, Vector()) / len(sel)
        d = cen - c1
        cen_perp = c1 + d - T * d.dot(T)
        newT = cen_perp - c
        if newT.length < step * 0.4:
            break
        newT.normalize()
        T = (T * 0.55 + newT * 0.45).normalized()
        c = cen_perp
        pts.append(c.copy()); tans.append(T.copy())
    return pts, tans


me = ob.data
P_world = [mw @ v.co for v in me.vertices]


def ear_w(v, side):
    return sum(g.weight for g in v.groups if gname.get(g.group) in ('Ear_' + side, 'Ear_Tip_' + side))


info = {}
for side, S in (('L', 1.0), ('R', -1.0)):
    h0, h1 = B['Ear_' + side]
    ax = (B['Ear_Tip_' + side][1] - h0).normalized()
    core = [i for i, v in enumerate(me.vertices) if ear_w(v, side) >= 0.25 and (P_world[i] - h0).dot(ax) >= 0.0]
    start = [P_world[i] for i in core if 0.068 <= (P_world[i] - h0).dot(ax) <= 0.082 and ear_w(me.vertices[i], side) >= 0.35]
    c0 = sum(start, Vector()) / len(start)
    c0 = c0 - ax * ax.dot(c0 - (h0 + ax * 0.075))
    pts, tans = trace_centerline([P_world[i] for i in core if (P_world[i] - h0).dot(ax) >= 0.06 and ear_w(me.vertices[i], side) >= 0.35], c0, ax)
    nb = int(0.075 / 0.004)
    full = [c0 - ax * 0.004 * k for k in range(nb, 0, -1)] + pts       # straight back into the head so the whole root is covered
    info[side] = dict(S=S, h0=h0, ax=ax, core=core, pts=full, c0=c0, k0=nb)
    print('EAR', side, 'old line:', len(pts), 'samples above the slab', tuple(round(x, 3) for x in c0), '-> tip', tuple(round(x, 3) for x in pts[-1]))

# ------------------------------------------------------------------ 1. cut the old ears off at the root
bm = bmesh.new()
bm.from_mesh(me)
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
dl = bm.verts.layers.deform.active
uvl = bm.loops.layers.uv['UVMap']
cut = {}
for side in 'LR':
    E = info[side]
    tree = KDTree(len(E['pts'])); [tree.insert(p, i) for i, p in enumerate(E['pts'])]; tree.balance()
    inside = set()
    for i in E['core']:
        _, k, d = tree.find(P_world[i])
        if d <= R_CUT or (k >= E['k0'] + 3 and d <= R_CUT * 1.3):     # the tube's body can be a little wider than the root cylinder
            inside.add(i)
    faces = [f for f in bm.faces if all(v.index in inside for v in f.verts)]
    face_set = set(faces)
    # keep only the biggest connected patch (the ear itself), and fill any hole inside it, so the cut has one clean boundary
    comps, seen = [], set()
    for f in faces:
        if f in seen:
            continue
        stack, comp = [f], []
        seen.add(f)
        while stack:
            g = stack.pop(); comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h in face_set and h not in seen:
                        seen.add(h); stack.append(h)
        comps.append(comp)
    faces = max(comps, key=len)
    face_set = set(faces)
    for _ in range(3):                                                  # absorb faces enclosed on (nearly) all sides
        grow = [f for f in bm.faces if f not in face_set and sum(1 for e in f.edges for h in e.link_faces if h is not f and h in face_set) >= max(2, len(f.edges) - 0)]
        if not grow:
            break
        faces += grow; face_set.update(grow)
    rim = set(v.index for f in faces for v in f.verts if any(lf not in face_set for lf in v.link_faces))
    nxt = {}                                                           # kept face goes a -> b along each boundary edge
    for e in bm.edges:
        a, b = e.verts
        if a.index in rim and b.index in rim and any(f in face_set for f in e.link_faces) and any(f not in face_set for f in e.link_faces):
            kf = [f for f in e.link_faces if f not in face_set][0]
            for lp in kf.loops:
                if lp.edge is e:
                    nxt[lp.vert.index] = lp.link_loop_next.vert.index
    prev = {b: a for a, b in nxt.items()}
    start_v = next(iter(prev))
    ring = [start_v]
    cur = prev[start_v]
    while cur is not None and cur != start_v and len(ring) < 400:
        ring.append(cur)
        cur = prev.get(cur)
    print('EAR', side, 'faces cut', len(faces), 'boundary edges', len(nxt), 'ring', len(ring), 'closed' if cur == start_v else 'NOT CLOSED')
    if cur != start_v:
        raise SystemExit('root ring is not a single closed loop; adjust EAR_CUT')
    verts = [bm.verts[vi] for vi in ring]
    data = []
    for bv in verts:
        uv = next((lf[uvl].uv.copy() for lf in bv.link_loops if lf.face not in face_set), None)
        data.append(dict(v=bv, co=mw @ bv.co, w={gname[g]: w for g, w in bv[dl].items()}, uv=uv if uv is not None else (0.5, 0.5)))
    cut[side] = dict(faces=faces, data=data)
for side in 'LR':
    bmesh.ops.delete(bm, geom=cut[side]['faces'], context='FACES')

# ------------------------------------------------------------------ 2. loft the new ears off the root rings
mid_x = 0.5 * sum(sum(d['co'].x for d in cut[s]['data']) / len(cut[s]['data']) for s in 'LR')
print('EAR midline x %.3f' % mid_x)
NS = 240


def make_spine(base, arc, e_up, e_in, e_fw):
    def spine(gamma_end, psi, curl_pow=1.45):
        P, T = [base.copy()], [e_up.copy()]
        c = base.copy()
        for k in range(1, NS + 1):
            g = gamma_end * (k / NS) ** curl_pow
            dirv = (e_up * math.cos(g) + (e_in * math.cos(psi) + e_fw * math.sin(psi)) * math.sin(g)).normalized()
            c = c + dirv * (arc / NS)
            P.append(c.copy()); T.append(dirv)
        return P, T
    return spine


ROOT_Z = sum(sum(d['co'].z for d in cut[s_]['data']) / len(cut[s_]['data']) for s_ in 'LR') / 2
ZT = ROOT_Z + float(os.environ.get('EAR_H', '0.145'))
print('EAR target tip height z=%.3f (root z=%.3f)' % (ZT, ROOT_Z))
NEW = {}
for side, S in (('L', 1.0), ('R', -1.0)):
    E = info[side]
    data = cut[side]['data']
    ring_w = [d['co'] for d in data]
    N = len(ring_w)
    cen = sum(ring_w, Vector()) / N
    n0 = Vector((S * 0.35, -1.0, 0.0)).normalized()                    # the cup opens forward and outward
    jitter = rng.uniform(-1, 1)
    e_up = ((E['c0'] - cen).normalized() * 0.4 + E['ax'] * 0.6).normalized()
    e_in = Vector((-S, 0.0, 0.0)); e_in = (e_in - e_up * e_in.dot(e_up)).normalized()                       # toward the midline
    e_fw = Vector((0.0, -1.0, 0.0)); e_fw = e_fw - e_up * e_fw.dot(e_up); e_fw = (e_fw - e_in * e_fw.dot(e_in)).normalized()
    psi = 0.30 + 0.06 * jitter
    z_tip = ZT - (0.0 if side == 'L' else 0.0)

    def solve(arc_):
        sp = make_spine(cen, arc_, e_up, e_in, e_fw)
        lo, hi = 0.15, math.radians(88)
        for _ in range(36):                                             # curl until the tip centre is TIP_X from the midline
            mid = 0.5 * (lo + hi)
            if S * (sp(mid, psi)[0][-1].x - mid_x) > TIP_X:
                lo = mid
            else:
                hi = mid
        g = 0.5 * (lo + hi)
        return sp, g, sp(g, psi)[0][-1].z

    a_lo, a_hi = 0.10, 0.26
    for _ in range(24):                                                 # and lengthen or shorten the ear until both reach the same height
        a_mid = 0.5 * (a_lo + a_hi)
        if solve(a_mid)[2] < z_tip:
            a_lo = a_mid
        else:
            a_hi = a_mid
    arc = 0.5 * (a_lo + a_hi)
    spine, gamma_end, _z = solve(arc)
    P, T = spine(gamma_end, psi)
    print('EAR', side, 'root centre', tuple(round(x, 3) for x in cen), 'curl %.1f deg' % math.degrees(gamma_end), 'tip centre', tuple(round(x, 3) for x in P[-1]), 'height above root %.3f' % (P[-1].z - cen.z))
    twist = math.radians(3.0 * jitter)
    nf = []
    for Tk in T:
        n = (n0 - Tk * n0.dot(Tk)).normalized()
        n = (n * math.cos(twist) + Tk.cross(n) * math.sin(twist)).normalized()
        nf.append((Tk, n))

    def sample(tau):
        f = max(0.0, min(1.0, tau)) * NS
        i = min(NS - 1, int(f)); w = f - i
        c = P[i].lerp(P[i + 1], w)
        Tk = nf[i][0].lerp(nf[i + 1][0], w).normalized()
        n = nf[i][1].lerp(nf[i + 1][1], w); n = (n - Tk * n.dot(Tk)).normalized()
        return c, Tk, n, Tk.cross(n)

    c_b, T_b, n_b, u_b = sample(0.0)
    A = [(r - c_b).dot(u_b) for r in ring_w]; Bn = [(r - c_b).dot(n_b) for r in ring_w]; H = [(r - c_b).dot(T_b) for r in ring_w]
    W_root = 0.5 * (max(A) - min(A)); D_root = 0.5 * (max(Bn) - min(Bn))
    W0 = 0.030 + 0.001 * jitter; D0 = 0.0175 - 0.0008 * jitter
    print('EAR', side, 'root ring: %d verts, width %.3f depth %.3f, height %.3f..%.3f' % (N, 2 * W_root, 2 * D_root, min(H), max(H)))
    ca = 0.5 * (max(A) + min(A)); cb = 0.5 * (max(Bn) + min(Bn))
    if os.environ.get('EAR_DEBUG'):
        for i in range(N):
            print('RING', side, i, 'a %+.3f b %+.3f h %+.3f' % (A[i], Bn[i], H[i]), tuple(round(x, 3) for x in ring_w[i]))
    th = [math.atan2((Bn[i] - cb) / max(D_root, 1e-3), (A[i] - ca) / max(W_root, 1e-3)) for i in range(N)]
    for i in range(1, N):                                               # unwrap, then force a strictly monotone angle round the ring
        while th[i] < th[i - 1] - math.pi:
            th[i] += 2 * math.pi
        while th[i] > th[i - 1] + math.pi:
            th[i] -= 2 * math.pi
    dirn = 1.0 if th[-1] >= th[0] else -1.0
    for i in range(1, N):
        if dirn * (th[i] - th[i - 1]) < 1e-3:
            th[i] = th[i - 1] + dirn * 1e-3
    tip_scale = (0.30, 0.40)

    def prof(tau):
        fw = tip_scale[0] + (1 - tip_scale[0]) * max(0.0, 1 - tau ** 2.2) ** 0.7
        fd = tip_scale[1] + (1 - tip_scale[1]) * max(0.0, 1 - tau ** 1.6) ** 0.5
        cup = 0.90 * ss(CUP_A, CUP_B, tau) * (1 - 0.45 * ss(0.75, 1.0, tau))
        return W0 * fw, D0 * fd, cup

    def kidney(theta, W, D, cup):
        sn = math.sin(theta)
        if sn < 0:
            return W * math.cos(theta), D * sn
        lip = 0.28 * D * cup * math.exp(-((sn - 0.22) / 0.13) ** 2)      # the raised rim round the opening
        return W * math.cos(theta), D * sn * (1 - 2.2 * cup * sn) + lip

    tipj = B['Ear_Tip_' + side][0]
    tau_j = max(0.30, min(0.50, min(range(NS + 1), key=lambda i: (P[i] - tipj).length) / NS))
    K = max(12, int(arc / RING_STEP))
    blend = float(os.environ.get('EAR_BLEND', '0.45'))
    # above the root the rings carry twice the root's vertex count (a midpoint between every pair), and their angles relax from the
    # root's uneven spacing to an even one, so the cup and its rim have vertices to be drawn with
    double = N < 40                                                    # the denser anatomy coat already has the vertices it needs
    N2 = 2 * N if double else N
    th_ext = th + [th[0] + dirn * 2 * math.pi]
    th2 = []; A2 = []; B2 = []; H2 = []; src2 = []
    for i in range(N):
        j = (i + 1) % N
        th2.append(th_ext[i]); A2.append(A[i]); B2.append(Bn[i]); H2.append(H[i]); src2.append(i)
        if double:
            th2.append(0.5 * (th_ext[i] + th_ext[i + 1])); A2.append(0.5 * (A[i] + A[j])); B2.append(0.5 * (Bn[i] + Bn[j])); H2.append(0.5 * (H[i] + H[j])); src2.append(i)
    th_even = [th2[0] + dirn * 2 * math.pi * m / N2 for m in range(N2)]
    rings = [[d['v'] for d in data]]
    taus = [0.0]
    for k in range(1, K + 1):
        tau = k / K
        c, Tk, n, u = sample(tau)
        Wn, Dn, cup = prof(tau)
        lam = ss(0.0, blend, tau)
        mu = ss(0.02, blend, tau)
        ring = []
        for m in range(N2):
            ax_, bx_ = kidney(lerp(th2[m], th_even[m], mu), Wn, Dn, cup)
            off = (u * A2[m] + n * B2[m]) * (1 - lam) + (u * ax_ + n * bx_) * lam
            pos = c + off + Tk * (H2[m] * (1 - ss(0.0, blend * 0.9, tau)))
            ring.append(bm.verts.new(mwi @ pos))
        rings.append(ring); taus.append(tau)
    c1, T1, n1, u1 = sample(1.0)
    Wt, Dt, _ = prof(1.0)
    apex = bm.verts.new(mwi @ (c1 + T1 * 0.55 * (Wt + Dt)))
    faces_new = []

    def add(*vs):
        try:
            faces_new.append(bm.faces.new(vs))
        except ValueError:
            pass
    r0, r1 = rings[0], rings[1]
    for i in range(N):
        j = (i + 1) % N
        if double:
            add(r0[i], r0[j], r1[2 * i + 1])
            add(r0[j], r1[(2 * j) % N2], r1[2 * i + 1])
            add(r0[i], r1[2 * i + 1], r1[2 * i])
        else:
            add(r0[i], r0[j], r1[j], r1[i])
    for k in range(1, len(rings) - 1):
        ra, rb = rings[k], rings[k + 1]
        for m in range(N2):
            q = (m + 1) % N2
            add(ra[m], ra[q], rb[q], rb[m])
    for m in range(N2):
        add(rings[-1][m], rings[-1][(m + 1) % N2], apex)
    for f in faces_new:
        f.smooth = True
    NEW[side] = dict(rings=rings, taus=taus, apex=apex, th=th_even, th2=th2, src2=src2, tau_j=tau_j, data=data, N=N, N2=N2, P=P, prof=prof, faces=faces_new, c=[sample(t)[0] for t in taus])
    print('EAR', side, 'lofted', len(rings) - 1, 'rings x', N, '=', len(faces_new), 'faces; tip-bone joint at tau %.2f' % tau_j)

# smooth the root: Taubin smoothing (shrink, then un-shrink) over the first rings, fading to nothing, so the transition from the
# head's tilted ring to the ear's own section has no folds; ring 0 (the head's own vertices) stays put
for side in 'LR':
    NI = NEW[side]
    m_rings = max(3, int(0.50 * (len(NI['rings']) - 1)))
    verts, fac = [], {}
    for k in range(1, m_rings + 1):
        for v in NI['rings'][k]:
            verts.append(v); fac[v] = 1.0 - (k - 1) / m_rings
    for _ in range(SMOOTH):
        for step in (0.55, -0.58):
            upd = {}
            for v in verts:
                nb = [e.other_vert(v) for e in v.link_edges]
                avg = sum((n_.co for n_ in nb), Vector()) / len(nb)
                upd[v] = v.co + (avg - v.co) * step * fac[v]
            for v, co in upd.items():
                v.co = co

# the old skin round each root (a scan's flange of the ear base) is smoothed too, fading out over a few edges, so the root does not
# sit on a boss; ring 0 itself stays put
SKIRT = int(os.environ.get('EAR_SKIRT', '9'))
for side in 'LR':
    NI = NEW[side]
    ring0 = set(d['v'] for d in NI['data'])
    new_verts = set(v for r in NI['rings'][1:] for v in r) | {NI['apex']}
    depth = {v: 0 for v in ring0}
    frontier = list(ring0)
    for dpt in range(1, SKIRT + 1):
        nxt_f = []
        for v in frontier:
            for e in v.link_edges:
                o = e.other_vert(v)
                if o not in depth and o not in new_verts:
                    depth[o] = dpt; nxt_f.append(o)
        frontier = nxt_f
    skirt = [v for v, d_ in depth.items() if d_ > 0]
    fac = {v: 1.0 - (depth[v] - 1) / SKIRT for v in skirt}
    for _ in range(12):
        for step in (0.5, -0.53):
            upd = {}
            for v in skirt:
                nb = [e.other_vert(v) for e in v.link_edges]
                avg = sum((n_.co for n_ in nb), Vector()) / len(nb)
                upd[v] = v.co + (avg - v.co) * step * fac[v]
            for v, co in upd.items():
                v.co = co

# orientation check: new faces must face away from the centre line
bad = tot = 0
for side in 'LR':
    NI = NEW[side]
    for f in NI['faces'][4 * NI['N']:-NI['N2']]:
        k = min(range(len(NI['c'])), key=lambda q: (NI['c'][q] - mw @ f.calc_center_median()).length)
        if (f.normal @ mw.to_3x3().transposed()).dot(mw @ f.calc_center_median() - NI['c'][k]) < 0:
            bad += 1
        tot += 1
print('EAR faces facing inward:', bad, 'of', tot)

# ------------------------------------------------------------------ 3. weights, UVs and the shader mask on the new vertices
bm.verts.index_update(); bm.faces.index_update()
uv_by_vert, w_by_vert, mask_by_vert = {}, {}, {}
for side in 'LR':
    NI = NEW[side]
    tau_j = NI['tau_j']
    for k in range(1, len(NI['rings'])):
        tau = NI['taus'][k]
        Wn, Dn, cup = NI['prof'](tau)
        for i, v in enumerate(NI['rings'][k]):
            d = NI['data'][NI['src2'][i]]
            cur = d['w']
            old_ear = cur.get('Ear_' + side, 0.0) + cur.get('Ear_Tip_' + side, 0.0)
            tot = lerp(old_ear, 1.0, ss(0.0, 0.18, tau))
            m = ss(tau_j - 0.14, tau_j + 0.10, tau)
            others = {n_: w_ for n_, w_ in cur.items() if n_ not in ('Ear_' + side, 'Ear_Tip_' + side)}
            osum = sum(others.values())
            others = {n_: w_ * (1 - tot) / osum for n_, w_ in others.items()} if osum > 1e-6 else ({'Head': 1 - tot} if tot < 0.999 else {})
            others['Ear_' + side] = tot * (1 - m); others['Ear_Tip_' + side] = tot * m
            w_by_vert[v] = others
            u0 = d['uv']
            thv = lerp(NI['th2'][i], NI['th'][i], ss(0.02, 0.30, tau))
            sn = math.sin(thv)
            uv_by_vert[v] = (u0[0] + 0.012 * tau * math.cos(thv), u0[1] + 0.03 * tau)
            cav = (max(0.0, sn) * ss(CUP_A, CUP_B, tau) * cup / 0.90) if sn > 0 else 0.0
            rim = (math.exp(-((sn - 0.30) / 0.16) ** 2) * ss(CUP_A - 0.05, CUP_A + 0.2, tau)) if sn > 0 else 0.0
            mask_by_vert[v] = (min(1.0, cav), 0.5 + 0.5 * min(1.0, rim))   # v: 0 = not ear, 0.5 = ear back/outside, up to 1 = rim hairs
    w_by_vert[NI['apex']] = {'Ear_Tip_' + side: 1.0}
    uv_by_vert[NI['apex']] = uv_by_vert[NI['rings'][-1][0]]
    mask_by_vert[NI['apex']] = (0.0, 0.5)
    for i, d in enumerate(NI['data']):
        uv_by_vert[d['v']] = d['uv']                                  # ring 0 keeps the head's UVs in the new faces' loops
for bv, w in w_by_vert.items():
    for gnm, wt in w.items():
        bv[dl][gindex[gnm]] = max(0.0, wt)
for side in 'LR':
    for f in NEW[side]['faces']:
        for lp in f.loops:
            lp[uvl].uv = uv_by_vert[lp.vert]
bm.verts.index_update()
mask_idx = {bv.index: m for bv, m in mask_by_vert.items()}
bm.to_mesh(me)
bm.free()
me.update()
if 'EarMask' in me.uv_layers:
    me.uv_layers.remove(me.uv_layers['EarMask'])
base_uv = me.uv_layers.active
lay = me.uv_layers.new(name='EarMask')
for loop in me.loops:
    lay.data[loop.index].uv = mask_idx.get(loop.vertex_index, (0.0, 0.0))
me.uv_layers.active = base_uv
me.update()
print('EAR mesh now', len(me.vertices), 'verts', len(me.polygons), 'polys')

# ------------------------------------------------------------------ 4. move the Ear_Tip joints onto the new centre lines (orientation kept)
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for side in 'LR':
    NI = NEW[side]
    tipj = B['Ear_Tip_' + side][0]
    f = NI['tau_j'] * NS
    i = min(NS - 1, int(f)); w = f - i
    target = NI['P'][i].lerp(NI['P'][i + 1], w)
    eb = arm.data.edit_bones['Ear_Tip_' + side]
    delta = arm.matrix_world.inverted().to_3x3() @ (target - tipj)
    eb.use_connect = False
    eb.head += delta
    eb.tail += delta
    print('EAR', side, 'Ear_Tip joint moved by', tuple(round(x, 3) for x in delta))
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
