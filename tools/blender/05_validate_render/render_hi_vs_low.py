# render hi-vs-low comparisons: args blend outdir tag [low|high]
import bpy, sys, math, mathutils, os
argv = sys.argv[sys.argv.index('--')+1:]
blend, outdir, tag, which = argv[:4]
bpy.ops.wm.open_mainfile(filepath=blend); sc = bpy.context.scene
for ob in sc.objects:
    if ob.type == 'MESH':
        hide = (ob.name == 'Marwari_High') if which == 'low' else (ob.name == 'Marwari_Low')
        ob.hide_render = hide; ob.hide_viewport = hide
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 70
for n, e, r, c in [('k',3.2,(48,0,35),(1,.95,.88)),('r',5,(65,0,195),(1,.92,.8)),('f',1.0,(75,0,-70),(.85,.9,1))]:
    l = bpy.data.objects.new(n, bpy.data.lights.new(n, 'SUN')); l.data.energy = e; l.data.color = c; l.rotation_euler = [math.radians(a) for a in r]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.62,0.58,0.52,1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 1000, 760
views = {'q_front': (140, 4.6, (0,-0.35,1.05)), 'head': (150, 1.6, (0,-1.1,1.8)), 'ears': (180, 1.1, (0,-1.05,1.98)), 'side': (90, 4.6, (0,-0.35,1.05)), 'hind': (35, 2.8, (0,0.4,0.8))}
for v, (az, d, tg) in views.items():
    a = math.radians(az); t = mathutils.Vector(tg)
    cam.location = t + mathutils.Vector((math.sin(a)*d, math.cos(a)*d, 0.1*d))
    cam.rotation_euler = (t - cam.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'{tag}_{v}.png'); bpy.ops.render.render(write_still=True)
