"""Procedural stylised Marwari stallion (Kala coat). Skin-modifier body from a skeleton graph.
Run with: bpyenv/bin/python build_marwari.py <outdir>
Facing -Y in Blender (+Z in glTF). Height at withers ~1.5 m, ears inward-curving (lyre)."""
import sys, math, bpy, bmesh
from mathutils import Vector

out = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---------------------------------------------------------------- skeleton graph
verts, edges, radii, roots = [], [], [], []

def v(x, y, z, r, root=False):
    verts.append((x, y, z)); radii.append(r); roots.append(root)
    return len(verts) - 1

def chain(prev, pts):
    """connect prev -> pts[0] -> pts[1] ..."""
    last = prev
    for p in pts:
        i = v(*p)
        if last is not None:
            edges.append((last, i))
        last = i
    return last

# spine (rump -> withers)
s_rump = v(0, 0.95, 1.42, 0.30, root=True)
s_croup = v(0, 0.55, 1.50, 0.32)
s_back = v(0, 0.00, 1.46, 0.31)
s_wither = v(0, -0.50, 1.50, 0.33)
for a, b in [(s_rump, s_croup), (s_croup, s_back), (s_back, s_wither)]:
    edges.append((a, b))
# belly / barrel mass (lower, hangs from the spine)
b1 = v(0, 0.35, 1.10, 0.36); b2 = v(0, -0.15, 1.04, 0.39)
edges += [(s_croup, b1), (s_back, b2)]
# chest
chest = v(0, -0.62, 1.12, 0.34); edges += [(s_wither, chest), (b2, chest)]

# neck: arched, high-carried (Marwari); rises ~45 degrees from the shoulder
n0 = v(0, -0.72, 1.56, 0.27)
n1 = v(0, -0.92, 1.80, 0.22)
n2 = v(0, -1.12, 1.97, 0.17)
poll = v(0, -1.28, 2.05, 0.13)
edges += [(s_wither, n0), (n0, n1), (n1, n2), (n2, poll)]
# head: refined, tilted down-forward
h0 = v(0, -1.38, 1.99, 0.135)
h1 = v(0, -1.52, 1.82, 0.125)
h2 = v(0, -1.63, 1.66, 0.088)
nose = v(0, -1.68, 1.55, 0.072)
edges += [(poll, h0), (h0, h1), (h1, h2), (h2, nose)]

# ears: short lyre pair, tips curve inward until they almost touch
for sx in (-1, 1):
    e0 = v(sx * 0.08, -1.30, 2.10, 0.052)
    e1 = v(sx * 0.115, -1.31, 2.19, 0.046)
    e2 = v(sx * 0.10, -1.32, 2.28, 0.037)
    e3 = v(sx * 0.055, -1.33, 2.345, 0.025)
    e4 = v(sx * 0.016, -1.335, 2.365, 0.014)
    edges += [(poll, e0), (e0, e1), (e1, e2), (e2, e3), (e3, e4)]

def leg(root_v, sx, front):
    if front:
        pts = [(sx * 0.22, -0.55, 1.16, 0.20), (sx * 0.21, -0.57, 0.76, 0.135),
               (sx * 0.21, -0.58, 0.45, 0.085), (sx * 0.21, -0.58, 0.22, 0.075), (sx * 0.21, -0.59, 0.05, 0.088)]
    else:
        pts = [(sx * 0.24, 0.74, 1.15, 0.24), (sx * 0.23, 0.72, 0.80, 0.16),
               (sx * 0.22, 0.86, 0.50, 0.095), (sx * 0.22, 0.85, 0.22, 0.075), (sx * 0.22, 0.84, 0.05, 0.088)]
    chain(root_v, pts)

for sx in (-1, 1):
    leg(chest, sx, True)
    leg(s_rump, sx, False)

# tail: set high, flowing down
t = chain(s_rump, [(0, 1.10, 1.50, 0.07), (0, 1.32, 1.36, 0.06), (0, 1.42, 1.00, 0.055),
                   (0, 1.40, 0.62, 0.04), (0, 1.37, 0.35, 0.025)])

