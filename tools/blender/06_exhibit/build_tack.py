# Stage C: tack (saddle, girth, bridle, bit) fitted to the coat surface, plus the anchors the page tracks.
# usage: blender -b <muscles.blend> -P build_tack.py -- <out.blend> <pose.json>
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

out, pose_json = sys.argv[sys.argv.index('--') + 1:][:2]
rig = Rig()
LEATHER = material('Leather', (0.085, 0.050, 0.030), 0.45)
LEATHER2 = material('LeatherLight', (0.075, 0.038, 0.02), 0.5)
STEEL = material('Steel', (0.72, 0.72, 0.74), 0.28, 1.0)
made = []


def snap_off(p, off):
    loc, n, i, d = rig.bvh.find_nearest(Vector(p))
    return loc + n * off, n


def strap(points, width, thick=0.005, off=0.004, n=40, closed=False, seg=6):
    """A flat strap lying on the coat along the given points (snapped to the surface, lifted off by half its thickness)."""
    pts, nrm = [], Vector()
    for p in points:
        q, nn = snap_off(p, off + thick / 2)
        pts.append(q)
        nrm += nn
    dense = catmull(pts, n)
    dense = [snap_off(p, off + thick / 2)[0] for p in dense]
    return loft(dense, thick / 2, width / 2, ref=nrm.normalized(), seg=seg, caps=(True, True), cap_rings=1)


def obj(name, mb, mat, bone=None, skin=True, weights=False, extras=None):
    w = coat_weights(rig, mb.v) if weights else None
    ob = make_object(rig, name, mb, mat, bone=bone if skin and not weights else None, weights=w, layer='tack', skin=skin, extras=extras)
    made.append(ob)
    return ob


# ------------------------------------------------------------------ saddle (rigid; the page moves it with the seat frame)
NX, NY = 27, 46
X0, Y0, Y1 = 0.14, -0.31, 0.25
top, bot = [], []
for j in range(NY):
    y = lerp(Y0, Y1, j / (NY - 1))
    rowt, rowb = [], []
    for i in range(NX):
        x = lerp(-X0, X0, i / (NX - 1))
        zb = rig.topz(y, x)
        if zb is None:
            zb = rig.topz(y, x * 0.9) or 1.4
        zb += 0.012
        u = (y - Y0) / (Y1 - Y0)
        pommel = 0.05 * smooth((0.14 - u) / 0.14) * (1 - (x / X0) ** 2) ** 0.7
        cantle = 0.042 * smooth((u - 0.82) / 0.14) * (1 - (x / X0) ** 2) ** 0.7
        dish = -0.012 * math.exp(-((u - 0.5) / 0.22) ** 2) * (1 - (x / 0.07) ** 2 if abs(x) < 0.07 else 0)
        edge = 1 - 0.55 * smooth((abs(x) / X0 - 0.5) / 0.5)
        thick = 0.036 * edge + pommel + cantle + dish
        rowb.append(Vector((x, y, zb)))
        rowt.append(Vector((x, y, zb + max(0.016, thick))))
    top.append(rowt)
    bot.append(rowb)
mb = MB()
V_, F_ = [], []
for grid in (top, bot):
    for row in grid:
        V_ += row
for j in range(NY - 1):
    for i in range(NX - 1):
        a = j * NX + i
        F_.append((a, a + 1, a + 1 + NX, a + NX))
        o = NY * NX
        F_.append((o + a, o + a + NX, o + a + 1 + NX, o + a + 1))
for j in range(NY - 1):          # side walls
    for (i, flip) in ((0, False), (NX - 1, True)):
        a, b = j * NX + i, (j + 1) * NX + i
        o = NY * NX
        F_.append((a, b, o + b, o + a) if not flip else (a, o + a, o + b, b))
for i in range(NX - 1):
    for (j, flip) in ((0, True), (NY - 1, False)):
        a, b = j * NX + i, j * NX + i + 1
        o = NY * NX
        F_.append((a, o + a, o + b, b) if flip else (a, b, o + b, o + a))
