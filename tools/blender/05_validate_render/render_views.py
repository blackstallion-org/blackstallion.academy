# Studio renders of the current .blend from named views (uses evaluated mesh, so poses/modifiers show).
import bpy, sys, math, mathutils, os
argv = sys.argv[sys.argv.index('--')+1:]
blend, outdir, tag, views = argv[0], argv[1], argv[2], argv[3].split(',')
frame = int(argv[4]) if len(argv)>4 else None
action = argv[5] if len(argv)>5 else None
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
for ob in list(sc.objects):
    if ob.name.startswith(('cam_','lt_','floor')): bpy.data.objects.remove(ob)
arm = next((o for o in sc.objects if o.type=='ARMATURE'), None)
if arm and action:
    arm.animation_data_create(); arm.animation_data.action = bpy.data.actions[action]
    try: arm.animation_data.action_slot = bpy.data.actions[action].slots[0]
    except Exception: pass
if frame is not None: sc.frame_set(frame)
cam = bpy.data.objects.new('cam_', bpy.data.cameras.new('cam_')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 60
for name, energy, rot, col in [('lt_key',3.2,(48,0,35),(1,0.95,0.88)),('lt_rim',5.0,(65,0,195),(1,0.92,0.8)),('lt_fill',1.0,(75,0,-70),(0.85,0.9,1))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name,'SUN')); l.data.energy=energy; l.data.color=col
    l.rotation_euler=[math.radians(a) for a in rot]; sc.collection.objects.link(l)
bpy.ops.mesh.primitive_plane_add(size=12); fl = bpy.context.object; fl.name='floor'
fm = bpy.data.materials.new('floor_m'); fm.use_nodes=True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.42,0.38,0.33,1); fl.data.materials.append(fm)
w = bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
w.node_tree.nodes['Background'].inputs[0].default_value=(0.62,0.58,0.52,1); w.node_tree.nodes['Background'].inputs[1].default_value=0.7
sc.render.engine='BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 1000, 760
sc.view_settings.view_transform='AgX' if 'AgX' in [x.identifier for x in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
ctr = mathutils.Vector((0,-0.35,1.05))
presets = {'left':(90,0),'right':(-90,0),'front':(180,0),'back':(0,0),'q_front':(140,0),'q_rear':(35,0),
           'head':(150,0),'ears':(180,30),'legs':(110,-10)}
for v in views:
    az, el = presets[v]
    a = math.radians(az); e = math.radians(el+6)
    d = 4.6
    tgt = ctr.copy()
    if v=='head': d=1.6; tgt=mathutils.Vector((0,-1.1,1.8))
    if v=='ears': d=1.1; tgt=mathutils.Vector((0,-1.05,1.98))
    if v=='legs': d=2.6; tgt=mathutils.Vector((0,-0.1,0.5))
    cam.location = tgt + mathutils.Vector((math.sin(a)*math.cos(e)*d, math.cos(a)*math.cos(e)*d, math.sin(e)*d))
    cam.rotation_euler = (tgt-cam.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'{tag}_{v}.png')
    bpy.ops.render.render(write_still=True)
