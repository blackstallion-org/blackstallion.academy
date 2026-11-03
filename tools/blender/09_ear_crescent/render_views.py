# Check renders of the ears from named angles (front, 3/4, side, rear 3/4, back, top), rest pose, matte studio light.
# usage: blender -b --factory-startup -P render_views.py -- <in.blend> <outdir> <tag> [width] [hide_hair 0|1]
import bpy, sys, os, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
outdir, tag = argv[1], argv[2]
W = int(argv[3]) if len(argv) > 3 else 600
hide_hair = (argv[4] != '0') if len(argv) > 4 else False
sc = bpy.context.scene
for ob in list(sc.objects):
    if ob.type in ('CAMERA', 'LIGHT') or ob.name in ('Marwari_High',) or (hide_hair and ob.name == 'Marwari_Hair'):
        bpy.data.objects.remove(ob)
arm = bpy.data.objects['MarwariRig']
arm.data.pose_position = 'REST'
if arm.animation_data:
    arm.animation_data.action = None
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 85
for name, energy, rot in [('k', 3.0, (55, 0, 150)), ('r', 3.4, (60, 0, -20)), ('f', 1.2, (70, 0, 250))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN')); l.data.energy = energy; l.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.78, 0.74, 0.68, 1)
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = W, int(W * 0.86)
tgt = mathutils.Vector((float(os.environ.get('TX', '-0.014')), -1.1, float(os.environ.get('TZ', '2.08'))))
dist = float(os.environ.get('DIST', '0.95'))
views = [('front', 180, 8), ('q45', 140, 12), ('side', 95, 6), ('rear135', 45, 12), ('back', 0, 8), ('top', 160, 50)]
only = os.environ.get('VIEWS')
for v, az, el in views:
    if only and v not in only.split(','):
        continue
    a, e = math.radians(az), math.radians(el)
    cam.location = tgt + mathutils.Vector((math.sin(a) * math.cos(e) * dist, math.cos(a) * math.cos(e) * dist, math.sin(e) * dist))
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'{tag}_{v}.png')
    bpy.ops.render.render(write_still=True)
