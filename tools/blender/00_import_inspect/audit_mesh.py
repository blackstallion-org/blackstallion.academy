# Mesh health audit of a GLB: counts, welded-vertex manifold state, loose parts, normals, UV, texture facts.
# usage: blender -b --factory-startup -P audit_mesh.py -- model.glb
import bpy, bmesh, sys, json, numpy as np
src = sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
me = o.data
out = {'tris': len(me.polygons), 'verts_raw': len(me.vertices), 'uv_layers': len(me.uv_layers),
       'materials': [m.name for m in me.materials], 'images': [(i.name, list(i.size)) for i in bpy.data.images]}
bm = bmesh.new(); bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-5)
out['verts_welded'] = len(bm.verts)
bm.edges.ensure_lookup_table()
out['nonmanifold_edges_after_weld'] = sum(1 for e in bm.edges if not e.is_manifold)
out['boundary_edges'] = sum(1 for e in bm.edges if e.is_boundary)
# loose parts via union-find on welded verts
parent = list(range(len(bm.verts)))
def f(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
for e in bm.edges:
    a, b = f(e.verts[0].index), f(e.verts[1].index)
    if a != b: parent[a] = b
roots = {}
for v in bm.verts: roots.setdefault(f(v.index), []).append(v.index)
sizes = sorted((len(v) for v in roots.values()), reverse=True)
out['connected_components'] = len(sizes); out['largest_components'] = sizes[:8]
out['tiny_components(<50 verts)'] = sum(1 for s in sizes if s < 50)
# edge-length stats
el = np.array([e.calc_length() for e in bm.edges], np.float32)
out['edge_len_mm'] = {'p5': float(np.percentile(el,5)*1000), 'median': float(np.median(el)*1000), 'p95': float(np.percentile(el,95)*1000)}
# normals: faces whose normal opposes the vertex-average outward direction from the centroid of their component (crude)
co = np.array([v.co[:] for v in bm.verts], np.float32); ctr = co.mean(0)
bad = 0
for f_ in bm.faces:
    c = f_.calc_center_median(); n = f_.normal
    if f_.calc_area() > 1e-8 and np.dot(np.array(n[:]), np.array(c[:]) - ctr) < -0.2 * np.linalg.norm(np.array(c[:]) - ctr) and abs(c[2] - ctr[2]) < 0.1: bad += 1
out['faces_pointing_inward_near_midheight(crude)'] = bad
print('AUDIT', json.dumps(out))
