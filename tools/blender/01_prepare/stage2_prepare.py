# Stage 2: decimate to a rig-friendly master and repaint the bay coat as a Kala (black) coat.
import bpy, sys, numpy as np, time
argv = sys.argv[sys.argv.index('--')+1:]
blend, out_blend, ratio = argv[0], argv[1], float(argv[2])
bpy.ops.wm.open_mainfile(filepath=blend)
o = bpy.data.objects['Marwari']
bpy.context.view_layer.objects.active = o; o.select_set(True)
t=time.time()
# weld duplicate verts first (Tripo exports split verts on UV seams only, so this is safe at 0.1 mm)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
v0 = len(o.data.vertices)
bpy.ops.mesh.remove_doubles(threshold=0.00002)
bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.mesh.select_non_manifold()
import bmesh
bm = bmesh.from_edit_mesh(o.data); nm = sum(1 for e in bm.edges if e.select); print('WELD', v0, '->', len(bm.verts), 'NONMANIFOLD_EDGES', nm)
bpy.ops.object.mode_set(mode='OBJECT')
m = o.modifiers.new('dec','DECIMATE'); m.decimate_type='COLLAPSE'; m.ratio=ratio; m.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier='dec')
bpy.ops.object.shade_smooth()
print('DECIMATED', len(o.data.polygons), round(time.time()-t,1),'s')

# ---- coat repaint (texture space)
img = bpy.data.images['horse_3d_model_basecolor']
w,h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h,w,4)
rgb = px[...,:3]
# image pixels are linear for sRGB images in Blender's float buffer? colorspace is sRGB; pixels[] returns stored (sRGB-encoded) values for byte images
lum = rgb @ np.array([0.2126,0.7152,0.0722], np.float32)
mx = rgb.max(-1); mn = rgb.min(-1); sat = (mx-mn)/np.maximum(mx,1e-4)
white = np.clip((lum-0.42)/0.18,0,1) * np.clip((0.55-sat)/0.3,0,1)   # blaze, snip, socks, pale hooves
def blur(a, r):
    for _ in range(3):
        c = np.cumsum(np.pad(a,((r+1,r),(0,0)),mode='edge'),0); a = (c[2*r+1:]-c[:-2*r-1])/(2*r+1)
        c = np.cumsum(np.pad(a,((0,0),(r+1,r)),mode='edge'),1); a = (c[:,2*r+1:]-c[:,:-2*r-1])/(2*r+1)
    return a
coat = 1-white
fill = blur(lum*coat, 12)/np.maximum(blur(coat,12),1e-4)          # coat brightness pulled into white patches
base = lum*(1-white) + fill*white
detail = lum - blur(lum, 3); detail *= (1-white)                     # hair-level variation
lo, hi = np.percentile(base[coat>0.9], [3,97])
t = np.clip((base-lo)/(hi-lo),0,1)
v = 0.035 + 0.27*t**1.35 + np.clip(detail,-0.08,0.08)*0.6
rng = np.random.default_rng(7); hair = blur(rng.standard_normal(lum.shape).astype(np.float32),1)*0.05
v += hair*white*np.std(detail[coat>0.9])/0.02  # hair grain where the white markings were filled
tint = np.array([1.0,0.92,0.85],np.float32)                          # warm undertone in the sheen
out = np.clip(v[...,None]*tint, 0, 1)
px[...,:3] = out
new = bpy.data.images.new('kala_basecolor', w, h, alpha=False)
new.pixels[:] = px.ravel()
new.filepath_raw = argv[3]; new.file_format='PNG'; new.save()
mat = o.data.materials[0]
for n in mat.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image == img: n.image = new
# a coat is not metal: drop metallic, keep the sheen map but never mirror-like
for l in list(mat.node_tree.links):
    if l.to_socket.name=='Metallic': mat.node_tree.links.remove(l)
bsdf = mat.node_tree.nodes['Principled BSDF']; bsdf.inputs['Metallic'].default_value = 0.0
rm = bpy.data.images['horse_3d_model_rm']; q = np.array(rm.pixels[:],np.float32).reshape(-1,4)
q[:,1] = np.clip(q[:,1]*0.85+0.12, 0.38, 0.9); q[:,2] = 0.0; rm.pixels[:] = q.ravel(); rm.update()
print('WHITE_FRACTION', float((white>0.5).mean()))
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
