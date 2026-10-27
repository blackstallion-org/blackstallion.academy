# Stage B: the muscle layer. Each muscle is carved out of the coat's own surface (so it deforms with the coat's skin weights and
# cannot float outside it): the faces whose centres lie within a spindle around the muscle's path, inset along the coat's normals,
# deeper toward the borders so the fascia shows as a seam. Paths are placed from the rig's joints and snapped to the coat.
# usage: blender -b <skeleton.blend> -P build_muscles.py -- <out.blend>
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

out = sys.argv[sys.argv.index('--') + 1]
rig = Rig()
me = rig.coat.data
me.calc_loop_triangles()
NF = len(me.polygons)
C = np.array([tuple(p.center) for p in me.polygons])
NR = np.array([tuple(p.normal) for p in me.polygons])
VN = np.array([tuple(v.normal) for v in me.vertices])
VP = np.array([tuple(v.co) for v in me.vertices])
FV = [tuple(p.vertices) for p in me.polygons]
gname = {g.index: g.name for g in rig.coat.vertex_groups}


def H(n, t=0.0):
    return rig.along(n, t)


def V(x, y, z):
    return Vector((x, y, z))


def snap(p):
    loc, n, i, d = rig.bvh.find_nearest(Vector(p))
    return loc


# --------------------------------------------------------------------- the muscle table (left side; the right side mirrors x)
# name, label, region, kind, path (rough points, snapped to the coat), half-width, outward hint, priority
sh_t = lambda t: H('Scapula_L', t)
M = []


def muscle(name, label, region, path, w, hint, kind='muscle', prio=0.0, inset=0.013):
    M.append(dict(name=name, label=label, region=region, path=path, w=w, hint=Vector(hint).normalized(), kind=kind, prio=prio, inset=inset))


