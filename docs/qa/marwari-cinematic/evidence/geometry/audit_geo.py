# Geometry / UV / skin / symmetry / intersection audit of the hero source blend (rest pose, base mesh, no modifiers).
# usage: blender -b --factory-startup file.blend -P audit_geo.py -- out.json
import bpy, bmesh, math, json, sys
import numpy as np
from mathutils import Vector, kdtree, bvhtree

out_path = sys.argv[sys.argv.index('--') + 1]
rig = bpy.data.objects['MarwariRig']
low = bpy.data.objects['Marwari_Low']
hair = bpy.data.objects['Marwari_Hair']
eyes = bpy.data.objects['Marwari_Eyes']
B = rig.data.bones
R = {}

def pct(a, ps=(5, 50, 95, 99)):
    a = np.asarray(a, dtype=np.float64)
    if a.size == 0:
        return {}
    return {f'p{p}': float(np.percentile(a, p)) for p in ps} | {'min': float(a.min()), 'max': float(a.max()), 'mean': float(a.mean())}

# ---- orientation: forward = from pelvis toward head, in the XY plane (Blender Z is up)
fwd = (B['Head'].head_local - B['Pelvis'].head_local)
fwd.z = 0
fwd.normalize()
up = Vector((0, 0, 1))
left = up.cross(fwd).normalized()  # horse's left
R['axes'] = {'forward': [round(c, 3) for c in fwd], 'left': [round(c, 3) for c in left]}
def F(v): return v.dot(fwd)
def L(v): return v.dot(left)

me = low.data
nv, nf, ne = len(me.vertices), len(me.polygons), len(me.edges)
co = np.empty(nv * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
R['counts'] = {'verts': nv, 'edges': ne, 'faces': nf,
               'quads': sum(1 for p in me.polygons if p.loop_total == 4), 'tris': sum(1 for p in me.polygons if p.loop_total == 3), 'ngons': sum(1 for p in me.polygons if p.loop_total > 4)}
R['counts']['triangles_after_triangulation'] = R['counts']['quads'] * 2 + R['counts']['tris']
R['bbox'] = {'min': [round(float(x), 3) for x in co.min(0)], 'max': [round(float(x), 3) for x in co.max(0)]}

# ---- edge lengths
ev = np.empty(ne * 2, dtype=np.int32); me.edges.foreach_get('vertices', ev); ev = ev.reshape(-1, 2)
el = np.linalg.norm(co[ev[:, 0]] - co[ev[:, 1]], axis=1) * 1000
R['edge_length_mm'] = pct(el)

# ---- bmesh: manifold, valence, flipped neighbours, tri quality
bm = bmesh.new(); bm.from_mesh(me)
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()
R['topology'] = {
    'non_manifold_edges': sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary),
    'boundary_edges': sum(1 for e in bm.edges if e.is_boundary),
    'loose_verts': sum(1 for v in bm.verts if not v.link_edges),
    'wire_edges': sum(1 for e in bm.edges if not e.link_faces),
}
# connected components
seen = set(); comps = []
for v in bm.verts:
    if v.index in seen: continue
    stack = [v]; seen.add(v.index); n = 0
    while stack:
        c = stack.pop(); n += 1
        for e in c.link_edges:
            o = e.other_vert(c)
            if o.index not in seen: seen.add(o.index); stack.append(o)
    comps.append(n)
R['topology']['connected_components'] = sorted(comps, reverse=True)[:12]
val = np.array([len(v.link_edges) for v in bm.verts])
R['valence'] = {'hist': {str(k): int((val == k).sum()) for k in range(1, 9)} | {'9+': int((val >= 9).sum())},
                'poles_3': int((val == 3).sum()), 'poles_5': int((val == 5).sum()), 'poles_6plus': int((val >= 6).sum()), 'regular_4_share': float((val == 4).mean())}
flip = 0
for e in bm.edges:
    if len(e.link_faces) == 2:
        if e.link_faces[0].normal.dot(e.link_faces[1].normal) < -0.5: flip += 1
R['normals'] = {'edges_with_opposed_neighbour_normals': flip}
# signed volume via triangulated faces
vol = 0.0
for p in me.polygons:
    vs = [co[i] for i in p.vertices]
    for k in range(1, len(vs) - 1):
        vol += np.dot(vs[0], np.cross(vs[k], vs[k + 1])) / 6.0
