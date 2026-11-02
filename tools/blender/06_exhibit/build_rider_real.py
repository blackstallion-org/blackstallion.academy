# Stage D (realistic, 2 Nov 2026): replaces the procedural cadet (build_cadet.py) with a photographic rider.
# Source: a Meshy image-to-3D model generated for the academy (Higgsfield `meshy_v7_image_to_3d`, textured, PBR, auto-rigged,
# from a Higgsfield gpt_image_2_5 studio reference; see tools/blender/source/rider/README.md). The standing A-pose is posed into
# the seat on this saddle by placing every joint: hips over the seat, the ball of each foot on the stirrup tread the procedural
# build left, knees found by two-bone geometry and pushed clear of the horse's flank, hands over the withers on the reins.
# The posed body is then baked and re-skinned to the page's five-bone "CadetRig" (R_Pelvis, R_Spine, R_Chest, R_Neck, R_Head,
# vertical, identity rest rotations), and the anchors the pages track (RAnchor_*) are placed on the new body. The pages need no
# change: they ride R_Pelvis on the horse's seat and let the spine absorb the motion, exactly as before.
# usage: blender -b <cadet.blend> -P build_rider_real.py -- <rider.glb> <pose.json> <out.blend>
import sys, os, json, math
import bpy
from mathutils import Vector, Matrix, Quaternion
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import Rig, save

argv = sys.argv[sys.argv.index('--') + 1:]
src, pose_json, out_path = argv[0], argv[1], argv[2]
TUNE = json.loads(os.environ.get('RIDER_TUNE', '{}'))
T = dict(hip_up=0.085, hip_back=0.0, thigh_out=0.45, foot_down=0.66, foot_out=0.10, wrist_fwd=0.27, wrist_up=0.21, wrist_x=0.09,
         elbow_back=1.0, elbow_out=0.30, head_tilt=5.0, lean=2.0, knee_clear=0.075, hand_twist=90.0)
T.update(TUNE)
pose = json.load(open(pose_json))
SY, SZ = pose['seat_y'], pose['seat_z']
rig = Rig()
sc = bpy.context.scene


def P(x, dy, dz):
    return Vector((x, SY + dy, SZ + dz))


# ---------------------------------------------------------------- 1. keep the stirrups and leathers; note where each tread is
balls = {}
for nm, S in (('L', 1.0), ('R', -1.0)):
    st = bpy.data.objects.get('Cadet_Stirrup_' + nm)
    if st:
        pts = [st.matrix_world @ v.co for v in st.data.vertices]
        xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
        balls[nm] = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs) + 0.011 + 0.022))  # boot sole sits on the tread
    else:
        balls[nm] = P(S * 0.30, -0.155, -0.53)
keep = {'Cadet_Stirrup_L', 'Cadet_Stirrup_R', 'Cadet_Leather_L', 'Cadet_Leather_R'}
for ob in list(sc.objects):
    if (ob.name.startswith(('Cadet_', 'RAnchor_')) and ob.name not in keep) or ob.name == 'CadetRig':
        bpy.data.objects.remove(ob, do_unlink=True)

# ---------------------------------------------------------------- 2. the generated rider
before = set(sc.objects)
bpy.ops.import_scene.gltf(filepath=src)
new = [o for o in sc.objects if o not in before]
for o in new:
    if o.name.startswith('Icosphere'):
        bpy.data.objects.remove(o, do_unlink=True)
A = [o for o in sc.objects if o.type == 'ARMATURE' and o.name != 'MarwariRig' and o in new][0]
M = [o for o in A.children if o.type == 'MESH'][0]
A.animation_data_clear()
A.data.pose_position = 'POSE'
for pb in A.pose.bones:
    pb.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()


def W(name):
    """World position of a bone's head in the current pose."""
    return A.matrix_world @ A.pose.bones[name].head


rest = {b.name: A.matrix_world @ b.head_local for b in A.data.bones}
L = lambda a, b: (rest[b] - rest[a]).length
hipc = (rest['LeftUpLeg'] + rest['RightUpLeg']) / 2
target_hipc = P(0, T['hip_back'], T['hip_up'])
A.location += target_hipc - hipc
bpy.context.view_layer.update()


