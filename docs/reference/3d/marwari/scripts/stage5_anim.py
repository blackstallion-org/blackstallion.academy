# Stage 5: author the reusable clips on the Marwari rig.
# Legs use a planar two-bone IK (forearm+cannon, gaskin+cannon) so hooves stay planted through stance;
# the shoulder/hip swing the whole limb, pastern and hoof fold through swing and lie flat in stance.
# Convention (checked in the test pose): rotating a bone +X moves it toward the tail (+Y);
# phi(v) = atan2(v.y, -v.z) is a sagittal angle measured from straight down, positive toward the tail.
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
sc = bpy.context.scene
sc.render.fps = 30
arm = bpy.data.objects['MarwariRig']
P = arm.pose.bones
B = arm.data.bones
vl = bpy.context.view_layer
for pb in P:
    pb.rotation_mode = 'XYZ'

def phi(v):
    return math.atan2(v.y, -v.z)

def rest_dir(n):
    return B[n].tail_local - B[n].head_local

PHI0 = {b.name: phi(rest_dir(b.name)) for b in B}

def cur_phi(n):
    return phi(P[n].tail - P[n].head)

def clear_pose():
    for pb in P:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
    vl.update()

def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)

FRONT = {s: ['Scapula_' + s, 'Humerus_' + s, 'Forearm_' + s, 'Cannon_F_' + s, 'Pastern_F_' + s, 'Hoof_F_' + s] for s in 'LR'}
HIND = {s: ['Femur_' + s, 'Gaskin_' + s, 'Cannon_B_' + s, 'Pastern_B_' + s, 'Hoof_B_' + s] for s in 'LR'}

def rest_pt(n, end='head'):
    return (B[n].head_local if end == 'head' else B[n].tail_local).copy()

# knee/hock bend side in the rest pose, so the solver reproduces the rest leg exactly
def bend_sign(upper, lower):
    E, K, T = rest_pt(upper), rest_pt(lower), rest_pt(lower, 'tail')
    a = phi(K - E); b = phi(T - E)
    return 1.0 if a >= b else -1.0

SIGN = {}
for s in 'LR':
    SIGN['F' + s] = bend_sign('Forearm_' + s, 'Cannon_F_' + s)
    SIGN['H' + s] = bend_sign('Gaskin_' + s, 'Cannon_B_' + s)
# a straight foreleg has no rest bend: a carpus always folds forward (toward the head), a hock backward
for s in 'LR':
    SIGN['F' + s] = -1.0
    SIGN['H' + s] = 1.0

def two_bone(E, T, a, b, sign):
    d = T - E
    D = math.hypot(d.y, d.z)
    D = min(max(D, abs(a - b) + 1e-4), a + b - 1e-4)
    beta = math.atan2(d.y, -d.z)
    alpha = math.acos(max(-1.0, min(1.0, (a * a + D * D - b * b) / (2 * a * D))))
    phi_u = beta + sign * alpha
    K = Vector((E.x, E.y + a * math.sin(phi_u), E.z - a * math.cos(phi_u)))
    phi_l = math.atan2(T.y - K.y, -(T.z - K.z))
    return phi_u, phi_l

def set_abs(chain, abs_phis, parent_delta):
    """Set local X rotations so each bone in `chain` gets the given absolute sagittal angle (None = keep rest-relative)."""
    prev = parent_delta
    for n, ph in zip(chain, abs_phis):
        delta = (ph - PHI0[n]) if ph is not None else prev
        P[n].rotation_euler.x = delta - prev
        prev = delta
    vl.update()

def solve_leg(kind, s, target, swing_angle_k, flex, hoof_rest_extra=0.0, pastern_rest_extra=0.0):
    """kind 'F' or 'H'. target: desired fetlock (armature space). flex 0..1 folds pastern+hoof (swing)."""
    if kind == 'F':
        scap, hum, upper, lower, past, hoof = FRONT[s]
        pivot = P[hum].head  # shoulder joint
        F0 = rest_pt(lower, 'tail'); S0 = rest_pt(hum)
        psi = phi(target - pivot) - phi(F0 - S0)
        P[scap].rotation_euler.x = 0.0; P[hum].rotation_euler.x = 0.0; vl.update()
        base = cur_phi(scap) - PHI0[scap]
        P[scap].rotation_euler.x = 0.45 * psi * swing_angle_k; vl.update()
        d_scap = cur_phi(scap) - PHI0[scap]
        P[hum].rotation_euler.x = psi * swing_angle_k - (d_scap - base); vl.update()
        parent = hum
        flex_p, flex_h = math.radians(48), math.radians(14)
    else:
        fem, upper, lower, past, hoof = HIND[s]
        pivot = P[fem].head  # hip joint
        F0 = rest_pt(lower, 'tail'); S0 = rest_pt(fem)
        psi = phi(target - pivot) - phi(F0 - S0)
        P[fem].rotation_euler.x = 0.0; vl.update()
        P[fem].rotation_euler.x = 0.9 * psi * swing_angle_k; vl.update()
        parent = fem
        flex_p, flex_h = math.radians(40), math.radians(12)
    E = P[upper].head.copy()
    a, b = B[upper].length, B[lower].length
    pu, pl = two_bone(E, target, a, b, SIGN[kind + s])
    d_parent = cur_phi(parent) - PHI0[parent]
    # pastern/hoof: flat on the ground in stance (rest absolute angles), folded toward the cannon in swing
    rest_p = PHI0[past] + pastern_rest_extra
    rest_h = PHI0[hoof] + hoof_rest_extra
    fold_p = pl + (PHI0[past] - PHI0[lower]) + flex_p
    fold_h = fold_p + (PHI0[hoof] - PHI0[past]) + flex_h
    pp = rest_p + (fold_p - rest_p) * flex
    ph = rest_h + (fold_h - rest_h) * flex
    set_abs([upper, lower, past, hoof], [pu, pl, pp, ph], d_parent)
    return [n for n in (FRONT[s] if kind == 'F' else HIND[s])]

