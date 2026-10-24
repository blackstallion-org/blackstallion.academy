# Stage 4: turn the head and neck to face straight ahead and make that the rest pose (neutral for gaze tracking).
import bpy, sys, math, numpy as np
from mathutils import Matrix, Vector
argv = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
arm = bpy.data.objects['MarwariRig']; o = bpy.data.objects['Marwari']; P = arm.pose.bones
vl = bpy.context.view_layer
def yaw_bone(name, frac=1.0):
    pb = P[name]; d = pb.tail - pb.head
    a = math.atan2(d.x, -d.y) * frac          # angle of the bone away from straight ahead (-Y)
    R = Matrix.Translation(pb.head) @ Matrix.Rotation(-a, 4, 'Z') @ Matrix.Translation(-pb.head)
    pb.matrix = R @ pb.matrix; vl.update(); return math.degrees(a)
print('YAW', [round(yaw_bone(n),1) for n in ('Neck_2','Neck_3','Head')])
print('POLL', [round(c,3) for c in P['Head'].head], 'MUZZLE', [round(c,3) for c in P['Head'].tail])
bpy.context.view_layer.objects.active = o
bpy.ops.object.modifier_apply(modifier='Armature')
vl.objects.active = arm; bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.armature_apply(); bpy.ops.object.mode_set(mode='OBJECT')
am = o.modifiers.new('Armature','ARMATURE'); am.object = arm
# eyes: recompute on the straightened head, then check symmetry about the head midline
co = np.empty(len(o.data.vertices)*3, np.float32); o.data.vertices.foreach_get('co', co); co = co.reshape(-1,3)
hx = float(P['Head'].head.x)
eyes = {}
for s in 'LR':
    m = (np.abs(co[:,2]-1.86)<0.06)&(co[:,1]<-1.06)&(co[:,1]>-1.22)
    c = co[m]; i = np.argmax(c[:,0]) if s=='L' else np.argmin(c[:,0]); eyes[s] = Vector(c[i].tolist())
print('EYES', {k:[round(x,3) for x in v] for k,v in eyes.items()}, 'HEADX', round(hx,3))
bpy.ops.object.mode_set(mode='OBJECT'); vl.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
for s in 'LR':
    e = eyes[s]; b = arm.data.edit_bones[f'Eye_{s}']; inward = Vector((-0.02 if s=='L' else 0.02,0,0))
    b.head = e+inward; b.tail = e+inward+Vector((0,0,0.04)); b.roll = 0
bpy.ops.object.mode_set(mode='OBJECT')
# eye weights: a soft disc around each eye, everything else in that disc given back to Head
for s in 'LR':
    g = o.vertex_groups[f'Eye_{s}']; hg = o.vertex_groups['Head']
    e = np.array(eyes[s]); d = np.linalg.norm(co - e, axis=1)
    idx = np.where(d < 0.05)[0]
    g.remove(list(range(len(co))))
    for i in idx:
        w = float(max(0.0, 1 - (d[i]/0.05)**2))**1.5
        g.add([int(i)], w, 'REPLACE'); hg.add([int(i)], 1-w, 'REPLACE')
        for vg in o.data.vertices[int(i)].groups:
            name = o.vertex_groups[vg.group].name
            if name not in (f'Eye_{s}','Head'): o.vertex_groups[vg.group].remove([int(i)])
print('EYE_VERTS', {s: int((np.linalg.norm(co-np.array(eyes[s]),axis=1)<0.05).sum()) for s in 'LR'})
bpy.ops.wm.save_as_mainfile(filepath=argv[1])
