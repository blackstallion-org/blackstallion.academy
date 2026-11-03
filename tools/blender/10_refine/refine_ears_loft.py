# part 2 of refine_ears.py (exec'd in its namespace): loft the ears off the root rings, weights, UVs, EarMask, bones
import numpy as np
NS = 240
BLEND = E('EAR_BLEND', 0.45)       # the cross-section relaxes from the root opening's angles to even spacing over this much of the length
TAU_F = E('EAR_FILLET', 0.075)    # the root's fillet (a quarter circle from the opening to the ear's section) spans this much of the length
BLEND_H = 0.25
CUP_A, CUP_B = 0.10, 0.50
rng = random.Random(11)
E_UP = Vector((0, 0, 1)); E_FW = Vector((0, -1, 0))

def fw_of(t):  return (0.07 + 0.93 * max(0.0, 1 - t ** 2.0) ** 0.85) * (1 + E('EAR_BULGE', 0.07) * math.sin(math.pi * min(1.0, t / 0.6)))
def fd_of(t):  return 0.26 + 0.74 * max(0.0, 1 - t ** 1.4) ** 0.55
WALL0, WALL1, LIPK = E('EAR_WALL0', 0.0042), E('EAR_WALL1', 0.0080), E('EAR_LIP', 0.50)
def wall_of(t): return WALL0 + WALL1 * (1 - ss(0.0, 0.65, t))
def cupf(t):   return ss(CUP_A, CUP_B, t) * (1 - 0.4 * ss(0.8, 1.0, t))

def spine_for(S, base, arc, A_in, a_out, b_fw, a_out_len=0.60):
    e_in = Vector((-S, 0, 0))
    P, T = [base.copy()], []
    c = base.copy()
    for k in range(NS + 1):
        t = k / NS
        al = -a_out * max(0.0, 1 - t / a_out_len) ** 2 + A_in * t ** 2.1
        be = b_fw * t ** 1.5
        d = (E_UP + e_in * math.tan(al) + E_FW * math.tan(be)).normalized()
        T.append(d)
        if k < NS:
            c = c + d * (arc / NS); P.append(c.copy())
    return P, T

CAP_A = E('EAR_CAPA', 0.30)       # half-span (radians of the section's parameter) of each rounded edge
RIM_K = E('EAR_RIMK', 1.15)       # edge thickness as a multiple of the wall
def kidney(theta, W, D, wall, lipk):
    """The ear's section, a closed curve parametrised by theta: a cup (back arc = the ellipse's lower half, front arc = that offset inward by
    the wall), closed at both lateral edges by half-round caps, so the rim is a soft rounded edge and never a knife edge.
    theta 0 = middle of the +u edge cap; (cap1) -> front arc -> (cap2) -> back arc."""
    th = theta % (2 * math.pi); a = CAP_A; PI = math.pi
    h0 = min(RIM_K * wall, 0.85 * W); wl = min(wall, h0); r = 0.5 * h0
    def Mp(psi): return (W * math.cos(psi), -D * math.sin(psi))
    def Np(psi):
        nx, ny = -math.cos(psi) / W, math.sin(psi) / D; l = math.hypot(nx, ny); return nx / l, ny / l
    def hh(psi): return wl + (h0 - wl) * (math.exp(-(psi / 0.55) ** 2) + math.exp(-((PI - psi) / 0.55) ** 2))
    if a <= th < PI - a:
        psi = PI * (th - a) / (PI - 2 * a); m, n, h = Mp(psi), Np(psi), hh(psi)
        return m[0] + n[0] * h, m[1] + n[1] * h
    if PI - a <= th < PI + a:
        phi = PI * (th - (PI - a)) / (2 * a)
        return (-W + 0.5 * h0) + r * math.cos(phi), r * math.sin(phi)
    if PI + a <= th < 2 * PI - a:
        psi = PI - PI * (th - (PI + a)) / (PI - 2 * a)
        return Mp(psi)
    t2 = th if th < a else th - 2 * PI
    phi = PI * (t2 + a) / (2 * a)
    return (W - 0.5 * h0) + r * math.cos(phi), r * math.sin(phi)