def key(names, frame, loc=False, rot=True, scale=False):
    for n in names:
        if rot: P[n].keyframe_insert('rotation_euler', frame=frame)
        if loc: P[n].keyframe_insert('location', frame=frame)
        if scale: P[n].keyframe_insert('scale', frame=frame)

def new_action(name):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = act
    return act

def finish(act):
    for fc in act.fcurves if hasattr(act, 'fcurves') else []:
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    try:
        for layer in act.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    except AttributeError:
        pass
    tr = arm.animation_data.nla_tracks.new(); tr.name = act.name
    tr.strips.new(act.name, int(act.frame_range[0]), act); tr.mute = True
    arm.animation_data.action = None
    clear_pose()

LEGS = [('F', 'L'), ('F', 'R'), ('H', 'L'), ('H', 'R')]

def gait(name, frames, duty, offsets, sweep, lift, bob, bob_phase, nod, tail_lift, roll):
    act = new_action(name)
    rest_fet = {(k, s): rest_pt(('Cannon_F_' if k == 'F' else 'Cannon_B_') + s, 'tail') for k, s in LEGS}
    for f in range(frames + 1):
        t = (f % frames) / frames
        clear_pose()
        # trunk: vertical bob (twice per stride), a little roll, the neck nods
        P['Body'].location = (0, bob * math.cos(4 * math.pi * (t - bob_phase)), 0)
        P['Body'].rotation_euler.z = math.radians(roll) * math.sin(2 * math.pi * t)
        P['Neck_1'].rotation_euler.x = math.radians(nod) * math.cos(4 * math.pi * (t - bob_phase))
        P['Head'].rotation_euler.x = -math.radians(nod * 0.6) * math.cos(4 * math.pi * (t - bob_phase))
        P['Tail_1'].rotation_euler.x = math.radians(tail_lift)
        for i in range(1, 5):
            P[f'Tail_{i}'].rotation_euler.z = math.radians(3 + 2 * i) * math.sin(2 * math.pi * t - 0.7 * i)
        vl.update()
        used = ['Body', 'Neck_1', 'Head', 'Tail_1', 'Tail_2', 'Tail_3', 'Tail_4']
        for k, s in LEGS:
            ph = (t - offsets[k + s]) % 1.0
            F0 = rest_fet[(k, s)]
            L = sweep[k]; h = lift[k]
            if ph < duty:  # stance: hoof slides back under the moving body
                u = ph / duty
                y = -L / 2 + L * u
                z = 0.0
                flex = smooth((u - 0.9) / 0.1) * 0.2  # breakover
            else:          # swing: lift, fold, reach forward
                u = (ph - duty) / (1 - duty)
                y = L / 2 - L * (0.5 - 0.5 * math.cos(math.pi * u))
                z = h * math.sin(math.pi * u ** 0.85)
                flex = 0.2 + 0.8 * smooth(u / 0.3) if u < 0.5 else smooth((0.92 - u) / 0.42)
            target = Vector((F0.x, F0.y + y, F0.z + z))
            used += solve_leg(k, s, target, 1.0, flex)
        key(['Body'], f, loc=True)
        key(used, f)
    sc.frame_start, sc.frame_end = 0, frames
    finish(act)

# ---------------------------------------------------------------- clips
clear_pose()

# Walk: four-beat lateral sequence (LH, LF, RH, RF), 1.2 s stride
gait('Walk', 36, 0.62, {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75},
     {'F': 0.56, 'H': 0.52}, {'F': 0.16, 'H': 0.13}, 0.012, 0.15, 3.0, 4.0, 1.2)
# Trot: two-beat diagonal pairs with suspension, 0.7 s stride
gait('Trot', 21, 0.44, {'FL': 0.0, 'HR': 0.0, 'FR': 0.5, 'HL': 0.5},
     {'F': 0.64, 'H': 0.60}, {'F': 0.26, 'H': 0.20}, 0.026, 0.22, 1.2, 12.0, 0.6)

