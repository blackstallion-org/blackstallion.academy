# Stage 10: export the hybrid (body + ears, hair cards, eyes) with its rig and clips as a Draco + WebP GLB.
# usage: blender -b --factory-startup -P stage10_export.py -- in.blend out.glb tex_size [hair_tex_size]
import bpy, sys
argv = sys.argv[sys.argv.index('--')+1:]
blend, out, tex = argv[0], argv[1], int(argv[2]); hair_tex = int(argv[3]) if len(argv) > 3 else max(256, tex // 2)
bpy.ops.wm.open_mainfile(filepath=blend)
vl = bpy.context.view_layer
keep = {'Marwari_Low', 'Marwari_Hair', 'Marwari_Eyes', 'MarwariRig'}
for ob in list(bpy.context.scene.objects):
    if ob.name not in keep: bpy.data.objects.remove(ob)
arm = bpy.data.objects['MarwariRig']
for im in bpy.data.images:
    if im.size[0] == 0: continue
    target = hair_tex if im.name == 'marwari_hair' else tex
    if im.size[0] > target: im.scale(target, target)
arm.animation_data.action = None
for t in arm.animation_data.nla_tracks: t.mute = True
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
print('EXPORT_TRIS', tris)
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.context.scene.objects: ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12, export_draco_generic_quantization=10,
    export_image_format='WEBP', export_image_quality=84,
    export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=False, export_optimize_animation_size=True,
    export_def_bones=False, export_skins=True, export_morph=False, export_apply=False, export_yup=True,
    export_tangents=False, export_cameras=False, export_lights=False)
