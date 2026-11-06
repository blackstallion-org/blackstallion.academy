"""World 04 Beyond: the deep-space backdrop, rendered in Blender (Cycles) as an equirectangular panorama.

Stars: three Voronoi layers on the view direction (sparse bright, medium, dense faint), each star tinted by a random colour
temperature (cool blue-white to warm amber); the dense layer and a soft dust glow follow a tilted band (a Milky Way analogue).
Nebula: two octaves of 3D noise, kept dim and in deep blue / muted violet / warm dust, masked to patches near the band.
Output: PNG 16-bit (linear-ish emission, view transform Standard) -> converted to WebP by export step.
Env: OUT (png path), W (width, default 4096), SAMPLES (default 24).
Run: OUT=/tmp/stars.png ~/bpyenv/bin/python tools/blender/12_worlds/beyond/render_starfield.py
"""
import bpy, os, math

OUT = os.environ.get("OUT", "/tmp/beyond_stars.png")
W = int(os.environ.get("W", "4096"))
SAMPLES = int(os.environ.get("SAMPLES", "24"))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False  # denoising smears single-pixel stars
sc.render.threads_mode = "FIXED"
sc.render.threads = 1
sc.render.resolution_x = W
sc.render.resolution_y = W // 2
sc.render.film_transparent = False
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_depth = "16"

cam = bpy.data.objects.new("pano", bpy.data.cameras.new("pano"))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.type = "PANO"
cam.data.panorama_type = "EQUIRECTANGULAR"
cam.rotation_euler = (math.pi / 2, 0, 0)

w = bpy.data.worlds.new("space")
sc.world = w
w.use_nodes = True
nt = w.node_tree
N = nt.nodes
L = nt.links
for n in list(N):
    if n.type != "OUTPUT_WORLD":
        N.remove(n)
out = [n for n in N if n.type == "OUTPUT_WORLD"][0]

def node(t, **kw):
    n = N.new(t)
    for k, v in kw.items():
        setattr(n, k, v)
    return n

def math_node(op, a=None, b=None, va=None, vb=None):
    m = node("ShaderNodeMath", operation=op)
    if a is not None: L.new(a, m.inputs[0])
    elif va is not None: m.inputs[0].default_value = va
    if b is not None: L.new(b, m.inputs[1])
    elif vb is not None: m.inputs[1].default_value = vb
    return m.outputs[0]

coord = node("ShaderNodeTexCoord").outputs["Generated"]  # for world: the view direction
# Generated in the world is the direction vector

# band mask: direction relative to a tilted plane (normal n)
band_n = (0.25, 0.62, 0.74)
nl = math.sqrt(sum(x * x for x in band_n))
band_n = tuple(x / nl for x in band_n)
dot = node("ShaderNodeVectorMath", operation="DOT_PRODUCT")
L.new(coord, dot.inputs[0])
dot.inputs[1].default_value = band_n
d = dot.outputs["Value"]
d2 = math_node("MULTIPLY", d, d)
band = math_node("EXPONENT", math_node("MULTIPLY", d2, vb=-14.0))      # broad band
core = math_node("EXPONENT", math_node("MULTIPLY", d2, vb=-90.0))      # bright core lane