# Idle breathing: 4 s, ribcage widens and deepens, the neck rises a hair on the inhale
act = new_action('Idle_Breathing')
for f in range(0, 121):
    t = f / 120.0
    b = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    P['Ribcage'].scale = (1 + 0.024 * b, 1 + 0.008 * b, 1 + 0.010 * b)
    P['Spine_Thoracic'].rotation_euler.x = -math.radians(0.35) * b
    P['Neck_1'].rotation_euler.x = -math.radians(0.6) * b
    key(['Ribcage'], f, scale=True); key(['Spine_Thoracic', 'Neck_1'], f)
finish(act)

# Head turn: look to the horse's right, back, to its left, back (8 s)
act = new_action('Head_Turn')
seq = [(0, 0), (45, 1), (95, 1), (125, 0), (160, -0.8), (205, -0.8), (240, 0)]
def interp(seq, f):
    for (f0, v0), (f1, v1) in zip(seq, seq[1:]):
        if f0 <= f <= f1:
            return v0 + (v1 - v0) * smooth((f - f0) / (f1 - f0))
    return seq[-1][1]
for f in range(0, 241):
    v = interp(seq, f)
    P['Neck_2'].rotation_euler.z = math.radians(8) * v
    P['Neck_3'].rotation_euler.z = math.radians(10) * v
    P['Head'].rotation_euler.z = math.radians(9) * v
    P['Head'].rotation_euler.y = math.radians(5) * v
    P['Head'].rotation_euler.x = math.radians(3) * abs(v)
    key(['Neck_2', 'Neck_3', 'Head'], f)
finish(act)

# Ear rotation: the ears swivel independently (4 s)
act = new_action('Ear_Rotate')
left = [(0, 0), (20, 0), (40, 1), (70, 1), (90, -0.3), (105, 0), (120, 0)]
right = [(0, 0), (35, 0), (55, 0.8), (75, 0.8), (95, 0), (120, 0)]
for f in range(0, 121):
    l, r = interp(left, f), interp(right, f)
    P['Ear_L'].rotation_euler.y = math.radians(55) * l
    P['Ear_L'].rotation_euler.x = math.radians(12) * l
    P['Ear_R'].rotation_euler.y = -math.radians(55) * r
    P['Ear_R'].rotation_euler.x = math.radians(12) * r
    key(['Ear_L', 'Ear_R'], f)
finish(act)

# Blink: 0.5 s
act = new_action('Blink')
for f, v in [(0, 1), (2, 0.75), (4, 0.12), (6, 0.08), (9, 0.4), (12, 0.9), (15, 1)]:
    for s in 'LR':
        P[f'Eye_{s}'].scale = (1, v, 1)
        key([f'Eye_{s}'], f, rot=False, scale=True)
finish(act)

# Weight shift: rest the right hind on its toe, hip drops, then take the weight back (6 s)
act = new_action('Weight_Shift')
seq = [(0, 0), (40, 1), (140, 1), (180, 0)]
rest_fet = {s: rest_pt('Cannon_B_' + s, 'tail') for s in 'LR'}
for f in range(0, 181):
    clear_pose()
    v = interp(seq, f)
    sway = math.sin(2 * math.pi * f / 180.0) * 0.15 * v
    P['Pelvis'].rotation_euler.y = -math.radians(3.2) * v
    P['Spine_Lumbar'].rotation_euler.z = math.radians(1.0) * v
    P['Neck_1'].rotation_euler.x = math.radians(2.5 + sway) * v
    vl.update()
    used = ['Pelvis', 'Spine_Lumbar', 'Neck_1']
    used += solve_leg('H', 'L', rest_fet['L'], 1.0, 0.0)
    tgt = rest_fet['R'] + Vector((0, -0.05 * v, 0.07 * v))
    used += solve_leg('H', 'R', tgt, 1.0, 0.0, hoof_rest_extra=math.radians(42) * v, pastern_rest_extra=math.radians(30) * v)
    key(used, f)
finish(act)

# Tail sway: a slow travelling wave down the dock (3 s)
act = new_action('Tail_Sway')
for f in range(0, 91):
    t = f / 90.0
    for i in range(1, 5):
        P[f'Tail_{i}'].rotation_euler.z = math.radians(4 + 2.5 * i) * math.sin(2 * math.pi * t - 0.65 * i)
        P[f'Tail_{i}'].rotation_euler.x = math.radians(1.5) * math.sin(4 * math.pi * t - 0.5 * i)
    key([f'Tail_{i}' for i in range(1, 5)], f)
finish(act)

print('ACTIONS', [(a.name, tuple(a.frame_range)) for a in bpy.data.actions])
bpy.ops.wm.save_as_mainfile(filepath=argv[1])