NEW = {}
def build_side(side, X_tip, jitter):
    R = ROOT[side]; S = R['S']; ring = R['ring']; N = len(ring); dirn = R['dirn']
    ring_w = [v.co.copy() for v in ring]
    cen = sum(ring_w, Vector()) / N
    print('ROOT %s ring centre (%.3f %.3f %.3f) z %.3f..%.3f' % (side, cen.x, cen.y, cen.z, min(r.z for r in ring_w), max(r.z for r in ring_w)))
    tip_x = MID + S * X_tip
    tipz = cen.z + E('EAR_H', 0.192)                       # equal ear length from each root; the head's own small tilt is left alone
    b_fw = math.radians(12 + 2 * jitter); a_out = math.radians(E('EAR_BOW', 19.0))
    def solve(arc):
        lo, hi = 0.0, 1.45
        for _ in range(40):
            mid = 0.5 * (lo + hi)
            P, T = spine_for(S, cen, arc, mid, a_out, b_fw)
            if S * (P[-1].x - tip_x) > 0: lo = mid
            else: hi = mid
        A = 0.5 * (lo + hi); P, T = spine_for(S, cen, arc, A, a_out, b_fw)
        return A, P, T
    lo, hi = 0.10, 0.34
    for _ in range(30):
        arc = 0.5 * (lo + hi)
        if solve(arc)[1][-1].z < tipz: lo = arc
        else: hi = arc
    arc = 0.5 * (lo + hi); A, P, T = solve(arc)
    twist = math.radians(3.0 * jitter)
    n0 = R['n0']; nf = []
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
    Aa = [(r - c_b).dot(u_b) for r in ring_w]; Bb = [(r - c_b).dot(n_b) for r in ring_w]; Hh = [(r - c_b).dot(T_b) for r in ring_w]
    Wr = 0.5 * (max(Aa) - min(Aa)); Dr = 0.5 * (max(Bb) - min(Bb)); ca = 0.5 * (max(Aa) + min(Aa)); cb = 0.5 * (max(Bb) + min(Bb))
    th = [math.atan2((Bb[i] - cb) / Dr, (Aa[i] - ca) / Wr) for i in range(N)]
    for i in range(1, N):
        while th[i] < th[i - 1] - math.pi: th[i] += 2 * math.pi
        while th[i] > th[i - 1] + math.pi: th[i] -= 2 * math.pi
    dr = 1.0 if th[-1] >= th[0] else -1.0
    for i in range(1, N):
        if dr * (th[i] - th[i - 1]) < 1e-3: th[i] = th[i - 1] + dr * 1e-3
    K = max(14, int(arc / RING_STEP))
    double = N < 40
    N2 = 2 * N if double else N
    th_ext = th + [th[0] + dr * 2 * math.pi]
    th2, A2, B2, H2, src2 = [], [], [], [], []
    for i in range(N):
        j = (i + 1) % N
        th2.append(th_ext[i]); A2.append(Aa[i]); B2.append(Bb[i]); H2.append(Hh[i]); src2.append(i)
        if double:
            th2.append(0.5 * (th_ext[i] + th_ext[i + 1])); A2.append(0.5 * (Aa[i] + Aa[j])); B2.append(0.5 * (Bb[i] + Bb[j])); H2.append(0.5 * (Hh[i] + Hh[j])); src2.append(i)
    th_even = [th2[0] + dr * 2 * math.pi * m / N2 for m in range(N2)]
    taus = [0.0] + [(k / K) ** 1.15 for k in range(1, K + 1)]
    pos = [[ring_w[i] for i in range(N)]]
    for k in range(1, K + 1):
        tau = taus[k]; c, Tk, n, u = sample(tau)
        Wn, Dn, wl = W0 * fw_of(tau), D0 * fd_of(tau), wall_of(tau)
        lam = math.sqrt(max(0.0, 1 - (1 - min(1.0, tau / TAU_F)) ** 2)); mu = ss(0.02, BLEND, tau)
        row = []
        for m in range(N2):
            ax_, bx_ = kidney(lerp(th2[m], th_even[m], mu), Wn, Dn, wl, LIPK)
            off = (u * A2[m] + n * B2[m]) * (1 - lam) + (u * ax_ + n * bx_) * lam
            row.append(c + off + Tk * (H2[m] * (1 - ss(0.0, BLEND_H, tau))))
        pos.append(row)
    c1, T1, n1, u1 = sample(1.0)
    apex = c1 + T1 * 0.85 * (W0 * fw_of(1.0) + D0 * fd_of(1.0)) - n1 * (0.52 * D0 * fd_of(1.0))     # the point sits over the section's own centre, not over its open edges
    return dict(S=S, N=N, N2=N2, K=K, double=double, th2=th2, th_even=th_even, src2=src2, taus=taus, pos=pos, apex=apex, P=P, arc=arc, A=A, sample=sample)

def tip_gap(Ls, Rs):
    a = np.array([p[:] for row in Ls['pos'][int(0.55 * Ls['K']):] for p in row] + [Ls['apex'][:]])
    b = np.array([p[:] for row in Rs['pos'][int(0.55 * Rs['K']):] for p in row] + [Rs['apex'][:]])
    d = np.sqrt(((a[:, None, :] - b[None, :, :]) ** 2).sum(-1)); return float(d.min())
