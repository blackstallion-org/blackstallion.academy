"""World 01 Origins: the BSAH academy on the valley floor, modelled procedurally in Blender.

Run:  OUT=/root/bsah/public/worlds/origins ~/bpyenv/bin/python academy.py
Writes origins-academy.glb (Draco). Origin = the centre of the main building; the browser places it at the academy site in
origins-layout.json. Built in three.js axes (x, y up, z) and converted at the end (Blender Z-up -> glTF Y-up).

The building follows the reference: a low, layered disc of white concrete and glass (two stepped tiers and a glazed central drum,
deep white eaves, bronze fins), warm light inside; around it four long stable blocks, a sand arena with a white post-and-rail
fence, and a ring of rail fence round the paddock track. No signage and no flags.
"""
import bpy, bmesh, math, os

OUT = os.environ.get("OUT", "/root/bsah/public/worlds/origins")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, color, rough=0.5, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


WHITE = mat("Academy_White", srgb("#d8d2c6"), 0.6)
GLASS = mat("Academy_Glass", srgb("#1b2329"), 0.06, 0.0)
INTERIOR = mat("Academy_Interior", srgb("#2a1c12"), 0.9, 0.0, srgb("#ffb871"), 2.2)
BRONZE = mat("Academy_Bronze", srgb("#8a5c3c"), 0.38, 0.85)
ROOF = mat("Academy_Roof", srgb("#5d5a55"), 0.7)
STABLE = mat("Academy_Stable", srgb("#e2d8c8"), 0.75)
TIMBER = mat("Academy_Timber", srgb("#6a4a32"), 0.7)
FENCE = mat("Academy_Fence", srgb("#f1ede6"), 0.6)


def link(ob, m):
    ob.data.materials.append(m)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def ring(name, r_out, r_in, y0, y1, m, segs=128):
    """an annulus prism between heights y0..y1 (three.js y), r_in = 0 for a solid disc"""
    bm = bmesh.new()
    if r_in <= 0:
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r_out, radius2=r_out, depth=y1 - y0)
        bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, (y0 + y1) / 2))
    else:
        outer = bmesh.ops.create_circle(bm, cap_ends=False, segments=segs, radius=r_out)["verts"]
        inner = bmesh.ops.create_circle(bm, cap_ends=False, segments=segs, radius=r_in)["verts"]
        for v in bm.verts:
            v.co.z = y0
        for i in range(segs):
            bm.faces.new((outer[i], outer[(i + 1) % segs], inner[(i + 1) % segs], inner[i]))
        ext = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        for v in [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]:
            v.co.z = y1
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = False
    return link(bpy.data.objects.new(name, me), m)


def box(name, sx, sy, sz, x, y, z, m, rot=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sz
        v.co.z *= sy
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(rot, 3, "Z"))
    bmesh.ops.translate(bm, verts=bm.verts, vec=(x, -z, y + sy / 2))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me), m)


# ------------------------------------------------------------------ main building: stepped discs
ring("Podium", 64, 0, 0.0, 0.9, WHITE)                    # plinth
ring("Tier1_Interior", 52.6, 0, 0.9, 5.2, INTERIOR, 96)   # lit interior behind the glass
ring("Tier1_Glass", 54, 53.2, 0.9, 5.2, GLASS, 128)
ring("Tier1_Eave", 61, 0, 5.2, 6.4, WHITE, 160)           # deep white eave
ring("Tier2_Interior", 40.6, 0, 6.4, 10.0, INTERIOR, 96)
ring("Tier2_Glass", 42, 41.2, 6.4, 10.0, GLASS, 128)
ring("Tier2_Eave", 47, 0, 10.0, 11.0, WHITE, 160)
ring("Roof_Garden", 45, 0, 11.0, 11.15, ROOF, 96)
ring("Drum_Interior", 13.4, 0, 11.0, 17.5, INTERIOR, 64)
ring("Drum_Glass", 14.2, 13.6, 11.0, 17.5, GLASS, 96)
ring("Drum_Cap", 17.5, 0, 17.5, 18.3, WHITE, 96)
ring("Drum_Ring", 21, 19.6, 18.6, 19.0, BRONZE, 128)      # a thin bronze halo ring above the drum