R['normals']['signed_volume_m3'] = round(vol, 4)
# triangle quality (after splitting quads)
minang, aspect = [], []
for p in me.polygons:
    vs = [Vector(co[i]) for i in p.vertices]
    tris = [(vs[0], vs[k], vs[k + 1]) for k in range(1, len(vs) - 1)]
    for a, b, c in tris:
        ea, eb, ec = (b - a).length, (c - b).length, (a - c).length
        if min(ea, eb, ec) < 1e-9: minang.append(0); aspect.append(1e9); continue
        ang = []
        for u, v in ((b - a, c - a), (a - b, c - b), (a - c, b - c)):
            ang.append(math.degrees(u.angle(v)))
        minang.append(min(ang)); aspect.append(max(ea, eb, ec) / min(ea, eb, ec))
minang = np.array(minang); aspect = np.array(aspect)
R['triangle_quality'] = {'min_angle_deg': pct(minang), 'edge_ratio': pct(aspect), 'tris_min_angle_lt_10deg': int((minang < 10).sum()), 'tris_edge_ratio_gt_4': int((aspect > 4).sum()), 'of': int(len(minang))}
# quad planarity
nonplanar = 0
for p in me.polygons:
    if p.loop_total == 4:
        vs = [Vector(co[i]) for i in p.vertices]
        n = (vs[2] - vs[0]).cross(vs[3] - vs[1])
        if n.length > 0:
            n.normalize(); h = abs((vs[1] - vs[0]).dot(n)) + abs((vs[3] - vs[0]).dot(n))
            e = np.mean([(vs[i] - vs[(i + 1) % 4]).length for i in range(4)])
            if h / max(e, 1e-9) > 0.25: nonplanar += 1
R['quads_strongly_nonplanar'] = nonplanar

# ---- UV
uvl = me.uv_layers.active
R['uv'] = {'layers': [u.name for u in me.uv_layers]}
uv = np.empty(len(me.loops) * 2); uvl.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
face_a3, face_auv, flipped, degenerate = [], [], 0, 0
face_region_idx = []
uv_tris = []
for p in me.polygons:
    ls = list(p.loop_indices)
    a3 = p.area
    auv = 0.0
    for k in range(1, len(ls) - 1):
        u0, u1, u2 = uv[ls[0]], uv[ls[k]], uv[ls[k + 1]]
        s = 0.5 * ((u1[0] - u0[0]) * (u2[1] - u0[1]) - (u2[0] - u0[0]) * (u1[1] - u0[1]))
        auv += s
        uv_tris.append((u0, u1, u2))
    face_a3.append(a3); face_auv.append(auv)
face_a3 = np.array(face_a3); face_auv = np.array(face_auv)
flipped = int((face_auv < -1e-10).sum()); degenerate = int((np.abs(face_auv) < 1e-10).sum())
good = (face_a3 > 1e-9) & (np.abs(face_auv) > 1e-10)
glob = np.abs(face_auv[good]).sum() / face_a3[good].sum()
logr = np.log2(np.abs(face_auv[good]) / face_a3[good] / glob)
R['uv'].update({'faces_flipped_in_uv': flipped, 'faces_degenerate_in_uv': degenerate,
                'stretch_log2': pct(logr), 'faces_stretched_2x': int((np.abs(logr) > 1).sum()), 'faces_stretched_4x': int((np.abs(logr) > 2).sum()), 'faces_considered': int(good.sum()),
                'uv_area_total': float(np.abs(face_auv).sum()), 'uv_bounds': [[float(uv[:, 0].min()), float(uv[:, 1].min())], [float(uv[:, 0].max()), float(uv[:, 1].max())]]})
# islands (faces connected through shared edges whose UVs coincide)
parent = list(range(nf))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
loop_uv = lambda loop: (round(float(uv[loop.index][0]), 5), round(float(uv[loop.index][1]), 5))
seams = 0
for e in bm.edges:
    if len(e.link_faces) != 2: continue
    f1, f2 = e.link_faces
    ok = True
    for v in e.verts:
        l1 = [l for l in f1.loops if l.vert == v][0]; l2 = [l for l in f2.loops if l.vert == v][0]
        if abs(uv[l1.index][0] - uv[l2.index][0]) > 1e-5 or abs(uv[l1.index][1] - uv[l2.index][1]) > 1e-5: ok = False; break
    if ok:
        a, b = find(f1.index), find(f2.index)
        if a != b: parent[a] = b
    else: seams += 1
