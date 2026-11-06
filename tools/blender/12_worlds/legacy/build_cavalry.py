"""
World 03 (Legacy): the cavalry horse (a light copy of the academy's rigged Marwari) with two historical riders, and the
scrub and rock props scattered on the plain.

Run:
    cd / && LEGACY_OUT=/root/bsah/public/worlds/legacy ~/bpyenv/bin/python /root/bsah/tools/blender/12_worlds/legacy/build_cavalry.py

cavalry.glb
  Cavalry_Horse   the Marwari coat + mane/tail, decimated to ~6k triangles, untextured (the coat colour is set per horse at runtime)
  Rider_A/Rider_B two riders skinned 100 % to the Spine_Lumbar bone, so they ride the gallop: turban, angarkha (a long
                  coat flaring over the saddle), cummerbund sash, trousers, riding boots, a round dhal shield on the back
                  and a bhala (lance) held upright. Colours are vertex colours. No flags, banners or standards.
  clips           Gallop_R, Canter_R, Trot only.
props.glb
  Prop_Rock       a weathered sandstone boulder (vertex coloured)
  Prop_Shrub      a desert shrub clump (khejri/ker-like scrub, vertex coloured)
"""
import math
import os

import bpy  # noqa: I001
import bmesh
import numpy as np
from mathutils import Matrix, Vector

OUT = os.environ.get("LEGACY_OUT", "/root/bsah/public/worlds/legacy")
SRC = "/root/bsah/public/models/marwari-hero-mobile-refined.glb"
KEEP_ACTIONS = {"Gallop_R", "Canter_R", "Trot"}


