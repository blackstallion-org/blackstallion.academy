# Widens the colour bleed round every UV island in the coat maps (colour, occlusion/roughness, normal). The original bake pads each island by a
# few texels only, so once the GPU mip-maps the 2048 maps the black atlas margin leaks into the seams and draws a dark line wherever two
# islands meet (down the blaze edge, along the cheek...). Every texel outside an island within PAD texels takes the colour of the nearest
# island texel; texels inside islands are never touched.
# usage: blender -b --factory-startup -P fix_gutters.py -- in.blend out.blend [pad_texels]
import bpy, sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]; PAD = int(argv[2]) if len(argv) > 2 else 24
bpy.ops.wm.open_mainfile(filepath=src)
me = bpy.data.objects['Marwari_Low'].data; uv = me.uv_layers['UVMap'].data
names = ['marwari_basecolor_refined', 'marwari_orm_dock', 'marwari_normal_dock']
W, H = bpy.data.images[names[0]].size
big = 2                                                                      # draw the coverage at 2x for clean edges, then reduce
m = Image.new('L', (W * big, H * big), 0); dr = ImageDraw.Draw(m)
for p in me.polygons:
    pts = [(uv[l].uv[0] * W * big, (1 - uv[l].uv[1]) * H * big) for l in p.loop_indices]
    dr.polygon(pts, fill=255, outline=255)
mask = np.asarray(m.resize((W, H), Image.BILINEAR)) > 40                     # (row 0 = top of the image)
mask = ndi.binary_erosion(mask, iterations=1) | ndi.binary_erosion(mask, iterations=0)   # keep to texels whose centre is covered
dist, (iy, ix) = ndi.distance_transform_edt(~mask, return_indices=True)
grow = (~mask) & (dist <= PAD)
print('coverage %.1f%% of the atlas, %d gutter texels refilled' % (100 * mask.mean(), grow.sum()))
for n in names:
    im = bpy.data.images[n]
    a = np.empty(W * H * 4, np.float32); im.pixels.foreach_get(a); a = a.reshape(H, W, 4)[::-1].copy()   # to top-left origin
    b = a.copy(); b[grow] = a[iy[grow], ix[grow]]
    im.pixels.foreach_set(b[::-1].reshape(-1)); im.update(); im.pack()      # packed, so the refilled pixels are what the file keeps
    print('  %s: refilled' % n)
bpy.ops.wm.save_as_mainfile(filepath=dst, compress=True)
