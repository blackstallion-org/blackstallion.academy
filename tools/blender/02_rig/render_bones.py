# Ortho X-ray of the skeleton over a translucent horse, to check joint placement.
import bpy, sys, math
argv = sys.argv[sys.argv.index('--')+1:]
blend, outdir, tag = argv[:3]
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; arm = bpy.data.objects['MarwariRig']; o = bpy.data.objects['Marwari']
red = bpy.data.materials.new('j'); red.use_nodes=True; nt=red.node_tree; nt.nodes.clear()
em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value=(1,0.15,0.05,1); em.inputs[1].default_value=3
out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], out.inputs[0])
for pb in arm.pose.bones:
    h = arm.matrix_world @ pb.head; t = arm.matrix_world @ pb.tail
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, location=h); bpy.context.object.data.materials.append(red)
    v = t-h; bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=v.length, location=(h+t)/2)
    c = bpy.context.object; c.rotation_mode='QUATERNION'; c.rotation_quaternion = v.to_track_quat('Z','Y'); c.data.materials.append(red)
for m in o.data.materials:
    m.surface_render_method = 'BLENDED'
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Alpha'].default_value = 0.35
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera=cam; cam.data.type='ORTHO'
l = bpy.data.objects.new('k', bpy.data.lights.new('k','SUN')); l.data.energy=3; l.rotation_euler=(0.7,0,1); sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.85,0.85,0.85,1)
sc.render.engine='BLENDER_EEVEE'
for name, loc, rot, res in [('side',(3,-0.2,1.1),(90,0,90),(1400,1200)),('front',(0,-3,1.1),(90,0,0),(800,1200)),('top',(0,-0.2,4),(0,0,0),(800,1400))]:
    cam.location=loc; cam.rotation_euler=[math.radians(a) for a in rot]; cam.data.ortho_scale=2.5
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath=f'{outdir}/{tag}_{name}.png'; bpy.ops.render.render(write_still=True)
