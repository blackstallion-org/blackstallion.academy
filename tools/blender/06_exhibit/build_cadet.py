# Stage D: the cadet rider, built in the horse's rest space, seated on the saddle (pose.json from build_tack.py).
# A young adult in the academy turnout: black hard hat with a peak, black jacket with brass buttons, white breeches, tall black boots,
# gloves. Proportions of a 1.65 m rider (sitting height ~0.53, thigh 0.41, shin 0.40). Own armature "CadetRig" (Pelvis, Spine, Chest,
# Neck, Head, all vertical with identity rest rotation); the page rides the Pelvis on the horse's seat and lets the spine absorb motion.
# usage: blender -b <tack.blend> -P build_cadet.py -- <out.blend> <pose.json>
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

out, pose_json = sys.argv[sys.argv.index('--') + 1:][:2]
rig = Rig()
pose = json.load(open(pose_json))
SY, SZ = pose['seat_y'], pose['seat_z']


def P(x, dy, dz):
    """Rider-relative point: dy > 0 is toward the horse's tail, dz above the seat."""
    return Vector((x, SY + dy, SZ + dz))


MAT = dict(
    jacket=material('Jacket', (0.012, 0.014, 0.022), 0.62),
    breeches=material('Breeches', (0.80, 0.78, 0.72), 0.7),
    boot=material('Boot', (0.018, 0.015, 0.014), 0.3),
    sole=material('Sole', (0.03, 0.022, 0.018), 0.6),
    skin=material('Skin', (0.20, 0.098, 0.052), 0.5),
    lip=material('Lip', (0.17, 0.055, 0.045), 0.45),
    stock=material('Stock', (0.85, 0.84, 0.80), 0.6),
    helmet=material('Helmet', (0.010, 0.010, 0.012), 0.82),
    glove=material('Glove', (0.03, 0.025, 0.022), 0.5),
    brass=material('Brass', (0.80, 0.58, 0.22), 0.3, 1.0),
    steel=material('StirrupSteel', (0.72, 0.72, 0.74), 0.28, 1.0),
    leather=material('StirrupLeather', (0.085, 0.050, 0.030), 0.45),
    hair=material('Hair', (0.012, 0.010, 0.010), 0.7),
    white=material('Eyeball', (0.7, 0.68, 0.64), 0.4),
    dark=material('Pupil', (0.01, 0.008, 0.006), 0.3),
)

# ---------------------------------------------------------------- armature (vertical bones, no roll: identity rest rotations)
bpy.ops.object.select_all(action='DESELECT')
adata = bpy.data.armatures.new('CadetRig')
arm = bpy.data.objects.new('CadetRig', adata)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
joints = [('R_Pelvis', 0.07, 0.22), ('R_Spine', 0.22, 0.40), ('R_Chest', 0.40, 0.56), ('R_Neck', 0.56, 0.66), ('R_Head', 0.66, 0.90)]
prev = None
for name, z0, z1 in joints:
    b = adata.edit_bones.new(name)
    b.head, b.tail = P(0, 0, z0), P(0, 0, z1)
    b.roll = 0.0
    if prev:
        b.parent = prev
        b.use_connect = True
    prev = b
bpy.ops.object.mode_set(mode='OBJECT')
ZJ = [0.07, 0.22, 0.40, 0.56, 0.66]
BN = ['R_Pelvis', 'R_Spine', 'R_Chest', 'R_Neck', 'R_Head']
made = []


def blend_w(dz):
    """Skin weights of a point at height dz above the seat, blended between neighbouring spine bones."""
    if dz <= ZJ[0]:
        return {BN[0]: 1.0}
    for i in range(len(ZJ) - 1):
        if dz <= ZJ[i + 1]:
            t = smooth((dz - ZJ[i]) / (ZJ[i + 1] - ZJ[i]))
            return {BN[i]: 1 - t, BN[i + 1]: t}
    return {BN[-1]: 1.0}


def add(name, mb, mat, bone=None, blend=False, extras=None):
    w = [blend_w(v.z - SZ) for v in mb.v] if blend else None
    ob = make_object(rig, name, mb, mat, bone=None if blend else bone, weights=w, layer='rider', extras=extras, arm=arm)
    made.append(ob)
    return ob


def anchor(name, p, bone):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.01
    e.location = Vector(p)
    e['bone'] = bone
    e['layer'] = 'anchor'
    bpy.context.scene.collection.objects.link(e)


