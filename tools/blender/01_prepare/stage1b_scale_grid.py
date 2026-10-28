import bpy, sys, math, mathutils
argv = sys.argv[sys.argv.index('--')+1:]
blend, out_blend, outdir = argv
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
o = bpy.data.objects['Marwari']
o.location.x += 0.02
o.scale = (2.17,)*3
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
# grid + labels (render only, not saved)
mat = bpy.data.materials.new('grid'); mat.use_nodes=True
nt = mat.node_tree; nt.nodes.clear(); em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value=(0.9,0.2,0.1,1); outn = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], outn.inputs[0])
def view(name, axis):
    coll = bpy.data.collections.new('g_'+name); sc.collection.children.link(coll)
    # axis 'x': side view (camera +X), plane in Y/Z ; 'y': front (camera -Y), plane in X/Z
    for i in range(-14, 15):
        v = i*0.1
        for orient in ('h','v'):
            bpy.ops.mesh.primitive_cube_add(size=1)
            c = bpy.context.object; c.data.materials.append(mat)
            for cc in c.users_collection: cc.objects.unlink(c)
            coll.objects.link(c)
            w = 0.004 if i % 2 else 0.008
            if axis=='x':
                c.location = (-1.0, v if orient=='v' else 0, v+1.1 if orient=='h' else 1.1)
                c.scale = (0.001, w if orient=='v' else 3.0, 3.0 if orient=='v' else w)
            else:
                c.location = (v if orient=='v' else 0, 1.0, v+1.1 if orient=='h' else 1.1)
                c.scale = (w if orient=='v' else 3.0, 0.001, 3.0 if orient=='v' else w)
        if i % 2 == 0:
            for orient in ('h','v'):
                bpy.ops.object.text_add()
                t = bpy.context.object; t.data.body = f'{v:.1f}' if orient=='v' else f'{v+1.1:.1f}'
                for cc in t.users_collection: cc.objects.unlink(t)
                coll.objects.link(t); t.data.materials.append(mat); t.data.size = 0.035
                if axis=='x':
                    t.rotation_euler = (math.radians(90), 0, math.radians(90))
                    t.location = (-0.9, v+0.005, 0.02) if orient=='v' else (-0.9, -1.25, v+1.1+0.005)
                else:
                    t.rotation_euler = (math.radians(90), 0, 0)
                    t.location = (v+0.005, 0.9, 0.02) if orient=='v' else (-0.75, 0.9, v+1.1+0.005)
    return coll
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type='ORTHO'
l = bpy.data.objects.new('key', bpy.data.lights.new('key','SUN')); l.data.energy=4; l.rotation_euler=(math.radians(40),0,math.radians(60)); sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.8,0.8,0.8,1)
sc.render.engine='BLENDER_EEVEE'
for name, axis, loc, rot, res, scale in [('side','x',(3,-0.15,1.1),(90,0,90),(1600,1400),2.6),('front','y',(0,-3,1.1),(90,0,0),(900,1400),2.6)]:
    coll = view(name, axis)
    cam.location = loc; cam.rotation_euler=[math.radians(a) for a in rot]; cam.data.ortho_scale = scale
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = f'{outdir}/ortho_{name}.png'
    bpy.ops.render.render(write_still=True)
    for ob in list(coll.objects): bpy.data.objects.remove(ob)
