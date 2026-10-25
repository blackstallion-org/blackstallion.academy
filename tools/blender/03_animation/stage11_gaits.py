# Stage 11: footfall-timed locomotion clips for the Marwari rig: Walk, Trot, Canter (R/L lead), Gallop (R/L), Sprint (R/L),
# plus Stop (halt: weight transfer) and Alert (held attention). Replaces the earlier Walk and Trot.
#
# Design (all in metres and seconds, body frame, +Y toward the tail, so "forward" is -Y):
#   v = L / T   nominal ground speed of the clip, L the stride length, T the clip period.
#   During stance a hoof moves BACKWARD relative to the body at exactly v, so it stays fixed on the ground when the root
#   advances at v (stance sweep = v * duty * T = L * duty). During swing it returns forward by the same distance.
#   Footfall timing (stance start c and duty d as fractions of the stride) comes from the gait tables below
#   (Hildebrand 1977; Biancardi & Minetti 2012 for transverse-gallop duty factors and lags).
#   Body heave, pitch, spine flexion and the head/neck counterbalance are DERIVED from the support pattern (load on fore and
#   hind limbs, flight phase), not from free sine waves.
# usage: blender -b --factory-startup -P stage11_gaits.py -- in.blend out.blend out.json
import bpy, sys, math, json, os
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
blend, out_blend, out_json = argv[0], argv[1], argv[2]
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; sc.render.fps = 30
arm = bpy.data.objects['MarwariRig']; P = arm.pose.bones; B = arm.data.bones; vl = bpy.context.view_layer
for pb in P: pb.rotation_mode = 'XYZ'

