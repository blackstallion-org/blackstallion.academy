import bpy, sys, numpy as np
bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index('--')+1])
for im in bpy.data.images:
    if im.size[0] == 0: continue
    p = np.array(im.pixels[:], np.float32).reshape(-1, 4)
    print('IMG', im.name, im.size[:], 'packed', bool(im.packed_file), im.colorspace_settings.name, 'mean', p[:, :3].mean(0).round(3), 'max', p[:, :3].max().round(3))
m = bpy.data.objects['Marwari_Low'].data.materials[0]
for n in m.node_tree.nodes: print('NODE', n.type, n.name, getattr(n, 'image', None) and n.image.name)
print('SLOTS', len(bpy.data.objects['Marwari_Low'].data.materials), [x.name for x in bpy.data.objects['Marwari_Low'].data.materials])
