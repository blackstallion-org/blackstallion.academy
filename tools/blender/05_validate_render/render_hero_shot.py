# Cinematic hero still: dark editorial background, warm rim light, soft key. usage: -- blend out.png [frame action]
import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--')+1:]
blend, out = argv[0], argv[1]
bpy.ops.wm.open_mainfile(filepath=blend); sc = bpy.context.scene
arm = bpy.data.objects['MarwariRig']
for ob in sc.objects:
    if ob.name == 'Marwari_High': ob.hide_render = True; ob.hide_viewport = True
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 52
eye = mathutils.Vector((4.4, -6.0, 1.35)); tgt = mathutils.Vector((0, -0.25, 1.05))
cam.location = eye; cam.rotation_euler = (tgt - eye).to_track_quat('-Z', 'Y').to_euler()
for n, kind, e, loc, col in [('rim', 'AREA', 260, (-3.2, 3.6, 3.0), (1.0, 0.6, 0.28)), ('rim2', 'AREA', 150, (4.2, 3.0, 2.4), (1.0, 0.68, 0.38)), ('key', 'AREA', 45, (3.2, -4.0, 2.2), (1.0, 0.9, 0.78))]:
    l = bpy.data.objects.new(n, bpy.data.lights.new(n, kind)); l.data.energy = e; l.data.color = col; l.data.size = 2.0; l.location = loc
    l.rotation_euler = (mathutils.Vector((0, -0.3, 1.0)) - mathutils.Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(l)
bpy.ops.mesh.primitive_plane_add(size=30); fl = bpy.context.object
fm = bpy.data.materials.new('f'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.006, 0.005, 0.004, 1); fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.8; fl.data.materials.append(fm)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.011, 0.01, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.5
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'None'
bpy.ops.render.render(write_still=True) if False else None
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
