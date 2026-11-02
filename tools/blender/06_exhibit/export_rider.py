# Stage E (rider only): export cadet-rider.glb from a cadet .blend (CadetRig + Cadet_* + RAnchor_*), Draco, WebP textures.
# usage: blender -b <cadet.blend> -P export_rider.py -- <rider.glb> [tex=1024]
import bpy, sys
argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]
tex = int(argv[1]) if len(argv) > 1 else 1024
sc = bpy.context.scene
rider_prefix = ('CadetRig', 'Cadet_', 'RAnchor_')
imgs = set()
for ob in sc.objects:
    if ob.type == 'MESH' and ob.name.startswith('Cadet_'):
        for m in ob.data.materials:
            if m and m.node_tree:
                for n in m.node_tree.nodes:
                    if n.type == 'TEX_IMAGE' and n.image:
                        imgs.add(n.image)
for im in imgs:
    if im.size[0] > tex:
        im.scale(tex, tex)
# The generated normal and metallic maps sparkle on the dark wool at web sizes (white specks on the jacket in the browser):
# the rider keeps its colour and roughness maps only, fully dielectric.
for ob in sc.objects:
    if ob.type == 'MESH' and ob.name == 'Cadet_Body':
        for m in ob.data.materials:
            if not (m and m.node_tree):
                continue
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    for key in ('Normal', 'Metallic', 'Alpha'):
                        for link in list(n.inputs[key].links):
                            m.node_tree.links.remove(link)
                    n.inputs['Metallic'].default_value = 0.0
                    n.inputs['Alpha'].default_value = 1.0  # an opaque body: the colour map's alpha made the wool dither
            # single-sided: a double-sided body shadows itself through its own back faces (white flecks on the jacket)
            m.use_backface_culling = True
bpy.ops.object.select_all(action='DESELECT')
n = 0
for ob in sc.objects:
    if ob.name.startswith(rider_prefix):
        ob.hide_viewport = False
        ob.hide_set(False)
        ob.select_set(True)
        n += 1
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12, export_draco_generic_quantization=10,
    export_image_format='WEBP', export_image_quality=84, export_animations=False,
    export_def_bones=False, export_skins=True, export_morph=False, export_apply=False, export_yup=True,
    export_tangents=False, export_cameras=False, export_lights=False, export_extras=True)
print('EXPORTED', out, n, 'objects', len(imgs), 'images')