# ---------------------------------------------------------------- mesh + skin
me = bpy.data.meshes.new("MarwariBody")
me.from_pydata(verts, edges, [])
me.update()
ob = bpy.data.objects.new("Marwari_Kala", me)
sc.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

ob.modifiers.new("Skin", "SKIN")
bpy.ops.object.mode_set(mode="OBJECT")
skin = me.skin_vertices[0].data
for i, (r, root) in enumerate(zip(radii, roots)):
    skin[i].radius = (r, r)
    skin[i].use_root = root
# each ear is attached to poll, so one connected component: only the rump root is needed
sm = ob.modifiers["Skin"]
sm.branch_smoothing = 1.0
sm.use_smooth_shade = True
ss = ob.modifiers.new("Subsurf", "SUBSURF")
ss.levels = 3; ss.render_levels = 3
for m in list(ob.modifiers):
    bpy.ops.object.modifier_apply(modifier=m.name)

# body wider than deep -> narrow in X a touch, deepen the barrel
ob.scale = (0.9, 1.0, 1.0)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.shade_smooth()

# ---------------------------------------------------------------- eyes
def eye(sx):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.022, location=(sx * 0.105, -1.43, 2.02), segments=16, ring_count=8)
    e = bpy.context.object; e.name = f"Eye_{'L' if sx<0 else 'R'}"
    return e
eyes = [eye(-1), eye(1)]

# ---------------------------------------------------------------- materials
def mat(name, rgb, rough, metal=0.0, spec=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

coat = mat("Kala_Coat", srgb("#15130F"), 0.34)           # obsidian, soft sheen (brand #0F0E0D lifted so form reads)
eyem = mat("Eye", srgb("#0A0806"), 0.05)
ob.data.materials.append(coat)
for e in eyes:
    e.data.materials.append(eyem)

# ---------------------------------------------------------------- scene for preview
bpy.ops.object.empty_add(location=(0, -0.15, 1.15)); target = bpy.context.object
bpy.ops.object.camera_add(location=(4.3, -4.9, 1.75)); cam = bpy.context.object
c = cam.constraints.new("TRACK_TO"); c.target = target; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
sc.camera = cam; cam.data.lens = 55
def light(name, loc, energy, color):
    bpy.ops.object.light_add(type="AREA", location=loc); L = bpy.context.object; L.name = name
    L.data.energy = energy; L.data.size = 3; L.data.color = color
    k = L.constraints.new("TRACK_TO"); k.target = target; k.track_axis = "TRACK_NEGATIVE_Z"; k.up_axis = "UP_Y"
light("Key_Gold", (-3, -3.2, 3.5), 900, srgb("#E8C46A"))
light("Rim_Copper", (3.2, 3.0, 2.6), 700, srgb("#B87333"))
light("Fill", (3.5, -3.0, 1.2), 180, (0.8, 0.85, 1.0))
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.011, 0.010, 1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0)); fl = bpy.context.object; fl.name = "Floor_Preview"
fm = mat("Floor", srgb("#1A1A18"), 0.6); fl.data.materials.append(fm)

sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 48
sc.cycles.use_denoising = False
sc.render.resolution_x = 1100; sc.render.resolution_y = 760
sc.render.filepath = f"{out}/marwari_preview.png"
bpy.ops.render.render(write_still=True)

# ---------------------------------------------------------------- export (horse only)
fl.hide_viewport = True
for o in list(bpy.data.objects):
    o.select_set(False)
ob.select_set(True)
for e in eyes: e.select_set(True)
bpy.ops.export_scene.gltf(filepath=f"{out}/marwari.glb", export_format="GLB", use_selection=True,
                          export_apply=True, export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=f"{out}/marwari_source.blend")
st = ob.data
print("VERTS", len(st.vertices), "TRIS", sum(len(p.vertices) - 2 for p in st.polygons))
