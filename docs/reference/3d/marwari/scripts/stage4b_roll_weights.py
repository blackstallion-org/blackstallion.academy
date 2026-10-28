# Stage 4b: roll every bone so local X = the horse's left (+X); soften knee, hock and fetlock weights.
import bpy, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
arm = bpy.data.objects['MarwariRig']; o = bpy.data.objects['Marwari']; vl = bpy.context.view_layer
vl.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
for eb in arm.data.edit_bones:
    z = Vector((1,0,0)).cross(eb.vector)
    if z.length > 1e-6: eb.align_roll(z.normalized())
bpy.ops.object.mode_set(mode='OBJECT')
bad = [b.name for b in arm.data.bones if b.matrix_local.col[0].xyz.x < 0.9]
print('ROLL_NOT_X', bad)
vl.objects.active = o; o.select_set(True); bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
for s in 'LR':
    for g in (f'Forearm_{s}', f'Cannon_F_{s}', f'Pastern_F_{s}', f'Gaskin_{s}', f'Cannon_B_{s}', f'Pastern_B_{s}', f'Humerus_{s}', f'Femur_{s}'):
        o.vertex_groups.active_index = o.vertex_groups[g].index
        bpy.ops.object.vertex_group_smooth(group_select_mode='ACTIVE', factor=0.5, repeat=6, expand=0.1)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
bpy.ops.wm.save_as_mainfile(filepath=argv[1])
