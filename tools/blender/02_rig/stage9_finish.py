# Stage 9: rig the hybrid low mesh, grade the baked coat, add eyes, hair cards (tail + mane), mane bones and the
# Attention_Response / Mane_Sway clips.
# usage: blender -b --factory-startup -P stage9_finish.py -- in.blend out.blend texdir
import bpy, sys, os, math, random
import numpy as np
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
blend, out, texdir = argv[0], argv[1], argv[2]
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = bpy.context.view_layer
lo = bpy.data.objects['Marwari_Low']; hi = bpy.data.objects['Marwari_High']; arm = bpy.data.objects['MarwariRig']
rnd = random.Random(11)

def select_only(ob):
    for o in vl.objects: o.select_set(False)
    ob.select_set(True); vl.objects.active = ob

# ---------------------------------------------------------------- coat grade
# the repaint left broad warm patches; flatten the low frequencies (keep hair-scale detail) so it reads as one black coat
im = bpy.data.images['marwari_basecolor']; W, H = im.size
px = np.array(im.pixels[:], np.float32).reshape(H, W, 4)
def blur(a, r):
    for _ in range(2):
        c = np.cumsum(np.pad(a, ((r + 1, r), (0, 0), (0, 0)), mode='edge'), 0); a = (c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1)
        c = np.cumsum(np.pad(a, ((0, 0), (r + 1, r), (0, 0)), mode='edge'), 1); a = (c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)
    return a
rgb = px[..., :3]
filled = rgb.max(-1) > 0.02                      # islands (the gutter is pure black)
rgb = rgb.copy()
low = blur(rgb, 24)
mean = rgb[filled].mean(0)
graded = np.where(filled[..., None], (rgb - low) + mean + 0.45 * (low - mean), rgb)
graded = np.clip(graded * np.array([0.92, 0.9, 0.9], np.float32), 0, 1)
artifact = rgb.max(-1) > 0.45                    # bake misses (white) around the closed tail root: paint with the coat mean
graded = np.where(artifact[..., None], mean * 0.9, graded)
px[..., :3] = graded
im.pixels[:] = px.ravel(); im.update(); im.pack()
im.filepath_raw = os.path.join(texdir, f'marwari_base_graded_{W}.png'); im.file_format = 'PNG'; im.save()
print('GRADED', rgb[filled].mean().round(4), '->', graded[filled].mean().round(4))

# ---------------------------------------------------------------- rig the body
for m in list(lo.modifiers): lo.modifiers.remove(m)
am = lo.modifiers.new('Armature', 'ARMATURE'); am.object = arm; lo.parent = arm
hi.hide_viewport = True; hi.hide_render = True
for m in hi.modifiers:
    if m.type == 'ARMATURE': m.show_viewport = False

def crest_points(n=7, y0=-1.0, y1=-0.45):
    pts = []
    for y in np.linspace(y0, y1, n):
        best = None
        for v in lo.data.vertices:
            if abs(v.co.y - y) < 0.025 and abs(v.co.x) < 0.09 and (best is None or v.co.z > best.z): best = v.co.copy()
        pts.append(best if best else Vector((0.0, float(y), 1.7)))
    return pts

# ---------------------------------------------------------------- mane bones (secondary motion)
cp = crest_points(5, -1.0, -0.5)
select_only(arm); bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones
neck_for = ['Neck_3', 'Neck_3', 'Neck_2', 'Neck_2', 'Neck_1']
for i in range(4):
    b = eb.new(f'Mane_{i+1}'); b.head = cp[i] + Vector((0.0, 0.0, -0.03)); b.tail = cp[i + 1] + Vector((0.0, 0.0, -0.03))
    b.parent = eb[neck_for[i]]; b.use_connect = False; b.use_deform = True
bpy.ops.object.mode_set(mode='OBJECT')
MANE_BONES = [arm.data.bones[f'Mane_{i+1}'] for i in range(4)]
TAIL_BONES = [arm.data.bones[f'Tail_{i+1}'] for i in range(4)]

