# L2+L3: the refined coat colour map. Every effect is a separate mask computed from the bind-pose position and normal of each
# texel (baked by bake_maps.py), then composited over the untouched graded map. Masks are saved for editing (PNG, 0..255).
# usage: blender -b --factory-startup -P paint_markings.py -- <bake_dir> <base.png> <orm.png> <out_dir> ['{json overrides}']
# (Blender's bundled Python has numpy; Pillow must be installed into it: <blender python> -m pip install pillow)
import sys, os, json, numpy as np
from PIL import Image
import bpy
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
bake, base_png, orm_png, out = argv[:4]
P = json.loads(argv[4]) if len(argv) > 4 else {}

def exr(name):
    im = bpy.data.images.load(os.path.join(bake, name)); w, h = im.size
    a = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(a)
    return np.flipud(a.reshape(h, w, 4)[..., :3])
pos, nor = exr('bake_pos.exr'), exr('bake_nor.exr')
X, Y, Z = pos[..., 0], pos[..., 1], pos[..., 2]
nn = nor / np.maximum(np.linalg.norm(nor, axis=-1, keepdims=True), 1e-6)
covered = np.linalg.norm(nor, axis=-1) > 0.5
H, W = X.shape
srgb = np.asarray(Image.open(base_png).convert('RGB')).astype(np.float32) / 255
ao = np.asarray(Image.open(orm_png).convert('RGB')).astype(np.float32)[..., 0] / 255
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
enc = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)
base = lin(srgb)
rng = np.random.default_rng(7)

# smooth value noise in 3D (deterministic): for irregular edges and hair streaks
G = rng.random((64, 64, 64)).astype(np.float32)
def vnoise(px, py, pz):
    xi, yi, zi = np.floor(px).astype(int), np.floor(py).astype(int), np.floor(pz).astype(int)
    fx, fy, fz = px - xi, py - yi, pz - zi
    fx, fy, fz = [f * f * (3 - 2 * f) for f in (fx, fy, fz)]
    def g(dx, dy, dz): return G[(xi + dx) % 64, (yi + dy) % 64, (zi + dz) % 64]
    a = g(0,0,0)*(1-fx) + g(1,0,0)*fx; b = g(0,1,0)*(1-fx) + g(1,1,0)*fx
    c = g(0,0,1)*(1-fx) + g(1,0,1)*fx; d = g(0,1,1)*(1-fx) + g(1,1,1)*fx
    return (a*(1-fy) + b*fy)*(1-fz) + (c*(1-fy) + d*fy)*fz
def fbm(px, py, pz, o=3):
    s, amp, tot = 0, 1, 0
    for i in range(o):
        s = s + amp * vnoise(px * 2**i + 13*i, py * 2**i + 7*i, pz * 2**i + 3*i); tot += amp; amp *= 0.5
    return s / tot
sstep = lambda e0, e1, x: (lambda t: t*t*(3-2*t))(np.clip((x - e0) / (e1 - e0), 0, 1))

masks = {}
# ---------------------------------------------------------------- stockings (four, each its own height and edge)
legs = {  # cannon/pastern axis points (x, y, z) from the rig, bottom to top, and the stocking top (m above ground)
    'FL': ([(0.148, -0.75, 0.02), (0.143, -0.663, 0.1), (0.13, -0.6, 0.23), (0.13, -0.608, 0.5), (0.14, -0.58, 0.9)], P.get('FL', 0.37), 0.3),
    'FR': ([(-0.152, -0.79, 0.02), (-0.146, -0.697, 0.1), (-0.139, -0.626, 0.23), (-0.143, -0.618, 0.5), (-0.15, -0.586, 0.9)], P.get('FR', 0.42), 1.7),
    'HL': ([(0.228, 0.42, 0.02), (0.224, 0.501, 0.1), (0.215, 0.561, 0.25), (0.208, 0.522, 0.56), (0.25, 0.23, 0.88)], P.get('HL', 0.38), 2.9),
    'HR': ([(-0.092, 0.22, 0.02), (-0.09, 0.316, 0.1), (-0.084, 0.397, 0.25), (-0.072, 0.469, 0.56), (-0.13, 0.195, 0.88)], P.get('HR', 0.34), 4.4),
}
def axis_at(pts, z):
    pts = np.array(pts); zs = pts[:, 2]
    cx = np.interp(z, zs, pts[:, 0]); cy = np.interp(z, zs, pts[:, 1]); return cx, cy