# ---------------------------------------------------------------- torso: jacket, a loft with measured sections
secs = [(0.03, 0.190, 0.130), (0.10, 0.185, 0.125), (0.21, 0.158, 0.108), (0.33, 0.172, 0.114), (0.44, 0.196, 0.124), (0.505, 0.206, 0.118), (0.545, 0.150, 0.095), (0.585, 0.062, 0.062)]


def interp(arr, z, k):
    for i in range(len(arr) - 1):
        if z <= arr[i + 1][0]:
            t = (z - arr[i][0]) / (arr[i + 1][0] - arr[i][0])
            return lerp(arr[i][k], arr[i + 1][k], smooth(t))
    return arr[-1][k]


zs = [0.03 + i * (0.585 - 0.03) / 28 for i in range(29)]
path = [P(0, 0.0 - 0.012 * (z / 0.58), z) for z in zs]
torso = loft(path, lambda t: interp(secs, zs[min(28, int(round(t * 28)))], 1), lambda t: interp(secs, zs[min(28, int(round(t * 28)))], 2), ref=(1, 0, 0), seg=28, caps=(True, False), cap_rings=3)
add('Cadet_Jacket', torso, MAT['jacket'], blend=True)

# collar band and neck
add('Cadet_Collar', loft([P(0, -0.012, 0.565), P(0, -0.012, 0.615)], 0.066, 0.066, seg=20, caps=(False, False)), MAT['jacket'], bone='R_Neck')
add('Cadet_Neck', loft([P(0, -0.012, 0.56), P(0, -0.015, 0.66)], 0.050, 0.052, seg=16, caps=(False, False)), MAT['skin'], bone='R_Neck')

# ---------------------------------------------------------------- head, face, hat
HC = P(0, -0.012, 0.755)
head = blob(HC, (0.078, 0.094, 0.108), seg=22, rings=16)
for v in head.v:   # a face: longer in front, jaw and chin, flatter sides
    dy, dz = v.y - HC.y, v.z - HC.z
    if dy < 0:
        v.y -= 0.008 * max(0, -dz / 0.108 * 0.0 + 1) * (1 - abs(dz) / 0.108) * 0.5
    if dz < -0.03:
        v.x *= 1 - 0.18 * min(1, (-dz - 0.03) / 0.07)
head_mb = head
head_mb.merge(blob(HC + Vector((0, -0.088, -0.012)), (0.014, 0.022, 0.03), seg=10, rings=8))          # nose
head_mb.merge(blob(HC + Vector((0, -0.07, -0.072)), (0.03, 0.026, 0.02), seg=10, rings=8))            # chin
for s in (-1, 1):
    head_mb.merge(blob(HC + Vector((s * 0.081, 0.0, -0.01)), (0.012, 0.022, 0.034), seg=10, rings=8))   # ears
    head_mb.merge(blob(HC + Vector((s * 0.028, -0.081, 0.03)), (0.017, 0.007, 0.007), seg=8, rings=6))  # brows
add('Cadet_Head', head_mb, MAT['skin'], bone='R_Head')
eyes = MB()
sclera = MB()
for s in (-1, 1):
    sclera.merge(blob(HC + Vector((s * 0.031, -0.0795, 0.014)), (0.0125, 0.0075, 0.0085), seg=10, rings=8))
    eyes.merge(blob(HC + Vector((s * 0.031, -0.0855, 0.014)), (0.0068, 0.0045, 0.0068), seg=10, rings=8))
add('Cadet_Sclera', sclera, MAT['white'], bone='R_Head')
add('Cadet_Eyes', eyes, MAT['dark'], bone='R_Head')
lips = MB()
lips.merge(blob(HC + Vector((0, -0.083, -0.046)), (0.021, 0.008, 0.0075), seg=12, rings=8))
lips.merge(blob(HC + Vector((0, -0.081, -0.057)), (0.017, 0.007, 0.0065), seg=12, rings=8))
add('Cadet_Lips', lips, MAT['lip'], bone='R_Head')
hair = MB()
for s in (-1, 1):
    hair.merge(blob(HC + Vector((s * 0.074, 0.012, 0.012)), (0.012, 0.03, 0.03), seg=10, rings=8))
hair.merge(blob(HC + Vector((0, 0.07, 0.0)), (0.07, 0.03, 0.06), seg=12, rings=8))
add('Cadet_Hair', hair, MAT['hair'], bone='R_Head')
add('Cadet_Stock', loft([P(0, -0.012, 0.612), P(0, -0.012, 0.628)], 0.060, 0.060, seg=20, caps=(False, False)), MAT['stock'], bone='R_Neck')