# ---------------------------------------------------------------- hair strand atlas
N = 1024; cols = 8
rs = np.random.default_rng(5)
atlas = np.zeros((N, N, 4), np.float32)
v = np.linspace(0, 1, N)[:, None]
for c in range(cols):
    cw = N // cols; x = np.arange(cw)[None, :]
    alpha = np.zeros((N, cw), np.float32); shade = np.zeros((N, cw), np.float32)
    for s in range(7):
        cx = rs.uniform(0.08, 0.92) * cw; w = rs.uniform(5, 11)
        wob = rs.uniform(2, 7) * np.sin(v * rs.uniform(3, 9) + rs.uniform(0, 6))
        d = np.abs(x - (cx + wob))
        taper = np.clip(1.0 - (v - rs.uniform(0.55, 0.9)) / 0.25, 0.0, 1.0)      # strands thin out toward the tip
        a = np.clip(1.0 - d / (w * (0.35 + 0.65 * taper)), 0, 1) ** 0.8
        alpha = np.maximum(alpha, a)
        shade = np.where(a > 0.05, rs.uniform(0.0, 1.0) * 0.5 + 0.5 * a, shade)
    base = 0.014 + 0.05 * shade
    atlas[:, c * cw:(c + 1) * cw, 0] = base * 1.0; atlas[:, c * cw:(c + 1) * cw, 1] = base * 0.88; atlas[:, c * cw:(c + 1) * cw, 2] = base * 0.8
    atlas[:, c * cw:(c + 1) * cw, 3] = (alpha > 0.28).astype(np.float32) * np.clip(alpha * 1.6, 0, 1)
hair_img = bpy.data.images.new('marwari_hair', N, N, alpha=True); hair_img.pixels[:] = atlas.ravel(); hair_img.pack()
hair_img.filepath_raw = os.path.join(texdir, 'marwari_hair_1024.png'); hair_img.file_format = 'PNG'; hair_img.save()

hair_mat = bpy.data.materials.new('Marwari_Hair'); hair_mat.use_nodes = True
nt = hair_mat.node_tree; b = nt.nodes['Principled BSDF']
tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = hair_img
nt.links.new(tn.outputs[0], b.inputs['Base Color']); nt.links.new(tn.outputs[1], b.inputs['Alpha'])
b.inputs['Roughness'].default_value = 0.5; b.inputs['Metallic'].default_value = 0.0
hair_mat.surface_render_method = 'DITHERED'; hair_mat.use_backface_culling = False

# ---------------------------------------------------------------- card builders
def bez(pts, t):
    n = len(pts) - 1; f = t * n; i = min(int(f), n - 1); u = f - i
    p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, n)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)

hair_verts, hair_faces, hair_uvs, hair_w = [], [], [], []
def add_card(path, width, angle, col, bone_weights, segs=8):
    """path: list of Vectors (root -> tip). angle: ribbon orientation about the path (radians, 0 = width along X)."""
    base = len(hair_verts); u0, u1 = col / cols, (col + 1) / cols
    for k in range(segs + 1):
        t = k / segs; p = bez(path, t); q = bez(path, min(t + 0.02, 1.0)); tang = (q - p) if t < 0.98 else (p - bez(path, t - 0.02))
        tang.normalize()
        side = Vector((math.cos(angle), math.sin(angle), 0.0)); side = (side - tang * side.dot(tang));
        if side.length < 1e-4: side = Vector((1, 0, 0))
        side.normalize(); w = width * (1.0 - 0.45 * t ** 2) * 0.5
        for sgn, uu in ((-1, u0), (1, u1)):
            hair_verts.append(p + side * w * sgn); hair_uvs.append((uu, 1.0 - t)); hair_w.append(bone_weights(p, t))
    for k in range(segs):
        a = base + 2 * k; hair_faces.append((a, a + 1, a + 3, a + 2))

def chain_weights(bones, p):
    """Blend the two bones whose segment is nearest to p (by projection along the chain)."""
    best = []
    for i, bn in enumerate(bones):
        h, t_ = bn.head_local, bn.tail_local; d = t_ - h; s = max(0.0, min(1.0, (p - h).dot(d) / max(d.length_squared, 1e-9)))
        best.append(((p - (h + d * s)).length, i, s))
    best.sort(); (d0, i0, s0) = best[0]
    # position along the whole chain -> smooth hand-over between neighbours
    w = {bones[i0].name: 1.0}
    if s0 > 0.5 and i0 + 1 < len(bones): w = {bones[i0].name: 1.5 - s0, bones[i0 + 1].name: s0 - 0.5}
    elif s0 < 0.5 and i0 > 0: w = {bones[i0].name: 0.5 + s0, bones[i0 - 1].name: 0.5 - s0}
    tot = sum(w.values()); return {k: v / tot for k, v in w.items()}