def rotate_world(pb, q, pivot):
    Wm = A.matrix_world @ pb.matrix
    R = Matrix.Translation(pivot) @ q.to_matrix().to_4x4() @ Matrix.Translation(-pivot)
    pb.matrix = A.matrix_world.inverted() @ R @ Wm
    bpy.context.view_layer.update()


def aim(name, child, target):
    """Turn bone `name` about its head so the head of `child` lands on the line toward `target`."""
    pb = A.pose.bones[name]
    h = W(name)
    d0 = (W(child) - h).normalized()
    d1 = (target - h).normalized()
    rotate_world(pb, d0.rotation_difference(d1), h)


def aim_axis(name, direction):
    pb = A.pose.bones[name]
    h = W(name)
    y = ((A.matrix_world @ pb.matrix).to_3x3() @ Vector((0, 1, 0))).normalized()
    rotate_world(pb, y.rotation_difference(direction.normalized()), h)


def two_bone(a, c, l1, l2, pole):
    """Middle joint for a chain a-(l1)-b-(l2)-c bending toward `pole`."""
    v = c - a
    d = min(v.length, l1 + l2 - 1e-4)
    axis = v.normalized()
    x = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, l1 * l1 - x * x))
    p = pole - axis * pole.dot(axis)
    return a + axis * x + p.normalized() * h, v.length - (l1 + l2)


# a little forward lean of the whole upper body over the seat (degrees), then the head looks between the ears
rotate_world(A.pose.bones['Spine02'], Quaternion(Vector((1, 0, 0)), math.radians(T['lean'])), W('Spine02'))

report = {}
for nm, S in (('Left', 1.0), ('Right', -1.0)):
    k = 'L' if S > 0 else 'R'
    # legs: ball of the foot on the tread, heel down, knee clear of the flank
    Lt, Ls, Lf = L(nm + 'UpLeg', nm + 'Leg'), L(nm + 'Leg', nm + 'Foot'), L(nm + 'Foot', nm + 'ToeBase')
    ball = balls[k]
    fdir = Vector((S * T['foot_out'], -0.74, -T['foot_down'])).normalized()
    ankle = ball - fdir * Lf
    hip = W(nm + 'UpLeg')
    out = T['thigh_out']
    for _ in range(40):
        knee, short = two_bone(hip, ankle, Lt, Ls, Vector((S * out, -1.0, 0.0)))
        mid = hip.lerp(knee, 0.6)
        if rig.depth(knee) <= -T['knee_clear'] and rig.depth(mid) <= -(T['knee_clear'] + 0.01):
            break
        out += 0.08
    aim(nm + 'UpLeg', nm + 'Leg', knee)
    aim(nm + 'Leg', nm + 'Foot', ankle)
    aim(nm + 'Foot', nm + 'ToeBase', ball)
    # arms: upper arm close to the body, elbow just behind the hip line, hands over the withers
    Lu, Lfa = L(nm + 'Arm', nm + 'ForeArm'), L(nm + 'ForeArm', nm + 'Hand')
    sh = W(nm + 'Arm')
    wrist = P(S * T['wrist_x'], -T['wrist_fwd'], T['wrist_up'])
    elbow, reach = two_bone(sh, wrist, Lu, Lfa, Vector((S * T['elbow_out'], T['elbow_back'], -0.25)))
    aim(nm + 'Arm', nm + 'ForeArm', elbow)
    aim(nm + 'ForeArm', nm + 'Hand', wrist)
    aim_axis(nm + 'Hand', Vector((-S * 0.2, -0.78, -0.55)))
    # turn the hand about its own length so the palms face each other, thumbs up, as when holding a rein in each hand
    hb = A.pose.bones[nm + 'Hand']
    hy = ((A.matrix_world @ hb.matrix).to_3x3() @ Vector((0, 1, 0))).normalized()
    rotate_world(hb, Quaternion(hy, S * math.radians(T['hand_twist'])), W(nm + 'Hand'))
    report[k] = dict(knee=tuple(round(c, 3) for c in knee), knee_depth=round(rig.depth(knee), 3), leg_short=round(short, 3),
                     ankle=tuple(round(c, 3) for c in ankle), ball=tuple(round(c, 3) for c in ball), elbow=tuple(round(c, 3) for c in elbow), arm_short=round(reach, 3), thigh_out=round(out, 2))