def vc_material(name, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    return m


class Paint:
    """bmesh primitives with a vertex colour per part; coordinates are Blender's (horse faces -Y, Z up)."""

    def __init__(self):
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.color.new("Col")

    def _colour(self, faces, c):
        for f in faces:
            for l in f.loops:
                l[self.col] = (*c, 1.0)

    def capsule(self, a, b, r0, r1, c, seg=8):
        a, b = Vector(a), Vector(b)
        axis = b - a
        L = axis.length
        q = axis.normalized().to_track_quat("Z", "Y")
        ret = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=L)
        M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        bmesh.ops.transform(self.bm, matrix=M, verts=ret["verts"])
        faces = {f for v in ret["verts"] for f in v.link_faces}
        self._colour(faces, c)

    def ellipsoid(self, centre, radii, c, seg=10, rings=6):
        ret = bmesh.ops.create_uvsphere(self.bm, u_segments=seg, v_segments=rings, radius=1.0)
        M = Matrix.Translation(centre) @ Matrix.Diagonal((*radii, 1.0))
        bmesh.ops.transform(self.bm, matrix=M, verts=ret["verts"])
        faces = {f for v in ret["verts"] for f in v.link_faces}
        self._colour(faces, c)

    def disc(self, centre, normal, r, thick, c, seg=14):
        n = Vector(normal).normalized()
        q = n.to_track_quat("Z", "Y")
        ret = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r * 0.85, depth=thick)
        M = Matrix.Translation(centre) @ q.to_matrix().to_4x4()
        bmesh.ops.transform(self.bm, matrix=M, verts=ret["verts"])
        self._colour({f for v in ret["verts"] for f in v.link_faces}, c)

    def to_object(self, name, mat):
        me = bpy.data.meshes.new(name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


SKIN = (0.36, 0.21, 0.13)
BOOT = (0.08, 0.05, 0.035)
WOOD = (0.32, 0.2, 0.1)
STEEL = (0.55, 0.55, 0.56)
LEATHER = (0.16, 0.09, 0.05)
BRASS = (0.62, 0.45, 0.18)


def rider(variant):
    """A seated cavalryman. Seat at Blender (0, -0.02, 1.47); he leans a little forward into the gallop."""
    coat, turban, sash, trouser = {
        "A": ((0.82, 0.76, 0.62), (0.85, 0.42, 0.08), (0.45, 0.08, 0.06), (0.86, 0.82, 0.72)),
        "B": ((0.62, 0.38, 0.16), (0.7, 0.1, 0.06), (0.9, 0.7, 0.3), (0.82, 0.78, 0.68)),
    }[variant]
    P = Paint()
    lean = Vector((0, -0.12, 0))  # forward lean of the upper body (horse faces -Y)
    hip = Vector((0, 0.0, 1.5))
    chest = hip + Vector((0, 0, 0.42)) + lean
    neck = hip + Vector((0, 0, 0.62)) + lean * 1.3
    head = hip + Vector((0, 0, 0.74)) + lean * 1.45
    # angarkha: torso and a skirt that flares over the saddle and the horse's sides
    P.capsule(hip, chest, 0.17, 0.19, coat, seg=10)
    P.capsule(hip + Vector((0, 0.02, 0.06)), hip + Vector((0, 0.06, -0.32)), 0.2, 0.36, coat, seg=12)
    P.capsule(hip + Vector((0, 0, 0.1)), hip + Vector((0, 0, 0.2)) + lean * 0.3, 0.195, 0.195, sash, seg=10)  # cummerbund
    P.capsule(chest, neck, 0.19, 0.08, coat, seg=10)
    P.ellipsoid(head, (0.095, 0.11, 0.115), SKIN)
    P.ellipsoid(head + Vector((0, -0.04, -0.07)), (0.08, 0.06, 0.05), (0.08, 0.06, 0.05))  # beard
    P.ellipsoid(head + Vector((0, 0.01, 0.07)), (0.15, 0.16, 0.1), turban, seg=12)  # safa / pagri
    P.ellipsoid(head + Vector((0, 0.06, 0.11)), (0.11, 0.12, 0.08), turban, seg=10)
    # legs astride the horse: thighs forward and down along the barrel, shins down, boots in the stirrups
    for s in (-1, 1):
        k = hip + Vector((s * 0.27, -0.3, -0.24))
        a = k + Vector((s * 0.03, 0.06, -0.42))
        P.capsule(hip + Vector((s * 0.13, 0.0, 0.02)), k, 0.09, 0.075, trouser)
        P.capsule(k, a, 0.07, 0.055, trouser)
        P.capsule(a + Vector((0, 0.0, 0.1)), a + Vector((0, -0.16, -0.04)), 0.055, 0.05, BOOT)
    # arms: the left hand at the reins, the right holds the lance upright
    sh_l = chest + Vector((0.2, 0, 0.08))
    sh_r = chest + Vector((-0.2, 0, 0.08))
    el_l = sh_l + Vector((0.04, -0.22, -0.22))
    hand_l = el_l + Vector((-0.1, -0.24, 0.0))
    P.capsule(sh_l, el_l, 0.06, 0.05, coat)
    P.capsule(el_l, hand_l, 0.05, 0.04, coat)
    P.ellipsoid(hand_l, (0.04, 0.05, 0.035), SKIN)
    el_r = sh_r + Vector((-0.12, -0.12, -0.24))
    hand_r = el_r + Vector((-0.02, -0.14, 0.18))
    P.capsule(sh_r, el_r, 0.06, 0.05, coat)
    P.capsule(el_r, hand_r, 0.05, 0.04, coat)
    P.ellipsoid(hand_r, (0.04, 0.035, 0.05), SKIN)
    # bhala: a long bamboo lance with a steel head, its butt near the stirrup, leaning slightly forward
    butt = hand_r + Vector((0.0, 0.32, -0.95))
    tip = hand_r + Vector((0.0, -0.55, 1.75))
    P.capsule(butt, tip, 0.016, 0.014, WOOD, seg=6)
    d = (tip - butt).normalized()
    P.capsule(tip, tip + d * 0.32, 0.03, 0.002, STEEL, seg=6)
    # dhal: a round leather shield with brass bosses slung on the back
    back = chest + Vector((0.02, 0.2, -0.06))
    P.disc(back, (0.1, 1, 0.15), 0.24, 0.05, LEATHER)
    for a in range(4):
        ang = a * math.pi / 2 + 0.6
        P.ellipsoid(back + Vector((0.09 * math.cos(ang), 0.035, 0.09 * math.sin(ang))), (0.022, 0.015, 0.022), BRASS, seg=6, rings=4)
    # a talwar at the left hip (scabbard)
    P.capsule(hip + Vector((0.24, 0.05, 0.05)), hip + Vector((0.3, 0.55, -0.35)), 0.025, 0.02, LEATHER, seg=6)
    return P


def build_cavalry():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    for o in list(bpy.data.objects):
        if o.type == "MESH" and o.name in ("Icosphere", "Marwari_Eyes"):
            bpy.data.objects.remove(o, do_unlink=True)
    coat = bpy.data.objects["Marwari_Low"]
    hair = bpy.data.objects["Marwari_Hair"]
    horse_mat = bpy.data.materials.new("Cavalry_Coat")
    horse_mat.use_nodes = True
    horse_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.04, 0.035, 1)
    horse_mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.55
    for ob, ratio in ((coat, 0.13), (hair, 0.6)):
        bpy.context.view_layer.objects.active = ob
        ob.data.materials.clear()
        ob.data.materials.append(horse_mat)
        while ob.data.uv_layers:
            ob.data.uv_layers.remove(ob.data.uv_layers[0])
        for a in list(ob.data.attributes):
            if a.name.startswith("EarMask") or a.domain == "CORNER" and a.data_type == "FLOAT2":
                try:
                    ob.data.attributes.remove(a)
                except Exception:
                    pass
        mod = ob.modifiers.new("dec", "DECIMATE")
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        # the decimate must run before the armature
        while ob.modifiers[0].name != "dec":
            bpy.ops.object.modifier_move_up(modifier="dec")
        bpy.ops.object.modifier_apply(modifier="dec")
    # join mane/tail into the coat: one skinned mesh, one draw call
    bpy.ops.object.select_all(action="DESELECT")
    hair.select_set(True)
    coat.select_set(True)
    bpy.context.view_layer.objects.active = coat
    bpy.ops.object.join()
    coat.name = "Cavalry_Horse"
    # riders, skinned to the lumbar spine
    rmat = vc_material("Rider", 0.85)
    for v in ("A", "B"):
        ob = rider(v).to_object(f"Rider_{v}", rmat)
        ob.parent = arm
        vg = ob.vertex_groups.new(name="Spine_Lumbar")
        vg.add(list(range(len(ob.data.vertices))), 1.0, "REPLACE")
        mod = ob.modifiers.new("Armature", "ARMATURE")
        mod.object = arm
    for a in list(bpy.data.actions):
        if a.name not in KEEP_ACTIONS:
            bpy.data.actions.remove(a)
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            ob.data.calc_loop_triangles()
            print(ob.name, "triangles", len(ob.data.loop_triangles))
    path = os.path.join(OUT, "cavalry.glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path, use_selection=True, export_format="GLB",
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=8, export_draco_color_quantization=8,
        export_vertex_color="ACTIVE", export_animations=True, export_animation_mode="ACTIONS", export_skins=True,
        export_texcoords=False, export_apply=False, export_yup=True,
    )
    print("cavalry.glb", os.path.getsize(path))


