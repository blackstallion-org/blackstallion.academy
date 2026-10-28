# Stage 1: import the supplied horse, face it -Y (glTF +Z), stand it on the floor, scale withers to 1.52 m.
import bpy, sys, math, mathutils, json, numpy as np
argv = sys.argv[sys.argv.index('--')+1:]
src, out_blend = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.context.scene.objects if x.type=='MESH'][0]
o.name = 'Marwari'; o.data.name = 'Marwari'
o.rotation_mode = 'XYZ'
o.rotation_euler = (o.rotation_euler.x, o.rotation_euler.y, o.rotation_euler.z + math.radians(90))
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
co = np.empty(len(o.data.vertices)*3, dtype=np.float32); o.data.vertices.foreach_get('co', co); co = co.reshape(-1,3)
# head is at -Y now. Profile of top line along Y
ymin, ymax = co[:,1].min(), co[:,1].max()
prof = []
for y0 in np.linspace(ymin, ymax, 41):
    m = (co[:,1] >= y0) & (co[:,1] < y0 + (ymax-ymin)/40)
    if m.any(): prof.append((round(float(y0),3), round(float(co[m,2].max()),3), round(float(co[m,2].min()),3), round(float(co[m,0].min()),3), round(float(co[m,0].max()),3)))
print('PROFILE', json.dumps(prof))
print('BOUNDS', co.min(0).tolist(), co.max(0).tolist())
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