# neck and head
muscle('Splenius', 'Splenius', 'poll_cervical', [V(0.06, -1.04, 2.02), H('Neck_3') + V(0.05, 0, 0.13), H('Neck_2') + V(0.07, 0, 0.12), H('Neck_1') + V(0.08, -0.02, 0.14)], 0.05, (0.6, 0, 0.8))
muscle('Brachiocephalicus', 'Brachiocephalicus', 'poll_cervical', [H('Head') + V(0.09, 0.03, -0.10), H('Neck_3') + V(0.10, 0, -0.02), H('Neck_2') + V(0.11, 0, -0.04), H('Neck_1') + V(0.12, -0.04, -0.06), H('Humerus_L') + V(0.07, -0.05, 0.0)], 0.05, (1, 0, 0), prio=0.05)
muscle('Sternocephalicus', 'Sternocephalicus', 'poll_cervical', [H('Head') + V(0.04, 0.02, -0.19), H('Neck_3') + V(0.04, 0, -0.17), H('Neck_2') + V(0.05, -0.02, -0.15), H('Neck_1') + V(0.04, -0.12, -0.2)], 0.034, (0.2, -0.3, -1))
muscle('Masseter', 'Masseter', 'poll_cervical', [V(0.075, -1.16, 1.93), V(0.075, -1.07, 1.72)], 0.06, (1, 0, 0), prio=0.1)
# shoulder, arm and forearm
muscle('Trapezius', 'Trapezius', 'withers_thorax', [H('Neck_2') + V(0.07, 0, 0.10), sh_t(0.0) + V(0.05, -0.02, 0.07), sh_t(0.45) + V(0.075, 0.03, 0.0)], 0.07, (0.5, 0, 0.9), prio=0.02)
muscle('Supraspinatus', 'Supraspinatus', 'withers_thorax', [sh_t(0.05) + V(0.07, -0.05, 0.0), sh_t(0.80) + V(0.07, -0.04, 0.0)], 0.036, (1, -0.2, 0))
muscle('Infraspinatus', 'Infraspinatus', 'withers_thorax', [sh_t(0.1) + V(0.07, 0.05, 0.0), sh_t(0.85) + V(0.07, 0.04, 0.0)], 0.04, (1, 0.2, 0))
muscle('Deltoideus', 'Deltoideus', 'withers_thorax', [sh_t(0.55) + V(0.08, 0.03, 0.0), H('Humerus_L', 0.45) + V(0.07, 0.0, 0.0)], 0.04, (1, 0, 0))
muscle('Triceps_brachii', 'Triceps brachii', 'withers_thorax', [sh_t(0.5) + V(0.07, 0.09, 0.0), H('Humerus_L', 0.5) + V(0.06, 0.09, 0.0), H('Forearm_L') + V(0.05, 0.075, 0.02)], 0.065, (0.7, 0.7, 0))
muscle('Pectoralis', 'Pectoralis', 'withers_thorax', [V(0.05, -0.62, 1.02), H('Humerus_L') + V(0.05, -0.09, -0.04)], 0.055, (0.3, -1, -0.2))
muscle('Latissimus_dorsi', 'Latissimus dorsi', 'withers_thorax', [V(0.11, -0.05, 1.42), V(0.2, -0.22, 1.12), H('Humerus_L', 0.55) + V(0.08, 0.06, 0.0)], 0.06, (1, 0.1, 0.2))
muscle('Serratus_ventralis', 'Serratus ventralis', 'withers_thorax', [V(0.25, -0.42, 1.06), V(0.25, -0.12, 1.16)], 0.055, (1, 0, 0))
muscle('Extensor_carpi_radialis', 'Extensor carpi radialis', 'withers_thorax', [H('Humerus_L', 1.0) + V(0.04, -0.05, 0.0), H('Forearm_L', 1.0) + V(0.0, -0.036, 0.0)], 0.032, (0, -1, 0))
muscle('Flexor_carpi', 'Carpal flexors', 'withers_thorax', [H('Humerus_L', 1.0) + V(0.03, 0.05, 0.0), H('Forearm_L', 1.0) + V(0.0, 0.034, 0.0)], 0.03, (0, 1, 0))
muscle('Extensor_tendon_fore', 'Extensor tendon', 'withers_thorax', [H('Forearm_L', 1.0) + V(0.0, -0.03, 0.0), H('Pastern_F_L') + V(0.0, -0.024, 0.0)], 0.012, (0, -1, 0), kind='tendon', prio=0.1, inset=0.003)
muscle('Flexor_tendons_fore', 'Flexor tendons', 'withers_thorax', [H('Forearm_L', 1.0) + V(0.0, 0.03, 0.0), H('Pastern_F_L') + V(0.0, 0.03, 0.0)], 0.018, (0, 1, 0), kind='tendon', prio=0.1, inset=0.003)
# trunk
muscle('Longissimus_dorsi', 'Longissimus dorsi', 'thoracolumbar', [V(0.075, 0.36, 1.46), V(0.075, 0.1, 1.45), V(0.075, -0.14, 1.46), V(0.08, -0.32, 1.52)], 0.06, (0.3, 0, 1))
muscle('External_oblique', 'External abdominal oblique', 'thoracolumbar', [V(0.23, -0.06, 1.0), V(0.22, 0.12, 1.04), V(0.2, 0.28, 1.1)], 0.085, (1, 0, -0.1))
muscle('Rectus_abdominis', 'Rectus abdominis', 'thoracolumbar', [V(0.05, -0.28, 0.86), V(0.05, 0.1, 0.9), V(0.05, 0.3, 0.98)], 0.06, (0.2, 0, -1))
# hindquarter
muscle('Gluteus_medius', 'Gluteus medius', 'lumbosacral_pelvis', [V(0.07, 0.14, 1.5), V(0.11, 0.3, 1.5), V(0.2, 0.38, 1.3)], 0.07, (0.5, 0, 0.85))
muscle('Tensor_fasciae_latae', 'Tensor fasciae latae', 'lumbosacral_pelvis', [V(0.22, 0.1, 1.38), V(0.26, 0.12, 1.18), H('Femur_L', 1.0) + V(0.03, -0.03, 0.04)], 0.048, (1, -0.4, 0))
muscle('Quadriceps', 'Quadriceps', 'lumbosacral_pelvis', [V(0.25, 0.16, 1.12), H('Femur_L', 1.0) + V(0.04, -0.02, 0.0)], 0.05, (1, -0.5, 0))
muscle('Biceps_femoris', 'Biceps femoris', 'lumbosacral_pelvis', [V(0.12, 0.42, 1.46), V(0.25, 0.47, 1.18), H('Femur_L', 1.0) + V(0.03, 0.14, -0.02), H('Gaskin_L', 0.4) + V(0.02, 0.09, 0.0)], 0.08, (1, 0.5, 0), prio=0.02)
muscle('Semitendinosus', 'Semitendinosus', 'lumbosacral_pelvis', [V(0.09, 0.63, 1.26), V(0.13, 0.62, 1.04), H('Gaskin_L', 0.25) + V(0.02, 0.1, 0.0)], 0.05, (0.3, 1, 0))
muscle('Gastrocnemius', 'Gastrocnemius', 'lumbosacral_pelvis', [H('Femur_L', 1.0) + V(0.03, 0.15, -0.04), H('Gaskin_L', 0.55) + V(0.0, 0.1, 0.0), H('Gaskin_L', 1.0) + V(0.0, 0.05, 0.04)], 0.045, (0.4, 1, 0))
muscle('Extensor_digitorum_longus', 'Cranial tibial group', 'lumbosacral_pelvis', [H('Femur_L', 1.0) + V(0.03, -0.01, -0.04), H('Gaskin_L', 1.0) + V(0.0, -0.03, 0.05)], 0.032, (0.3, -1, 0))
muscle('Achilles_tendon', 'Achilles tendon', 'lumbosacral_pelvis', [H('Gaskin_L', 1.0) + V(0.0, 0.05, 0.1), H('Gaskin_L', 1.0) + V(0.0, 0.06, -0.02)], 0.014, (0, 1, 0), kind='tendon', prio=0.1, inset=0.003)
muscle('Flexor_tendons_hind', 'Flexor tendons', 'lumbosacral_pelvis', [H('Gaskin_L', 1.0) + V(0.0, 0.04, -0.03), H('Pastern_B_L') + V(0.0, 0.034, 0.0)], 0.018, (0, 1, 0), kind='tendon', prio=0.1, inset=0.003)
muscle('Extensor_tendon_hind', 'Extensor tendon', 'lumbosacral_pelvis', [H('Gaskin_L', 1.0) + V(0.0, -0.03, 0.0), H('Pastern_B_L') + V(0.0, -0.024, 0.0)], 0.012, (0, -1, 0), kind='tendon', prio=0.1, inset=0.003)

