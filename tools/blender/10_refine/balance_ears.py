# Balances the ears (4 Nov 2026). refine_ears.py places the pair symmetric about the crown's own midline, but the scanned crown leans: above the
# brow the skull's midline drifts about 2 cm to the horse's right (x = -0.002 at the eyes, -0.020 at the poll), and the right ear came out 1.7 cm
# lower than the left (its root sits 9 mm from the right eye's height band, the left 12.5 mm). From the front the pair looked shifted off the
# blaze and lopsided. This script, run on the finished working copy, applies one smooth correction above the eyes:
#   1  the crown, the ears and the forelock slide back onto the face's midline (full shift at the poll, none below z = 1.94, none behind the poll);
#   2  each ear is raised or lowered by half the height difference, fading out round its root (the skull stays welded to the ear);
#   3  the Ear and Ear_Tip bones move with their ears (orientations kept, so every clip turns the ears as before).
# The eyes, the face below the brow, the neck, the body and the tail do not move.
# usage: blender -b --factory-startup -P balance_ears.py -- in.blend out.blend
import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
E = lambda k, d: float(os.environ.get(k, d))
Z0, Z1 = E('BAL_Z0', 1.94), E('BAL_Z1', 2.01)          # the centring fades in between these heights (the eyes' tops are at 1.93)
Y0, Y1 = E('BAL_Y0', -0.98), E('BAL_Y1', -0.90)        # and fades out behind the poll, toward the neck
SIG = E('BAL_SIGMA', 0.032)                             # reach of each ear's height correction round its root
ss = lambda a, b, x: (lambda t: t * t * (3 - 2 * t))(max(0.0, min(1.0, (x - a) / (b - a))))

bpy.ops.wm.open_mainfile(filepath=src)
arm = bpy.data.objects['MarwariRig']; arm.data.pose_position = 'REST'; bpy.context.view_layer.update()
low = bpy.data.objects['Marwari_Low']; me = low.data
assert low.matrix_world.is_identity and arm.matrix_world.is_identity

# the face's midline, measured where the scan is still straight (cheeks and brow, below the eyes' tops)
def slice_mid(z0):
    s = [v.co.x for v in me.vertices if abs(v.co.z - z0) < 0.004 and -1.20 < v.co.y < -1.0]
    return 0.5 * (min(s) + max(s))
FACE_MID = 0.5 * (slice_mid(1.80) + slice_mid(1.86))
POLL_MID = slice_mid(2.0)
DX = FACE_MID - POLL_MID
bones = {n: arm.data.bones[n] for n in ('Ear_L', 'Ear_R', 'Ear_Tip_L', 'Ear_Tip_R')}
root = {s: bones[f'Ear_{s}'].head_local.copy() for s in 'LR'}
DZ = 0.5 * (root['L'].z - root['R'].z)                  # the left goes down by this, the right up by this
print('face midline %.4f, poll midline %.4f -> shift %.4f; ear roots %.4f / %.4f -> each by %.4f' % (FACE_MID, POLL_MID, DX, root['L'].z, root['R'].z, DZ))

gi = {g.name: g.index for g in low.vertex_groups}
EARG = {'L': {gi['Ear_L'], gi['Ear_Tip_L']}, 'R': {gi['Ear_R'], gi['Ear_Tip_R']}}

def offset(co, ear_w=None):
    """The correction at a point. ear_w: the point's weight on each ear's bones (skinned meshes), or None (use distance only)."""
    w = ss(Z0, Z1, co.z) * (1.0 - ss(Y0, Y1, co.y))
    d = Vector((DX * w, 0.0, 0.0))
    for s, sign in (('L', -1.0), ('R', 1.0)):
        r = (co - root[s]).length
        k = math.exp(-(r * r) / (2 * SIG * SIG)) if co.z > root[s].z - 0.03 else 0.0
        if ear_w is not None: k = max(k, min(1.0, ear_w[s]))
        d.z += sign * DZ * k
    return d

moved = 0
for v in me.vertices:
    ew = {s: sum(g.weight for g in v.groups if g.group in EARG[s]) for s in 'LR'}
    d = offset(v.co, ew)
    if d.length > 1e-7: v.co += d; moved += 1
me.update()
print('Marwari_Low: %d vertices moved' % moved)

# the hair: only the forelock reaches the poll; everything behind it is untouched by the y fade
hair_moved = 0
for name in ('Marwari_Hair', 'Marwari_Hair_Original'):
    ob = bpy.data.objects.get(name)
    if not ob: continue
    for v in ob.data.vertices:
        d = offset(v.co)
        if d.length > 1e-7: v.co += d; hair_moved += 1
    ob.data.update()
print('hair: %d vertices moved' % hair_moved)

# the ear bones travel with their ears (each ear moves rigidly: full shift, full height correction)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
for n in bones:
    s = n[-1]
    eb = arm.data.edit_bones[n]
    delta = Vector((DX, 0.0, (-DZ if s == 'L' else DZ)))
    eb.head += delta; eb.tail += delta
    print('BONE', n, 'moved by', tuple(round(x, 4) for x in delta))
bpy.ops.object.mode_set(mode='OBJECT')
arm.data.pose_position = 'POSE'
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
print('saved', dst)
