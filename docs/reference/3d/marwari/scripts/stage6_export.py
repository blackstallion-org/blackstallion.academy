# Stage 6: export a GLB (Draco geometry, WebP textures, skin + named clips). args: blend out.glb decimate_ratio tex_size [save.blend]
import bpy, sys
argv = sys.argv[sys.argv.index('--')+1:]
blend, out, ratio, tex = argv[0], argv[1], float(argv[2]), int(argv[3])
bpy.ops.wm.open_mainfile(filepath=blend)
o = bpy.data.objects['Marwari']; arm = bpy.data.objects['MarwariRig']; vl = bpy.context.view_layer
for ob in list(bpy.context.scene.objects):
    if ob not in (o, arm): bpy.data.objects.remove(ob)
if ratio < 1:
    vl.objects.active = o
    m = o.modifiers.new('dec','DECIMATE'); m.ratio = ratio; m.use_collapse_triangulate = True
    bpy.ops.object.modifier_move_to_index(modifier='dec', index=0)
    bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
# any vertex left without influence takes the weights of its nearest weighted neighbour
import mathutils
kd = mathutils.kdtree.KDTree(len(o.data.vertices)); good = []
for v in o.data.vertices:
    if sum(g.weight for g in v.groups) > 1e-4: kd.insert(v.co, v.index); good.append(v.index)
kd.balance(); fixed = 0
for v in o.data.vertices:
    if sum(g.weight for g in v.groups) <= 1e-4:
        for co, i, d in kd.find_n(v.co, 3):
            src = o.data.vertices[i]
            if sum(g.weight for g in src.groups) > 1e-4:
                for g in src.groups: o.vertex_groups[g.group].add([v.index], g.weight, 'REPLACE')
                fixed += 1; break
print('FIXED_ZERO', fixed)
for im in bpy.data.images:
    if im.size[0] > tex: im.scale(tex, tex)
arm.animation_data.action = None
for t in arm.animation_data.nla_tracks: t.mute = True
print('TRIS', len(o.data.polygons), 'VERTS', len(o.data.vertices))
if len(argv) > 4:
    bpy.ops.file.pack_all(); bpy.ops.wm.save_as_mainfile(filepath=argv[4], compress=True)
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); arm.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12, export_draco_generic_quantization=10,
    export_image_format='WEBP', export_image_quality=82,
    export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=False,
    export_optimize_animation_size=True, export_def_bones=False, export_skins=True,
    export_morph=False, export_apply=False, export_yup=True, export_tangents=False,
    export_cameras=False, export_lights=False)