leg_of = np.full(X.shape, '', dtype=object)
best = np.full(X.shape, 9.0)
for k, (pts, top, ph) in legs.items():
    cx, cy = axis_at(pts, Z)
    d = np.hypot(X - cx, Y - cy)
    sel = (d < best) & (d < 0.11) & (Z < 0.62) & covered
    best = np.where(sel, d, best); leg_of = np.where(sel, k, leg_of)
stock_all = np.zeros(X.shape, np.float32); hoof = np.zeros(X.shape, np.float32); hstripe = np.zeros(X.shape, np.float32)
for k, (pts, top, ph) in legs.items():
    on = leg_of == k
    cx, cy = axis_at(pts, Z)
    th = np.arctan2(Y - cy, X - cx)   # angle around the leg; -y is the front of the leg
    front = np.cos(th + np.pi / 2)      # 1 at the front (toward -y), -1 behind
    # an irregular top edge: a slow wave round the leg, unique per leg, plus ragged hair tufts
    edge = top + 0.028 * np.sin(th + ph) + 0.014 * np.sin(2 * th + 2.1 * ph) + 0.012 * front
    edge += 0.018 * (fbm(np.cos(th) * 3 + ph, np.sin(th) * 3, Z * 2) - 0.5)
    streak = (fbm(np.cos(th) * 40 + ph * 5, np.sin(th) * 40, Z * 3, 2) - 0.5) * 0.026   # hair runs down the leg: streaks along z
    m = 1 - sstep(edge - 0.004, edge + 0.006, Z + streak)
    # hoof: horn below the coronet, which runs higher at the toe than at the heel
    cor = 0.066 + 0.02 * front + 0.004 * np.sin(th * 3 + ph)
    hm = 1 - sstep(cor - 0.004, cor + 0.004, Z)
    stock = np.where(on, m * (1 - hm), 0); hoofk = np.where(on, hm, 0)
    hstripe = np.where(on, fbm(np.cos(th) * 22 + ph, np.sin(th) * 22, Z * 1.2, 2), hstripe)   # growth lines run down the wall
    masks['stock_' + k] = stock.astype(np.float32); stock_all = np.maximum(stock_all, stock); hoof = np.maximum(hoof, hoofk)
masks['hooves'] = hoof
# ---------------------------------------------------------------- blaze (forehead -> nasal bridge -> muzzle)
O = np.array([0.016, -1.089, 1.854]); A = np.array([0.0, -0.699, -0.715]); F = np.array([0.0, -0.715, 0.699])
rel = pos - O
s = rel @ A                      # along the head: ~0 at the eyes, ~0.38 at the muzzle tip
x0 = -0.001 + 0.024 * np.clip(s / 0.38, 0, 1)
lat = np.abs(X - x0)
facing = nn @ F                   # 1 on the front of the face
tipward = nn @ A                  # 1 on the end of the muzzle
head = (Y < -0.95) & (Z > 1.45) & covered
# half-width along the head: broad on the forehead, narrow down the bridge, widening over the muzzle
sk = np.array(P.get('blaze_s', [-0.07, -0.04, 0.0, 0.06, 0.14, 0.22, 0.29, 0.34, 0.40]))
wk = np.array(P.get('blaze_w', [0.0, 0.04, 0.05, 0.039, 0.027, 0.025, 0.036, 0.054, 0.068]))
w = np.interp(s, sk, wk)
w = w * (1 + 0.22 * (fbm(s * 9 + 3, X * 4, 1.0) - 0.5)) + 0.004 * (fbm(X * 260, s * 6, 2.0, 2) - 0.5)
depth = rel @ F                   # > 0 on the upper (front) half of the head; the throat and jaw are below 0
front_ok = sstep(-0.3, 0.15, facing) * sstep(-0.01, 0.02, depth) * (s < 0.30) + sstep(-0.35, 0.1, np.maximum(facing, tipward)) * (s >= 0.30)
top_edge = sstep(-0.048, -0.022, s + 0.02 * (fbm(X * 40, 1.0, 3.0) - 0.5))
blaze = head * front_ok * top_edge * (1 - sstep(w - 0.003, w + 0.004, lat))
masks['blaze'] = blaze.astype(np.float32)
# pink skin: the muzzle end of the blaze, nostrils kept dark by the baked occlusion
pink = blaze * sstep(0.285, 0.33, s + 0.012 * (fbm(X * 30, s * 30, 5.0) - 0.5))
masks['muzzle_pink'] = pink.astype(np.float32)
# ---------------------------------------------------------------- warm brown regions (barrel, flank, lower neck)
side = np.abs(nn[..., 0])
barrel = sstep(-0.62, -0.35, Y) * (1 - sstep(0.15, 0.42, Y)) * sstep(0.7, 0.86, Z) * (1 - sstep(1.08, 1.24, Z))
flank = sstep(0.0, 0.2, Y) * (1 - sstep(0.38, 0.55, Y)) * sstep(0.78, 0.95, Z) * (1 - sstep(1.12, 1.28, Z))
neck = sstep(-0.98, -0.85, Y) * (1 - sstep(-0.6, -0.48, Y)) * sstep(1.12, 1.22, Z) * (1 - sstep(1.38, 1.5, Z)) * sstep(-0.2, 0.3, -nn[..., 2] * 0.5 + side)   # lower neck, sides and underside
warm = np.clip(np.maximum.reduce([barrel * sstep(0.15, 0.5, side), flank * sstep(0.2, 0.55, side), neck * 0.8]), 0, 1)
warm *= 0.75 + 0.5 * (fbm(X * 6, Y * 6, Z * 6) - 0.5)
warm = np.clip(warm, 0, 1) * covered * (1 - stock_all) * (Z > 0.6)
masks['warm'] = warm.astype(np.float32)

