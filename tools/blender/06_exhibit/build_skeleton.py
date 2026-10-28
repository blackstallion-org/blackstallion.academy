# Stage A: the skeleton, built from the Marwari armature's joints and held inside the coat.
# usage: blender -b <source.blend> -P build_skeleton.py -- <out.blend>
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

out = sys.argv[sys.argv.index('--') + 1]
rig = Rig()
J = rig.J
BONE = material('Bone', (0.80, 0.70, 0.55), 0.55)
made = []


LIMB_BONES = ('Scapula', 'Humerus', 'Forearm', 'Cannon', 'Pastern', 'Hoof', 'Femur', 'Gaskin')


def bone_obj(name, mb, bone, margin=0.009, weights=True, hint=None, allow=None, mix=None):
    # Skin weights come from the nearest coat vertex (a long bone is mid-shaft the same as a rigid bone; at a joint it follows the coat's
    # blend, so it stays inside the coat when the limb folds). `allow` restricts them (ribs and pelvis must not follow a limb).
    moved = clamp_inside(rig, mb, margin)
    if hint is not None:
        # a second pass for vertices the ring centres could not rescue: pull toward a point known to be deep inside
        for i, p in enumerate(mb.v):
            for _ in range(60):
                if rig.depth(p) >= margin:
                    break
                c = Vector((0.0, p.y, p.z)) if isinstance(hint, str) else hint
                p = p.lerp(c, 0.05)
            mb.v[i] = p
    w = coat_weights(rig, mb.v) if weights else None
    side = 'L' if name.endswith('_L') else ('R' if name.endswith('_R') else None)
    if w and side:
        # the coat's weights bleed across the crotch and chest; a left bone never follows a right-hand bone
        opp = '_R' if side == 'L' else '_L'
        w = [{k: v for k, v in wd.items() if not k.endswith(opp)} or {bone: 1.0} for wd in w]
        w = [{k: v / sum(wd.values()) for k, v in wd.items()} for wd in w]
    if w and mix:
        # blend toward a rigid bone: mix(vertex) -> share of `bone` (0..1) for that vertex
        out = []
        for v, wd in zip(mb.v, w):
            k = mix(v)
            m = {kk: vv * (1 - k) for kk, vv in wd.items()}
            m[bone] = m.get(bone, 0.0) + k
            out.append(m)
        w = out
    if w and allow:
        fixed = []
        for wd in w:
            kept = {k: v for k, v in wd.items() if allow(k)}
            tot = sum(kept.values())
            fixed.append({k: v / tot for k, v in kept.items()} if tot > 1e-4 else {bone: 1.0})
        w = fixed
    ob = make_object(rig, 'Bone_' + name, mb, BONE, bone=None if weights else bone, weights=w, layer='bone', extras={'label': name.replace('_', ' ')})
    made.append(ob)
    return ob


def long_bone(a, b, r, ra, rb, flare=0.15, flat=0.9, ref=(1, 0, 0), n=16):
    pts = [a.lerp(b, i / (n - 1)) for i in range(n)]

    def rr(t):
        return r + (ra - r) * math.exp(-(t / flare) ** 2) + (rb - r) * math.exp(-((1 - t) / flare) ** 2)

    return loft(pts, lambda t: rr(t), lambda t: rr(t) * flat, ref=ref, seg=12)


def sgn(s):
    return 1.0 if s == 'L' else -1.0


def mirror_x(v):
    return Vector((-v.x, v.y, v.z))