isl = {}
for i in range(nf): isl.setdefault(find(i), []).append(i)
isl_area = sorted(((np.abs(face_auv[v]).sum()) for v in isl.values()), reverse=True)
R['uv'].update({'islands': len(isl), 'seam_edges': seams, 'largest_islands_uv_area': [round(float(a), 4) for a in isl_area[:6]], 'islands_smaller_than_0.0005_uv_area': int(sum(1 for a in isl_area if a < 0.0005))})
# overlap (rasterise at 1024^2)
G = 1024
cov = np.zeros((G, G), dtype=np.uint8)
for (u0, u1, u2) in uv_tris:
    xs = [u0[0] * G, u1[0] * G, u2[0] * G]; ys = [u0[1] * G, u1[1] * G, u2[1] * G]
    x0, x1 = max(int(math.floor(min(xs))), 0), min(int(math.ceil(max(xs))), G - 1)
    y0, y1 = max(int(math.floor(min(ys))), 0), min(int(math.ceil(max(ys))), G - 1)
    if x1 < x0 or y1 < y0: continue
    px, py = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
    if abs(d) < 1e-9: continue
    a = ((ys[1] - ys[2]) * (px - xs[2]) + (xs[2] - xs[1]) * (py - ys[2])) / d
    b = ((ys[2] - ys[0]) * (px - xs[2]) + (xs[0] - xs[2]) * (py - ys[2])) / d
    c = 1 - a - b
    m = (a > 0.02) & (b > 0.02) & (c > 0.02)
    cov[y0:y1 + 1, x0:x1 + 1] += m.astype(np.uint8)
R['uv']['covered_share_of_unit_square'] = round(float((cov > 0).mean()), 4)
R['uv']['overlapping_share_of_covered'] = round(float((cov > 1).sum() / max((cov > 0).sum(), 1)), 5)

# ---- regions by dominant vertex group
gname = {g.index: g.name for g in low.vertex_groups}
def region_of(name):
    n = name
    if n.startswith('Ear') or n.startswith('Eye') or n == 'Head': return 'head'
    if n.startswith('Neck') or n.startswith('Mane'): return 'neck'
    if n.startswith('Hoof'): return 'hooves'
    if n.startswith(('Pastern', 'Cannon')): return 'lower_legs'
    if n.startswith(('Forearm', 'Gaskin')): return 'mid_legs'
    if n.startswith(('Humerus', 'Femur', 'Scapula')): return 'upper_legs'
    if n.startswith('Tail'): return 'tail_root'
    return 'trunk'
W = [[(gname[g.group], g.weight) for g in v.groups if g.weight > 1e-4] for v in me.vertices]
dom = [max(w, key=lambda t: t[1])[0] if w else None for w in W]
vreg = [region_of(d) if d else 'unweighted' for d in dom]
vreg_arr = np.array(vreg)
# texel density per region (texels per metre at 2048 px), area-weighted by face
reg_dens = {}
freg = []
for p in me.polygons:
    rs = [vreg[i] for i in p.vertices]
    freg.append(max(set(rs), key=rs.count))
freg = np.array(freg)
for r in sorted(set(freg)):
    m = (freg == r) & good
    if m.sum() == 0: continue
    a3 = face_a3[m].sum(); au = np.abs(face_auv[m]).sum()
    reg_dens[r] = {'faces': int(m.sum()), 'area_m2': round(float(a3), 3), 'texels_per_cm_at_2048': round(float(math.sqrt(au * 2048 * 2048 / a3) / 100), 2), 'share_of_surface_area': round(float(a3 / face_a3[good].sum()), 3)}
R['texel_density'] = reg_dens
# mean edge length per region (mesh resolution)
rv = {}
for r in sorted(set(vreg)):
    idx = np.where(vreg_arr == r)[0]
    m = np.isin(ev[:, 0], idx) & np.isin(ev[:, 1], idx)
    rv[r] = {'verts': int(len(idx)), 'mean_edge_mm': round(float(el[m].mean()), 1) if m.any() else None}
R['region_resolution'] = rv

# ---- symmetry about x = 0 plane in the rest pose (left axis)
kd = kdtree.KDTree(nv)
for i in range(nv): kd.insert(Vector(co[i]), i)
kd.balance()
cx = float((co[:, 0].max() + co[:, 0].min()) / 2)
R['symmetry_plane_x'] = round(cx, 4)
d_m = np.empty(nv)
for i in range(nv):
    p = Vector((2 * cx - co[i][0], co[i][1], co[i][2]))
    d_m[i] = kd.find(p)[2]
