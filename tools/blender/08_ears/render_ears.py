# Close renders of the ears: front, three-quarter and side, rest pose, studio light.  usage: -- <in.blend> <outdir> <tag>
import bpy, sys, os, math, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
outdir, tag = argv[1], argv[2]
sc = bpy.context.scene
for ob in list(sc.objects):
    if ob.type in ('CAMERA', 'LIGHT') or ob.name in ('Marwari_High',):
        bpy.data.objects.remove(ob)
arm = bpy.data.objects['MarwariRig']
arm.data.pose_position = 'REST'
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 85
for name, energy, rot in [('k', 3.0, (55, 0, 150)), ('r', 3.4, (60, 0, -20)), ('f', 1.0, (70, 0, 250))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN')); l.data.energy = energy; l.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.78, 0.74, 0.68, 1)
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 700, 600
tgt = mathutils.Vector((0, -1.1, 2.08))
for v, az, el in [('front', 180, 8), ('q', 140, 12), ('side', 95, 6), ('top', 160, 45)]:
    a, e = math.radians(az), math.radians(el)
    d = 0.95
    cam.location = tgt + mathutils.Vector((math.sin(a) * math.cos(e) * d, math.cos(a) * math.cos(e) * d, math.sin(e) * d))
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'{tag}_{v}.png')
    bpy.ops.render.render(write_still=True)
