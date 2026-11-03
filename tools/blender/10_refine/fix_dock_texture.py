# Fills the hole where the croup meets the tail dock in the coat maps. The original bake left those texels at 0 in the colour map, in the
# occlusion/roughness map (occlusion 0 on one side of the hole, 1 on the other) and flat-ish in the normal map, so the coat shader drew a
# patch of dark and tan with a hard edge beside the tail. The hole is found by flood fill from a seed inside it (colour map black,
# occlusion 0), grown a few pixels, filled from its surroundings (push-pull, smoothed) and, in the colour and normal maps, given the grain
# of the neighbouring coat, so nothing else in any map changes.
# usage: python3 fix_dock_texture.py base.png orm.png normal.png out_base.png out_orm.png out_normal.png
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

base_p, orm_p, nor_p, base_o, orm_o, nor_o = sys.argv[1:7]
load = lambda p: np.array(Image.open(p).convert('RGB')).astype(np.float32)
base, orm, nor = load(base_p), load(orm_p), load(nor_p)
H, W, _ = base.shape
SEED = (int(W * 0.0757), int(H * (1 - 0.636)))            # (x, y) inside the hole: u = 0.076, v = 0.636 on the croup island
box = (slice(int(H * 0.30), int(H * 0.43)), slice(int(W * 0.03), int(W * 0.13)))

def component(mask):
    m = np.zeros((H, W), bool); m[box] = mask[box]
    lab, _ = ndi.label(m)
    assert lab[SEED[1], SEED[0]] > 0, 'seed is not in the hole'
    return lab == lab[SEED[1], SEED[0]]

hole0 = component(base.mean(axis=2) < 4) | component(orm[..., 0] < 30)
hole = ndi.binary_dilation(hole0, iterations=4)

def pushpull(img, ok):
    """average the valid texels down a pyramid, then push the result back up where texels are missing"""
    levels = [(img * ok[..., None], ok.astype(np.float32))]
    while min(levels[-1][1].shape) > 2:
        a, w = levels[-1]
        h2, w2 = a.shape[0] // 2, a.shape[1] // 2
        a2 = a[:h2 * 2, :w2 * 2].reshape(h2, 2, w2, 2, 3).sum(axis=(1, 3)); w_ = w[:h2 * 2, :w2 * 2].reshape(h2, 2, w2, 2).sum(axis=(1, 3))
        levels.append((a2, w_))
    out = None
    for a, w in reversed(levels):
        cur = a / np.maximum(w[..., None], 1e-6)
        if out is not None:
            up = np.repeat(np.repeat(out, 2, axis=0), 2, axis=1)
            up = np.pad(up, ((0, cur.shape[0] - up.shape[0]), (0, cur.shape[1] - up.shape[1]), (0, 0)), mode='edge')
            cur = np.where((w > 0.5)[..., None], cur, up)
        out = cur
    return out

ys, xs = np.where(hole); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
soft = ndi.gaussian_filter(hole.astype(np.float32), 1.5)[y0:y1, x0:x1, None]      # a soft rim so the fill melts into the coat
src_y, src_x = int(H * 0.37), int(W * 0.012)                                      # plain coat on the island's left side, for the grain

def fixed(im, grain_k):
    f = pushpull(im, ~hole)
    for sig in (10, 10, 6):      # the pyramid leaves faint blocks: smooth the fill (only inside the hole), twice
        f = np.where(hole[..., None], ndi.gaussian_filter(f, sigma=(sig, sig, 0)), f)
    patch = f[y0:y1, x0:x1]
    if grain_k:
        hp = im - ndi.gaussian_filter(im, sigma=(4, 4, 0))
        g = hp[src_y:src_y + (y1 - y0), src_x:src_x + (x1 - x0)]
        if g.shape[:2] != (y1 - y0, x1 - x0): g = np.resize(g, (y1 - y0, x1 - x0, 3))
        patch = patch + g * grain_k
    out = im.copy()
    out[y0:y1, x0:x1] = im[y0:y1, x0:x1] * (1 - soft) + np.clip(patch, 0, 255) * soft
    return out

save = lambda a, p: Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8)).save(p)
save(fixed(base, 0.9), base_o)
o = fixed(orm, 0); o[..., 2] = orm[..., 2]; save(o, orm_o)
n = fixed(nor, 0.8); save(n, nor_o)
print('dock hole filled: %d texels (+ rim) in x %d..%d, y %d..%d; colour, occlusion/roughness and normal maps' % (hole0.sum(), x0, x1, y0, y1))
