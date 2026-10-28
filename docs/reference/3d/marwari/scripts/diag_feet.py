import bpy, sys
argv = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=argv[0]); act = bpy.data.actions[argv[1]]
arm = bpy.data.objects['MarwariRig']; arm.animation_data.action = act
try: arm.animation_data.action_slot = act.slots[0]
except Exception: pass
sc = bpy.context.scene
for f in range(int(act.frame_range[0]), int(act.frame_range[1])+1, int(argv[2])):
    sc.frame_set(f)
    row = []
    for n in ('Hoof_F_L','Hoof_F_R','Hoof_B_L','Hoof_B_R'):
        pb = arm.pose.bones[n]; row.append(f"{n[5:]} y{pb.tail.y:+.2f} z{pb.tail.z:.2f}/{pb.head.z:.2f}")
    print('F', f, ' | '.join(row))
