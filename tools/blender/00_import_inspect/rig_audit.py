# Rig audit: bone lengths, rest directions, limb reach, weight stats per limb. usage: -- in.blend
import bpy, sys, math, numpy as np
bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index('--')+1])
arm = bpy.data.objects['MarwariRig']; lo = bpy.data.objects['Marwari_Low']
B = arm.data.bones
def L(n): return round(B[n].length, 3)
print('LIMB_LENGTHS')
for s in 'LR':
    print(' fore', s, {n: L(n) for n in (f'Scapula_{s}', f'Humerus_{s}', f'Forearm_{s}', f'Cannon_F_{s}', f'Pastern_F_{s}', f'Hoof_F_{s}')})
    print(' hind', s, {n: L(n) for n in (f'Femur_{s}', f'Gaskin_{s}', f'Cannon_B_{s}', f'Pastern_B_{s}', f'Hoof_B_{s}')})
    sh = B[f'Humerus_{s}'].head_local; hip = B[f'Femur_{s}'].head_local
    print(' shoulder', [round(c, 3) for c in sh], 'hip', [round(c, 3) for c in hip])
    fet_f = B[f'Cannon_F_{s}'].tail_local; fet_b = B[f'Cannon_B_{s}'].tail_local
    print(' fetlock heights fore/hind', round(fet_f.z, 3), round(fet_b.z, 3))
    reach_f = L(f'Forearm_{s}') + L(f'Cannon_F_{s}'); 
    print(' max horizontal sweep est (fore, shoulder->fetlock chain via humerus+forearm+cannon):', round(math.sqrt(max(0, (L(f"Humerus_{s}")+reach_f)**2 - (sh.z - fet_f.z)**2)), 3))
    reach_b = L(f'Femur_{s}') + L(f'Gaskin_{s}') + L(f'Cannon_B_{s}')
    print(' max horizontal sweep est (hind):', round(math.sqrt(max(0, reach_b**2 - (hip.z - fet_b.z)**2)), 3))
# weights: how many verts are influenced by >2 bones in limb joints; max influence overlap
vg = {g.index: g.name for g in lo.vertex_groups}
cnt = {}
for v in lo.data.vertices:
    for g in v.groups:
        if g.weight > 0.05: cnt[vg[g.group]] = cnt.get(vg[g.group], 0) + 1
print('VERTS_PER_BONE', {k: v for k, v in sorted(cnt.items(), key=lambda x: -x[1])[:46]})
print('ARMATURE_BONE_COUNT', len(B), 'actions', [a.name for a in bpy.data.actions])