mb.add(V_, F_, None)
obj('Tack_Saddle', mb, LEATHER2, skin=False)
seat_y = -0.02
seat_z = (rig.topz(seat_y, 0.0) or 1.46) + 0.012 + 0.036 - 0.012 + 0.002
# flaps: a thin strip hanging down the barrel from the panel edge, following the coat's side
flaps = MB()
for S in (1.0, -1.0):
    cols = []
    rows = 16
    for j in range(rows):
        t = j / (rows - 1)
        z_top = (rig.topz(-0.04, S * 0.13) or 1.42) + 0.04
        z = lerp(z_top, 1.02, t)
        for k in range(9):
            y = lerp(-0.23, 0.07, k / 8) - 0.05 * t * 0.0 + 0.02 * t
            hw = rig.halfwidth(y, z, S) or 0.24
            cols.append(Vector((S * (hw + 0.021 + 0.004 * math.sin(math.pi * k / 8)), y, z)))
    verts, faces = [], []
    for v in cols:
        verts.append(v)
    thick = 0.007
    n_ = len(verts)
    verts += [Vector((v.x + S * thick, v.y, v.z)) for v in cols]
    for j in range(rows - 1):
        for k in range(8):
            a = j * 9 + k
            faces.append((a, a + 1, a + 10, a + 9) if S > 0 else (a, a + 9, a + 10, a + 1))
            faces.append((n_ + a, n_ + a + 9, n_ + a + 10, n_ + a + 1) if S > 0 else (n_ + a, n_ + a + 1, n_ + a + 10, n_ + a + 9))
    flaps.add(verts, faces, None)
    # stirrup bar position (where the leather hangs from)
    bar = Vector((S * (rig.halfwidth(-0.02, z_top - 0.02, S) or 0.2), -0.02, z_top - 0.02))
    pose_bar = bar
obj('Tack_Flaps', flaps, LEATHER2, skin=False)
bars = {}
for S, nm in ((1.0, 'L'), (-1.0, 'R')):
    z_top = (rig.topz(-0.04, S * 0.13) or 1.42) + 0.04
    bars[nm] = [(rig.halfwidth(-0.03, z_top - 0.015, S) or 0.2) * S + S * 0.03, -0.03, z_top - 0.015]

# ------------------------------------------------------------------ girth (follows the barrel, skinned like the coat)
yg = -0.19
pts = []
for a in range(-10, 191, 8):
    ang = math.radians(a)
    d = Vector((math.cos(ang), 0, -math.sin(ang)))
    c = Vector((0, yg, 1.18))
    h = rig.ray(c, d, 1.5)
    if h:
        pts.append(h[0] + h[1] * 0.012)
g = loft(pts, 0.005, 0.03, ref=(0, 1, 0), seg=6, caps=(True, True), cap_rings=1)
obj('Tack_Girth', g, LEATHER, weights=True)

# ------------------------------------------------------------------ bridle
HEAD = 'Head'
cheek = {}
for S, nm in ((1.0, 'L'), (-1.0, 'R')):
    p_top = Vector((S * 0.075, -1.075, 2.0))
    p_bit = Vector((S * 0.066, -1.265, 1.60))
    cheek[nm] = strap([p_top, Vector((S * 0.092, -1.16, 1.84)), Vector((S * 0.085, -1.225, 1.70)), p_bit], 0.022)
    obj('Tack_Cheekpiece_' + nm, cheek[nm], LEATHER, bone=HEAD)
obj('Tack_Browband', strap([Vector((0.07, -1.14, 1.985)), Vector((0.03, -1.17, 2.045)), Vector((0, -1.18, 2.05)), Vector((-0.03, -1.17, 2.045)), Vector((-0.07, -1.14, 1.985))], 0.02), LEATHER, bone=HEAD)
obj('Tack_Crownpiece', strap([Vector((0.075, -1.075, 2.0)), Vector((0.04, -1.04, 2.07)), Vector((0, -1.035, 2.08)), Vector((-0.04, -1.04, 2.07)), Vector((-0.075, -1.075, 2.0))], 0.026), LEATHER, bone=HEAD)
obj('Tack_Noseband', strap([Vector((0.08, -1.275, 1.69)), Vector((0.05, -1.318, 1.67)), Vector((0, -1.335, 1.665)), Vector((-0.05, -1.318, 1.67)), Vector((-0.08, -1.275, 1.69)), Vector((-0.07, -1.27, 1.63)), Vector((0, -1.3, 1.56)), Vector((0.07, -1.27, 1.63)), Vector((0.08, -1.275, 1.69))], 0.026, n=70), LEATHER, bone=HEAD)
obj('Tack_Throatlash', strap([Vector((0.09, -1.13, 1.80)), Vector((0.06, -1.1, 1.67)), Vector((0, -1.09, 1.63)), Vector((-0.06, -1.1, 1.67)), Vector((-0.09, -1.13, 1.80))], 0.018), LEATHER, bone=HEAD)
bit = MB()
bit_ring = {}
for S, nm in ((1.0, 'L'), (-1.0, 'R')):
    c = Vector((S * 0.074, -1.268, 1.592))
    pr = [c + Vector((0, 0.022 * math.cos(a), 0.022 * math.sin(a))) for a in [i * 2 * math.pi / 16 for i in range(17)]]
    bit.merge(loft(pr, 0.0035, 0.0035, seg=6, caps=(False, False)))
    bit_ring[nm] = c + Vector((0, -0.0, -0.022))