def build_props():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rng = np.random.default_rng(5)
    # a boulder: an icosphere pushed by layered noise, flattened, sand-coloured with darker crevices
    P = Paint()
    ret = bmesh.ops.create_icosphere(P.bm, subdivisions=2, radius=1.0)
    from mathutils import noise
    for v in ret["verts"]:
        n = noise.fractal(v.co * 1.4 + Vector((3, 1, 2)), 0.6, 2.2, 4)
        v.co *= 1.0 + 0.35 * n
        v.co.z *= 0.62
        v.co.z = max(v.co.z, -0.35)
    for f in P.bm.faces:
        for l in f.loops:
            h = (l.vert.co.z + 0.4) / 1.1
            k = 0.62 + 0.38 * max(0.0, min(1.0, h)) * (0.85 + 0.15 * noise.noise(l.vert.co * 4))
            l[P.col] = (0.68 * k, 0.5 * k, 0.36 * k, 1.0)
    rock = P.to_object("Prop_Rock", vc_material("Prop_Rock_Mat", 0.95))
    # a shrub: a few squashed lobes, olive and dust-grey
    P = Paint()
    for i in range(5):
        c = Vector((rng.normal(0, 0.45), rng.normal(0, 0.45), 0.25 + abs(rng.normal(0, 0.18))))
        r = rng.uniform(0.38, 0.62)
        g = rng.uniform(0.8, 1.1)
        P.ellipsoid(c, (r, r, r * 0.7), (0.24 * g, 0.26 * g, 0.14 * g), seg=7, rings=4)
    for v in P.bm.verts:
        v.co += Vector(noise.noise_vector(v.co * 3.0)) * 0.08
    for f in P.bm.faces:
        for l in f.loops:
            k = 0.55 + 0.45 * max(0.0, min(1.0, l.vert.co.z / 0.8))
            r, g, b, _ = l[P.col]
            l[P.col] = (r * k, g * k, b * k, 1.0)
    shrub = P.to_object("Prop_Shrub", vc_material("Prop_Shrub_Mat", 0.9))
    path = os.path.join(OUT, "props.glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format="GLB", export_draco_mesh_compression_enable=True,
                              export_vertex_color="ACTIVE", export_texcoords=False, export_yup=True)
    for ob in (rock, shrub):
        ob.data.calc_loop_triangles()
        print(ob.name, len(ob.data.loop_triangles))
    print("props.glb", os.path.getsize(path))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    build_cavalry()
    build_props()
