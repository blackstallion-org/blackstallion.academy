# Quick studio renders of an exhibit .blend: layers on, coat as a faint ghost, from named views.
# usage: blender -b <layers.blend> -P render_layers.py -- <outdir> <tag> <views> [hide=Muscle_,Tack_] [frame] [action]
import bpy, sys, math, os, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]
outdir, tag, views = argv[0], argv[1], argv[2].split(',')
hide = argv[3].split(',') if len(argv) > 3 and argv[3] else []
frame = int(argv[4]) if len(argv) > 4 else None
action = argv[5] if len(argv) > 5 else None
sc = bpy.context.scene
for ob in list(sc.objects):
    if ob.name.startswith(('cam_', 'lt_', 'floor')):
        bpy.data.objects.remove(ob)
arm = bpy.data.objects['MarwariRig']
arm.data.pose_position = 'POSE' if action else 'REST'
if action:
    arm.animation_data_create(); arm.animation_data.action = bpy.data.actions[action]
    try: arm.animation_data.action_slot = bpy.data.actions[action].slots[0]
    except Exception: pass
if frame is not None: sc.frame_set(frame)
ghost = bpy.data.materials.new('ghost'); ghost.use_nodes = True
b = ghost.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1); b.inputs['Alpha'].default_value = 0.10
try: ghost.surface_render_method = 'BLENDED'
except Exception: pass
for ob in sc.objects:
    if ob.name == 'Marwari_Low' and 'ghost' not in hide:
        ob.data.materials.clear(); ob.data.materials.append(ghost)
    if ob.name in ('Marwari_High', 'Marwari_Hair', 'Marwari_Eyes') or any(ob.name.startswith(h) for h in hide if h and h != 'ghost'):
        ob.hide_render = True; ob.hide_viewport = True
if os.environ.get('COLORIZE'):
    import colorsys, zlib
    for ob in sc.objects:
        if ob.name.startswith('Muscle_') and not ob.hide_render:
            h = (zlib.crc32(ob.name.encode()) % 360) / 360.0
            m = bpy.data.materials.new('c_' + ob.name); m.use_nodes = True
            m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*colorsys.hsv_to_rgb(h, 0.65, 0.85), 1)
            ob.data.materials.clear(); ob.data.materials.append(m)
cam = bpy.data.objects.new('cam_', bpy.data.cameras.new('cam_')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 45
for name, energy, rot, col in [('lt_key', 3.4, (48, 0, 35), (1, 0.95, 0.88)), ('lt_rim', 4.0, (65, 0, 195), (1, 0.92, 0.8)), ('lt_fill', 1.4, (75, 0, -70), (0.85, 0.9, 1))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN')); l.data.energy = energy; l.data.color = col
    l.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.82, 0.78, 0.7, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 1100, 800
try: sc.view_settings.view_transform = 'AgX'
except Exception: pass
presets = {'left': (90, 0, 4.2, (0, -0.35, 1.05)), 'q_front': (135, 0, 4.2, (0, -0.35, 1.05)), 'q_rear': (40, 0, 4.2, (0, -0.2, 1.05)), 'front': (180, 0, 4.2, (0, -0.35, 1.05)), 'top': (90, 70, 4.2, (0, -0.2, 1.05)),
           'head': (110, 0, 1.4, (0, -1.15, 1.8)), 'rear': (0, 5, 3.4, (0, 0.2, 1.1)), 'fore': (100, 0, 1.8, (0, -0.55, 0.62)), 'hind': (100, 0, 1.8, (0, 0.4, 0.7)), 'trunk': (90, 0, 2.4, (0, -0.1, 1.25)), 'rider': (90, 0, 3.6, (0, -0.1, 1.8))}
for v in views:
    az, el, d, t = presets[v]
    a, e = math.radians(az), math.radians(el + 4)
    tgt = mathutils.Vector(t)
    cam.location = tgt + mathutils.Vector((math.sin(a) * math.cos(e) * d, math.cos(a) * math.cos(e) * d, math.sin(e) * d))
    cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'{tag}_{v}.png')
    bpy.ops.render.render(write_still=True)
