# Close-ups aimed at named bones, optional markers at bone heads. args: blend outdir tag spec... spec = bone:azimuth:dist[:marker]
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
blend, outdir, tag = argv[:3]; specs = argv[3].split(','); action = argv[4] if len(argv)>4 else ''; frame = int(argv[5]) if len(argv)>5 else 0
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; arm = bpy.data.objects['MarwariRig']
if action:
    arm.animation_data_create(); act = bpy.data.actions[action]; arm.animation_data.action = act
    try: arm.animation_data.action_slot = act.slots[0]
    except Exception: pass
sc.frame_set(frame)
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 70
for name, energy, rot in [('k',3.2,(48,0,35)),('r',5,(65,0,195)),('f',1.2,(75,0,-70))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name,'SUN')); l.data.energy=energy; l.rotation_euler=[math.radians(a) for a in rot]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.62,0.58,0.52,1); w.node_tree.nodes['Background'].inputs[1].default_value=0.8
sc.render.engine='BLENDER_EEVEE'; sc.render.resolution_x, sc.render.resolution_y = 800, 640
red = bpy.data.materials.new('m'); red.use_nodes=True; red.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value=(1,0,0,1); red.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=5
for sp in specs:
    parts = sp.split(':'); bone, az, dist = parts[0], float(parts[1]), float(parts[2]); el = float(parts[3]) if len(parts)>3 else 8
    pb = arm.pose.bones[bone]; tgt = arm.matrix_world @ ((pb.head+pb.tail)/2)
    marker = None
    if len(parts)>4:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.006, location=arm.matrix_world @ pb.head); marker = bpy.context.object; marker.data.materials.append(red)
    a, e = math.radians(az), math.radians(el)
    cam.location = tgt + Vector((math.sin(a)*math.cos(e), -math.cos(a)*math.cos(e), math.sin(e)))*dist
    cam.rotation_euler = (tgt-cam.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'{tag}_{bone}_{int(az)}.png'); bpy.ops.render.render(write_still=True)
    if marker: bpy.data.objects.remove(marker)