# ---------------------------------------------------------------- limbs (per side)
for S in 'LR':
    sx = sgn(S)
    # ---- forelimb
    sc_top, sh = rig.head('Scapula_' + S), rig.tail('Scapula_' + S)
    el, ca = rig.tail('Humerus_' + S), rig.tail('Forearm_' + S)
    fe, pj, toe = rig.tail('Cannon_F_' + S), rig.tail('Pastern_F_' + S), rig.tail('Hoof_F_' + S)
    up = sc_top + Vector((0.0, -0.01, 0.07))
    mb = loft([up.lerp(sh, i / 14) for i in range(15)], lambda t: 0.028 + 0.052 * (1 - t) ** 0.9, lambda t: 0.0072 + 0.002 * (1 - t), ref=(0, 1, 0), seg=14)
    ridge_a, ridge_b = up.lerp(sh, 0.04) + Vector((sx * 0.012, -0.012, 0)), up.lerp(sh, 0.8) + Vector((sx * 0.014, -0.004, 0))
    mb.merge(loft([ridge_a.lerp(ridge_b, i / 9) for i in range(10)], lambda t: 0.010 * (1 - 0.5 * t), 0.008, ref=(0, 1, 0), seg=8))
    mb.merge(blob(sh + Vector((sx * 0.004, -0.014, 0.004)), (0.036, 0.04, 0.036)))
    bone_obj('Scapula_' + S, mb, 'Scapula_' + S, hint='axis')

    mb = long_bone(sh, el, 0.027, 0.040, 0.036, ref=(1, 0, 0))
    mb.merge(blob(sh.lerp(el, 0.32) + Vector((sx * 0.026, -0.012, 0)), (0.02, 0.02, 0.026)))
    bone_obj('Humerus_' + S, mb, 'Humerus_' + S)

    mb = long_bone(el, ca, 0.022, 0.030, 0.030, ref=(1, 0, 0), flat=1.15)
    olecranon = el + Vector((0, 0.06, 0.058))
    mb.merge(loft([olecranon, el.lerp(ca, 0.38) + Vector((0, 0.022, 0))], 0.013, 0.012, seg=8))
    mb.merge(blob(olecranon, (0.017, 0.02, 0.024)))
    bone_obj('Radius_Ulna_' + S, mb, 'Forearm_' + S)

    mb = MB()
    for row, zz in enumerate((0.018, -0.012)):
        for col, xx in enumerate((-0.016, 0.0, 0.016)):
            mb.merge(blob(ca + Vector((xx, 0.0 + 0.003 * col, zz)), (0.0135, 0.019, 0.0105)))
    bone_obj('Carpus_' + S, mb, 'Cannon_F_' + S)

    mb = long_bone(ca + Vector((0, 0, -0.02)), fe, 0.0125, 0.0185, 0.0185, ref=(1, 0, 0), flat=1.1)
    for k in (-1, 1):
        mb.merge(loft([ca.lerp(fe, 0.08) + Vector((k * 0.017, 0.003, 0)), ca.lerp(fe, 0.66) + Vector((k * 0.014, 0.003, 0))], 0.0046, 0.0046, seg=6))
    bone_obj('Cannon_MC3_' + S, mb, 'Cannon_F_' + S)

    mb = MB()
    for k in (-1, 1):
        mb.merge(blob(fe + Vector((k * 0.008, 0.026, 0.0)), (0.007, 0.011, 0.014)))
    mb.merge(long_bone(fe + Vector((0, 0.0, -0.012)), fe.lerp(pj, 0.62), 0.0125, 0.0185, 0.0165, flat=1.0))
    mb.merge(long_bone(fe.lerp(pj, 0.5), pj + (pj - fe).normalized() * 0.012, 0.012, 0.0155, 0.0145, flat=1.0))
    bone_obj('Pastern_P1_P2_' + S, mb, 'Pastern_F_' + S)

    hdir = (toe - pj).normalized()
    mb = blob(pj.lerp(toe, 0.46), (0.044, 0.052, 0.028), basis_along(hdir, (1, 0, 0)))
    bone_obj('Coffin_P3_' + S, mb, 'Hoof_F_' + S, margin=0.004)

    # ---- hindlimb
    hip, st = rig.head('Femur_' + S), rig.tail('Femur_' + S)
    ho, fb = rig.tail('Gaskin_' + S), rig.tail('Cannon_B_' + S)
    st = rig.fit_inside(st, hip.lerp(ho, 0.5) + Vector((0, -0.06, 0)), 0.05)   # the rig's stifle sits 4 cm outside the coat
    pjb, toeb = rig.tail('Pastern_B_' + S), rig.tail('Hoof_B_' + S)
    mb = long_bone(hip, st, 0.030, 0.034, 0.034, ref=(1, 0, 0))
    mb.merge(blob(hip + Vector((-sx * 0.024, 0.0, 0.012)), (0.03, 0.03, 0.03)))
    mb.merge(blob(hip + Vector((sx * 0.034, 0.014, 0.034)), (0.026, 0.03, 0.04)))
    for k in (-1, 1):
        mb.merge(blob(st + Vector((k * 0.024, 0.026, 0.0)), (0.021, 0.03, 0.03)))
    bone_obj('Femur_' + S, mb, 'Femur_' + S)

    bone_obj('Patella_' + S, blob(st + Vector((0.0, -0.062, 0.03)), (0.022, 0.017, 0.03)), 'Femur_' + S, hint=st)

    mb = long_bone(st, ho, 0.0235, 0.032, 0.03, ref=(1, 0, 0), flat=1.1)
    mb.merge(loft([st + Vector((0, -0.036, -0.015)), st.lerp(ho, 0.32) + Vector((0, -0.026, 0))], 0.007, 0.012, ref=(1, 0, 0), seg=8))
    mb.merge(loft([st.lerp(ho, 0.12) + Vector((sx * 0.032, 0.0, 0)), st.lerp(ho, 0.72) + Vector((sx * 0.029, 0.004, 0))], 0.0065, 0.0065, seg=6))
    bone_obj('Tibia_' + S, mb, 'Gaskin_' + S)

    calc_a, calc_b = ho + Vector((0, 0.02, 0.0)), ho + Vector((0, 0.075, 0.078))
    mb = loft([calc_a.lerp(calc_b, i / 7) for i in range(8)], 0.0155, 0.017, seg=10)
    mb.merge(blob(calc_b, (0.021, 0.024, 0.026)))
    mb.merge(blob(ho + Vector((0, -0.005, 0.034)), (0.028, 0.028, 0.026)))
    for xx in (-0.014, 0.014):
        for dz in (0.0, -0.026):
            mb.merge(blob(ho + Vector((xx, 0.004, dz - 0.004)), (0.0145, 0.019, 0.0125)))
    bone_obj('Tarsus_Hock_' + S, mb, 'Cannon_B_' + S, hint=ho + Vector((0, -0.02, 0.0)))

    mb = long_bone(ho + Vector((0, 0, -0.03)), fb, 0.0135, 0.0195, 0.0195, ref=(1, 0, 0), flat=1.1)
    for k in (-1, 1):
        mb.merge(loft([ho.lerp(fb, 0.1) + Vector((k * 0.018, 0.004, 0)), ho.lerp(fb, 0.68) + Vector((k * 0.015, 0.004, 0))], 0.0048, 0.0048, seg=6))
    bone_obj('Cannon_MT3_' + S, mb, 'Cannon_B_' + S)

    mb = MB()
    for k in (-1, 1):
        mb.merge(blob(fb + Vector((k * 0.008, 0.026, 0.0)), (0.007, 0.011, 0.014)))
    mb.merge(long_bone(fb + Vector((0, 0.0, -0.012)), fb.lerp(pjb, 0.62), 0.013, 0.0195, 0.017, flat=1.0))
    mb.merge(long_bone(fb.lerp(pjb, 0.5), pjb + (pjb - fb).normalized() * 0.012, 0.012, 0.016, 0.015, flat=1.0))
    bone_obj('Pastern_P1_P2_B_' + S, mb, 'Pastern_B_' + S)
    hdirb = (toeb - pjb).normalized()
    bone_obj('Coffin_P3_B_' + S, blob(pjb.lerp(toeb, 0.46), (0.04, 0.05, 0.027), basis_along(hdirb, (1, 0, 0))), 'Hoof_B_' + S, margin=0.004)