# bronze fins round both glass tiers
bm = bmesh.new()
for (r, y0, y1, n) in [(54.6, 0.9, 5.2, 180), (42.6, 6.4, 10.0, 140)]:
    for i in range(n):
        a = i / n * 2 * math.pi
        geom = bmesh.ops.create_cube(bm, size=1)["verts"]
        for v in geom:
            v.co.x *= 0.12
            v.co.y *= 0.9
            v.co.z *= (y1 - y0)
        bmesh.ops.rotate(bm, verts=geom, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(-a, 3, "Z"))
        bmesh.ops.translate(bm, verts=geom, vec=(r * math.cos(a), r * math.sin(a), (y0 + y1) / 2))
me = bpy.data.meshes.new("Fins")
bm.to_mesh(me)
bm.free()
link(bpy.data.objects.new("Fins", me), BRONZE)

# ------------------------------------------------------------------ stables: four long blocks radiating on the far side
for k, ang in enumerate([-0.55, -0.15, 0.25, 0.65]):
    a = ang + math.pi * 0.5  # toward +z (away from the hill)
    cx, cz = math.cos(a) * 110, math.sin(a) * 110
    rot = -a
    box(f"Stable_{k}", 42, 4.0, 11, cx, 0, cz, STABLE, rot)
    box(f"StableRoof_{k}", 44, 0.6, 13, cx, 4.0, cz, ROOF, rot)
    box(f"StableBand_{k}", 42.2, 1.0, 11.2, cx, 2.2, cz, TIMBER, rot)

# ------------------------------------------------------------------ fences: arena oval and the paddock track ring
def rail_ellipse(name, cx, cz, ax, az, n_posts, heights, post_h):
    bm = bmesh.new()
    pts = []
    N = max(64, n_posts * 2)
    for i in range(N):
        t = i / N * 2 * math.pi
        pts.append((cx + ax * math.cos(t), cz + az * math.sin(t)))
    for h in heights:  # rails as thin square tubes
        for i in range(N):
            x0, z0 = pts[i]
            x1, z1 = pts[(i + 1) % N]
            dx, dz = x1 - x0, z1 - z0
            L = math.hypot(dx, dz)
            g = bmesh.ops.create_cube(bm, size=1)["verts"]
            for v in g:
                v.co.x *= L + 0.05
                v.co.y *= 0.08
                v.co.z *= 0.12
            bmesh.ops.rotate(bm, verts=g, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(-math.atan2(dz, dx), 3, "Z"))
            bmesh.ops.translate(bm, verts=g, vec=((x0 + x1) / 2, -(z0 + z1) / 2, h))
    for i in range(n_posts):
        t = i / n_posts * 2 * math.pi
        x, z = cx + ax * math.cos(t), cz + az * math.sin(t)
        g = bmesh.ops.create_cube(bm, size=1)["verts"]
        for v in g:
            v.co.x *= 0.14
            v.co.y *= 0.14
            v.co.z *= post_h
        bmesh.ops.translate(bm, verts=g, vec=(x, -z, post_h / 2))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    link(bpy.data.objects.new(name, me), FENCE)


rail_ellipse("ArenaFence", 95, -150, 48, 24, 90, [0.55, 1.2], 1.35)
rail_ellipse("TrackFence", 0, 0, 133, 133, 160, [0.6, 1.25], 1.4)

# ------------------------------------------------------------------ export (Draco)
bpy.ops.object.select_all(action="SELECT")
path = os.path.join(OUT, "origins-academy.glb")
bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_draco_mesh_compression_enable=True, export_texcoords=False, export_apply=True)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
print("academy", path, os.path.getsize(path), "tris", tris)