bit.merge(loft([Vector((0.062, -1.268, 1.592)), Vector((0.0, -1.262, 1.585)), Vector((-0.062, -1.268, 1.592))], 0.0045, 0.0045, seg=6))
made_bit = obj('Tack_Bit', bit, STEEL, bone=HEAD)

# ------------------------------------------------------------------ anchors: empties at rest positions, bound to a bone by the page
def anchor(name, p, bone):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.01
    e.location = Vector(p)
    e['bone'] = bone
    e['layer'] = 'anchor'
    bpy.context.scene.collection.objects.link(e)
    return e


def on_top(y, x=0.0, up=0.0):
    return Vector((x, y, (rig.topz(y, x) or 1.45) + up))


anchor('Anchor_Poll', Vector((0.0, -1.06, 2.0)), 'Head')
anchor('Anchor_Withers', on_top(-0.33, 0.0, -0.02), 'Spine_Thoracic')
anchor('Anchor_Loin', on_top(0.2, 0.0, -0.02), 'Spine_Lumbar')
anchor('Anchor_Croup', on_top(0.38, 0.0, -0.02), 'Pelvis')
anchor('Anchor_Bit_L', bit_ring['L'], 'Head')
anchor('Anchor_Bit_R', bit_ring['R'], 'Head')
# rein waypoint just outside the neck so the reins never pass through it
for S, nm in ((1.0, 'L'), (-1.0, 'R')):
    p = Vector((S * 0.15, -0.78, 1.66))
    for _ in range(40):
        if rig.depth(p) <= -0.02:
            break
        p.x += S * 0.01
    anchor('Anchor_ReinMid_' + nm, p, 'Neck_2')
# spine line the page draws (poll to dock): vertebral column points, each bound to the bone that carries it
spine_line = [(Vector((0.0, -1.06, 1.99)), 'Head'), (Vector((0.0, -0.99, 1.89)), 'Neck_3'), (neck := Vector((0.0, -0.80, 1.72)), 'Neck_2'), (Vector((0.0, -0.62, 1.52)), 'Neck_1'),
              (Vector((0.0, -0.40, 1.41)), 'Spine_Thoracic'), (Vector((0.0, -0.02, 1.34)), 'Spine_Lumbar'), (Vector((0.0, 0.30, 1.37)), 'Pelvis'), (Vector((0.0, 0.58, 1.40)), 'Tail_1')]
for i, (p, b) in enumerate(spine_line):
    anchor('SpineLine_%d' % i, p, b)
# the seat frame is sampled from four coat vertices under the saddle (found by position by the page)
for nm, (x, y) in (('F', (0.0, -0.22)), ('B', (0.0, 0.18)), ('L', (0.13, -0.02)), ('R', (-0.13, -0.02))):
    anchor('Seat_' + nm, Vector((x, y, rig.topz(y, x) or 1.45)), 'Spine_Thoracic')

n, outn, worst = inside_report(rig, [o for o in made if False])
pose = dict(seat_y=seat_y, seat_z=seat_z, bar_L=bars['L'], bar_R=bars['R'], topline_seat=rig.topz(seat_y))
json.dump(pose, open(pose_json, 'w'), indent=1)
print('TACK objects', len(made), 'seat_z %.3f' % seat_z, 'polys', sum(len(o.data.polygons) for o in made), pose)
save(out)
