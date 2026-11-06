"""World 01 Origins: hill rocks from two Poly Haven scans (CC0), decimated for the browser.

Run:  ORIGINS_DL=/root/work/origins/dl OUT=/root/bsah/public/worlds/origins ~/bpyenv/bin/python rocks.py
Source (see SOURCES.md): boulder_01 (1k glTF). (rock_face_02 was tried and dropped: upright it read as a slab.) Each is decimated to about 2.5-3.5k triangles, re-centred on
its base, scaled to 1 m across (the browser scales each placement), and exported with its own 1k diffuse / normal /
ARM textures as WebP. Writes origins-rocks.glb with Rock_Boulder (~3.3k triangles) and Rock_Boulder_Lo (~700) sharing one material.
"""
import bpy, os
from mathutils import Vector

DL = os.environ.get("ORIGINS_DL", "/root/work/origins/dl")
OUT = os.environ.get("OUT", "/root/bsah/public/worlds/origins")
bpy.ops.wm.read_factory_settings(use_empty=True)

keep = []
for src, name, target in [("boulder_01/boulder_01_1k.gltf", "Rock_Boulder", 3200)]:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(DL, src))
    new = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in new:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new[0]
    if len(new) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    # weld the scan's split vertices first, or the collapse stalls on the seams
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
    # collapse in passes (one pass stalls on UV seams of the dense scans)
    for _ in range(4):
        cur = sum(len(p.vertices) - 2 for p in ob.data.polygons)
        if cur <= target * 1.15:
            break
        mod = ob.modifiers.new("dec", "DECIMATE")
        mod.ratio = max(0.05, target / cur)
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier="dec")
    # base at z = 0, centred, 1 m across
    xs = [v.co for v in ob.data.vertices]
    mn = Vector((min(v.x for v in xs), min(v.y for v in xs), min(v.z for v in xs)))
    mx = Vector((max(v.x for v in xs), max(v.y for v in xs), max(v.z for v in xs)))
    c = (mn + mx) / 2
    size = max(mx.x - mn.x, mx.y - mn.y)
    for v in ob.data.vertices:
        v.co = Vector(((v.co.x - c.x) / size, (v.co.y - c.y) / size, (v.co.z - mn.z) / size))
    ob.name = name
    ob.data.name = name
    ob.parent = None
    keep.append(ob)
    print(name, "tris", tris, "->", sum(len(p.vertices) - 2 for p in ob.data.polygons), "height/width", (mx.z - mn.z) / size)

# a light copy for the small stones (same UVs and material, ~700 triangles)
src_ob = keep[0]
lo = src_ob.copy()
lo.data = src_ob.data.copy()
lo.name = lo.data.name = "Rock_Boulder_Lo"
bpy.context.scene.collection.objects.link(lo)
bpy.ops.object.select_all(action="DESELECT")
lo.select_set(True)
bpy.context.view_layer.objects.active = lo
cur = sum(len(p.vertices) - 2 for p in lo.data.polygons)
mod = lo.modifiers.new("dec", "DECIMATE")
mod.ratio = 700 / cur
mod.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier="dec")
print("Rock_Boulder_Lo tris", sum(len(p.vertices) - 2 for p in lo.data.polygons))
keep.append(lo)
for o in list(bpy.data.objects):
    if o not in keep:
        bpy.data.objects.remove(o)
bpy.ops.object.select_all(action="SELECT")
path = os.path.join(OUT, "origins-rocks.glb")
bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_draco_mesh_compression_enable=True, export_image_format="WEBP",
                          export_image_quality=82, export_apply=True)
print(path, os.path.getsize(path))
