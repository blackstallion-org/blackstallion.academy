# Retopology experiment: voxel-weld the rigged 213k mesh into a watertight shell, then Quadriflow it to a quad mesh.
# usage: blender -b --factory-startup -P retopo_quadriflow.py -- in.blend out.blend target_faces voxel
import bpy, sys, time, bmesh
argv = sys.argv[sys.argv.index('--')+1:]
blend, out, target, voxel = argv[0], argv[1], int(argv[2]), float(argv[3])
bpy.ops.wm.open_mainfile(filepath=blend)
src = bpy.data.objects['Marwari']; vl = bpy.context.view_layer
# the high-detail reference keeps its weights, material and UVs
hi = src; hi.name = 'Marwari_High'
tmp = hi.copy(); tmp.data = hi.data.copy(); tmp.name = 'Retopo_Source'; bpy.context.scene.collection.objects.link(tmp)
for m in list(tmp.modifiers): tmp.modifiers.remove(m)
tmp.parent = None
tmp.vertex_groups.clear() if hasattr(tmp.vertex_groups, 'clear') else None
vl.objects.active = tmp; bpy.ops.object.select_all(action='DESELECT'); tmp.select_set(True)
t = time.time()
m = tmp.modifiers.new('r', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.adaptivity = 0.0; m.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier='r')
print('VOXEL', len(tmp.data.vertices), len(tmp.data.polygons), round(time.time()-t,1), 's')
# drop floating specks left by the voxel pass (Quadriflow wants one clean shell)
bm = bmesh.new(); bm.from_mesh(tmp.data); bm.verts.ensure_lookup_table()
par = list(range(len(bm.verts)))
def _f(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
for e in bm.edges:
    x, y = _f(e.verts[0].index), _f(e.verts[1].index)
    if x != y: par[x] = y
import collections
cnt = collections.Counter(_f(v.index) for v in bm.verts)
keep = cnt.most_common(1)[0][0]
bmesh.ops.delete(bm, geom=[v for v in bm.verts if _f(v.index) != keep], context='VERTS')
print('COMPONENTS_DROPPED', len(cnt) - 1); bm.to_mesh(tmp.data); bm.free(); tmp.data.update()
# Quadriflow needs a manifold shell with consistent normals
def nonmanifold(o):
    bm = bmesh.new(); bm.from_mesh(o.data); n = sum(1 for e in bm.edges if not e.is_manifold); nv = sum(1 for v in bm.verts if not v.is_manifold); bm.free(); return n, nv
print('NONMANIFOLD_AFTER_VOXEL', nonmanifold(tmp))
for _ in range(4):
    bm = bmesh.new(); bm.from_mesh(tmp.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-6, edges=bm.edges)
    bad = {v for e in bm.edges if not e.is_manifold for v in e.verts}
    bad |= {v for v in bm.verts if not v.is_manifold}
    if bad: bmesh.ops.delete(bm, geom=list(bad), context='VERTS')
    bm.verts.ensure_lookup_table()
    holes = [e for e in bm.edges if e.is_boundary]
    if holes: bmesh.ops.holes_fill(bm, edges=holes, sides=64)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(tmp.data); bm.free(); tmp.data.update()
    nm = nonmanifold(tmp); print('NONMANIFOLD_PASS', nm)
    if nm == (0, 0): break
# the solver rejects the dense triangulated shell; a ~125k-triangle collapse-decimated copy goes through
m = tmp.modifiers.new('d', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = 0.27; m.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier='d')
print('PRE_QUADRIFLOW_TRIS', len(tmp.data.polygons))
t = time.time()
bpy.ops.object.quadriflow_remesh(target_faces=target, use_mesh_symmetry=False, use_preserve_sharp=False, use_preserve_boundary=False, smooth_normals=True, mode='FACES', seed=1)
me = tmp.data
quads = sum(1 for p in me.polygons if len(p.vertices) == 4)
print('QUADRIFLOW', len(me.vertices), 'verts', len(me.polygons), 'faces', quads, 'quads', round(time.time()-t,1), 's')
tmp.name = 'Marwari_Low'; tmp.data.name = 'Marwari_Low'
bpy.ops.wm.save_as_mainfile(filepath=out)