# ---------------------------------------------------------------- pelvis (both sides, one object) and sacrum
mb = MB()
for S in 'LR':
    sx = sgn(S)
    hip = rig.head('Femur_' + S)
    tc = Vector((sx * 0.215, 0.115, rig.topz(0.115, sx * 0.2) - 0.07 if rig.topz(0.115, sx * 0.2) else 1.40))   # tuber coxae (point of the hip)
    ts = Vector((sx * 0.045, 0.31, rig.topz(0.31) - 0.075))                                                   # sacral tuber
    ish = Vector((sx * 0.085, 0.585, 1.215))                                                                 # ischiatic tuberosity
    sym = Vector((sx * 0.012, 0.47, 1.105))                                                                   # pubic symphysis
    mb.merge(loft([tc.lerp(hip, i / 8) for i in range(9)], 0.030, 0.026, ref=(0, 1, 0), seg=10))                # ilial shaft
    mb.merge(loft([tc.lerp(ts, i / 10) for i in range(11)], lambda t: 0.055 + 0.03 * math.sin(t * math.pi), 0.0095, ref=(0, 0, 1), seg=12))   # wing
    mb.merge(loft([hip.lerp(ish, i / 8) for i in range(9)], 0.021, 0.019, seg=10))                              # ischium
    mb.merge(loft([ish.lerp(sym, i / 8) for i in range(9)], 0.015, 0.014, seg=8))                               # ischial arch
    mb.merge(loft([hip.lerp(sym, i / 8) for i in range(9)], 0.016, 0.015, seg=8))                               # pubis
    mb.merge(blob(tc, (0.03, 0.036, 0.03)))
    mb.merge(blob(ish, (0.024, 0.03, 0.024)))
    mb.merge(blob(hip, (0.036, 0.04, 0.036)))
