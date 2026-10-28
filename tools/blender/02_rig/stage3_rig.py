# Stage 3: measure joint landmarks from the mesh, build a 50-bone quadruped skeleton, weight it.
import bpy, sys, math, json, numpy as np, mathutils
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
blend, out_blend = argv[0], argv[1]
bpy.ops.wm.open_mainfile(filepath=blend)
o = bpy.data.objects['Marwari']
co = np.empty(len(o.data.vertices)*3, np.float32); o.data.vertices.foreach_get('co', co); co = co.reshape(-1,3)
X,Y,Z = co[:,0],co[:,1],co[:,2]

def leg_mask(side, front):
    m = (X>0) if side=='L' else (X<0)
    return m & ((Y<-0.2) if front else ((Y>0.05)&(Y<0.62)))
def centroid(mask, z, dz=0.012):
    m = mask & (np.abs(Z-z)<dz)
    c = co[m].mean(0); return Vector((float(c[0]), float(c[1]), z))
def toe(mask):
    m = mask & (Z<0.03); i = np.argmin(Y[m]); c = co[m]; return Vector((float(c[:,0].mean()), float(c[i,1]), 0.0))

L = {}
for side in 'LR':
    sgn = 1 if side=='L' else -1
    fm = leg_mask(side, True); hm = leg_mask(side, False)
    fa = centroid(fm, 0.75)
    L[f'elbow_{side}']   = Vector((fa.x, fa.y+0.04, 0.90))
    L[f'shoulder_{side}']= Vector((sgn*0.17, fa.y-0.12, 1.08))
    L[f'scap_{side}']    = Vector((sgn*0.10, fa.y+0.30, 1.40))
    L[f'knee_{side}']    = centroid(fm, 0.50)
    L[f'ffet_{side}']    = centroid(fm, 0.23)
    L[f'fcor_{side}']    = centroid(fm, 0.10)
    L[f'ftoe_{side}']    = toe(fm)
    ga = centroid(hm, 0.72)
    L[f'stifle_{side}']  = Vector((ga.x+sgn*0.04, ga.y-0.22, 0.88))
    L[f'hip_{side}']     = Vector((sgn*0.16, ga.y-0.12, 1.18))
    L[f'hock_{side}']    = centroid(hm, 0.56)
    L[f'hfet_{side}']    = centroid(hm, 0.25)
    L[f'hcor_{side}']    = centroid(hm, 0.10)
    L[f'htoe_{side}']    = toe(hm)

# neck centreline: slices perpendicular to the neck from its base to the poll
base = Vector((0,-0.55,1.30))
pm = (Z>1.88)&(Z<1.98)&(Y<-0.95)&(Y>-1.15)
poll = Vector(co[pm].mean(0).tolist()); poll.z -= 0.08
neck = []
for s in np.linspace(0,1,4):
    P = base.lerp(poll, s); d = (poll-base).normalized()
    rel = co - np.array(P); along = rel @ np.array(d)
    rad = np.linalg.norm(rel - np.outer(along, np.array(d)), axis=1)
    m = (np.abs(along)<0.03)&(rad<0.30)
    c = Vector(co[m].mean(0).tolist()) if m.sum()>50 else P
    neck.append(c if 0<s<1 else P)
neck[0] = base; neck[-1] = poll
# muzzle: most forward point of the head
mz = Y < Y.min()+0.04; muzzle = Vector(co[mz].mean(0).tolist())
# ears: everything high above the poll, split at the head's midline
hx = poll.x
ear = {}
for side in 'LR':
    m = (Z>2.0)&(Y<-0.9)&((X>hx) if side=='L' else (X<hx))
    tip = co[m][np.argmax(Z[m])]
    b = co[m & (Z<2.06)].mean(0)
    ear[side] = (Vector(b.tolist()), Vector(tip.tolist()))
# eyes: the outermost surface near the eye height on each side of the head
eye = {}
for side in 'LR':
    m = (np.abs(Z-1.84)<0.05)&(Y<-1.06)&(Y>-1.2)
    c = co[m]; i = np.argmax(c[:,0]) if side=='L' else np.argmin(c[:,0])
    eye[side] = Vector(c[i].tolist())
# tail: centroid of tail slices
dock = Vector((0,0.56,1.40)); tail = [dock]
for z in (1.10, 0.85, 0.60, 0.36):
    m = (np.abs(Z-z)<0.02)&(Y>0.58)&(np.abs(X)<0.15)
    if z>1.0: m &= Y> np.percentile(Y[(np.abs(Z-z)<0.02)&(np.abs(X)<0.15)], 75)
    tail.append(Vector(co[m].mean(0).tolist()) if m.sum()>20 else tail[-1]+Vector((0,0.03,-0.25)))
print('LANDMARKS', json.dumps({k:[round(c,3) for c in v] for k,v in L.items()}))
print('NECK', [[round(c,3) for c in v] for v in neck], 'MUZZLE', [round(c,3) for c in muzzle], 'EARS', {k:[[round(c,3) for c in a] for a in v] for k,v in ear.items()}, 'EYES', {k:[round(c,3) for c in v] for k,v in eye.items()}, 'TAIL', [[round(c,3) for c in v] for v in tail])

