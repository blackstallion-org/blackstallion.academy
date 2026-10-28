# Stage E: export the exhibit's two GLBs (Draco, WebP textures).
#   anatomy-exhibit.glb : the Marwari (coat, hair, eyes, rig, all clips) + Bone_* + Muscle_* + Tack_* (skinned to the same armature) + anchors
#   cadet-rider.glb     : CadetRig + Cadet_* (own skin) + rider anchors
# usage: blender -b <cadet.blend> -P export_exhibit.py -- <horse.glb> <rider.glb> [tex=1024]
import bpy, sys
argv = sys.argv[sys.argv.index('--') + 1:]
horse_out, rider_out = argv[0], argv[1]
tex = int(argv[2]) if len(argv) > 2 else 1024
sc = bpy.context.scene
if 'Marwari_High' in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects['Marwari_High'])
for im in bpy.data.images:
    if im.size[0] == 0:
        continue
    target = max(256, tex // 2) if im.name == 'marwari_hair' else tex
    if im.size[0] > target:
        im.scale(target, target)
arm = bpy.data.objects['MarwariRig']
arm.animation_data.action = None
for t in arm.animation_data.nla_tracks:
    t.mute = True
arm.data.pose_position = 'POSE'

def export(path, pick, anims):
    bpy.ops.object.select_all(action='DESELECT')
    n = 0
    for ob in sc.objects:
        if pick(ob.name):
            ob.hide_viewport = False
            ob.hide_set(False)
            ob.select_set(True)
            n += 1
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12, export_draco_generic_quantization=10,
        export_image_format='WEBP', export_image_quality=84,
        export_animations=anims, export_animation_mode='ACTIONS', export_force_sampling=False, export_optimize_animation_size=True,
        export_def_bones=False, export_skins=True, export_morph=False, export_apply=False, export_yup=True,
        export_tangents=False, export_cameras=False, export_lights=False, export_extras=True)
    print('EXPORTED', path, n, 'objects')

horse_prefix = ('Marwari_Low', 'Marwari_Hair', 'Marwari_Eyes', 'MarwariRig', 'Bone_', 'Muscle_', 'Tack_', 'Anchor_', 'SpineLine_', 'Seat_')
rider_prefix = ('CadetRig', 'Cadet_', 'RAnchor_')
export(horse_out, lambda n: n.startswith(horse_prefix), True)
export(rider_out, lambda n: n.startswith(rider_prefix), False)