hat = blob(HC + Vector((0, 0.002, 0.036)), (0.097, 0.108, 0.088), seg=24, rings=14)
for v in hat.v:
    if v.z < HC.z + 0.036 - 0.01 and v.y < HC.y:
        pass
hat_mb = MB()
hat_mb.v = [v for v in hat.v]
hat_mb.f = hat.f
hat_mb.c = hat.c
# keep only the upper dome (drop faces whose vertices are all below the hat band)
band_z = HC.z + 0.002
keep = [f for f in hat_mb.f if any(hat_mb.v[i].z > band_z for i in f)]
hat_mb.f = keep
peak = loft([HC + Vector((0, -0.092, 0.02 + 0.002)), HC + Vector((0, -0.145, 0.0)), HC + Vector((0, -0.16, -0.005))], lambda t: 0.075 - 0.03 * t, 0.004, ref=(1, 0, 0), seg=16, caps=(False, True), cap_rings=1)
hat_mb.merge(peak)
add('Cadet_Hat', hat_mb, MAT['helmet'], bone='R_Head')
strap = MB()
for s in (-1, 1):
    strap.merge(loft([HC + Vector((s * 0.093, -0.01, 0.0)), HC + Vector((s * 0.088, -0.025, -0.05)), HC + Vector((s * 0.04, -0.07, -0.078)), HC + Vector((0, -0.075, -0.082))], 0.0055, 0.0045, ref=(0, 1, 0), seg=6, caps=(True, True), cap_rings=1))
add('Cadet_Chinstrap', strap, MAT['hair'], bone='R_Head')

# ---------------------------------------------------------------- arms: sleeves, cuffs and gloved hands holding the reins
HAND = {}
for S, nm in ((1.0, 'L'), (-1.0, 'R')):
    sh, el, wr = P(S * 0.19, -0.005, 0.50), P(S * 0.205, -0.06, 0.245), P(S * 0.10, -0.285, 0.205)
    sleeve = loft(catmull([sh, el, wr], 20), lambda t: 0.060 - 0.020 * t, lambda t: 0.058 - 0.020 * t, ref=(0, 1, 0), seg=16, caps=(True, False), cap_rings=3)
    add('Cadet_Sleeve_' + nm, sleeve, MAT['jacket'], bone='R_Chest')
    hc = wr + Vector((-S * 0.004, -0.05, -0.004))
    fist = blob(hc, (0.042, 0.052, 0.034), seg=12, rings=8)
    fist.merge(blob(hc + Vector((-S * 0.0, -0.0, 0.032)), (0.02, 0.04, 0.012), seg=8, rings=6))
    add('Cadet_Glove_' + nm, fist, MAT['glove'], bone='R_Chest')
    HAND[nm] = hc
    anchor('RAnchor_Hand_' + nm, hc + Vector((0, -0.01, -0.006)), 'R_Chest')
    anchor('RAnchor_Elbow' if nm == 'L' else 'RAnchor_Elbow_R', el, 'R_Chest')

# ---------------------------------------------------------------- legs: breeches, boots, stirrups; centres kept clear of the horse's flank
add('Cadet_Seat', blob(P(0, 0.025, 0.055), (0.165, 0.12, 0.085), seg=18, rings=12), MAT['breeches'], bone='R_Pelvis')


def clear(p, S, r):
    q = Vector(p)
    for _ in range(80):
        if rig.depth(q) <= -(r + 0.006):
            break
        q.x += S * 0.004
    return q