# ---------------------------------------------------------------- armature
arm_d = bpy.data.armatures.new('MarwariRig'); arm = bpy.data.objects.new('MarwariRig', arm_d)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
eb = arm_d.edit_bones
def bone(name, h, t, parent=None, deform=True, connect=False, roll=0.0):
    b = eb.new(name); b.head = h; b.tail = t; b.roll = roll; b.use_deform = deform
    if parent: b.parent = eb[parent]; b.use_connect = connect
    return b
bone('Root', (0,-0.1,0), (0,-0.1,0.35), deform=False)
bone('Body', (0,-0.1,1.05), (0,-0.1,1.30), 'Root', deform=False)
bone('Spine_Lumbar', (0,0.22,1.30), (0,-0.10,1.30), 'Body')
bone('Spine_Thoracic', (0,-0.10,1.30), neck[0], 'Spine_Lumbar', connect=True)
bone('Ribcage', (0,-0.32,1.06), (0,-0.32,0.86), 'Spine_Thoracic')
bone('Pelvis', (0,0.22,1.30), (0,0.52,1.36), 'Body')
for i in range(3):
    bone(f'Neck_{i+1}', neck[i], neck[i+1], 'Spine_Thoracic' if i==0 else f'Neck_{i}', connect=True)
bone('Head', poll, muzzle, 'Neck_3', connect=True)
for s in 'LR':
    b0, tip = ear[s]
    bone(f'Ear_{s}', b0, b0.lerp(tip,0.55), 'Head')
    bone(f'Ear_Tip_{s}', b0.lerp(tip,0.55), tip, f'Ear_{s}', connect=True)
    e = eye[s]; inward = Vector((-0.02 if s=='L' else 0.02,0,0))
    bone(f'Eye_{s}', e+inward, e+inward+Vector((0,0,0.04)), 'Head')
for i in range(4):
    bone(f'Tail_{i+1}', tail[i], tail[i+1], 'Pelvis' if i==0 else f'Tail_{i}', connect=i>0)
for s in 'LR':
    bone(f'Scapula_{s}', L[f'scap_{s}'], L[f'shoulder_{s}'], 'Spine_Thoracic')
    bone(f'Humerus_{s}', L[f'shoulder_{s}'], L[f'elbow_{s}'], f'Scapula_{s}', connect=True)
    bone(f'Forearm_{s}', L[f'elbow_{s}'], L[f'knee_{s}'], f'Humerus_{s}', connect=True)
    bone(f'Cannon_F_{s}', L[f'knee_{s}'], L[f'ffet_{s}'], f'Forearm_{s}', connect=True)
    bone(f'Pastern_F_{s}', L[f'ffet_{s}'], L[f'fcor_{s}'], f'Cannon_F_{s}', connect=True)
    bone(f'Hoof_F_{s}', L[f'fcor_{s}'], L[f'ftoe_{s}']+Vector((0,0,0.02)), f'Pastern_F_{s}', connect=True)
    bone(f'Femur_{s}', L[f'hip_{s}'], L[f'stifle_{s}'], 'Pelvis')
    bone(f'Gaskin_{s}', L[f'stifle_{s}'], L[f'hock_{s}'], f'Femur_{s}', connect=True)
    bone(f'Cannon_B_{s}', L[f'hock_{s}'], L[f'hfet_{s}'], f'Gaskin_{s}', connect=True)
    bone(f'Pastern_B_{s}', L[f'hfet_{s}'], L[f'hcor_{s}'], f'Cannon_B_{s}', connect=True)
    bone(f'Hoof_B_{s}', L[f'hcor_{s}'], L[f'htoe_{s}']+Vector((0,0,0.02)), f'Pastern_B_{s}', connect=True)
# consistent rolls: legs bend in the sagittal plane, local X points to the horse's left
bpy.ops.armature.select_all(action='SELECT'); bpy.ops.armature.calculate_roll(type='GLOBAL_POS_X')
bpy.ops.object.mode_set(mode='OBJECT')
print('BONES', len(arm_d.bones))

# ---------------------------------------------------------------- weights via a watertight proxy
bpy.ops.object.select_all(action='DESELECT')
proxy = o.copy(); proxy.data = o.data.copy(); proxy.name='WeightProxy'; bpy.context.scene.collection.objects.link(proxy)
rm = proxy.modifiers.new('rm','REMESH'); rm.mode='VOXEL'; rm.voxel_size=0.011; rm.use_smooth_shade=True
bpy.context.view_layer.objects.active = proxy; proxy.select_set(True); bpy.ops.object.modifier_apply(modifier='rm')
print('PROXY', len(proxy.data.vertices))
arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('PROXY_GROUPS', len(proxy.vertex_groups), sum(1 for v in proxy.data.vertices if len(v.groups)==0), 'unweighted')
# transfer to the render mesh
for g in proxy.vertex_groups: o.vertex_groups.new(name=g.name)
dt = o.modifiers.new('dt','DATA_TRANSFER'); dt.object = proxy; dt.use_vert_data=True; dt.data_types_verts={'VGROUP_WEIGHTS'}
dt.vert_mapping='POLYINTERP_NEAREST'; dt.layers_vgroup_select_src='ALL'; dt.layers_vgroup_select_dst='NAME'
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.object.modifier_apply(modifier='dt')
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
am = o.modifiers.new('Armature','ARMATURE'); am.object = arm
o.parent = arm
bpy.data.objects.remove(proxy)
nw = sum(1 for v in o.data.vertices if len(v.groups)==0)
print('UNWEIGHTED', nw)
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