d_m *= 1000
R['symmetry_mm'] = {'all': pct(d_m, (50, 90, 99)), 'share_over_10mm': float((d_m > 10).mean()), 'share_over_30mm': float((d_m > 30).mean())}
R['symmetry_by_region_mm'] = {r: {'p50': round(float(np.percentile(d_m[vreg_arr == r], 50)), 1), 'p90': round(float(np.percentile(d_m[vreg_arr == r], 90)), 1), 'max': round(float(d_m[vreg_arr == r].max()), 1)} for r in sorted(set(vreg)) if (vreg_arr == r).sum() > 20}

# ---- skin weights
infl = np.array([len(w) for w in W]); ws = np.array([sum(t[1] for t in w) for w in W])
R['skin'] = {'bones_in_groups': len(low.vertex_groups), 'unweighted_verts': int((infl == 0).sum()), 'influence_hist': {str(k): int((infl == k).sum()) for k in range(0, 9)}, 'max_influences': int(infl.max()),
             'weight_sum': pct(ws[infl > 0], (1, 50, 99)), 'verts_with_sum_off_by_gt_2pct': int((np.abs(ws[infl > 0] - 1) > 0.02).sum())}
# neighbour weight smoothness: mean |dw| over edges for each bone with >100 verts
wd = [dict(w) for w in W]
bones_cnt = {}
for d in wd:
    for k in d: bones_cnt[k] = bones_cnt.get(k, 0) + 1
big_jump = 0
for a, b in ev:
    da, db = wd[a], wd[b]
    keys = set(da) | set(db)
    if max(abs(da.get(k, 0) - db.get(k, 0)) for k in keys) > 0.5: big_jump += 1
R['skin']['edges_with_weight_jump_gt_0.5'] = int(big_jump)
# joint transition zones: vertices shared between a parent and child bone; extent along the bone axis
JOINTS = [('Humerus_L', 'Forearm_L', 'elbow L'), ('Forearm_L', 'Cannon_F_L', 'knee (carpus) L'), ('Cannon_F_L', 'Pastern_F_L', 'fetlock F L'), ('Pastern_F_L', 'Hoof_F_L', 'pastern/hoof F L'),
          ('Femur_L', 'Gaskin_L', 'stifle L'), ('Gaskin_L', 'Cannon_B_L', 'hock L'), ('Cannon_B_L', 'Pastern_B_L', 'fetlock H L'), ('Neck_1', 'Neck_2', 'neck 1-2'), ('Neck_2', 'Neck_3', 'neck 2-3'), ('Neck_3', 'Head', 'poll'), ('Spine_Lumbar', 'Spine_Thoracic', 'back')]
jz = {}
for a, b, label in JOINTS:
    if a not in B or b not in B: continue
    axis = (B[b].tail_local - B[a].head_local).normalized()
    pts = [co[i] for i, d in enumerate(wd) if d.get(a, 0) > 0.15 and d.get(b, 0) > 0.15]
    if not pts: jz[label] = {'verts': 0}; continue
    t = [float(Vector(p).dot(axis)) for p in pts]
    jz[label] = {'verts': len(pts), 'extent_along_bone_cm': round((max(t) - min(t)) * 100, 1)}
R['joint_transition_zones'] = jz

# ---- bones and proportions
def bl(n): return round(B[n].length, 3)
R['bone_lengths_m'] = {n: bl(n) for n in ['Neck_1', 'Neck_2', 'Neck_3', 'Head', 'Ear_L', 'Scapula_L', 'Humerus_L', 'Forearm_L', 'Cannon_F_L', 'Pastern_F_L', 'Hoof_F_L', 'Femur_L', 'Gaskin_L', 'Cannon_B_L', 'Pastern_B_L', 'Hoof_B_L', 'Spine_Lumbar', 'Spine_Thoracic']}
R['bone_heads'] = {n: [round(c, 3) for c in B[n].head_local] for n in ['Head', 'Neck_1', 'Neck_2', 'Neck_3', 'Scapula_L', 'Humerus_L', 'Pelvis', 'Spine_Thoracic', 'Femur_L', 'Ear_L', 'Ear_Tip_L', 'Eye_L', 'Eye_R']}
# measurements from the mesh
fc = co @ np.array([fwd.x, fwd.y, fwd.z]); lc = co @ np.array([left.x, left.y, left.z]); zc = co[:, 2]
sc = B['Scapula_L'].head_local
def wither():
    m = (np.abs(lc) < 0.12) & (np.abs(fc - F(sc)) < 0.18)
    return float(zc[m].max())