# tail: dense ribbons hanging from the dock on a smooth gravity curve (the sculpt's tail bones are too irregular to follow),
# weighted to Tail_1..4 by height (the bones are chained at the heights the sculpt's tail was measured at)
tail_curve = [Vector(c) for c in ((0.0, 0.56, 1.40), (0.0, 0.64, 1.30), (0.0, 0.725, 1.12), (0.0, 0.755, 0.86), (0.0, 0.765, 0.58), (0.0, 0.775, 0.30))]
z_to_bone = [(1.12, 'Tail_1'), (0.86, 'Tail_2'), (0.60, 'Tail_3'), (0.00, 'Tail_4')]
def tail_weights(p, t):
    zs = [1.40, 1.12, 0.86, 0.60, 0.36]; names = ['Tail_1', 'Tail_2', 'Tail_3', 'Tail_4']
    for i in range(4):
        if p.z >= zs[i + 1] or i == 3:
            f = min(1.0, max(0.0, (zs[i] - p.z) / (zs[i] - zs[i + 1])))
            if i == 3: return {'Tail_4': 1.0}
            return {names[i]: 1.0 - f * 0.5 if f > 0.5 else 1.0, names[i + 1]: f * 0.5 if f > 0.5 else 0.0} if f > 0.5 else {names[i]: 1.0}
    return {'Tail_4': 1.0}
for i in range(72):
    u = rnd.uniform(-1, 1); dep = rnd.uniform(-1, 1); curl = rnd.uniform(-1, 1)
    path = []
    for k, p in enumerate(tail_curve):
        s_ = k / (len(tail_curve) - 1)
        spread = 0.014 + 0.075 * math.sin(math.pi * min(1.0, s_ * 1.18)) ** 0.6 * (1.0 - 0.25 * s_)
        path.append(p + Vector((u * spread + curl * 0.012 * s_, dep * spread * 0.95, 0)))
    add_card(path, rnd.uniform(0.07, 0.11), rnd.uniform(0, math.pi / 2), rnd.randrange(cols), tail_weights, segs=9)
n_tail_faces = len(hair_faces)
# mane: ribbons falling over the crest toward the horse's left (+X), three drops per crest position
crest = crest_points(14, -1.02, -0.5)
for i, c in enumerate(crest):
    for layer in range(4):
        if rnd.random() < 0.05: continue
        drop = rnd.uniform(0.24, 0.34) - 0.03 * layer; out_ = rnd.uniform(0.05, 0.1) + 0.02 * layer; back = rnd.uniform(0.0, 0.05)
        root = c + Vector((rnd.uniform(-0.012, 0.004), rnd.uniform(-0.012, 0.012), -0.012))
        path = [root, root + Vector((out_ * 0.5, back * 0.3, -drop * 0.25)), root + Vector((out_ * 0.9, back * 0.7, -drop * 0.6)), root + Vector((out_, back, -drop))]
        add_card(path, rnd.uniform(0.065, 0.095), rnd.uniform(-0.5, 0.5) + math.pi / 2, rnd.randrange(cols), lambda p, t: chain_weights(MANE_BONES, Vector((p.x * 0.0 + 0.0, p.y, p.z + 0.0))), segs=7)
print('HAIR_CARDS', n_tail_faces // 9, 'tail strips', (len(hair_faces) - n_tail_faces) // 7, 'mane strips', 'tris', 2 * len(hair_faces))

me = bpy.data.meshes.new('Marwari_Hair'); me.from_pydata([tuple(v) for v in hair_verts], [], hair_faces); me.update()
uv = me.uv_layers.new(name='UVMap')
for poly in me.polygons:
    for li, vi in zip(poly.loop_indices, poly.vertices): uv.data[li].uv = hair_uvs[vi]
hair = bpy.data.objects.new('Marwari_Hair', me); sc.collection.objects.link(hair); me.materials.append(hair_mat)
for bn in TAIL_BONES + MANE_BONES: hair.vertex_groups.new(name=bn.name)
for vi, wd in enumerate(hair_w):
    for name, w in wd.items(): hair.vertex_groups[name].add([vi], float(w), 'REPLACE')
for p in me.polygons: p.use_smooth = True
hm = hair.modifiers.new('Armature', 'ARMATURE'); hm.object = arm; hair.parent = arm

# ---------------------------------------------------------------- eyes: glossy domes riding the eye bones (blink squashes them)
eye_mat = bpy.data.materials.new('Marwari_Eye'); eye_mat.use_nodes = True
eb_ = eye_mat.node_tree.nodes['Principled BSDF']
eb_.inputs['Base Color'].default_value = (0.016, 0.009, 0.006, 1); eb_.inputs['Roughness'].default_value = 0.06
eb_.inputs['Metallic'].default_value = 0.0
eyes = []
for s_, sgn in (('L', 1), ('R', -1)):
    bone = arm.data.bones[f'Eye_{s_}']
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.0148, location=bone.head_local + Vector((sgn * 0.0075, -0.003, 0.0)))
    e = bpy.context.object; e.name = f'Eye_{s_}_Dome'; e.scale = (0.72, 1.0, 1.0)   # flattened toward the skull
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); bpy.ops.object.shade_smooth()
    e.data.materials.append(eye_mat)
    g = e.vertex_groups.new(name=f'Eye_{s_}'); g.add(list(range(len(e.data.vertices))), 1.0, 'REPLACE')
    eyes.append(e)