# --------------------------------------------------------------------- assign every coat face to its best muscle
units = []
for m in M:
    for side in (1.0, -1.0):
        pts = [snap(Vector((side * p.x, p.y, p.z))) for p in m['path']]
        hint = Vector((side * m['hint'].x, m['hint'].y, m['hint'].z))
        units.append(dict(m=m, side=side, pts=np.array([tuple(p) for p in pts]), hint=np.array(tuple(hint))))
WS = 1.55   # widen the table's half-widths so the muscles tile the surface
best = np.full(NF, 9.0)
owner = np.full(NF, -1)
tpar = np.zeros(NF)
for ui, u in enumerate(units):
    P = u['pts']
    seg = P[1:] - P[:-1]
    L = np.linalg.norm(seg, axis=1)
    cum = np.concatenate([[0], np.cumsum(L)])
    tot = cum[-1]
    dmin = np.full(NF, 9.0)
    tt = np.zeros(NF)
    for k in range(len(seg)):
        ab = seg[k]
        tk = np.clip(((C - P[k]) @ ab) / (ab @ ab), 0, 1)
        cl = P[k] + tk[:, None] * ab
        d = np.linalg.norm(C - cl, axis=1)
        sel = d < dmin
        dmin = np.where(sel, d, dmin)
        tt = np.where(sel, (cum[k] + tk * L[k]) / tot, tt)
    raw0 = ((C - P[0]) @ seg[0]) / (seg[0] @ seg[0])
    raw1 = ((C - P[-2]) @ seg[-1]) / (seg[-1] @ seg[-1])
    w = u['m']['w'] * WS * (0.4 + 0.6 * np.sin(np.pi * np.clip(tt, 0, 1)) ** 0.6) if u['m']['kind'] == 'muscle' else np.full(NF, u['m']['w'])
    score = dmin / w - u['m']['prio']
    ok = (score < 1.0 - u['m']['prio']) & (NR @ u['hint'] / np.linalg.norm(u['hint']) > 0.2) & (raw0 > -0.03) & (raw1 < 1.03)
    take = ok & (score < best)
    owner = np.where(take, ui, owner)
    best = np.where(take, score, best)
    tpar = np.where(take, tt, tpar)
    u['score'] = score
    u['facing'] = (NR @ u['hint'] / np.linalg.norm(u['hint']) > -0.15) & (raw0 > -0.25) & (raw1 < 1.25)

# gaps between the strict spindles go to the nearest muscle (never to a tendon), so the muscles tile the surface and the fascia only shows at seams
loose = np.full(NF, 9.0)
lown = np.full(NF, -1)
for ui, u in enumerate(units):
    if u['m']['kind'] != 'muscle':
        continue
    sc = np.where(u['facing'], u['score'], 9.0)
    take = sc < loose
    loose = np.where(take, sc, loose)
    lown = np.where(take, ui, lown)