def croup():
    pel = B['Pelvis'].head_local
    m = (np.abs(lc) < 0.12) & (np.abs(fc - F(pel)) < 0.15)
    return float(zc[m].max())
chest = np.where((zc > 0.9) & (zc < 1.4) & np.isin(vreg_arr, ['upper_legs', 'trunk']) & (fc > F(sc) - 0.2))[0]
butt = np.where((zc > 0.9) & (zc < 1.5) & (fc < F(B['Pelvis'].head_local)))[0]
body_len = float(fc[chest].max() - fc[butt].min()) if len(chest) and len(butt) else None
headv = np.where(vreg_arr == 'head')[0]
R['proportions_m'] = {'height_at_withers': round(wither(), 3), 'height_at_croup': round(croup(), 3), 'highest_point_ears': round(float(zc.max()), 3), 'body_length_chest_to_buttock': round(body_len, 3) if body_len else None,
                      'overall_length_nose_to_buttock': round(float(fc.max() - fc.min()), 3), 'width_max': round(float(lc.max() - lc.min()), 3),
                      'head_length_poll_to_muzzle': round(float(fc[headv].max() - F(B['Head'].head_local)), 3),
                      'neck_length_bones': round(B['Neck_1'].length + B['Neck_2'].length + B['Neck_3'].length, 3),
                      'ear_length_bones': round(B['Ear_L'].length + (B['Ear_Tip_L'].length if 'Ear_Tip_L' in B else 0), 3),
                      'ear_tip_gap_L_R': round(float(abs(L(B['Ear_Tip_L'].tail_local) - L(B['Ear_Tip_R'].tail_local))), 3)}
R['proportions_m']['withers_to_body_length_ratio'] = round(R['proportions_m']['height_at_withers'] / body_len, 3) if body_len else None
R['proportions_m']['hands_at_withers'] = round(R['proportions_m']['height_at_withers'] / 0.1016, 1)

# ---- intersections and eye registration (rest pose, world = object space here)
def bvh_of(obj):
    m = obj.data
    verts = [v.co.copy() for v in m.vertices]
    polys = [tuple(p.vertices) for p in m.polygons]
    return bvhtree.BVHTree.FromPolygons(verts, polys, epsilon=0.0), verts
bl_, lv = bvh_of(low)
bh_, hv = bvh_of(hair)
be_, ev_ = bvh_of(eyes)
hair_hits = bl_.overlap(bh_)
R['intersections'] = {'hair_cards_vs_coat_triangle_pairs': len(hair_hits), 'hair_cards_touching_coat': len({b for a, b in hair_hits}), 'hair_cards_total': len(hair.data.polygons)}
eye_hits = bl_.overlap(be_)
R['intersections']['eye_domes_vs_coat_triangle_pairs'] = len(eye_hits)
eg = {g.index: g.name for g in eyes.vertex_groups}
eye_report = {}
for side in ('L', 'R'):
    idx = [v.index for v in eyes.data.vertices if any(eg[g.group] == f'Eye_{side}' and g.weight > 0.5 for g in v.groups)]
    if not idx: continue
    pts = [eyes.data.vertices[i].co.copy() for i in idx]
    c = sum(pts, Vector()) / len(pts)
    loc, nrm, fi, dist = bl_.find_nearest(c)
    outside = [((p - bl_.find_nearest(p)[0]).dot(bl_.find_nearest(p)[1]) > 0) for p in pts]
    # the extent of the dome (sphere radius)
    rad = max((p - c).length for p in pts)
    eye_report[side] = {'dome_centre': [round(x, 3) for x in c], 'dome_radius_cm': round(rad * 100, 2), 'centre_to_coat_surface_cm': round(dist * 100, 2),
                        'centre_is_outside_coat': bool((c - loc).dot(nrm) > 0), 'share_of_dome_verts_outside_coat': round(sum(outside) / len(outside), 2), 'verts': len(idx)}
R['eyes'] = eye_report
# the sculpted socket: deepest concavity near the eye bone, approximated by the coat vertex nearest to the bone head inside the head
eb = B['Eye_L'].head_local
ni = kd.find(eb)
R['eyes']['Eye_L_bone_head'] = [round(c, 3) for c in eb]
R['eyes']['coat_vertex_nearest_to_Eye_L_bone_cm'] = round(ni[2] * 100, 2)
json.dump(R, open(out_path, 'w'), indent=1)
print('AUDIT_DONE', out_path)
