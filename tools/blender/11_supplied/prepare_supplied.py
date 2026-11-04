# The eight supplied image-to-3D models (4 Nov 2026): prepare one for the web.
# Like 07_statue/prepare_statue.py, with one step added first: duplicate vertices are welded. These meshes carry about 40 % more
# vertices than they need (one per normal or UV break), and decimating without welding tears the surface into shards.
# usage: blender -b -P prepare_supplied.py -- <in.glb> <out.glb> [max_tris=250000] [tex=2048]
import bpy, bmesh, sys
argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
max_tris = int(argv[2]) if len(argv) > 2 else 250000
tex = int(argv[3]) if len(argv) > 3 else 2048
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bm = bmesh.new(); bm.from_mesh(ob.data)
n0 = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
print('WELD', n0, '->', len(bm.verts))
bm.to_mesh(ob.data); bm.free()
tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
if tris > max_tris:
    mod = ob.modifiers.new('dec', 'DECIMATE')
    mod.ratio = max_tris / tris
    bpy.ops.object.modifier_apply(modifier=mod.name)
print('TRIS', tris, '->', sum(len(p.vertices) - 2 for p in ob.data.polygons), tuple(round(d, 3) for d in ob.dimensions))
for p in ob.data.polygons:
    p.use_smooth = True
for im in bpy.data.images:
    if im.size[0] > tex:
        im.scale(tex, tex)
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12,
    export_image_format='WEBP', export_image_quality=85, export_animations=False, export_yup=True, export_cameras=False, export_lights=False)
print('EXPORTED', out)