stir = {}
for S, nm in ((1.0, 'L'), (-1.0, 'R')):
    hip = P(S * 0.095, 0.0, 0.072)
    knee = clear(P(S * 0.25, -0.34, -0.15), S, 0.062)
    ankle = clear(P(S * 0.30, -0.035, -0.425), S, 0.05)
    ankle.y = SY - 0.035
    # thigh: a stout tube from the hip to above the knee
    mid = clear(hip.lerp(knee, 0.5) + Vector((S * 0.02, 0, 0)), S, 0.08)
    thigh = loft(catmull([hip, mid, knee], 18), lambda t: 0.098 - 0.040 * t, lambda t: 0.090 - 0.030 * t, ref=(1, 0, 0), seg=16, caps=(True, True), cap_rings=3)
    add('Cadet_Thigh_' + nm, thigh, MAT['breeches'], bone='R_Pelvis')
    # tall boot: below the knee to the ankle; the top flares slightly
    top = knee + (ankle - knee).normalized() * 0.07
    bootpts = catmull([top, top.lerp(ankle, 0.5) + Vector((S * 0.004, 0.012, 0)), ankle], 14)
    boot = loft(bootpts, lambda t: 0.060 - 0.017 * t, lambda t: 0.066 - 0.024 * t, ref=(1, 0, 0), seg=16, caps=(True, False), cap_rings=2)
    foot = loft([ankle + Vector((0, 0.055, -0.045)), ankle + Vector((0, -0.01, -0.062)), ankle + Vector((0, -0.12, -0.066)), ankle + Vector((0, -0.215, -0.056))], lambda t: 0.046 - 0.006 * t, lambda t: 0.060 - 0.022 * t, ref=(1, 0, 0), seg=14, caps=(True, True), cap_rings=3)
    boot.merge(foot)
    add('Cadet_Boot_' + nm, boot, MAT['boot'], bone='R_Pelvis')
    sole = loft([ankle + Vector((0, 0.058, -0.086)), ankle + Vector((0, -0.12, -0.098)), ankle + Vector((0, -0.215, -0.082))], 0.046, 0.0065, ref=(1, 0, 0), seg=12, caps=(True, True), cap_rings=1)
    add('Cadet_Sole_' + nm, sole, MAT['sole'], bone='R_Pelvis')
    # stirrup iron under the ball of the foot, hung on a leather from the saddle bar
    ball = ankle + Vector((0, -0.12, -0.108))
    cx = ball.x
    iron = MB()
    ring = [Vector((cx + S * 0.0, ball.y, ball.z + 0.012 + 0.058 + 0.062 * math.sin(a))) + Vector((0.058 * math.cos(a), 0, 0)) for a in [i * 2 * math.pi / 22 for i in range(23)]]
    iron.merge(loft(ring, 0.0055, 0.0055, seg=6, caps=(False, False)))
    iron.merge(loft([Vector((cx - 0.06, ball.y, ball.z)), Vector((cx + 0.06, ball.y, ball.z))], 0.012, 0.011, ref=(0, 1, 0), seg=8, caps=(True, True), cap_rings=1))
    add('Cadet_Stirrup_' + nm, iron, MAT['steel'], bone='R_Pelvis')
    bar = Vector(pose['bar_' + nm])
    eye = Vector((cx, ball.y, ball.z + 0.012 + 0.058 + 0.062))
    leather = loft([bar, bar.lerp(eye, 0.5) + Vector((S * 0.01, 0, 0)), eye], 0.0035, 0.0135, ref=(1, 0, 0), seg=8, caps=(True, True), cap_rings=1)
    add('Cadet_Leather_' + nm, leather, MAT['leather'], bone='R_Pelvis')
    stir[nm] = dict(ankle=ankle, knee=knee)
    if nm == 'L':
        anchor('RAnchor_Heel', ankle + Vector((0.0, 0.05, -0.06)), 'R_Pelvis')
        anchor('RAnchor_Hip', hip + Vector((S * 0.06, 0, 0)), 'R_Pelvis')

# ---------------------------------------------------------------- buttons down the front of the jacket
btn = MB()
for k in range(6):
    dz = 0.17 + k * 0.062
    front = HC.y * 0 + SY - 0.012 * (dz / 0.58) - interp(secs, dz, 2) - 0.004
    for sx in (-0.014, 0.014):
        btn.merge(blob(Vector((sx, front, SZ + dz)), (0.0065, 0.0045, 0.0065), seg=8, rings=6))
for s in (-1, 1):
    btn.merge(blob(P(s * 0.032, -0.014 - 0.0, 0.585), (0.007, 0.0045, 0.007), seg=8, rings=6))
add('Cadet_Buttons', btn, MAT['brass'], blend=True)

# ---------------------------------------------------------------- anchors the page tracks
anchor('RAnchor_Ear', P(0.083, -0.012, 0.745), 'R_Head')
anchor('RAnchor_Shoulder', P(0.20, -0.005, 0.50), 'R_Chest')
anchor('RAnchor_Neck', P(0.0, -0.012, 0.60), 'R_Neck')
anchor('RAnchor_Core', P(0.0, -0.012, 0.40), 'R_Chest')
anchor('RAnchor_Lumbar', P(0.0, 0.0, 0.20), 'R_Spine')
anchor('RAnchor_Top', P(0.0, -0.012, 0.865), 'R_Head')

for nm in ('L', 'R'):
    print('LEG', nm, 'knee', tuple(round(c, 3) for c in stir[nm]['knee']), 'ankle', tuple(round(c, 3) for c in stir[nm]['ankle']))
print('CADET objects', len(made), 'polys', sum(len(o.data.polygons) for o in made), 'head top z %.3f' % (SZ + 0.88), 'hand', tuple(round(c, 3) for c in HAND['L']))
save(out)