fill = (owner < 0) & (loose < 2.6)
owner = np.where(fill, lown, owner)
best = np.where(fill, loose, best)
for ui, u in enumerate(units):
    pass

# --------------------------------------------------------------------- build the patches
def proj(u, p, n):
    """(t along the path 0..1, |offset| / half-width, signed side) of a point against a muscle path."""
    P = u['pts']
    best_d, best_t, best_sgn = 9.0, 0.0, 1.0
    seg = P[1:] - P[:-1]
    L = np.linalg.norm(seg, axis=1)
    cum = np.concatenate([[0], np.cumsum(L)])
    for k in range(len(seg)):
        tk = float(np.clip(((p - P[k]) @ seg[k]) / (seg[k] @ seg[k]), 0, 1))
        cl = P[k] + tk * seg[k]
        d = float(np.linalg.norm(p - cl))
        if d < best_d:
            best_d, best_t = d, (cum[k] + tk * L[k]) / cum[-1]
            best_sgn = 1.0 if np.dot(np.cross(p - cl, seg[k]), n) >= 0 else -1.0
    m = u['m']
    w = m['w'] * (0.4 + 0.6 * math.sin(math.pi * min(1, max(0, best_t))) ** 0.6) if m['kind'] == 'muscle' else m['w']
    return best_t, min(1.0, best_d / w), best_sgn


def build_patch(faces, inset_fn):
    verts = sorted({v for fi in faces for v in FV[fi]})
    idx = {v: i for i, v in enumerate(verts)}
    mb = MB()
    wts = []
    for v in verts:
        mb.v.append(Vector(tuple(VP[v] - VN[v] * inset_fn(v))))
        wts.append({gname[g.group]: g.weight for g in me.vertices[v].groups if g.weight > 1e-4})
    mb.f = [tuple(idx[v] for v in FV[fi]) for fi in faces]
    mb.c = [None] * len(verts)
    return mb, wts, verts


made = []
cov = 0
stats = []
for m in M:
    faces = [i for i in range(NF) if owner[i] >= 0 and units[owner[i]]['m'] is m]
    stats.append((m['name'], len(faces)))
    if len(faces) < 6:
        continue
    cov += len(faces)
    vunit = {}
    for fi in faces:
        for v in FV[fi]:
            vunit.setdefault(v, owner[fi])
    par = {v: proj(units[ui], VP[v], VN[v]) for v, ui in vunit.items()}
    inset = lambda v, m=m, par=par: m['inset'] + (0.013 if m['kind'] == 'muscle' else 0.002) * par[v][1] ** 2
    mb, wts, verts = build_patch(faces, inset)
    uv = [(par[v][0], 0.5 + 0.5 * par[v][1] * par[v][2]) for v in verts]
    mat = material('Tendon' if m['kind'] == 'tendon' else 'Muscle', (0.92, 0.82, 0.62) if m['kind'] == 'tendon' else (0.42, 0.13, 0.08), 0.55)
    made.append(make_object(rig, 'Muscle_' + m['name'], mb, mat, weights=wts, layer='muscle', extras=dict(region=m['region'], label=m['label'], kind=m['kind']), uvs=uv, closed=False))

# deep layer: everything the muscles leave open on the trunk and upper limbs (not the head, not below the carpus and hock)
deep = [i for i in range(NF) if owner[i] < 0 and not (C[i][1] < -0.97 and C[i][2] > 1.45) and C[i][2] > 0.55 and abs(C[i][0]) < 0.4]
deep = [i for i in deep if not (C[i][1] < -0.95 and C[i][2] > 1.4)]
mbd, wd, vd = build_patch(deep, lambda v: 0.030)
uvd = [(0.5, 0.5)] * len(vd)
made.append(make_object(rig, 'Muscle_Fascia', mbd, material('MuscleDeep', (0.24, 0.07, 0.045), 0.7), weights=wd, layer='muscle', extras=dict(region='thoracolumbar', label='Deep fascia', kind='deep'), uvs=uvd, closed=False))

n, outn, worst = inside_report(rig, made)
tri = sum(len(o.data.polygons) for o in made)
print('MUSCLES', len(made), 'faces assigned', cov, 'of', NF, 'deep', len(deep), 'verts', n, 'outside coat', outn, 'worst cm %.2f' % worst, 'polys', tri)
print('PER', [s for s in stats if s[1] < 40])
save(out)