def stars(scale, rad, threshold, gain, mask=None, seed=0.0):
    radius = rad * scale  # Voronoi distance is in cell units
    vor = node("ShaderNodeTexVoronoi", feature="F1", distance="EUCLIDEAN")
    vor.voronoi_dimensions = "3D"
    vor.inputs["Scale"].default_value = scale
    vor.inputs["Randomness"].default_value = 1.0
    off = node("ShaderNodeVectorMath", operation="ADD")
    L.new(coord, off.inputs[0])
    off.inputs[1].default_value = (seed, seed * 1.7, seed * 0.3)
    L.new(off.outputs[0], vor.inputs["Vector"])
    dist = vor.outputs["Distance"]
    col = vor.outputs["Color"]
    sep = node("ShaderNodeSeparateColor")
    L.new(col, sep.inputs[0])
    r = sep.outputs[0]   # brightness lottery
    g = sep.outputs[1]   # colour temperature
    # only the luckiest cells hold a visible star
    lucky = math_node("MAXIMUM", math_node("SUBTRACT", r, vb=threshold), vb=0.0)
    lucky = math_node("DIVIDE", lucky, vb=1.0 - threshold)
    lucky = math_node("POWER", lucky, vb=3.0)
    # gaussian point
    pt = math_node("EXPONENT", math_node("MULTIPLY", math_node("MULTIPLY", dist, dist), vb=-1.0 / (radius * radius)))
    v = math_node("MULTIPLY", math_node("MULTIPLY", pt, lucky), vb=gain)
    if mask is not None:
        v = math_node("MULTIPLY", v, mask)
    ramp = node("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.62, 0.74, 1.0, 1)
    ramp.color_ramp.elements[1].color = (1.0, 0.78, 0.52, 1)
    e = ramp.color_ramp.elements.new(0.45); e.color = (1.0, 0.97, 0.92, 1)
    L.new(g, ramp.inputs[0])
    mul = node("ShaderNodeVectorMath", operation="SCALE")
    L.new(ramp.outputs[0], mul.inputs[0])
    L.new(v, mul.inputs["Scale"])
    return mul.outputs[0]

# sparse bright, medium, dense faint (dense faint follows the band)
bandish = math_node("ADD", math_node("MULTIPLY", band, vb=1.6), vb=0.15)
s1 = stars(38.0, 0.0016, 0.80, 14.0, seed=0.0)
s2 = stars(95.0, 0.0010, 0.72, 3.2, seed=3.1)
s3 = stars(260.0, 0.0008, 0.62, 1.1, mask=bandish, seed=7.7)

def add(a, b):
    n = node("ShaderNodeVectorMath", operation="ADD")
    L.new(a, n.inputs[0]); L.new(b, n.inputs[1])
    return n.outputs[0]

acc = add(add(s1, s2), s3)

# nebula: dim, deep blue / muted violet / warm dust, near the band
noise = node("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 2.2
noise.inputs["Detail"].default_value = 9.0
noise.inputs["Roughness"].default_value = 0.62
L.new(coord, noise.inputs["Vector"])
noise2 = node("ShaderNodeTexNoise")
noise2.inputs["Scale"].default_value = 0.9
noise2.inputs["Detail"].default_value = 3.0
L.new(coord, noise2.inputs["Vector"])
dens = math_node("MULTIPLY", noise.outputs["Fac"], noise2.outputs["Fac"])
dens = math_node("MAXIMUM", math_node("SUBTRACT", dens, vb=0.22), vb=0.0)
dens = math_node("MULTIPLY", dens, math_node("ADD", math_node("MULTIPLY", band, vb=1.4), vb=0.12))
neb_ramp = node("ShaderNodeValToRGB")
neb_ramp.color_ramp.elements[0].color = (0.010, 0.014, 0.035, 1)
neb_ramp.color_ramp.elements[1].color = (0.30, 0.20, 0.13, 1)
e = neb_ramp.color_ramp.elements.new(0.45); e.color = (0.07, 0.07, 0.17, 1)
e = neb_ramp.color_ramp.elements.new(0.7); e.color = (0.16, 0.10, 0.17, 1)
L.new(noise2.outputs["Fac"], neb_ramp.inputs[0])
neb = node("ShaderNodeVectorMath", operation="SCALE")
L.new(neb_ramp.outputs[0], neb.inputs[0])
L.new(math_node("MULTIPLY", dens, vb=0.35), neb.inputs["Scale"])
acc = add(acc, neb.outputs[0])

# unresolved star glow along the band core (warm, very dim)
glow = node("ShaderNodeVectorMath", operation="SCALE")
glow.inputs[0].default_value = (0.055, 0.045, 0.038)
L.new(math_node("ADD", math_node("MULTIPLY", core, vb=0.9), math_node("MULTIPLY", band, vb=0.25)), glow.inputs["Scale"])
# break the glow with dust lanes
lane = node("ShaderNodeTexNoise"); lane.inputs["Scale"].default_value = 5.0; lane.inputs["Detail"].default_value = 6.0
L.new(coord, lane.inputs["Vector"])
lanem = math_node("POWER", lane.outputs["Fac"], vb=2.2)
glow2 = node("ShaderNodeVectorMath", operation="SCALE")
L.new(glow.outputs[0], glow2.inputs[0]); L.new(math_node("MULTIPLY", lanem, vb=2.0), glow2.inputs["Scale"])
acc = add(acc, glow2.outputs[0])

bg = node("ShaderNodeBackground")
L.new(acc, bg.inputs["Color"])
bg.inputs["Strength"].default_value = 1.0
L.new(bg.outputs[0], out.inputs["Surface"])

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
