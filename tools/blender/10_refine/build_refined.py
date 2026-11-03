# Build the refined Marwari working copy from the untouched master (BSAH Marwari three-view refinement, Nov 2026).
# The master is only read; every layer is reversible in the output file:
#   L2/L3  the coat colour map: a new packed image `marwari_basecolor_refined` on the coat material; the original image is kept
#          (fake user) so pointing the node back restores the old coat.
#   L4/L5  tail and mane: the original hair object is kept, hidden and excluded from export (`Marwari_Hair_Original`); the refined
#          cards are a copy with the same vertex count, order, UVs and weights, only their rest positions differ.
#   L1     anatomy: not changed. Measured against the reference's side view (belly clearance, neck base, barrel depth, each as a
#          share of the height at the withers) the body is within a few per cent; the remaining difference is the reference's
#          lens and light. export_refined.py would bake a shape key mix if one is added later.
#   L2c    the dock hole (optional): coat occlusion/roughness and normal maps with the hole beside the tail dock filled, as new packed images
#          `marwari_orm_dock` / `marwari_normal_dock` (fix_dock_texture.py makes the three files). The originals are left out of the saved
#          file to keep it under 30 MB; they are unchanged in the master and in tools/blender/textures.
# usage: blender -b --factory-startup -P build_refined.py -- <master.blend> <out.blend> <refined_basecolor.png> [layers] [orm.png normal.png]
#        layers: comma list of tex,hair (default both)
import bpy, sys, os, importlib.util
argv = sys.argv[sys.argv.index('--') + 1:]
master, out, tex = argv[0], argv[1], argv[2]
layers = set((argv[3] if len(argv) > 3 else 'tex,hair').split(','))
orm_png, nor_png = (argv[4], argv[5]) if len(argv) > 5 else (None, None)
here = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=master)

def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(here, name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod

if 'tex' in layers:
    old = bpy.data.images['marwari_basecolor']
    old.use_fake_user = True
    im = bpy.data.images.load(tex); im.name = 'marwari_basecolor_refined'; im.colorspace_settings.name = 'sRGB'; im.pack()
    for n in bpy.data.materials['Marwari_Coat'].node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image == old: n.image = im
    print('L2/L3 colour map ->', im.name)
    for old_name, path, new_name in (('marwari_orm', orm_png, 'marwari_orm_dock'), ('marwari_normal', nor_png, 'marwari_normal_dock')):
        if not path: continue
        old = bpy.data.images[old_name]
        new = bpy.data.images.load(path); new.name = new_name; new.colorspace_settings.name = 'Non-Color'; new.pack()
        for n in bpy.data.materials['Marwari_Coat'].node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image == old: n.image = new
        print('L2c dock hole fix ->', new.name)
if 'hair' in layers:
    load('refine_hair').run()
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print('SAVED', out)