jit = {'L': rng.uniform(-1, 1), 'R': rng.uniform(-1, 1)}
X_tip = 0.011
for it in range(8):
    Ls, Rs = build_side('L', X_tip, jit['L']), build_side('R', X_tip, jit['R'])
    g = tip_gap(Ls, Rs)
    print('EAR gap iteration %d: tip centre %.4f from the midline, closest surfaces %.1f mm' % (it, X_tip, g * 1000))
    if abs(g - GAP) < 0.0004: break
    X_tip = max(0.001, X_tip + 0.5 * (GAP - g))
NEW = {'L': Ls, 'R': Rs}
for s in 'LR':
    n_ = NEW[s]; print('EAR', s, 'arc %.3f m, %d rings x %d, tip centre (%.3f, %.3f, %.3f), height above root %.3f' % (n_['arc'], n_['K'], n_['N2'], *n_['apex'], n_['apex'].z - ROOT[s]['ring'][0].co.z))
if STOP == 'spine':
    raise SystemExit

# ------------------------------------------------------------------ build the mesh
FAILED = []
new_faces = {}; new_verts = {}; mask_of = {}; uv_of = {}; w_of = {}
for side in 'LR':
    R, Nw = ROOT[side], NEW[side]
    N, N2, K, double = Nw['N'], Nw['N2'], Nw['K'], Nw['double']
    rings = [R['ring']]
    for k in range(1, K + 1):
        rings.append([bm.verts.new(p) for p in Nw['pos'][k]])
    apex = bm.verts.new(Nw['apex'])
    faces = []
    def add(*vs):
        try: faces.append(bm.faces.new(vs))
        except ValueError as ex: FAILED.append((side, str(ex)[:60], [tuple(round(x, 4) for x in v.co) for v in vs]))
    r0, r1 = rings[0], rings[1]
    for i in range(N):
        j = (i + 1) % N
        if double:
            add(r0[i], r0[j], r1[2 * i + 1]); add(r0[j], r1[(2 * j) % N2], r1[2 * i + 1]); add(r0[i], r1[2 * i + 1], r1[2 * i])
        else:
            add(r0[i], r0[j], r1[j], r1[i])
    for k in range(1, K):
        ra, rb = rings[k], rings[k + 1]
        for m in range(N2):
            q = (m + 1) % N2; add(ra[m], ra[q], rb[q], rb[m])
    for m in range(N2): add(rings[-1][m], rings[-1][(m + 1) % N2], apex)
    for f in faces: f.smooth = True
    new_faces[side] = faces; new_verts[side] = (rings, apex)
    # winding: the new faces must run opposite to the skin they join along the root ring (so they face outward with it)
    bm.verts.index_update(); bm.normal_update()
    fs = set(faces); flips = 0
    e = bm.edges.get((rings[0][0], rings[0][1]))
    ear_f = [g for g in e.link_faces if g in fs][0]; skin_f = [g for g in e.link_faces if g not in fs][0]
    d_ear = [l.vert.index for l in ear_f.loops if l.edge is e]; d_skin = [l.vert.index for l in skin_f.loops if l.edge is e]
    if d_ear == d_skin:
        bmesh.ops.reverse_faces(bm, faces=faces); flips = 1
    print('EAR', side, 'faces', len(faces), 'reversed' if flips else 'winding ok', 'FAILED adds:', len([x for x in FAILED if x[0] == side]))
bm.verts.index_update(); bm.normal_update()
bad_edges = 0
for e in bm.edges:
    if len(e.link_faces) == 2:
        d = [l.vert.index for f in e.link_faces for l in f.loops if l.edge is e]
        if d[0] == d[1]: bad_edges += 1
print('edges with inconsistent winding after loft:', bad_edges)

# smoothing: Taubin on the first rings (fading), then the dome skin round each root (fading)
SMOOTH = int(E('EAR_SMOOTH', 12)); SKIRT = int(E('EAR_SKIRT', 8))
for side in 'LR':
    rings, apex = new_verts[side]; K = NEW[side]['K']
    m_rings = max(3, int(0.55 * K)); verts, fac = [], {}
    for k in range(1, m_rings + 1):
        for v in rings[k]: verts.append(v); fac[v] = 1.0 - (k - 1) / m_rings
    for _ in range(SMOOTH):
        for step in (0.55, -0.58):
            upd = {}
            for v in verts:
                nb = [e.other_vert(v) for e in v.link_edges]; avg = sum((n_.co for n_ in nb), Vector()) / len(nb)
                upd[v] = v.co + (avg - v.co) * step * fac[v]
            for v, co in upd.items(): v.co = co
