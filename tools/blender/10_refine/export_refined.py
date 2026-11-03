# Export the refined working copy exactly as stage10_export.py exports the master (Draco + WebP, same settings, same objects),
# with one addition: a shape key mix on a mesh is written into its exported positions (the site does not use morph targets, and
# stage10 exports with export_morph=False), so the refined anatomy ships without changing the loader. Nothing is saved.
# usage: blender -b --factory-startup -P export_refined.py -- in.blend out.glb tex_size [hair_tex_size]
import bpy, sys
argv = sys.argv[sys.argv.index('--') + 1:]
blend, out, tex = argv[0], argv[1], int(argv[2]); hair_tex = int(argv[3]) if len(argv) > 3 else max(256, tex // 2)
bpy.ops.wm.open_mainfile(filepath=blend)
keep = {'Marwari_Low', 'Marwari_Hair', 'Marwari_Eyes', 'MarwariRig'}
# added hair cards live in their own objects in the source (removable); they ship as part of the one hair mesh the loader expects
adds = [o for o in bpy.context.scene.objects if o.name.startswith('Marwari_Hair_Add')]
if adds:
    hair = bpy.data.objects['Marwari_Hair']
    with bpy.context.temp_override(active_object=hair, selected_editable_objects=[hair] + adds):
        bpy.ops.object.join()
    print('JOINED', [a.name for a in adds] if False else len(adds), 'added hair objects')
for ob in list(bpy.context.scene.objects):
    if ob.name not in keep: bpy.data.objects.remove(ob)
for ob in bpy.context.scene.objects:
    keys = ob.data.shape_keys if ob.type == 'MESH' else None
    if keys:
        basis = keys.reference_key
        mix = [v.co.copy() for v in basis.data]
        for kb in keys.key_blocks:
            if kb == basis or kb.mute or kb.value == 0: continue
            for i, d in enumerate(kb.data): mix[i] += (d.co - basis.data[i].co) * kb.value
        ob.shape_key_clear()
        for v, c in zip(ob.data.vertices, mix): v.co = c
        ob.data.update()
        print('BAKED_KEYS', ob.name)
arm = bpy.data.objects['MarwariRig']
for im in bpy.data.images:
    if im.size[0] == 0 or im.users == 0: continue
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
