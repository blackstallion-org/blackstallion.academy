# Ear cups (Phase 10, 2 Nov 2026): the Marwari's ears were solid tubes with no opening, so close up they read as horns.
# This hollows the front face of each ear into a cup: vertices of the low coat mesh that belong to an ear and face its opening are
# pushed back along their normal by a share of the ear's local thickness (measured by a ray through the ear), deepest a third of
# the way up and closing to nothing at the rim, the base and the tip. The displacement is smoothed over the mesh so the cup has no
# steps. Rigging, UVs and weights are untouched (only vertex positions move).
# usage: blender -b -P ear_cup.py -- <in.blend> <out.blend>    env EAR_DEPTH (share of thickness, default 0.42), EAR_SMOOTH (passes, 3)
import bpy, bmesh, sys, os, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
DEPTH = float(os.environ.get('EAR_DEPTH', '0.55'))
PASSES = int(os.environ.get('EAR_SMOOTH', '3'))
bpy.ops.wm.open_mainfile(filepath=src)
ob = bpy.data.objects['Marwari_Low']
arm = bpy.data.objects['MarwariRig']
arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
me = ob.data
mw = ob.matrix_world
mwi = mw.inverted()
bm = bmesh.new()
bm.from_mesh(me)
bm.transform(mw)
bm.normal_update()
bm.verts.ensure_lookup_table()
bvh = BVHTree.FromBMesh(bm)
names = {g.index: g.name for g in ob.vertex_groups}
B = {b.name: (arm.matrix_world @ b.head_local, arm.matrix_world @ b.tail_local) for b in arm.data.bones}


def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


THIN = float(os.environ.get('EAR_THIN', '0.78'))   # front-to-back thickness kept above a third of the way up
TAPER = float(os.environ.get('EAR_TAPER', '0.62'))  # share of the radius taken off at the very tip (the tips were rounded knobs)


def closest_on(a, b, p):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return a + ab * t


def ear_h(p, side, w_base, w_tip):
    """Height along the ear following its two bones: 0 at the base, 0.55 where the tip segment starts, 1 at (and beyond) the tip."""
    a, b = B['Ear_' + side]
    c, d = B['Ear_Tip_' + side]
    if w_tip > w_base:
        t = (p - c).dot(d - c) / (d - c).length_squared
        return 0.55 + 0.45 * max(0.0, min(1.0, t))
    t = (p - a).dot(b - a) / (b - a).length_squared
    return 0.55 * max(0.0, min(1.0, t))


# 1. shape: a thinner ear and a pointed tip, measured from the ear's own bones (base segment and curled tip segment)
for side, S in (('L', 1.0), ('R', -1.0)):
    base, tip = B['Ear_' + side][0], B['Ear_Tip_' + side][1]
    axis = (tip - base).normalized()
    length = (tip - base).length
    opening = Vector((S * 0.3, -1.0, 0.0))
    opening = (opening - axis * opening.dot(axis)).normalized()
    for v in me.vertices:
        w_base = sum(g.weight for g in v.groups if names.get(g.group) == 'Ear_' + side)
        w_tip = sum(g.weight for g in v.groups if names.get(g.group) == 'Ear_Tip_' + side)
        w = w_base + w_tip
        if w < 0.5:
            continue
        bv = bm.verts[v.index]
        p = bv.co.copy()
        h = ear_h(p, side, w_base, w_tip)
        if h < 0.1:
            continue
        seg = B['Ear_Tip_' + side] if w_tip > w_base else B['Ear_' + side]
        c = closest_on(seg[0], seg[1], p)
        r = p - c
        k = min(1.0, w)
        thin = 1 - (1 - THIN) * smoothstep(0.15, 0.4, h) * k
        r = r - opening * (r.dot(opening) * (1 - thin))
        r = r * (1 - TAPER * smoothstep(0.6, 1.0, h) * k)
        bv.co = c + r
bm.normal_update()
bvh = BVHTree.FromBMesh(bm)

disp = {}
for side, S in (('L', 1.0), ('R', -1.0)):
    base, tip = B['Ear_' + side][0], B['Ear_Tip_' + side][1]
    axis = (tip - base).normalized()
    length = (tip - base).length
    opening = Vector((S * 0.3, -1.0, 0.0))
    opening = (opening - axis * opening.dot(axis)).normalized()
    n_side = 0
    for v in me.vertices:
        w = sum(g.weight for g in v.groups if names.get(g.group) in ('Ear_' + side, 'Ear_Tip_' + side))
        if w < 0.5:
            continue
        bv = bm.verts[v.index]
        p, n = bv.co.copy(), bv.normal.copy()
        h = (p - base).dot(axis) / length
        if h < 0.04 or h > 0.96:
            continue
        f = n.dot(opening)
        if f < 0.15:
            continue
        hit = bvh.ray_cast(p - n * 0.0015, -n, 0.12)
        if hit[0] is None:
            continue
        t = (hit[0] - p).length
        profile = math.sin(math.pi * max(0.0, min(1.0, h)) ** 0.7)
        d = min(DEPTH * t * profile * smoothstep(0.15, 0.65, f) * min(1.0, w), 0.55 * t)
        disp[v.index] = (-n) * d
        n_side += 1
    print('EARCUP', side, 'vertices moved', n_side)

# smooth the displacement field over the mesh edges (moved vertices only, their unmoved neighbours count as zero)
for _ in range(PASSES):
    nxt = {}
    for i, d in disp.items():
        acc, k = d.copy(), 1
        for e in bm.verts[i].link_edges:
            j = e.other_vert(bm.verts[i]).index
            acc += disp.get(j, Vector()) * 0.5
            k += 0.5
        nxt[i] = acc / k
    disp = nxt
deep = max((d.length for d in disp.values()), default=0)
for v in me.vertices:
    v.co = mwi @ (bm.verts[v.index].co + disp.get(v.index, Vector()))
me.update()
print('EARCUP deepest %.4f m over %d vertices' % (deep, len(disp)))
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