for side in 'LR':
    rings, apex = new_verts[side]
    ring0 = set(rings[0]); newv = {v for r in rings[1:] for v in r} | {apex}
    depth = {v: 0 for v in ring0}; fr = list(ring0)
    for d_ in range(1, SKIRT + 1):
        nx = []
        for v in fr:
            for e in v.link_edges:
                o = e.other_vert(v)
                if o not in depth and o not in newv: depth[o] = d_; nx.append(o)
        fr = nx
    skirt = [v for v, d_ in depth.items() if d_ > 0]
    fac = {v: 1.0 - (depth[v] - 1) / SKIRT for v in skirt}
    for _ in range(10):
        for step in (0.5, -0.53):
            upd = {}
            for v in skirt:
                nb = [e.other_vert(v) for e in v.link_edges]; avg = sum((n_.co for n_ in nb), Vector()) / len(nb)
                upd[v] = v.co + (avg - v.co) * step * fac[v]
            for v, co in upd.items(): v.co = co

# weights, coat UVs, EarMask
tau_j = {}
for side in 'LR':
    Nw, R = NEW[side], ROOT[side]
    rings, apex = new_verts[side]
    tj = B['Ear_Tip_' + side][0]
    tau_j[side] = 0.40
    for k in range(1, Nw['K'] + 1):
        tau = Nw['taus'][k]
        for i, v in enumerate(rings[k]):
            src = Nw['src2'][i]; cur = R['w'][src]
            old_ear = cur.get('Ear_' + side, 0.0) + cur.get('Ear_Tip_' + side, 0.0)
            tot = lerp(old_ear, 1.0, ss(0.0, 0.18, tau)); m = ss(tau_j[side] - 0.14, tau_j[side] + 0.10, tau)
            others = {n_: w_ for n_, w_ in cur.items() if n_ not in ('Ear_' + side, 'Ear_Tip_' + side)}
            osum = sum(others.values())
            others = {n_: w_ * (1 - tot) / osum for n_, w_ in others.items()} if osum > 1e-6 else ({'Head': 1 - tot} if tot < 0.999 else {})
            others['Ear_' + side] = tot * (1 - m); others['Ear_Tip_' + side] = tot * m
            w_of[v] = others
            u0 = R['uv'][src]; thv = lerp(Nw['th2'][i], Nw['th_even'][i], ss(0.02, 0.30, tau)); sn = math.sin(thv)
            uv_of[v] = (u0[0] + 0.012 * tau * math.cos(thv), u0[1] + 0.03 * tau)
            front = max(0.0, sn)
            cav = min(1.0, front ** 0.7 * cupf(tau) * 1.15)
            rim = (math.exp(-((sn - 0.30) / 0.16) ** 2) * ss(0.04, 0.25, tau)) if sn > 0 else 0.0
            mask_of[v] = (cav, 0.5 * ss(0.0, 0.18, tau) + 0.5 * min(1.0, rim * ss(0.1, 0.25, tau)))
    w_of[apex] = {'Ear_Tip_' + side: 1.0}; uv_of[apex] = uv_of[rings[-1][0]]; mask_of[apex] = (0.0, 0.5)
    for i, v in enumerate(rings[0]): uv_of[v] = R['uv'][i]
for v, w in w_of.items():
    for g in list(v[dl].keys()): del v[dl][g]
    for gn, wt in w.items():
        if wt > 1e-6: v[dl][gindex[gn]] = wt
for side in 'LR':
    for f in new_faces[side]:
        for lp in f.loops:
            lp[uvl].uv = uv_of[lp.vert]
            lp[emk].uv = mask_of.get(lp.vert, (0.0, 0.0))
# every other loop keeps EarMask (0,0): the cap/ear shell loops are gone with it
RING_CEN = {s_: sum((v.co for v in ROOT[s_]['ring']), Vector()) / len(ROOT[s_]['ring']) for s_ in 'LR'}
bm.to_mesh(me); bm.free(); me.update()
me.polygons.foreach_set('use_smooth', [True] * len(me.polygons)); me.update()
print('mesh now %d verts, %d polys' % (len(me.vertices), len(me.polygons)))

# ------------------------------------------------------------------ bones: heads onto the new roots, tip joints onto the new centre lines
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for side in 'LR':
    Nw, R = NEW[side], ROOT[side]
    for nm, target in (('Ear_' + side, None), ('Ear_Tip_' + side, None)):
        eb = arm.data.edit_bones[nm]; eb.use_connect = False
        if nm.startswith('Ear_Tip'):
            f = tau_j[side] * NS; i = min(NS - 1, int(f)); w = f - i
            target = Nw['P'][i].lerp(Nw['P'][i + 1], w)
        else:
            target = RING_CEN[side] - Vector((0, 0, 0.006))
        delta = target - eb.head
        eb.head += delta; eb.tail += delta
        print('BONE', nm, 'moved by', tuple(round(x, 3) for x in delta))
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
print('saved', dst)
