# Smooths the sharp fold that runs diagonally down the forehead (the two halves of the scanned face meet there with a step and a notch), so the
# front view is calm and the blaze edge has no dark crack. Only vertices near the fold move, by a weighted Taubin smoothing (no shrinkage);
# the ears, the poll, the eyes and everything else are untouched.
# usage: blender -b --factory-startup -P refine_face.py -- in.blend out.blend
import bpy, bmesh, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
E = lambda k, d: float(os.environ.get(k, d))
THR = E('FACE_CREASE', 32.0)          # degrees: a fold is an edge whose two faces differ by more than this
SIG = E('FACE_SIGMA', 0.016)          # metres: reach of the smoothing round each fold
PASSES = int(E('FACE_PASSES', 60))
ss = lambda a, b, x: (lambda t: t * t * (3 - 2 * t))(max(0.0, min(1.0, (x - a) / (b - a))))
bpy.ops.wm.open_mainfile(filepath=src)
ob = bpy.data.objects['Marwari_Low']; me = ob.data
bm = bmesh.new(); bm.from_mesh(me); bm.normal_update()
mid = -0.0177
def in_zone(c): return 1.64 < c.z < 2.0 and c.y < -1.13 and c.y > -1.55 and abs(c.x - mid) < 0.085
folds = []
for e in bm.edges:
    if len(e.link_faces) != 2: continue
    c = (e.verts[0].co + e.verts[1].co) / 2
    if not in_zone(c): continue
    if math.degrees(e.link_faces[0].normal.angle(e.link_faces[1].normal)) > THR: folds.append(c)
print('fold edges in the forehead zone:', len(folds))
if not folds: raise SystemExit('nothing to smooth')
import numpy as np
F = np.array([c[:] for c in folds])
w = {}
for v in bm.verts:
    if not (1.60 < v.co.z < 2.02 and v.co.y < -1.1 and abs(v.co.x - mid) < 0.11): continue
    d = float(np.sqrt(((F - np.array(v.co[:])) ** 2).sum(1)).min())
    k = math.exp(-(d / SIG) ** 2) * (1.0 - ss(1.985, 2.02, v.co.z))
    if k > 0.02: w[v] = k
print('vertices smoothed:', len(w))
before = {v: v.co.copy() for v in w}
for _ in range(PASSES):
    for step in (0.5, -0.53):
        upd = {}
        for v, k in w.items():
            nb = [e.other_vert(v).co for e in v.link_edges]
            if nb: upd[v] = v.co + (sum(nb, Vector()) / len(nb) - v.co) * step * k
        for v, co in upd.items(): v.co = co
mx = max((v.co - before[v]).length for v in w)
print('largest move %.1f mm' % (mx * 1000))
bm.normal_update(); bm.to_mesh(me); me.update(); bm.free()
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
print('saved', dst)
