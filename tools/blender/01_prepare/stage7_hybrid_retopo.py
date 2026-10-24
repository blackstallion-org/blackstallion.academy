# Stage 7: hybrid retopology.
#   body+head+legs : voxel shell -> Quadriflow quads (clean flow), weights transferred from the rigged detail mesh
#   ears, tail     : detail pieces cut from the original-derived mesh (Quadriflow cannot keep thin or curled parts)
# usage: blender -b --factory-startup -P stage7_hybrid_retopo.py -- in.blend out.blend body_faces voxel
import bpy, sys, bmesh, time, collections
import numpy as np
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
blend, out, body_faces, voxel = argv[0], argv[1], int(argv[2]), float(argv[3])
piece_scale = float(argv[4]) if len(argv) > 4 else 1.0
tail_piece = (argv[5] == '1') if len(argv) > 5 else False   # default: the tail becomes hair cards (stage 10)
bpy.ops.wm.open_mainfile(filepath=blend)
vl = bpy.context.view_layer; sc = bpy.context.scene
hi = bpy.data.objects['Marwari']; arm = bpy.data.objects['MarwariRig']
hi.name = 'Marwari_High'
for ob in vl.objects: ob.select_set(False)

def group_weight_sum(o, names):
    idx = {o.vertex_groups[n].index for n in names if n in o.vertex_groups}
    w = np.zeros(len(o.data.vertices), np.float32)
    for v in o.data.vertices:
        for g in v.groups:
            if g.group in idx: w[v.index] += g.weight
    return w

# ------------------------------------------------------------ pieces from the detail mesh
def extract(name, vmask, ratio):
    bm = bmesh.new(); bm.from_mesh(hi.data); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    keep = {f for f in bm.faces if all(vmask[v.index] for v in f.verts)}
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in keep], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob)
    # carry the vertex groups
    for g in hi.vertex_groups: ob.vertex_groups.new(name=g.name)
    ob.parent = None
    return ob
z = np.array([v.co.z for v in hi.data.vertices]); y = np.array([v.co.y for v in hi.data.vertices])
tailw = group_weight_sum(hi, ['Tail_1', 'Tail_2', 'Tail_3', 'Tail_4'])
ear_mask = (z > 2.005) & (y < -0.85)
tail_mask = tailw > 0.3
print('PIECE_VERTS', int(ear_mask.sum()), int(tail_mask.sum()))
pieces = []
for nm, mask, ratio in [('Piece_Ears', ear_mask, 0.35 * piece_scale)] + ([('Piece_Tail', tail_mask, 0.12 * piece_scale)] if tail_piece else []):
    ob = extract(nm, mask, ratio); pieces.append((ob, ratio))

# ------------------------------------------------------------ quad body
src = hi.copy(); src.data = hi.data.copy(); src.name = 'Body_Source'; sc.collection.objects.link(src)
for m in list(src.modifiers): src.modifiers.remove(m)
src.parent = None; src.vertex_groups.clear()
vl.objects.active = src; src.select_set(True)
m = src.modifiers.new('r', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.adaptivity = 0; m.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier='r')
bm = bmesh.new(); bm.from_mesh(src.data); bm.verts.ensure_lookup_table()
par = list(range(len(bm.verts)))
def f(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
for e in bm.edges:
    a, b = f(e.verts[0].index), f(e.verts[1].index)
    if a != b: par[a] = b
cnt = collections.Counter(f(v.index) for v in bm.verts); keep = cnt.most_common(1)[0][0]
bmesh.ops.delete(bm, geom=[v for v in bm.verts if f(v.index) != keep], context='VERTS')
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(src.data); bm.free()
dm = src.modifiers.new('d', 'DECIMATE'); dm.ratio = min(1.0, 125000 / (2 * len(src.data.polygons))); dm.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier='d')
t = time.time()
bpy.ops.object.quadriflow_remesh(target_faces=body_faces, mode='FACES', use_mesh_symmetry=False, use_preserve_sharp=False, use_preserve_boundary=False, smooth_normals=True, seed=1)
print('BODY_QUADS', len(src.data.polygons), round(time.time()-t, 1), 's')
src.name = 'Body_Quad'

# ------------------------------------------------------------ weights: nearest-surface transfer from the rigged detail mesh
def transfer(ob):
    for g in hi.vertex_groups:
        if g.name not in ob.vertex_groups: ob.vertex_groups.new(name=g.name)
    dt = ob.modifiers.new('dt', 'DATA_TRANSFER'); dt.object = hi; dt.use_vert_data = True; dt.data_types_verts = {'VGROUP_WEIGHTS'}
    dt.vert_mapping = 'POLYINTERP_NEAREST'; dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
    vl.objects.active = ob; bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier='dt')
for ob in [src] + [p for p, _ in pieces]: transfer(ob)

# cut the body where the detail pieces take over (ears above z 2.035, tail where its weight > 0.5)
bo = src; bm = bmesh.new(); bm.from_mesh(bo.data); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
tidx = {bo.vertex_groups[n].index for n in ('Tail_1', 'Tail_2', 'Tail_3', 'Tail_4')}
dl = bm.verts.layers.deform.verify()
def tw(v): return sum(w for g, w in v[dl].items() if g in tidx)
cut = [f for f in bm.faces if f.calc_center_median().z > 2.035 or sum(tw(v) for v in f.verts) / len(f.verts) > 0.5]
bmesh.ops.delete(bm, geom=cut, context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
# close the cut boundaries (ear bases, tail root) so the shell stays watertight; the pieces and cards overlap them
bm.edges.ensure_lookup_table()
bnd = [e for e in bm.edges if e.is_boundary]
if bnd:
    r = bmesh.ops.holes_fill(bm, edges=bnd, sides=240); print('HOLES_FILLED', len(r['faces']))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(bo.data); bm.free()
print('BODY_AFTER_CUT', len(bo.data.polygons), 'faces; cut', len(cut))

# decimate the pieces and join everything into one mesh
for ob, ratio in pieces:
    vl.objects.active = ob; bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
    dm = ob.modifiers.new('d', 'DECIMATE'); dm.ratio = ratio; dm.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='d')
    print('PIECE', ob.name, len(ob.data.polygons), 'tris')
bpy.ops.object.select_all(action='DESELECT')
for ob in [bo] + [p for p, _ in pieces]: ob.select_set(True)
vl.objects.active = bo; bpy.ops.object.join()
bo.name = 'Marwari_Low'; bo.data.name = 'Marwari_Low'
bpy.ops.object.shade_smooth()
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
print('LOW_TOTAL', len(bo.data.polygons), 'faces', sum(len(p.vertices) - 2 for p in bo.data.polygons), 'tris')
hi.hide_viewport = False
bpy.ops.wm.save_as_mainfile(filepath=out)