bone_obj('Pelvis', mb, 'Pelvis', hint='axis')

# ---------------------------------------------------------------- spine
def zc(y):
    return 1.31 + 0.02 * smooth((y - 0.0) / 0.4)


def bone_for_y(y):
    return 'Spine_Thoracic' if y < -0.10 else ('Spine_Lumbar' if y < 0.22 else 'Pelvis')


def vertebra(c, length, rc, sp_h, tilt, tp, wide=1.0, ribfacet=False):
    mb = MB()
    d = Vector((0, 1, 0))
    mb.merge(loft([c - d * length / 2, c + d * length / 2], rc * 1.1 * wide, rc * 0.92, ref=(1, 0, 0), seg=10))
    if sp_h > 0:
        base = c + Vector((0, 0, rc * 0.7))
        tip = base + Vector((0, sp_h * tilt, sp_h))
        mb.merge(loft([base.lerp(tip, i / 5) for i in range(6)], lambda t: 0.0135 * (1 - 0.25 * t), lambda t: 0.0052 * (1 - 0.2 * t), ref=(0, 1, 0), seg=8))
    if tp > 0:
        for s in (-1, 1):
            a = c + Vector((s * rc * 0.5, 0, 0))
            mb.merge(loft([a, a + Vector((s * tp, 0, -0.012))], 0.016, 0.0058, ref=(0, 1, 0), seg=8))
    return mb


# thoracic T1..T18: spinous processes tall at the withers, short toward the loin; tip held below the topline
for i in range(18):
    y = -0.52 + i * 0.62 / 17
    c = Vector((0, y, zc(y)))
    h = 0.085 + 0.115 * math.exp(-((i - 5.0) / 3.4) ** 2) - 0.004 * max(0, i - 9)
    top = rig.topz(y)
    if top is not None:
        h = min(h, max(0.04, top - 0.04 - (c.z + 0.02) - 0.05 * 0.4))
    bone_obj('Thoracic_T%d' % (i + 1), vertebra(c, 0.031, 0.021, h, 0.45, 0.04, 1.0), bone_for_y(y))
# lumbar L1..L6 with broad transverse processes
for i in range(6):
    y = 0.125 + i * 0.034
    c = Vector((0, y, zc(y)))
    top = rig.topz(y) or 1.5
    bone_obj('Lumbar_L%d' % (i + 1), vertebra(c, 0.033, 0.021, min(0.062, top - 0.05 - c.z - 0.03), 0.1, 0.085, 1.0), bone_for_y(y))
# sacrum: five fused segments along the Pelvis bone, rising toward the tail root
pa, pb = rig.head('Pelvis') + Vector((0, 0.13, 0.015)), rig.tail('Pelvis') + Vector((0, 0.0, -0.01))
mb = loft([pa.lerp(pb, i / 8) for i in range(9)], lambda t: 0.036 - 0.014 * t, lambda t: 0.024 - 0.008 * t, ref=(1, 0, 0), seg=12)
for i in range(5):
    p = pa.lerp(pb, 0.08 + i * 0.2)
    mb.merge(loft([p, p + Vector((0, 0.01, 0.04 - i * 0.004))], 0.012, 0.0045, ref=(0, 1, 0), seg=8))
bone_obj('Sacrum', mb, 'Pelvis')
# tail (caudal) vertebrae along the Tail_1..Tail_4 chain
tail_pts = [rig.head('Tail_1'), rig.tail('Tail_1'), rig.tail('Tail_2'), rig.tail('Tail_3'), rig.tail('Tail_4')]
tail_bones = ['Tail_1', 'Tail_1', 'Tail_2', 'Tail_3', 'Tail_4']
samp = catmull(tail_pts, 15)
for i in range(14):
    a, b = samp[i], samp[i + 1]
    r = 0.019 - 0.0105 * i / 13
    seg = loft([a.lerp(b, k / 2) for k in range(3)], r, r * 0.95, seg=8)
    bn = 'Tail_%d' % min(4, 1 + int(i / 14 * 4))
    bone_obj('Caudal_%d' % (i + 1), seg, bn, margin=-9.0, weights=False)

