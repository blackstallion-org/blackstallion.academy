import bpy, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
arm = bpy.data.objects['MarwariRig']
for b in arm.data.bones:
    if 'Ear' in b.name or b.name in ('Head',):
        print('BONE', b.name, 'head', tuple(round(c, 3) for c in arm.matrix_world @ b.head_local), 'tail', tuple(round(c, 3) for c in arm.matrix_world @ b.tail_local), 'parent', b.parent.name if b.parent else None)
for ob in bpy.data.objects:
    if ob.type != 'MESH':
        continue
    names = [g.name for g in ob.vertex_groups]
    ear = [i for i, n in enumerate(names) if 'Ear' in n]
    cnt = {names[i]: 0 for i in ear}
    pts = []
    for v in ob.data.vertices:
        for g in v.groups:
            if g.group in ear and g.weight > 0.5:
                cnt[names[g.group]] += 1
                pts.append(ob.matrix_world @ v.co)
    print('MESH', ob.name, len(ob.data.vertices), 'verts', len(ob.data.polygons), 'polys', 'mats', [m.name for m in ob.data.materials], 'ear groups', cnt)
    if pts:
        mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        print('   ear bbox', tuple(round(c, 3) for c in mn), tuple(round(c, 3) for c in mx))