# ------------------------------------------------------------------ IK helpers (same conventions as stage 5)
def phi(v): return math.atan2(v.y, -v.z)
def rest_pt(n, end='head'): return (B[n].head_local if end == 'head' else B[n].tail_local).copy()
PHI0 = {b.name: phi(b.tail_local - b.head_local) for b in B}
def cur_phi(n): return phi(P[n].tail - P[n].head)
def clear_pose():
    for pb in P: pb.location = (0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
    vl.update()
def smooth(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
FRONT = {s: ['Scapula_' + s, 'Humerus_' + s, 'Forearm_' + s, 'Cannon_F_' + s, 'Pastern_F_' + s, 'Hoof_F_' + s] for s in 'LR'}
HIND = {s: ['Femur_' + s, 'Gaskin_' + s, 'Cannon_B_' + s, 'Pastern_B_' + s, 'Hoof_B_' + s] for s in 'LR'}
SIGN = {}
for s in 'LR': SIGN['F' + s] = -1.0; SIGN['H' + s] = 1.0   # carpus folds forward, hock backward
def two_bone(E, T, a, b, sign):
    d = T - E; D = math.hypot(d.y, d.z); D = min(max(D, abs(a - b) + 1e-4), a + b - 1e-4)
    beta = math.atan2(d.y, -d.z)
    alpha = math.acos(max(-1.0, min(1.0, (a * a + D * D - b * b) / (2 * a * D))))
    pu = beta + sign * alpha
    K = Vector((E.x, E.y + a * math.sin(pu), E.z - a * math.cos(pu)))
    return pu, math.atan2(T.y - K.y, -(T.z - K.z))
def set_abs(chain, abs_phis, parent_delta):
    prev = parent_delta
    for n, ph in zip(chain, abs_phis):
        delta = (ph - PHI0[n]) if ph is not None else prev
        P[n].rotation_euler.x = delta - prev; prev = delta
    vl.update()
def _reach_gap(E, T, a, b):
    D = math.hypot(T.y - E.y, T.z - E.z)
    return max(0.0, D - (a + b)) + max(0.0, abs(a - b) - D)

PREF = {'F': 0.45, 'H': 0.9}
def _apply_swing(kind, s, target, share):
    if kind == 'F':
        scap, hum = FRONT[s][0], FRONT[s][1]
        F0 = rest_pt(FRONT[s][3], 'tail'); S0 = rest_pt(hum)
        P[scap].rotation_euler.x = 0.0; P[hum].rotation_euler.x = 0.0; vl.update()
        psi = phi(target - P[hum].head) - phi(F0 - S0)
        base = cur_phi(scap) - PHI0[scap]
        P[scap].rotation_euler.x = share * psi; vl.update()
        d_scap = cur_phi(scap) - PHI0[scap]
        P[hum].rotation_euler.x = psi - (d_scap - base); vl.update()
    else:
        fem = HIND[s][0]
        F0 = rest_pt(HIND[s][2], 'tail'); S0 = rest_pt(fem)
        P[fem].rotation_euler.x = 0.0; vl.update()
        psi = phi(target - P[fem].head) - phi(F0 - S0)
        P[fem].rotation_euler.x = share * psi; vl.update()

def best_share(kind, s, target):
    """Shoulder/hip swing (as a share of the angle toward the target) closest to the natural value that still lets the lower limb reach."""
    upper, lower = (FRONT[s][2], FRONT[s][3]) if kind == 'F' else (HIND[s][1], HIND[s][2])
    a, b = B[upper].length, B[lower].length
    cands = [round(i * 0.05, 2) for i in range(0, 29)] if kind == 'F' else [round(0.6 + i * 0.05, 2) for i in range(0, 29)]
    ok, bestgap = [], None
    for sh in cands:
        _apply_swing(kind, s, target, sh)
        gap = _reach_gap(P[upper].head, target, a, b)
        if gap < 2e-3: ok.append(sh)
        if bestgap is None or gap < bestgap[0]: bestgap = (gap, sh)
    if ok: return min(ok, key=lambda x: abs(x - PREF[kind]))
    return bestgap[1]

def solve_leg(kind, s, target, flex, share, hoof_rest_extra=0.0, pastern_rest_extra=0.0, fold_p_deg=None, fold_h_deg=None):
    _apply_swing(kind, s, target, share)
    if kind == 'F':
        scap, hum, upper, lower, past, hoof = FRONT[s]; parent = hum; fp, fh = math.radians(fold_p_deg or 55), math.radians(fold_h_deg or 18)
    else:
        fem, upper, lower, past, hoof = HIND[s]; parent = fem; fp, fh = math.radians(fold_p_deg or 45), math.radians(fold_h_deg or 14)
    E = P[upper].head.copy(); a, b = B[upper].length, B[lower].length
    pu, pl = two_bone(E, target, a, b, SIGN[kind + s])
    d_parent = cur_phi(parent) - PHI0[parent]
    rp = PHI0[past] + pastern_rest_extra; rh = PHI0[hoof] + hoof_rest_extra
    fold_p = pl + (PHI0[past] - PHI0[lower]) + fp; fold_h = fold_p + (PHI0[hoof] - PHI0[past]) + fh
    set_abs([upper, lower, past, hoof], [pu, pl, rp + (fold_p - rp) * flex, rh + (fold_h - rh) * flex], d_parent)
    achieved = P[lower].tail.copy()
    return (FRONT[s] if kind == 'F' else HIND[s]), (achieved - target).length

def key(names, frame, loc=False, rot=True, scale=False):
    for n in names:
        if rot: P[n].keyframe_insert('rotation_euler', frame=frame)
        if loc: P[n].keyframe_insert('location', frame=frame)
        if scale: P[n].keyframe_insert('scale', frame=frame)
def new_action(name):
    for tr in list(arm.animation_data.nla_tracks) if arm.animation_data else []:
        if tr.name == name: arm.animation_data.nla_tracks.remove(tr)
    old = bpy.data.actions.get(name)
    if old: bpy.data.actions.remove(old)
    act = bpy.data.actions.new(name); act.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = act
    return act
def finish(act):
    try:
        for layer in act.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    except AttributeError: pass
    tr = arm.animation_data.nla_tracks.new(); tr.name = act.name
    tr.strips.new(act.name, int(act.frame_range[0]), act); tr.mute = True
    arm.animation_data.action = None; clear_pose()

# ------------------------------------------------------------------ gait tables
# c = stance start (fraction of stride, 0 = first footfall), d = duty (stance fraction). Right-lead footfall orders:
#   walk   : LH, LF, RH, RF  (lateral four-beat)            trot   : LF+RH, RF+LH (diagonal two-beat)
#   canter : LH, RH+LF, RF   (three-beat)                    gallop : LH, RH, LF, RF (transverse four-beat, gathered flight)
GAITS = {
  # Stride lengths are FITTED TO THIS RIG: the sculpt's hind fetlock rests 0.23 m behind the hip and the forelimb is almost straight,
  # so stance sweeps (L x duty) are kept near 0.95 m; speed comes from stride frequency (v = L / T). `bias` shifts the stance window
  # (m, relative to the rest fetlock) to where each limb can reach: forelimb about the shoulder, hindlimb forward of rest.
  # foldScale: how much of the pastern/hoof fold the swing keeps (1 = the first-pass fold). The unfold into the landing flicks the toe
  # point, so the swing peaks well above the smooth-profile floor (1.5 x the mean swing speed): at 0.2 the walk peaks at 5.7 m/s (floor
  # 4.8), the trot at 9.2 (8.1) and the canter at 11.7-11.8 (10-11); at 1.0 they peaked at 9.4, 11.7 and 13.9-14.3 m/s.
  # Walk swing: the hoof must cover one stride (1.15 m) in 0.36 s, a mean ground speed of 3.2 m/s, so no swing can peak below about
  # 4.8 m/s (a smooth start and stop at rest in the world frame: 1.5 x the mean). The old fold of the pastern and hoof (unfolding into
  # the landing) and a 17 cm lift flicked the toe to 9-10 m/s and 35 cm high; foldScale 0.2 and lift 12 / 10 cm bring it to about 5.7 m/s
  # and 11 cm.
  'Walk':   dict(v=1.44, T=0.80, N=24, lead=None, c={'HL': 0.00, 'FL': 0.25, 'HR': 0.50, 'FR': 0.75}, d={'F': 0.55, 'H': 0.55}, bias={'F': None, 'H': None}, lift={'F': 0.12, 'H': 0.10}, foldScale=0.2,
                 body=dict(heave=0.010, pitch=1.2, pelvis=2.0, lumbar=1.0, neck=3.0, head=2.0, neck_base=0, tail=4, roll=1.0)),
  'Trot':   dict(v=3.33, T=0.75, N=24, lead=None, c={'FL': 0.00, 'HR': 0.00, 'FR': 0.50, 'HL': 0.50}, d={'F': 0.38, 'H': 0.38}, bias={'F': None, 'H': None}, lift={'F': 0.26, 'H': 0.20}, foldScale=0.2,
                 body=dict(heave=0.030, pitch=1.4, pelvis=2.5, lumbar=1.2, neck=2.5, head=2.0, neck_base=3, tail=10, roll=0.6)),
  'Canter': dict(v=4.83, T=0.60, N=28, lead='R', c={'HL': 0.00, 'HR': 0.29, 'FL': 0.29, 'FR': 0.50}, d={'F': 0.28, 'H': 0.33}, bias={'F': None, 'H': None}, lift={'F': 0.34, 'H': 0.28}, foldScale=0.2,
                 body=dict(heave=0.045, pitch=3.5, pelvis=5.0, lumbar=3.0, neck=5.0, head=3.0, neck_base=9, tail=18, roll=1.5)),
  'Gallop': dict(v=10.0, T=0.42, N=30, lead='R', c={'HL': 0.00, 'HR': 0.14, 'FL': 0.30, 'FR': 0.46}, d={'F': 0.19, 'H': 0.22}, bias={'F': None, 'H': None}, lift={'F': 0.42, 'H': 0.34},
                 body=dict(heave=0.060, pitch=5.0, pelvis=7.0, lumbar=4.5, neck=6.0, head=4.0, neck_base=17, tail=26, roll=1.8)),
  'Sprint': dict(v=12.0, T=0.383, N=30, lead='R', c={'HL': 0.00, 'HR': 0.13, 'FL': 0.29, 'FR': 0.44}, d={'F': 0.17, 'H': 0.20}, bias={'F': None, 'H': None}, lift={'F': 0.46, 'H': 0.37},
                 body=dict(heave=0.070, pitch=6.0, pelvis=8.0, lumbar=5.5, neck=7.0, head=4.5, neck_base=24, tail=34, roll=2.0)),
}
def mirrored(spec):
    sw = {'L': 'R', 'R': 'L'}
    s2 = json.loads(json.dumps(spec)); s2['c'] = {k[0] + sw[k[1]]: v for k, v in spec['c'].items()}
    s2['lead'] = 'L'; s2['body']['roll'] = -spec['body']['roll']; return s2

def stance_param(ph, c, d):
    """Return (in_stance, u) with u in 0..1 through stance, or the swing parameter via (False, u)."""
    x = (ph - c) % 1.0
    if x < d: return True, x / d
    return False, (x - d) / (1.0 - d)

def load_of(ph, c, d):
    inn, u = stance_param(ph, c, d)
    return math.sin(math.pi * u) if inn else 0.0

REST_FET = {(k, s): rest_pt(('Cannon_F_' if k == 'F' else 'Cannon_B_') + s, 'tail') for k in 'FH' for s in 'LR'}
# The rig's rest pose is not symmetric: the right hind fetlock rests 16 cm ahead of the left (cannon tails at y 0.397 / 0.561) and the
# forefeet differ by 2.6 cm. A stance window centred on each leg's own rest position puts the two hind stances 16 cm apart in the body
# frame, and the left-right gait is then not a mirror (the right turns slipped 60 % more than the left). Both sides of a pair are
# centred on the mean of their rest positions instead (GAIT_SYM=0 restores the old behaviour for comparison).
SYM = os.environ.get('GAIT_SYM', '1') == '1'
STANCE_FET = {}
for _k in 'FH':
    _ym = (REST_FET[(_k, 'L')].y + REST_FET[(_k, 'R')].y) / 2
    for _s in 'LR':
        _r = REST_FET[(_k, _s)]
        STANCE_FET[(_k, _s)] = Vector((_r.x, _ym, _r.z)) if SYM else _r.copy()
# The hoof bone's tail (the toe point the runtime measures) sits SOLE_OFF above the sole: measured on the hoof mesh at rest
# (lowest vertex of each hoof at z = 0.001 m, bone tail at z = 0.020 m).
SOLE_OFF = 0.019
# Experiment, OFF by default: lower stance targets until the sole sits on the ground. Measured in the browser it did not reduce
# hover overall (sprint front-foot p95 2.6 cm without it, 4.1 cm with it) and it raised ground slip by 1-3 points at trot to sprint.
PRECOMP = os.environ.get('GAIT_PRECOMP', '0') == '1'
_BIAS_CACHE = {}
def auto_bias(kind, sw):
    """Stance-window offset (m, relative to the common stance centre) that keeps the worst reach error over the stance smallest. Both sides
    are searched and the offset is the one that minimises the worse of the two, so the two legs of a pair keep the same window; the error
    of each side at that offset is printed (a per-side offset would put the windows apart again)."""
    key_ = (kind, round(sw, 4))
    if key_ in _BIAS_CACHE: return _BIAS_CACHE[key_]
    best = None; per = {}
    for b in [round(-0.4 + i * 0.02, 2) for i in range(0, 41)]:
        worst = {}
        for side in 'LR':
            F0 = STANCE_FET[(kind, side)]; w = 0.0
            for u in (0.0, 0.25, 0.5, 0.75, 1.0):
                fwd = b + sw / 2 - sw * u
                tgt = Vector((F0.x, F0.y - fwd, F0.z))
                clear_pose()
                _, err = solve_leg(kind, side, tgt, 0.0, best_share(kind, side, tgt))
                w = max(w, err)
            worst[side] = w
        score = max(worst.values()) + 0.25 * min(worst.values())      # the worse side first, the other as a tie-breaker
        if best is None or score < best[0]: best = (score, b); per = worst
    _BIAS_CACHE[key_] = best[1]
    print('AUTOBIAS', kind, round(sw, 3), best[1], 'worst err L %.3f R %.3f' % (per['L'], per['R']))
    return best[1]
REPORT = {}
RETRACT = 1.0  # full: the swing ends moving backward at the stance speed v, so the hoof lands with no ground speed (was 0.3: it landed skidding forward)

def apply_overrides(name, spec):
    """Experiments: GAIT_OVERRIDE='Walk:foldScale=0.5,lift.F=0.12' edits a copy of the spec without touching the table."""
    ov = os.environ.get('GAIT_OVERRIDE')
    if not ov: return spec
    spec = json.loads(json.dumps(spec))
    for part in ov.split(';'):
        g, _, kvs = part.partition(':')
        if g != name.split('_')[0]: continue
        for kv in kvs.split(','):
            if not kv: continue
            k, val = kv.split('='); val = float(val); path = k.split('.')
            d = spec
            for q in path[:-1]: d = d[q]
            d[path[-1]] = val
    return spec

def build_gait(name, spec):
    spec = apply_overrides(name, spec)
    v, T, N = spec['v'], spec['T'], spec['N']; L = v * T
    fold_scale = spec.get('foldScale', 1.0)
    act = new_action(name); frames_total = T * sc.render.fps
    c, d, lift, bd = spec['c'], spec['d'], spec['lift'], spec['body']
    sweep = {'F': L * d['F'], 'H': L * d['H']}
    bias = {k: (auto_bias(k, sweep[k]) if spec['bias'][k] is None else spec['bias'][k]) for k in 'FH'}
    # body signals as functions of phase, derived from support
    def loads(ph):
        lf = load_of(ph, c['FL'], d['F']) + load_of(ph, c['FR'], d['F'])
        lh = load_of(ph, c['HL'], d['H']) + load_of(ph, c['HR'], d['H'])
        return lf, lh
    samp = np.linspace(0, 1, 400, endpoint=False)
    LF = np.array([loads(p)[0] for p in samp]); LH = np.array([loads(p)[1] for p in samp])
    def lowpass(a, w=0.045):
        k = int(w * len(a)); ker = np.ones(2 * k + 1) / (2 * k + 1); ext = np.concatenate([a[-k:], a, a[:k]]); return np.convolve(ext, ker, mode='valid')
    LF, LH = lowpass(LF), lowpass(LH); LT = LF + LH
    susp = lowpass(np.array([1.0 if all(not stance_param(p, c[k], d[k[0]])[0] for k in c) else 0.0 for p in samp]))
    def at(a, ph): return float(a[int((ph % 1.0) * len(a)) % len(a)])
    fore_td = (c['FL'] + c['FR']) / 2 + 0.02
    err_max = {'F': 0.0, 'H': 0.0}; err_limb = {k: 0.0 for k in c}; slip_samples = {k: [] for k in c}
    sole_stance = {'F': [], 'H': []}
    toe_traj = {k: [] for k in c}   # (t, y, z, in_stance) of the hoof's toe point (bone tail), body frame
    mean = lambda a: float(np.mean(a))

    def pose_body(ph):
        heave = bd['heave'] * ((at(susp, ph) - mean(susp)) * 1.2 - 0.6 * (at(LT, ph) - mean(LT)) / max(1e-6, np.max(LT)))
        pitch = bd['pitch'] * (at(LF, ph) - mean(LF)) / max(1e-6, np.max(LF)) - 0.5 * bd['pitch'] * (at(LH, ph) - mean(LH)) / max(1e-6, np.max(LH))
        gather = at(susp, ph) - mean(susp)
        P['Body'].location = (0, 0, heave)
        P['Body'].rotation_euler.x = math.radians(pitch + bd['neck_base'] * 0.12)    # +X: nose down; a slight forward lean with speed
        P['Body'].rotation_euler.z = math.radians(bd['roll']) * math.sin(2 * math.pi * (ph + 0.1))
        P['Pelvis'].rotation_euler.x = math.radians(-bd['pelvis'] * (at(LH, ph) - mean(LH)) / max(1e-6, np.max(LH)) * 0.6 - bd['pelvis'] * 0.5 * gather)
        P['Spine_Lumbar'].rotation_euler.x = math.radians(bd['lumbar'] * gather * 2.0 - 0.3 * bd['lumbar'] * (at(LH, ph) - mean(LH)))
        pump = math.cos(2 * math.pi * (ph - fore_td))
        P['Neck_1'].rotation_euler.x = math.radians(bd['neck_base'] * 0.55 + bd['neck'] * 0.5 * pump)
        P['Neck_2'].rotation_euler.x = math.radians(bd['neck_base'] * 0.30 + bd['neck'] * 0.3 * pump)
        P['Neck_3'].rotation_euler.x = math.radians(bd['neck_base'] * 0.15 + bd['neck'] * 0.2 * pump)
        P['Head'].rotation_euler.x = math.radians(-bd['neck_base'] * 0.45 + bd['head'] * 0.5 * pump)
        P['Tail_1'].rotation_euler.x = math.radians(-bd['tail'])
        for i in range(1, 5): P[f'Tail_{i}'].rotation_euler.z = math.radians(2 + 1.6 * i) * math.sin(2 * math.pi * ph - 0.8 * i)
        vl.update()

    def limb_target(limb, ph):
        kind, side = limb[0], limb[1]
        inn, u = stance_param(ph, c[limb], d[kind])
        F0 = STANCE_FET[(kind, side)]; sw = sweep[kind]; fwd_td = bias[kind] + sw / 2
        if inn:
            fwd = fwd_td - sw * u; z = 0.0
            flex = smooth((u - 0.88) / 0.12) * 0.25                                   # heel lifts at breakover
        else:
            # swing return: a Hermite curve whose end tangents carry a share (RETRACT) of the ground speed, so the hoof is already
            # moving backward (relative to the body) as it lands and the foot does not skid at touchdown
            fwd_lo = fwd_td - sw
            m = -RETRACT * v * (1.0 - d[kind]) * T
            h00, h10, h01, h11 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
            fwd = h00 * fwd_lo + h10 * m + h01 * fwd_td + h11 * m
            z = lift[kind] * math.sin(math.pi * min(1.0, u ** 0.8)) ** 1.15
            flex = (0.25 + 0.75 * smooth(u / 0.22)) if u < 0.55 else smooth((0.97 - u) / 0.45) * 0.8
            # foldScale < 1 shrinks the pastern/hoof fold of the swing (the unfold into landing is what flicks the toe): the heel lift
            # of the breakover still runs into the swing start so the hoof leaves the ground as before
            flex = flex * fold_scale + 0.25 * (1.0 - fold_scale) * (1.0 - smooth(u / 0.3))
        return kind, side, inn, Vector((F0.x, F0.y - fwd, F0.z + z)), flex

    # pass 1: find, per limb and frame, the shoulder/hip swing that makes the target reachable; smooth it around the stride
    shares = {limb: [] for limb in c}
    for k_i in range(N):
        ph = k_i / N; clear_pose(); pose_body(ph)
        for limb in c:
            kind, side, inn, tgt, flex = limb_target(limb, ph)
            shares[limb].append(best_share(kind, side, tgt))
    for limb in c:
        arr = np.array(shares[limb]); w = 2
        ext = np.concatenate([arr[-w:], arr, arr[:w]]); shares[limb] = np.convolve(ext, np.ones(2 * w + 1) / (2 * w + 1), mode='valid').tolist()
    # pass 2: pose and key
    for k_i in range(N + 1):
        ph = (k_i % N) / N; frame = k_i * frames_total / N
        clear_pose(); pose_body(ph)
        used = ['Body', 'Pelvis', 'Spine_Lumbar', 'Neck_1', 'Neck_2', 'Neck_3', 'Head', 'Tail_1', 'Tail_2', 'Tail_3', 'Tail_4']
        for limb in c:
            kind, side, inn, tgt, flex = limb_target(limb, ph)
            share = shares[limb][k_i % N]
            if inn:
                # the authored stance target is only reachable as far as the rig allows; lower the target by the sole's
                # height above the ground until the sole sits on it (or the leg cannot go lower). The correction ramps in
                # from touchdown and out toward lift-off, so the stance meets the swing at both ends without a jump.
                _, uu = stance_param(ph, c[limb], d[kind])
                wgt = smooth(uu / 0.15) * (1.0 - smooth((uu - 0.85) / 0.15))
                corr = 0.0
                for _ in range(4 if PRECOMP else 1):
                    adj = Vector((tgt.x, tgt.y, tgt.z - wgt * corr))
                    chain, _e = solve_leg(kind, side, adj, flex, share)
                    sole = P[chain[-1]].tail.z - SOLE_OFF
                    if abs(sole) < 1e-3 or not PRECOMP: break
                    corr = min(0.08, max(-0.08, corr + sole / max(wgt, 0.3)))
                cannon = chain[3] if kind == 'F' else chain[2]
                err = (P[cannon].tail - tgt).length          # error against the authored target
                err_max[kind] = max(err_max[kind], err); err_limb[limb] = max(err_limb[limb], err)
                sole_stance[kind].append(sole)
                slip_samples[limb].append((k_i * T / N, P[cannon].tail.y, P[cannon].tail.z))
            else:
                chain, err = solve_leg(kind, side, tgt, flex, share)
            toe = P[chain[-1]].tail
            toe_traj[limb].append((k_i * T / N, toe.y, toe.z, inn))
            used += chain
        key(['Body'], frame, loc=True); key(used, frame)
    sc.frame_start, sc.frame_end = 0, int(round(frames_total)); finish(act)
    # report: slip = |d(achieved y)/dt + v| during stance (body-frame backward speed should equal v)
    slips = []
    for limb, arr in slip_samples.items():
        for (t0, y0, z0), (t1, y1, z1) in zip(arr, arr[1:]):
            if t1 - t0 > 1e-6 and (t1 - t0) < T / N * 1.5: slips.append(abs((y1 - y0) / (t1 - t0) - v))
    contacts = {k: [round(c[k], 3), round(d[k[0]], 3)] for k in c}
    # airborne fraction from the stance windows
    grid = np.linspace(0, 1, 1000, endpoint=False)
    airborne = float(np.mean([all(not stance_param(p, c[k], d[k[0]])[0] for k in c) for p in grid]))
    # world speed of the toe through the swing (body frame y grows toward the tail, the root advances at v): forward = v - dy/dt
    swing_peak, swing_mean, swing_peak3d, swing_maxz = [], [], [], []
    for limb, tr in toe_traj.items():
        sp, sp3 = [], []
        for (t0, y0, z0, i0), (t1, y1, z1, i1) in zip(tr, tr[1:]):
            if i0 or i1 or t1 - t0 < 1e-6: continue
            fw = v - (y1 - y0) / (t1 - t0); vz = (z1 - z0) / (t1 - t0)
            sp.append(abs(fw)); sp3.append(math.hypot(fw, vz))
            if os.environ.get('GAIT_DEBUG') and limb in os.environ['GAIT_DEBUG'].split(','): print('SWKEY', name, limb, 't=%.3f fw=%.2f vz=%.2f y=%.3f z=%.3f' % (t0, fw, vz, y0, z0))
        swing_maxz.append(max([z for (_t, _y, z, i) in tr if not i] or [0]))
        if sp: swing_peak.append(max(sp)); swing_mean.append(float(np.mean(sp))); swing_peak3d.append(max(sp3))
    soles = {k: (round(float(np.mean(v_)), 4), round(float(np.max(np.abs(v_))), 4)) for k, v_ in sole_stance.items() if v_}
    return dict(v=v, T=T, strideLength=round(L, 3), strideFrequency=round(1 / T, 3), lead=spec['lead'], contacts=contacts, duty=d, airborneFraction=round(airborne, 3),
                sweepM={k: round(v_, 3) for k, v_ in sweep.items()}, biasM=bias, ikReachErrorStanceMaxM={k: round(e, 4) for k, e in err_max.items()}, ikReachErrorByLimbM={k: round(e, 4) for k, e in err_limb.items()}, stanceCentreY={k + s_: round(STANCE_FET[(k, s_)].y, 3) for k in 'FH' for s_ in 'LR'},
                soleStanceMeanM={k: x[0] for k, x in soles.items()}, soleStanceMaxAbsM={k: x[1] for k, x in soles.items()},
                toeSwingPeakMps=round(max(swing_peak), 2) if swing_peak else 0, toeSwingMeanMps=round(float(np.mean(swing_mean)), 2) if swing_mean else 0, toeSwingPeak3dMps=round(max(swing_peak3d), 2) if swing_peak3d else 0, toeSwingMaxHeightM=round(max(swing_maxz), 3) if swing_maxz else 0,
                slipRmsMps=round(float(np.sqrt(np.mean(np.square(slips)))) if slips else 0, 3), slipMaxMps=round(float(np.max(slips)) if slips else 0, 3), frames=int(round(frames_total)), samples=N)

ONLY = os.environ.get('GAIT_ONLY')   # experiments: build just this gait (e.g. Walk)
for name, spec in GAITS.items():
    if ONLY and name != ONLY: continue
    if spec['lead'] is None:
        REPORT[name] = build_gait(name, spec)
    else:
        REPORT[name + '_R'] = build_gait(name + '_R', spec)
        REPORT[name + '_L'] = build_gait(name + '_L', mirrored(spec))

# ------------------------------------------------------------------ Stop: weight transfer while halting (planted feet, plays over the stand)
def planted(offsets, hind_forward, fore_forward, k):
    used = []
    for kind in 'FH':
        for side in 'LR':
            F0 = REST_FET[(kind, side)]; fw = (fore_forward if kind == 'F' else hind_forward) * k
            tg = Vector((F0.x, F0.y - fw, F0.z)); chain, _ = solve_leg(kind, side, tg, 0.0, best_share(kind, side, tg)); used += chain
    return used
act = new_action('Stop'); fr = 54  # 1.8 s
for f in range(0, fr + 1):
    t = f / fr
    k = smooth(t / 0.22) * (1 - smooth((t - 0.45) / 0.55))            # brace, hold, settle
    clear_pose()
    P['Body'].location = (0, 0, -0.045 * k); P['Body'].rotation_euler.x = math.radians(-2.5 * k)
    P['Pelvis'].rotation_euler.x = math.radians(-9 * k); P['Spine_Lumbar'].rotation_euler.x = math.radians(2.5 * k)
    P['Neck_1'].rotation_euler.x = math.radians(-6 * k); P['Neck_2'].rotation_euler.x = math.radians(-4 * k); P['Head'].rotation_euler.x = math.radians(-3 * k)
    P['Tail_1'].rotation_euler.x = math.radians(-14 * k); vl.update()
    used = ['Body', 'Pelvis', 'Spine_Lumbar', 'Neck_1', 'Neck_2', 'Head', 'Tail_1'] + planted(None, 0.07, 0.11, k)
    key(['Body'], f, loc=True); key(used, f)
sc.frame_start, sc.frame_end = 0, fr; finish(act)
REPORT['Stop'] = dict(T=1.8, note='planted feet; forelimbs braced 0.11 m forward, hindlimbs 0.07 m under; plays over the stand')

# ------------------------------------------------------------------ Alert: held attention (loops), ears forward, head and neck raised
act = new_action('Alert'); fr = 120
for f in range(0, fr + 1):
    t = f / fr; breath = 0.5 - 0.5 * math.cos(2 * math.pi * t)
    clear_pose()
    P['Neck_1'].rotation_euler.x = math.radians(-5); P['Neck_2'].rotation_euler.x = math.radians(-4); P['Neck_3'].rotation_euler.x = math.radians(-2)
    P['Head'].rotation_euler.x = math.radians(-6); P['Body'].rotation_euler.x = math.radians(-0.8)
    P['Ribcage'].scale = (1 + 0.02 * breath, 1 + 0.007 * breath, 1 + 0.009 * breath)
    for s_, sg in (('L', 1), ('R', -1)):
        P[f'Ear_{s_}'].rotation_euler = (math.radians(-12), math.radians(-6 * sg), 0)
    vl.update()
    used = ['Body', 'Neck_1', 'Neck_2', 'Neck_3', 'Head', 'Ear_L', 'Ear_R', 'Ribcage']
    key(used, f); key(['Ribcage'], f, rot=False, scale=True)
sc.frame_start, sc.frame_end = 0, fr; finish(act)
REPORT['Alert'] = dict(T=4.0, note='looping hold; combine with Idle_Breathing and Blink at runtime')

REPORT['_meta'] = dict(units='metres, seconds', convention='body frame +Y toward tail; clips are in place (no root motion); runtime advances the root at v',
                       sources=['Hildebrand 1977 (gait classification)', 'Biancardi & Minetti 2012, J Exp Biol (transverse gallop duty factors and lags)'])
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
with open(out_json, 'w') as f: json.dump(REPORT, f, indent=1)
for k, v_ in REPORT.items():
    if k.startswith('_'): continue
    print('GAIT', k, json.dumps({x: v_[x] for x in ('v', 'strideLength', 'airborneFraction', 'ikReachErrorStanceMaxM', 'ikReachErrorByLimbM', 'toeSwingPeakMps', 'toeSwingMeanMps', 'toeSwingPeak3dMps', 'toeSwingMaxHeightM', 'slipRmsMps', 'slipMaxMps') if x in v_}))
print('STAGE11_DONE', [a.name for a in bpy.data.actions])
