# Shaded + wireframe renders of a named mesh object, for topology review. usage: -- blend object outdir tag
import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--')+1:]
blend, name, outdir, tag = argv[:4]
bpy.ops.wm.open_mainfile(filepath=blend); sc = bpy.context.scene
for ob in sc.objects:
    if ob.type == 'MESH' and ob.name != name: ob.hide_render = True; ob.hide_viewport = True
o = bpy.data.objects[name]
wm = o.modifiers.new('wire', 'WIREFRAME'); wm.thickness = 0.0012; wm.use_replace = False; wm.material_offset = 1
mat = bpy.data.materials.new('wiremat'); mat.use_nodes = True; mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.95, 0.75, 0.3, 1)
o.data.materials.append(mat) if not len(o.data.materials) else None
if len(o.data.materials) < 2: o.data.materials.append(mat)
clay = bpy.data.materials.new('clay'); clay.use_nodes = True; clay.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.08, 0.08, 0.09, 1)
o.data.materials[0] = clay
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 70
for n, e, r in [('k', 3, (50, 0, 40)), ('f', 1.5, (70, 0, -60))]:
    l = bpy.data.objects.new(n, bpy.data.lights.new(n, 'SUN')); l.data.energy = e; l.rotation_euler = [math.radians(a) for a in r]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.35, 0.37, 1)
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 1100, 800
views = {'side': ((90, 4.8), (0, -0.2, 1.0)), 'head': ((140, 1.3), (0, -1.1, 1.8)), 'ears': ((165, 0.8), (0, -1.05, 1.98)), 'hind': ((60, 1.6), (0, 0.5, 0.6)), 'fore': ((120, 1.7), (0, -0.6, 0.7))}
for v, ((az, d), tgt) in views.items():
    a = math.radians(az); tg = mathutils.Vector(tgt)
    cam.location = tg + mathutils.Vector((math.sin(a) * d, math.cos(a) * d, 0.15 * d))
    cam.rotation_euler = (tg - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = f'{outdir}/{tag}_{v}.png'; bpy.ops.render.render(write_still=True)