rotate_world(A.pose.bones['Head'], Quaternion(Vector((1, 0, 0)), math.radians(T['head_tilt'])), W('Head'))

J = {n: W(n).copy() for n in ('Hips', 'Spine02', 'Spine01', 'Spine', 'neck', 'Head', 'head_end', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftFoot', 'LeftToeBase')}
hand_dir = {s: ((A.matrix_world @ A.pose.bones[s + 'Hand'].matrix).to_3x3() @ Vector((0, 1, 0))).normalized() for s in ('Left', 'Right')}

# ---------------------------------------------------------------- 3. bake the pose, re-skin to the page's five bones
dg = bpy.context.evaluated_depsgraph_get()
baked = bpy.data.meshes.new_from_object(M.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
mw = M.matrix_world.copy()
groups = [g.name for g in M.vertex_groups]
for mod in list(M.modifiers):
    M.modifiers.remove(mod)
M.parent = None
M.data = baked
M.data.transform(mw)
M.matrix_world = Matrix.Identity(4)


def rebake(ob, size=2048, margin=12):
    """The generated texture atlas packs hundreds of islands edge to edge (white breeches beside black wool), so mipmaps bleed
    white flecks onto the jacket in the browser. Lay out a fresh UV map with gaps, bake the colour and roughness onto it with a
    dilated margin, and keep only that (the generated normal and metallic maps add noise at web sizes)."""
    me = ob.data
    old_uv = me.uv_layers.active.name
    new_uv = me.uv_layers.new(name='BakeUV')
    me.uv_layers.active = new_uv
    for o in sc.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.006, area_weight=0.6, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    mat = me.materials[0]
    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type == 'TEX_IMAGE':
            uvn = nt.nodes.new('ShaderNodeUVMap')
            uvn.uv_map = old_uv
            nt.links.new(uvn.outputs['UV'], n.inputs['Vector'])
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 4
    sc.cycles.device = 'CPU'
    out_imgs = {}
    for kind, cs in (('DIFFUSE', 'sRGB'), ('ROUGHNESS', 'Non-Color')):
        im = bpy.data.images.new('rider_' + kind.lower(), size, size, alpha=False)
        im.colorspace_settings.name = cs
        node = nt.nodes.new('ShaderNodeTexImage')
        node.image = im
        for n in nt.nodes:
            n.select = False
        node.select = True
        nt.nodes.active = node
        if kind == 'DIFFUSE':
            bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=margin, use_clear=True)
        else:
            bpy.ops.object.bake(type='ROUGHNESS', margin=margin, use_clear=True)
        im.pack()
        out_imgs[kind] = im
        nt.nodes.remove(node)
    # a clean material on the new layout
    new = bpy.data.materials.new('Cadet_Rider')
    new.use_nodes = True
    t = new.node_tree
    bsdf = t.nodes['Principled BSDF']
    col = t.nodes.new('ShaderNodeTexImage')
    col.image = out_imgs['DIFFUSE']
    rough = t.nodes.new('ShaderNodeTexImage')
    rough.image = out_imgs['ROUGHNESS']
    t.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
    t.links.new(rough.outputs['Color'], bsdf.inputs['Roughness'])
    bsdf.inputs['Metallic'].default_value = 0.0
    new.use_backface_culling = True
    me.materials.clear()
    me.materials.append(new)
    me.uv_layers.remove(me.uv_layers[old_uv])
    sc.render.engine = 'BLENDER_EEVEE'


if os.environ.get('REBAKE', '1') == '1':
    rebake(M)

MAP = {'Hips': {'R_Pelvis': 1}, 'Spine02': {'R_Spine': 1}, 'Spine01': {'R_Spine': 0.45, 'R_Chest': 0.55}, 'Spine': {'R_Chest': 1},
       'neck': {'R_Neck': 1}, 'Head': {'R_Head': 1}, 'head_end': {'R_Head': 1}, 'headfront': {'R_Head': 1}}
for s in ('Left', 'Right'):
    for b in ('UpLeg', 'Leg', 'Foot', 'ToeBase'):
        MAP[s + b] = {'R_Pelvis': 1}
    for b in ('Shoulder', 'Arm', 'ForeArm', 'Hand'):
        MAP[s + b] = {'R_Chest': 1}
acc = [dict() for _ in M.data.vertices]
for v in M.data.vertices:
    for g in v.groups:
        for nb, f in MAP.get(groups[g.group], {'R_Chest': 1}).items():
            acc[v.index][nb] = acc[v.index].get(nb, 0) + g.weight * f
for g in list(M.vertex_groups):
    M.vertex_groups.remove(g)
vgs = {n: M.vertex_groups.new(name=n) for n in ('R_Pelvis', 'R_Spine', 'R_Chest', 'R_Neck', 'R_Head')}
for i, d in enumerate(acc):
    tot = sum(d.values()) or 1
    if not d:
        d = {'R_Pelvis': 1}
    for nb, w in d.items():
        vgs[nb].add([i], w / tot, 'REPLACE')

# the five-bone rig, vertical, at the new body's joints
adata = bpy.data.armatures.new('CadetRig')
arm = bpy.data.objects.new('CadetRig', adata)
sc.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
top = max((v.co.z for v in M.data.vertices), default=SZ + 0.95)
heads = [('R_Pelvis', J['Hips'].z - 0.10), ('R_Spine', J['Spine02'].z), ('R_Chest', J['Spine01'].z), ('R_Neck', J['neck'].z), ('R_Head', J['Head'].z)]
ends = [h for _, h in heads[1:]] + [top]
for (name, z0), z1, src_j in zip(heads, ends, ('Hips', 'Spine02', 'Spine01', 'neck', 'Head')):
    b = adata.edit_bones.new(name)
    y = J[src_j].y
    b.head, b.tail = Vector((0, y, z0)), Vector((0, y, max(z1, z0 + 0.05)))
    b.roll = 0.0
    if name != 'R_Pelvis':
        b.parent = adata.edit_bones[heads[[h[0] for h in heads].index(name) - 1][0]]
bpy.ops.object.mode_set(mode='OBJECT')

M.name = 'Cadet_Body'
M.data.name = 'Cadet_Body'
M['layer'] = 'rider'
for i, mat in enumerate(M.data.materials):
    if mat:
        mat.name = 'Cadet_Rider' if i == 0 else f'Cadet_Rider_{i}'
mod = M.modifiers.new('Armature', 'ARMATURE')
mod.object = arm
M.parent = arm
for n in keep:
    ob = bpy.data.objects.get(n)
    if ob:
        ob.parent = arm
        for m in ob.modifiers:
            if m.type == 'ARMATURE':
                m.object = arm
bpy.data.objects.remove(A, do_unlink=True)


# ---------------------------------------------------------------- 4. anchors the pages track
def anchor(name, p, bone):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.01
    e.location = Vector(p)
    e['bone'] = bone
    e['layer'] = 'anchor'
    sc.collection.objects.link(e)


for s, k in (('Left', 'L'), ('Right', 'R')):
    anchor('RAnchor_Hand_' + k, J[s + 'Hand'] + hand_dir[s] * 0.075, 'R_Chest')
anchor('RAnchor_Elbow', J['LeftForeArm'], 'R_Chest')
anchor('RAnchor_Elbow_R', J['RightForeArm'], 'R_Chest')
anchor('RAnchor_Heel', J['LeftFoot'] + Vector((0.0, 0.045, -0.075)), 'R_Pelvis')
anchor('RAnchor_Hip', J['LeftUpLeg'] + Vector((0.06, 0, 0)), 'R_Pelvis')
anchor('RAnchor_Ear', J['Head'] + Vector((0.075, 0.01, 0.075)), 'R_Head')
anchor('RAnchor_Shoulder', J['LeftArm'] + Vector((0.02, 0, 0)), 'R_Chest')
anchor('RAnchor_Neck', J['neck'], 'R_Neck')
anchor('RAnchor_Core', J['Spine'], 'R_Chest')
anchor('RAnchor_Lumbar', J['Spine02'], 'R_Spine')
anchor('RAnchor_Top', Vector((0, J['Head'].y, top)), 'R_Head')

print('RIDER', json.dumps(report))
print('RIDER tris', sum(len(p.vertices) - 2 for p in M.data.polygons), 'top above seat %.3f' % (top - SZ), 'hips', tuple(round(c, 3) for c in J['Hips']))
save(out_path)