# ---------------------------------------------------------------- composite (linear)
L = (base @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
detail = np.clip(L / max(float(L[covered].mean()), 1e-4), 0.6, 1.6)
brown = lin(np.array(P.get('brown', [0.36, 0.21, 0.11])))
k = masks['warm'][..., None] * P.get('warm_k', 0.85)
col = base * (1 - k) + brown * detail ** 0.6 * k
fur_v = 1 + 0.07 * (fbm(X * 90, Y * 90, Z * 90, 2) - 0.5)
white = lin(np.array([0.87, 0.85, 0.81]))[None, None, :] * fur_v[..., None] * (0.55 + 0.45 * ao[..., None])
mw = np.maximum(stock_all, blaze)[..., None]
col = col * (1 - mw) + white * mw
skin = lin(np.array([0.79, 0.64, 0.61])) * (0.85 + 0.3 * (fbm(X * 70, Y * 70, Z * 70) - 0.5))[..., None]
skin = skin * np.clip(ao[..., None] ** 1.6, 0.25, 1)
skin = skin * (1 - 0.2 * sstep(0.55, 0.85, fbm(X * 120, Y * 120, Z * 120, 2)))[..., None]   # grey mottling of muzzle skin
col = col * (1 - pink[..., None]) + skin * pink[..., None]
horn_a, horn_b = lin(np.array([0.50, 0.46, 0.41])), lin(np.array([0.63, 0.58, 0.50]))
stripe = (0.35 + 0.65 * sstep(0.35, 0.75, hstripe))[..., None]
horn = (horn_a * (1 - stripe) + horn_b * stripe) * (0.7 + 0.3 * ao[..., None])
col = col * (1 - hoof[..., None]) + horn * hoof[..., None]
# the bake's margin gave every gutter texel the position and normal of its own island's edge, so the masks already continue
# each island outward by 12 px (mip padding) without borrowing from a neighbouring island
outp = np.where(covered[..., None], col, base)
img = (np.clip(enc(outp), 0, 1) * 255 + 0.5).astype(np.uint8)
Image.fromarray(img).save(os.path.join(out, 'marwari_base_refined_2048.png'), optimize=True)
os.makedirs(os.path.join(out, 'masks'), exist_ok=True)
for name, m in masks.items():
    Image.fromarray((np.clip(m, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, 'masks', f'marwari_mask_{name}.png'), optimize=True)
print('PAINTED', {k: round(float(v.mean()) * 100, 3) for k, v in masks.items()})