select_only(eyes[0]); eyes[1].select_set(True); bpy.ops.object.join()
eyes_ob = vl.objects.active; eyes_ob.name = 'Marwari_Eyes'; eyes_ob.data.name = 'Marwari_Eyes'
em = eyes_ob.modifiers.new('Armature', 'ARMATURE'); em.object = arm; eyes_ob.parent = arm

# ---------------------------------------------------------------- clips
def key_rot(pb, frame): pb.keyframe_insert('rotation_euler', frame=frame)
def finish(act):
    try:
        for layer in act.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
    except AttributeError:
        pass
    tr = arm.animation_data.nla_tracks.new(); tr.name = act.name
    tr.strips.new(act.name, int(act.frame_range[0]), act); tr.mute = True
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
P = arm.pose.bones
for pb in P: pb.rotation_mode = 'XYZ'
def smooth(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
def interp(seq, f):
    for (f0, v0), (f1, v1) in zip(seq, seq[1:]):
        if f0 <= f <= f1: return v0 + (v1 - v0) * smooth((f - f0) / (f1 - f0))
    return seq[-1][1]
def new_action(name):
    act = bpy.data.actions.new(name); act.use_fake_user = True; arm.animation_data_create(); arm.animation_data.action = act; return act

# Attention_Response (3 s): both ears snap forward, the head lifts and turns a few degrees, a short eye widening, the neck follows
act = new_action('Attention_Response')
pk = [(0, 0), (6, 1), (60, 1), (84, 0.2), (90, 0)]
for f in range(0, 91):
    k = interp(pk, f)
    P['Ear_L'].rotation_euler = (math.radians(-14) * k, math.radians(18) * k, 0); P['Ear_R'].rotation_euler = (math.radians(-14) * k, math.radians(-18) * k, 0)
    P['Head'].rotation_euler = (math.radians(-6) * k, 0, math.radians(7) * interp([(0, 0), (20, 1), (70, 1), (90, 0)], f))
    P['Neck_3'].rotation_euler = (math.radians(-3) * k, 0, math.radians(5) * interp([(0, 0), (22, 1), (70, 1), (90, 0)], f))
    P['Neck_1'].rotation_euler = (math.radians(-2) * k, 0, 0)
    P['Eye_L'].scale = (1, 1 + 0.08 * k, 1); P['Eye_R'].scale = (1, 1 + 0.08 * k, 1)
    for n in ('Ear_L', 'Ear_R', 'Head', 'Neck_3', 'Neck_1'): key_rot(P[n], f)
    for n in ('Eye_L', 'Eye_R'): P[n].keyframe_insert('scale', frame=f)
finish(act)

# Mane_Sway (4 s): a slow travelling wave down the crest bones, small and bounded
act = new_action('Mane_Sway')
for f in range(0, 121):
    t = f / 120.0
    for i in range(1, 5):
        P[f'Mane_{i}'].rotation_euler = (math.radians(1.4) * math.sin(2 * math.pi * t - 0.7 * i), math.radians(2.6) * math.sin(2 * math.pi * t - 0.9 * i + 1.0), math.radians(1.2) * math.sin(4 * math.pi * t - 0.5 * i))
        key_rot(P[f'Mane_{i}'], f)
finish(act)

for ob in vl.objects: ob.select_set(False)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out)
print('STAGE9_DONE', [a.name for a in bpy.data.actions])
