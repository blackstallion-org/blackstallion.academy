# Measure how far each limb can actually reach (fetlock on the ground) with the stage-11 IK, for several shoulder/hip shares.
import sys
src = open(__file__.replace('reach_probe.py', 'stage11_gaits.py')).read().split('# ------------------------------------------------------------------ gait tables')[0]
sys.argv = [sys.argv[0], '--', sys.argv[sys.argv.index('--')+1], '/dev/null', '/dev/null']
exec(src)
import json
res = {}
for kind in 'FH':
    s = 'L'; F0 = rest_pt(('Cannon_F_' if kind == 'F' else 'Cannon_B_') + s, 'tail')
    for share in (0,):
        row = []
        for fwd in [round(x * 0.05, 2) for x in range(-20, 21)]:
            clear_pose()
            tgt = Vector((F0.x, F0.y - fwd, F0.z))
            chain, err = solve_leg(kind, s, tgt, 0.0, best_share(kind, s, tgt))
            row.append((fwd, round(err, 3)))
        ok = [f for f, e in row if e < 0.02]
        print('REACH', kind, 'share', share, 'ok fwd range', (min(ok), max(ok)) if ok else None, 'err@+0.5/-0.5', dict(row)[0.5], dict(row)[-0.5], 'err@+0.7/-0.7', dict(row)[0.7], dict(row)[-0.7])