# neck C1..C7 along the rig's neck chain, held inside the crest and throat
neck = catmull([rig.head('Neck_1'), rig.head('Neck_2'), rig.head('Neck_3'), rig.head('Head') + Vector((0, 0.012, -0.012))], 60)
arc = [0.0]
for i in range(1, len(neck)):
    arc.append(arc[-1] + (neck[i] - neck[i - 1]).length)
tot = arc[-1]


def neck_at(f):
    target = f * tot
    for i in range(1, len(arc)):
        if arc[i] >= target:
            u = (target - arc[i - 1]) / max(1e-6, arc[i] - arc[i - 1])
            return neck[i - 1].lerp(neck[i], u), (neck[i] - neck[i - 1]).normalized()
    return neck[-1], (neck[-1] - neck[-2]).normalized()


cfrac = [0.93, 0.78, 0.62, 0.48, 0.34, 0.20, 0.07]   # C1..C7
for i, f in enumerate(cfrac):
    c, tg = neck_at(f)
    L = (0.065, 0.12, 0.105, 0.098, 0.092, 0.084, 0.07)[i]
    r = (0.03, 0.026, 0.027, 0.029, 0.031, 0.033, 0.034)[i]
    mb = loft([c - tg * L / 2, c + tg * L / 2], r * (1.5 if i == 0 else 1.15), r * 0.95, ref=(1, 0, 0), seg=10)
    up = Vector((0, -tg.z, tg.y)).normalized() if tg.z < 0 else Vector((0, tg.z, -tg.y)).normalized()
    if up.z < 0:
        up = -up
    mb.merge(loft([c + up * r * 0.6, c + up * (r * 0.6 + (0.03 if i else 0.012))], 0.016, 0.0058, ref=tg, seg=8))
    for s in (-1, 1):
        mb.merge(loft([c + Vector((s * r * 0.6, 0, 0)), c + Vector((s * (r + 0.04 + (0.03 if i == 0 else 0)), 0, -0.012))], 0.02, 0.0065, ref=tg, seg=8))
    bn = ('Head', 'Neck_3', 'Neck_3', 'Neck_2', 'Neck_2', 'Neck_1', 'Neck_1')[i]
    bone_obj('Cervical_C%d' % (i + 1), mb, bn, margin=0.016, hint='axis')

# ---------------------------------------------------------------- ribs and sternum (weights follow the coat's barrel)
def barrel_x(y, z):
    h = rig.halfwidth(y, z)
    return h if h else 0.2


mb_all = MB()
for i in range(18):
    y0 = -0.52 + i * 0.62 / 17
    dy = 0.05 + 0.012 * i if i < 9 else 0.15 + 0.004 * (i - 9)
    z_end = 0.93 if i < 8 else 0.93 + (i - 7) * 0.026
    for S in 'LR':
        sx = sgn(S)
        pts = []
        N = 24
        for k in range(N):
            u = k / (N - 1)
            y = y0 + dy * u ** 1.25
            z = lerp(zc(y0) - 0.005, z_end, u ** 0.92)
            X = barrel_x(y, z)
            ex = lerp(0.034, X - 0.024, smooth(u * 1.15))
            if i < 8:
                ex *= 1 - 0.93 * smooth((u - 0.84) / 0.16)
            pts.append(Vector((sx * ex, y, z)))
        rib = loft(pts, lambda t, a=0.0125 if i < 15 else 0.011: a * (0.8 + 0.4 * math.sin(math.pi * min(1, t * 1.3))), 0.0058, ref=(0, 1, 0), seg=8, caps=(True, True))
        mb_all.merge(rib)
bone_obj('Ribs', mb_all, 'Spine_Thoracic', hint='axis')

zs = lambda y: (rig.botz(y) or 0.88) + 0.028
sternum = loft([Vector((0, -0.55 + i * 0.5 / 12, zs(-0.55 + i * 0.5 / 12))) for i in range(13)], lambda t: 0.026 + 0.012 * math.sin(math.pi * t), lambda t: 0.014 + 0.008 * math.sin(math.pi * t), ref=(1, 0, 0), seg=10)
bone_obj('Sternum', sternum, 'Spine_Thoracic')

# ---------------------------------------------------------------- skull and jaw, measured on the sagittal profile of the coat head
def head_profile(y):
    t = rig.ray((0, y, 3.0), (0, 0, -1))
    b = rig.ray((0, y, 0.6), (0, 0, 1))
    if not t or not b:
        return None
    zt, zb = t[0].z, b[0].z
    hw = rig.halfwidth(y, (zt + zb) / 2) or 0.07
    return zt, zb, hw


