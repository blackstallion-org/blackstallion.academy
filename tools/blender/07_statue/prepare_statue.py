# The cadet-and-Marwari statue (R20/R03, 2 Nov 2026): prepare a generated image-to-3D model for the web.
# Joins the meshes, decimates to a triangle budget, caps texture size, renders a front / three-quarter / side check and exports a
# Draco GLB with WebP textures.
# usage: blender -b -P prepare_statue.py -- <in.glb> <out.glb> <renders_dir> [max_tris=320000] [tex=2048]
import bpy, sys, os, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
src, out, rdir = argv[0], argv[1], argv[2]
max_tris = int(argv[3]) if len(argv) > 3 else 320000
tex = int(argv[4]) if len(argv) > 4 else 2048
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
meshes = [o for o in sc.objects if o.type == 'MESH']
for o in sc.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
print('STATUE in', tris, 'tris', tuple(round(d, 3) for d in ob.dimensions), [m.name for m in ob.data.materials])
if tris > max_tris:
    mod = ob.modifiers.new('dec', 'DECIMATE')
    mod.ratio = max_tris / tris
    bpy.ops.object.modifier_apply(modifier=mod.name)
    print('STATUE decimated to', sum(len(p.vertices) - 2 for p in ob.data.polygons))
for p in ob.data.polygons:
    p.use_smooth = True
for im in bpy.data.images:
    print('IMG', im.name, tuple(im.size))
    if im.size[0] > tex:
        im.scale(tex, tex)
ob.name = 'Statue'
# renders
os.makedirs(rdir, exist_ok=True)
bb = [ob.matrix_world @ mathutils.Vector(c) for c in ob.bound_box]
cen = sum(bb, mathutils.Vector()) / 8
h = max(c.z for c in bb) - min(c.z for c in bb)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50
for name, energy, rot in [('k', 3.2, (50, 0, 35)), ('r', 2.4, (60, 0, 200)), ('f', 1.0, (70, 0, -70))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN')); l.data.energy = energy; l.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.07, 0.06, 1)
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 800, 1000
for v, az in [('front', 0), ('q', 40), ('side', 90), ('qb', 220)]:
    a = math.radians(az)
    d = h * 2.3
    cam.location = cen + mathutils.Vector((math.sin(a) * d, -math.cos(a) * d, h * 0.1))
    cam.rotation_euler = (cen - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(rdir, f'statue_{v}.png')
    bpy.ops.render.render(write_still=True)
# close-up of the cadet's head and hands from the front three-quarter
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12,
    export_image_format='WEBP', export_image_quality=85, export_animations=False, export_yup=True, export_cameras=False, export_lights=False)
print('EXPORTED', out)
