# Before export_exhibit.py: ship the refined horse's hair as one mesh (join the added tail locks, drop the kept original ribbons) and write
# any shape key mix into the positions, exactly as 10_refine/export_refined.py does for the hero.
import bpy, sys
argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]
sc = bpy.context.scene
orig = bpy.data.objects.get('Marwari_Hair_Original')
if orig: bpy.data.objects.remove(orig)
adds = [o for o in sc.objects if o.name.startswith('Marwari_Hair_Add')]
if adds:
    hair = bpy.data.objects['Marwari_Hair']
    with bpy.context.temp_override(active_object=hair, selected_editable_objects=[hair] + adds):
        bpy.ops.object.join()
    print('JOINED', len(adds))
for ob in sc.objects:
    keys = ob.data.shape_keys if ob.type == 'MESH' else None
    if keys:
        basis = keys.reference_key
        mix = [v.co.copy() for v in basis.data]
        for kb in keys.key_blocks:
            if kb == basis or kb.mute or kb.value == 0: continue
            for i, d in enumerate(kb.data): mix[i] += (d.co - basis.data[i].co) * kb.value
        ob.shape_key_clear()
        for v, c in zip(ob.data.vertices, mix): v.co = c
        ob.data.update()
        print('BAKED_KEYS', ob.name)
bpy.ops.wm.save_as_mainfile(filepath=out)
