# How far the bone and muscle layers poke through the coat while the gait clips play (evaluated, skinned meshes).
# usage: blender -b <layers.blend> -P validate_motion.py -- [samples=6]
import bpy, sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree
argv = sys.argv[sys.argv.index('--') + 1:]
N = int(argv[0]) if argv else 6
ONLY = argv[1].split(',') if len(argv) > 1 else ['Walk', 'Trot', 'Canter_R']
per = {}
sc = bpy.context.scene
arm = bpy.data.objects['MarwariRig']
arm.data.pose_position = 'POSE'
arm.animation_data_create()
coat = bpy.data.objects['Marwari_Low']
layers = {'bone': [o for o in sc.objects if o.name.startswith('Bone_') and not o.name.startswith('Bone_Caudal')],
          'muscle': [o for o in sc.objects if o.name.startswith('Muscle_')]}
print('MOTION clip frames layer verts outside pct worst_cm')
for clip in ONLY:
    act = bpy.data.actions[clip]
    arm.animation_data.action = act
    try:
        arm.animation_data.action_slot = act.slots[0]
    except Exception:
        pass
    f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
    frames = sorted({f0 + int((f1 - f0) * i / N) for i in range(N)})
    tot = {k: [0, 0, 0.0] for k in layers}
    for f in frames:
        sc.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        bvh = BVHTree.FromObject(coat, dg)
        for k, objs in layers.items():
            for o in objs:
                eo = o.evaluated_get(dg)
                me = eo.to_mesh()
                mw = eo.matrix_world
                for v in me.vertices:
                    p = mw @ v.co
                    loc, n, i, d = bvh.find_nearest(p)
                    tot[k][0] += 1
                    if loc is not None and (p - loc).dot(n) > 0:
                        tot[k][1] += 1
                        tot[k][2] = max(tot[k][2], d)
                        r = per.setdefault((clip, o.name), [0, 0.0])
                        r[0] += 1
                        r[1] = max(r[1], d)
                eo.to_mesh_clear()
    for k, (n_, o_, w_) in tot.items():
        print('MOTION', clip, len(frames), k, n_, o_, '%.2f%%' % (100 * o_ / max(1, n_)), '%.2f' % (w_ * 100))

for (clip, name), (cnt, w) in sorted(per.items(), key=lambda kv: -kv[1][1])[:14]:
    print('MOTION_OBJ', clip, name, cnt, '%.1f cm' % (w * 100))
