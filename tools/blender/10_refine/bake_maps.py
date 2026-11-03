# L2/L3 step 1: bake the bind-pose object-space position and normal of Marwari_Low into its UVMap (float EXR), with a 12 px
# margin, plus a margin-free coverage map; paint_markings.py turns them into masks.
# usage: blender -b --factory-startup -P bake_maps.py -- <master.blend> <out_dir> [size]
import bpy, sys, os
argv = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=argv[0]); out = argv[1]; S = int(argv[2]) if len(argv) > 2 else 2048
sc = bpy.context.scene
arm = bpy.data.objects['MarwariRig']; arm.data.pose_position = 'REST'
ob = bpy.data.objects['Marwari_Low']
for o in sc.objects: o.select_set(False)
ob.select_set(True); bpy.context.view_layer.objects.active = ob
# the ears reuse texels of the body (their colour comes from the shader): bake the body alone so no texel takes an ear's position
import bmesh
bm = bmesh.new(); bm.from_mesh(ob.data)
ear = bm.loops.layers.uv['EarMask']
bmesh.ops.delete(bm, geom=[f for f in bm.faces if any(l[ear].uv.y > 0.001 for l in f.loops)], context='FACES')
bm.to_mesh(ob.data); bm.free()
ob.data.uv_layers.active = ob.data.uv_layers['UVMap']
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1
sc.render.bake.margin = 12; sc.render.bake.margin_type = 'EXTEND'
mat = bpy.data.materials.new('bakemat'); mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()
tc = nt.nodes.new('ShaderNodeTexCoord'); em = nt.nodes.new('ShaderNodeEmission'); mo = nt.nodes.new('ShaderNodeOutputMaterial')
img_node = nt.nodes.new('ShaderNodeTexImage')
nt.links.new(em.outputs[0], mo.inputs[0])
orig = list(ob.data.materials); ob.data.materials.clear(); ob.data.materials.append(mat)
for name, sock, mg in [('pos', 'Object', 12), ('nor', 'Normal', 12), ('cov', 'Normal', 0)]:
    img = bpy.data.images.new(name, S, S, float_buffer=True, alpha=False)
    img_node.image = img; nt.nodes.active = img_node
    nt.links.new(tc.outputs[sock], em.inputs[0])
    bpy.ops.object.bake(type='EMIT', margin=mg)
    img.filepath_raw = os.path.join(out, f'bake_{name}.exr'); img.file_format = 'OPEN_EXR'; img.save()
    print('BAKED', name)
