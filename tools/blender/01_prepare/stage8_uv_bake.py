# Stage 8: UV-unwrap the hybrid low mesh and bake base colour, tangent normal, roughness and AO from the detail mesh.
# usage: blender -b --factory-startup -P stage8_uv_bake.py -- in.blend out.blend texdir size
import bpy, sys, os, math, time
import numpy as np
argv = sys.argv[sys.argv.index('--')+1:]
blend, out, texdir, size = argv[0], argv[1], argv[2], int(argv[3])
os.makedirs(texdir, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = bpy.context.view_layer
lo = bpy.data.objects['Marwari_Low']; hi = bpy.data.objects['Marwari_High']
# ---- unwrap
for ob in vl.objects: ob.select_set(False)
vl.objects.active = lo; lo.select_set(True)
while lo.data.uv_layers: lo.data.uv_layers.remove(lo.data.uv_layers[0])
lo.data.uv_layers.new(name='UVMap')
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(82), island_margin=0.003, area_weight=0.5, correct_aspect=True, scale_to_bounds=False)
bpy.ops.uv.pack_islands(margin=0.004)
bpy.ops.object.mode_set(mode='OBJECT')
print('UV_ISLANDS_DONE')
# ---- bake target material
for m in list(lo.data.materials): lo.data.materials.pop(index=0)
mat = bpy.data.materials.new('Marwari_Coat'); mat.use_nodes = True; lo.data.materials.append(mat)
nt = mat.node_tree
def img(name, data=False):
    im = bpy.data.images.new(name, size, size, alpha=False, float_buffer=False)
    if data: im.colorspace_settings.name = 'Non-Color'   # set before baking: changing it later regenerates (blanks) the image
    return im
targets = {'base': img('marwari_basecolor'), 'normal': img('marwari_normal', True), 'rough': img('marwari_rough', True), 'ao': img('marwari_ao', True)}
node = nt.nodes.new('ShaderNodeTexImage')
# ---- Cycles bake, selected (hi) -> active (lo)
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 16
try: sc.cycles.use_denoising = False
except Exception: pass
hi.hide_render = False; hi.hide_viewport = False
for m in list(hi.modifiers):
    if m.type == 'ARMATURE': m.show_viewport = False
bpy.ops.object.select_all(action='DESELECT'); hi.select_set(True); lo.select_set(True); vl.objects.active = lo
def bake(kind, key, **kw):
    node.image = targets[key]; nt.nodes.active = node
    t = time.time()
    bpy.ops.object.bake(type=kind, use_selected_to_active=True, cage_extrusion=0.025, max_ray_distance=0.06, margin=10, margin_type='EXTEND', use_clear=True, **kw)
    print('BAKED', key, round(time.time()-t, 1), 's')
bake('DIFFUSE', 'base', pass_filter={'COLOR'})
bake('NORMAL', 'normal', normal_space='TANGENT')
bake('ROUGHNESS', 'rough')
sc.cycles.samples = 48
bake('AO', 'ao')
# ---- pack ORM (R = occlusion, G = roughness, B = 0) and save
def px(im): return np.array(im.pixels[:], np.float32).reshape(size, size, 4)
rough, ao = px(targets['rough'])[..., 0], px(targets['ao'])[..., 0]
orm = np.zeros((size, size, 4), np.float32); orm[..., 0] = ao; orm[..., 1] = np.clip(rough, 0.3, 0.95); orm[..., 3] = 1
o_im = img('marwari_orm', True); o_im.pixels[:] = orm.ravel()
for key, im in (('base', targets['base']), ('normal', targets['normal']), ('orm', o_im)):
    im.filepath_raw = os.path.join(texdir, f'marwari_{key}_{size}.png'); im.file_format = 'PNG'; im.save()
    print('SAVED', im.filepath_raw)
# ---- final material
nt.nodes.clear()
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); outn = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(bsdf.outputs[0], outn.inputs[0])
def tex(image, cs):
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = image; return n
tb, tn, to = tex(targets['base'], 'sRGB'), tex(targets['normal'], 'Non-Color'), tex(o_im, 'Non-Color')
nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs[0], nm.inputs[1]); nt.links.new(nm.outputs[0], bsdf.inputs['Normal'])
sep = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs[0], sep.inputs[0])
nt.links.new(tb.outputs[0], bsdf.inputs['Base Color']); nt.links.new(sep.outputs[1], bsdf.inputs['Roughness'])
bsdf.inputs['Metallic'].default_value = 0.0
grp = bpy.data.node_groups.get('glTF Material Output') or bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
if 'Occlusion' not in [i.name for i in grp.interface.items_tree]: grp.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
g = nt.nodes.new('ShaderNodeGroup'); g.node_tree = grp; nt.links.new(sep.outputs[0], g.inputs['Occlusion'])
lo.data.materials[0] = mat
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out)