ys = [-1.352 + 0.0245 * k for k in range(15)]          # nose tip back to the poll
prof = [(y, head_profile(y)) for y in ys]
prof = [(y, p) for y, p in prof if p]
sk_c, sk_rx, sk_ry = [], [], []
for y, (zt, zb, hw) in prof:
    t = (y - ys[0]) / (ys[-1] - ys[0])
    H = zt - zb
    top = zt - 0.007
    bot = top - 0.60 * H if t > 0.15 else top - 0.78 * H
    sk_c.append(Vector((0.0, y, (top + bot) / 2)))
    sk_ry.append((top - bot) / 2)
    sk_rx.append(hw * (0.50 + 0.30 * smooth(t / 0.55)))


def interp(arr, t):
    x = t * (len(arr) - 1)
    k = min(int(x), len(arr) - 2)
    return lerp(arr[k], arr[k + 1], x - k)


dense = catmull(sk_c, 36)
mb = loft(dense, lambda t: interp(sk_rx, t), lambda t: interp(sk_ry, t), ref=(1, 0, 0), seg=16)
for s_ in (-1, 1):   # zygomatic arches and orbital rims
    eye = rig.head('Eye_L' if s_ > 0 else 'Eye_R')
    eye_in = eye - Vector((s_ * 0.022, 0, 0))
    mb.merge(loft([eye_in + Vector((s_ * 0.004, 0.07, -0.02)), eye_in + Vector((s_ * 0.012, 0.0, -0.046)), eye_in + Vector((s_ * 0.004, -0.075, -0.06))], 0.011, 0.0085, ref=(0, 1, 0), seg=8))
    ax = basis_along(Vector((s_, 0, 0)), (0, 1, 0))
    pts = [eye_in + ax @ Vector((0.034 * math.cos(a), 0.034 * math.sin(a), 0)) for a in [i * 2 * math.pi / 14 for i in range(15)]]
    mb.merge(loft(pts, 0.0065, 0.0065, seg=6, caps=(False, False)))
bone_obj('Skull', mb, 'Head', margin=0.010, hint='axis')

mb = MB()
yb = [-1.33 + 0.03 * k for k in range(10)]
for s_ in (-1, 1):
    pts = []
    for y in yb:
        pr = head_profile(y)
        if not pr:
            continue
        zt, zb, hw = pr
        t = (y + 1.33) / 0.27
        pts.append(Vector((s_ * hw * (0.30 + 0.30 * smooth(t / 0.6)), y, zb + 0.038 + 0.012 * smooth(t))))
    mb.merge(loft(pts, 0.016, lambda t: 0.021 + 0.012 * t, ref=(1, 0, 0), seg=10))
    pr = head_profile(-1.0)
    top_ramus = Vector((s_ * 0.052, -1.04, (head_profile(-1.04)[0]) - 0.15))
    mb.merge(loft([pts[-1], pts[-1].lerp(top_ramus, 0.5) + Vector((0, 0.01, 0)), top_ramus], 0.026, 0.0085, ref=(0, 1, 0), seg=8))
bone_obj('Mandible', mb, 'Head', margin=0.010, hint='axis')

mb = MB()
zv0 = sk_c[0].z - sk_ry[0]
for k in range(6):
    mb.merge(blob(Vector((-0.0275 + k * 0.011, -1.335, zv0 - 0.004)), (0.0055, 0.009, 0.015)))
    mb.merge(blob(Vector((-0.0275 + k * 0.011, -1.332, zv0 - 0.024)), (0.0055, 0.009, 0.014)))
for s_ in (-1, 1):
    for k in range(6):
        y = -1.245 + k * 0.032
        pr = head_profile(y)
        zt, zb, hw = pr
        mb.merge(blob(Vector((s_ * 0.036, y, zb + 0.062)), (0.012, 0.0155, 0.017)))
bone_obj('Teeth', mb, 'Head', margin=0.003, hint='axis')

# ---------------------------------------------------------------- report and save
n, outn, worst = inside_report(rig, [o for o in made if not o.name.startswith('Bone_Caudal')])
tris = sum(len(o.data.polygons) for o in made)
print('SKELETON objects', len(made), 'verts', n, 'outside coat', outn, 'worst cm %.2f' % worst, 'polys', tris)
save(out)
