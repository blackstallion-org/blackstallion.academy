"""
World 03 (Legacy): the hill fort and the terrain height map.

Run (Blender 5 as a Python module):
    cd / && LEGACY_OUT=/root/bsah/public/worlds/legacy ~/bpyenv/bin/python /root/bsah/tools/blender/12_worlds/legacy/build_fort.py

Writes
  terrain-height.png   512x512 RGBA: R,G = height (16 bit, big-endian, metres*HSCALE + HOFF), B = rock mask, A = 255
  terrain-height.json  extent and scale of the map
  fort.glb             the fort (Draco): stone, plaster and shadow materials, vertex colours for grime and occlusion

The fort is procedural and generic Rajasthan hill-fort architecture (battered curtain walls that follow the ridge, round
bastions, merlons, a gate, a stepped palace with jharokha balconies, chhatri pavilions). It is not a model of any real fort.
"""
import json
import math
import os
import sys

import bpy  # noqa: I001  (bpy first: it makes bmesh importable)
import bmesh
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import legacy_field as F  # noqa: E402

OUT = os.environ.get("LEGACY_OUT", "/root/bsah/public/worlds/legacy")
os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ height map
EXT = {"x0": -2600.0, "x1": 2600.0, "z0": -2300.0, "z1": 2900.0, "n": 512}
HOFF, HSCALE = 20.0, 100.0  # stored = (h + HOFF) * HSCALE  (range -20 .. 635 m, 1 cm steps)


def heightmap():
    n = EXT["n"]
    xs = np.linspace(EXT["x0"], EXT["x1"], n)
    zs = np.linspace(EXT["z0"], EXT["z1"], n)
    X, Z = np.meshgrid(xs, zs)  # row = z, col = x
    H = F.height(X, Z)
    # slope from finite differences
    dx = (EXT["x1"] - EXT["x0"]) / (n - 1)
    gz, gx = np.gradient(H, dx)
    slope = np.hypot(gx, gz)
    rock = F.rockiness(X, Z, H, slope)
    q = np.clip(np.round((H + HOFF) * HSCALE), 0, 65535).astype(np.uint32)
    img = np.zeros((n, n, 4), dtype=np.float32)
    img[..., 0] = (q >> 8) / 255.0
    img[..., 1] = (q & 255) / 255.0
    img[..., 2] = np.round(rock * 255) / 255.0
    img[..., 3] = 1.0
    # Blender images are bottom-up; row 0 of our array is z0, we want the PNG's first row to be z0 too
    im = bpy.data.images.new("hm", n, n, alpha=True, float_buffer=False)
    im.colorspace_settings.name = "Non-Color"
    im.pixels.foreach_set(img[::-1].reshape(-1))
    im.filepath_raw = os.path.join(OUT, "terrain-height.png")
    im.file_format = "PNG"
    im.save()
    with open(os.path.join(OUT, "terrain-height.json"), "w") as f:
        json.dump({**EXT, "hoff": HOFF, "hscale": HSCALE, "rows": "first PNG row is z0 (row index grows with z), column grows with x"}, f, indent=1)
    print("heightmap", H.min(), H.max())


# ------------------------------------------------------------------ mesh helpers (three.js coordinates in, Blender out)
class Builder:
    def __init__(self):
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.color.new("Col")
        self.mat_index = 0

    def v(self, p):
        x, y, z = p
        return self.bm.verts.new(F.bl(x, y, z))

    def face(self, vs, mat=0):
        try:
            f = self.bm.faces.new(vs)
            f.material_index = mat
            return f
        except ValueError:
            return None

    def box(self, c, size, rot_y=0.0, mat=0, taper=0.0):
        """Axis box centred at c (three coords), size (w, h, d), rotated about Y. taper shrinks the top (batter)."""
        cx, cy, cz = c
        w, h, d = size
        ca, sa = math.cos(rot_y), math.sin(rot_y)
        pts = []
        for yy in (-0.5, 0.5):
            k = 1.0 - (taper if yy > 0 else 0.0)
            for xx, zz in ((-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)):
                lx, lz = xx * w * k, zz * d * k
                pts.append((cx + lx * ca + lz * sa, cy + yy * h, cz - lx * sa + lz * ca))
        vs = [self.v(p) for p in pts]
        b, t = vs[:4], vs[4:]
        self.face([b[3], b[2], b[1], b[0]], mat)
        self.face([t[0], t[1], t[2], t[3]], mat)
        for i in range(4):
            j = (i + 1) % 4
            self.face([b[i], b[j], t[j], t[i]], mat)

    def cylinder(self, c, r0, r1, h, seg=20, mat=0, cap=True):
        cx, cy, cz = c
        bot = [self.v((cx + r0 * math.cos(a), cy, cz + r0 * math.sin(a))) for a in np.linspace(0, 2 * math.pi, seg, endpoint=False)]
        top = [self.v((cx + r1 * math.cos(a), cy + h, cz + r1 * math.sin(a))) for a in np.linspace(0, 2 * math.pi, seg, endpoint=False)]
        for i in range(seg):
            j = (i + 1) % seg
            self.face([bot[j], bot[i], top[i], top[j]], mat)
        if cap:
            self.face(list(reversed(bot)), mat)
            self.face(top, mat)
        return top

    def dome(self, c, r, h, seg=16, rings=6, mat=1, point=0.25):
        """A Rajput dome: a slightly bulbous, pointed cupola with a finial."""
        cx, cy, cz = c
        rows = []
        for k in range(rings + 1):
            t = k / rings
            ang = t * math.pi / 2
            rr = r * math.cos(ang) * (1.0 + 0.12 * math.sin(t * math.pi))  # a little bulge
            yy = h * math.sin(ang) + point * h * t ** 6
            if k == rings:
                rr = 0.0
            rows.append([self.v((cx + rr * math.cos(a), cy + yy, cz + rr * math.sin(a))) for a in np.linspace(0, 2 * math.pi, seg, endpoint=False)])
        for k in range(rings):
            for i in range(seg):
                j = (i + 1) % seg
                self.face([rows[k][j], rows[k][i], rows[k + 1][i], rows[k + 1][j]], mat)
        # finial
        self.cylinder((cx, cy + h * (1 + point) - 0.05, cz), r * 0.06, r * 0.02, h * 0.35, seg=6, mat=mat)

    def chhatri(self, c, size, mat_stone=0, mat_plaster=1):
        """Four (or six) slender pillars on a plinth carrying a projecting eave and a dome."""
        cx, cy, cz = c
        s = size
        self.box((cx, cy + 0.15 * s, cz), (s * 1.15, 0.3 * s, s * 1.15), mat=mat_stone)
        for px, pz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            self.box((cx + px * s * 0.42, cy + 0.3 * s + 0.55 * s, cz + pz * s * 0.42), (s * 0.09, 1.1 * s, s * 0.09), mat=mat_stone)
        self.box((cx, cy + 1.45 * s, cz), (s * 1.3, 0.12 * s, s * 1.3), mat=mat_plaster, taper=-0.05)
        self.dome((cx, cy + 1.5 * s, cz), s * 0.5, s * 0.55, seg=14, rings=5, mat=mat_plaster)

    def finish(self, name, materials):
        me = bpy.data.meshes.new(name)
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.001)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        for m in materials:
            me.materials.append(m)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


def material(name, color, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    # carry the vertex colour (grime and occlusion) into glTF as COLOR_0
    attr = m.node_tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    mix = m.node_tree.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs[6].default_value = (*color, 1.0)
    m.node_tree.links.new(attr.outputs["Color"], mix.inputs[7])
    m.node_tree.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    return m


# ------------------------------------------------------------------ the fort
def ground(x, z):
    return float(F.height(x, z))


def polyline_resample(pts, step):
    out = [pts[0]]
    for a, b in zip(pts[:-1], pts[1:]):
        L = math.dist(a, b)
        n = max(1, int(L / step))
        for i in range(1, n + 1):
            t = i / n
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def build_fort():
    stone = material("Fort_Stone", (0.72, 0.52, 0.36), 0.88)
    plaster = material("Fort_Plaster", (0.86, 0.74, 0.58), 0.8)
    shadow = material("Fort_Shadow", (0.09, 0.06, 0.045), 1.0)
    B = Builder()
    x0, x1 = F.FORT_X
    xs = np.linspace(x0, x1, 120)
    crest_h = np.array([ground(x, float(F.ridge_z(x))) for x in xs])
    # smooth crest level for the wall walk
    k = np.ones(9) / 9
    crest_s = np.convolve(np.pad(crest_h, 4, mode="edge"), k, mode="valid")

    def crest_at(x):
        return float(np.interp(x, xs, crest_s))

    # front (plain side) and rear curtain walls: offsets from the crest line, a loop closed by the two end walls
    front = [(x, float(F.ridge_z(x)) - 38.0 - 10.0 * math.sin(x / 70.0)) for x in np.linspace(x0, x1, 40)]
    rear = [(x, float(F.ridge_z(x)) + 34.0 + 8.0 * math.sin(x / 55.0 + 2)) for x in np.linspace(x1, x0, 40)]
    loop = front + rear + [front[0]]
    pts = polyline_resample(loop, 4.0)
    WALL_ABOVE = 11.0  # wall walk above the crest
    THICK = 5.0
    merlon_pts = []
    # walls: segments between consecutive points; bottom buried 12 m below the local ground, battered 15 %
    for (ax, az), (bx, bz) in zip(pts[:-1], pts[1:]):
        mx, mz = (ax + bx) / 2, (az + bz) / 2
        L = math.hypot(bx - ax, bz - az)
        rot = math.atan2(bx - ax, bz - az) + math.pi / 2
        g = min(ground(ax, az), ground(bx, bz), ground(mx, mz))
        top = crest_at(mx) + WALL_ABOVE
        base = g - 12.0
        h = top - base
        # batter: wide base, narrower top (taper relative to the thickness, not the length)
        B.box((mx, base + h / 2, mz), (L + 0.6, h, THICK + 0.18 * h), rot_y=rot, mat=0, taper=0.0)
        merlon_pts.append((mx, top, mz, rot, L))
    # merlons along the wall walk (outer edge)
    for mx, top, mz, rot, L in merlon_pts:
        n = max(1, int(L / 2.4))
        for i in range(n):
            t = (i + 0.5) / n - 0.5
            ca, sa = math.cos(rot), math.sin(rot)
            # along the wall direction is the box's local X
            px = mx + t * L * ca
            pz = mz - t * L * sa
            B.box((px, top + 0.9, pz), (1.25, 1.8, 0.8), rot_y=rot, mat=0, taper=0.12)
    # round bastions every ~55 m along the front wall, a few on the rear
    def bastion(x, z, r, above):
        g = ground(x, z)
        top_y = crest_at(x) + WALL_ABOVE + above
        base = g - 12.0
        h = top_y - base
        rim = B.cylinder((x, base, z), r * 1.22, r, h, seg=28, mat=0)
        # a crown of merlons
        for a in np.linspace(0, 2 * math.pi, int(2 * math.pi * r / 2.5), endpoint=False):
            B.box((x + (r - 0.4) * math.cos(a), top_y + 0.9, z + (r - 0.4) * math.sin(a)), (1.2, 1.8, 0.8), rot_y=-a + math.pi / 2, mat=0, taper=0.12)
        # loopholes: dark slits in a ring below the top
        for a in np.linspace(0.2, 2 * math.pi + 0.2, 10, endpoint=False):
            rr = r * 1.005 + 0.02
            B.box((x + rr * math.cos(a), top_y - 4.0, z + rr * math.sin(a)), (0.5, 1.6, 0.25), rot_y=-a + math.pi / 2, mat=2)
        return rim

    front_line = polyline_resample(front, 1.0)
    acc = 0.0
    last = front_line[0]
    bastions = [front_line[0]]
    for p in front_line[1:]:
        acc += math.dist(p, last)
        last = p
        if acc > 56:
            bastions.append(p)
            acc = 0
    bastions.append(front_line[-1])
    for i, (bx, bz) in enumerate(bastions):
        bastion(bx, bz, 8.5 + 2.5 * ((i * 37) % 3) / 2, 2.5)
    for p in rear[::8]:
        bastion(p[0], p[1], 8.0, 2.0)

    # the gate: two tall bastions flanking an arched dark opening, front wall near x = -60
    gx = -60.0
    gz = float(F.ridge_z(gx)) - 38.0 - 10.0 * math.sin(gx / 70.0)
    gt = crest_at(gx) + WALL_ABOVE
    B.box((gx, gt - 9, gz - 3.2), (6.0, 10.0, 0.4), mat=2)
    for s in (-1, 1):
        bastion(gx + s * 9.5, gz - 2.0, 6.5, 5.0)

    # ---------------- the palace: stepped blocks on the high ground at the west (screen right) end
    def storey_windows(cx, cy, cz, w, h, d, rot, rows, mat=2):
        """Dark arched window openings on the face toward the plain (-Z side in local space)."""
        ca, sa = math.cos(rot), math.sin(rot)
        n = max(2, int(w / 4.2))
        for r in range(rows):
            yy = cy - h / 2 + (r + 0.6) * h / rows
            for i in range(n):
                t = (i + 0.5) / n - 0.5
                lx, lz = t * w * 0.92, -d / 2 - 0.12
                B.box((cx + lx * ca + lz * sa, yy, cz - lx * sa + lz * ca), (1.3, h / rows * 0.48, 0.3), rot_y=rot, mat=mat)

    def jharokha(cx, cy, cz, rot, size=2.6):
        """A projecting balcony window: corbelled base, a box with a dark opening, a curved (bangaldar) roof."""
        ca, sa = math.cos(rot), math.sin(rot)
        off = -size * 0.55
        px, pz = cx + off * sa, cz + off * ca
        B.box((px, cy - size * 0.6, pz), (size * 0.9, size * 0.35, size * 0.7), rot_y=rot, mat=0, taper=-0.25)
        B.box((px, cy, pz), (size, size * 0.9, size * 0.8), rot_y=rot, mat=1)
        lx, lz = 0, -size * 0.41
        B.box((px + lz * sa, cy - size * 0.05, pz + lz * ca), (size * 0.62, size * 0.6, 0.12), rot_y=rot, mat=2)
        B.box((px, cy + size * 0.55, pz), (size * 1.25, size * 0.12, size * 1.0), rot_y=rot, mat=1)
        B.dome((px, cy + size * 0.6, pz), size * 0.55, size * 0.38, seg=10, rings=4, mat=1, point=0.1)

    palace = [
        # (x, dz from crest line, width along x, depth, height above crest, storeys)
        (-405, -6, 46, 30, 30, 4),
        (-360, -14, 40, 26, 38, 5),
        (-318, -8, 34, 24, 26, 3),
        (-282, -18, 28, 20, 20, 3),
        (-430, 14, 30, 30, 22, 3),
        (-245, 6, 36, 28, 16, 2),
        (-170, 2, 60, 34, 12, 2),
        (-110, 10, 44, 30, 10, 1),
    ]
    for (px, dz, w, d, hh, rows) in palace:
        pz = float(F.ridge_z(px)) + dz
        base = crest_at(px) - 6
        top = crest_at(px) + hh
        rot = 0.0
        B.box((px, (base + top) / 2, pz), (w, top - base, d), rot_y=rot, mat=0)
        # a parapet and a thin cornice
        B.box((px, top + 0.6, pz), (w + 1.2, 1.2, d + 1.2), mat=1)
        storey_windows(px, (base + 6 + top) / 2 + 3, pz, w, top - base - 9, d, rot, rows)
        # jharokhas along the upper storey
        n = max(1, int(w / 9))
        for i in range(n):
            t = (i + 0.5) / n - 0.5
            jharokha(px + t * w * 0.8, top - 4.5, pz - d / 2, 0.0, size=2.8)
        # chhatris on the roof corners and centre of the taller blocks
        if hh >= 20:
            for cx, cz in ((-0.38, -0.32), (0.38, -0.32), (0.0, 0.1)):
                B.chhatri((px + cx * w, top + 1.2, pz + cz * d), 4.2 if cz < 0 else 6.0)
    # free-standing chhatris and small temples along the wall walk
    for x in (-460, -250, -140, -20, 30):
        B.chhatri((x, crest_at(x) + WALL_ABOVE + 0.1, float(F.ridge_z(x)) - 34.0 - 10.0 * math.sin(x / 70.0) + 4.0), 3.4)
    # a lower palace terrace and the inner houses (small cubic blocks with flat roofs)
    rng = np.random.default_rng(3)
    for _ in range(70):
        x = rng.uniform(x0 + 30, x1 - 20)
        z = float(F.ridge_z(x)) + rng.uniform(-24, 26)
        if -440 < x < -230 and z < float(F.ridge_z(x)) + 14:
            continue
        w, d, h = rng.uniform(7, 16), rng.uniform(7, 14), rng.uniform(5, 11)
        g = crest_at(x)
        B.box((x, g + h / 2 - 2, z), (w, h + 4, d), rot_y=rng.uniform(-0.15, 0.15), mat=1 if rng.random() < 0.35 else 0)

    ob = B.finish("Fort", [stone, plaster, shadow])
    return ob


def box_uv_and_grime(ob, tile=4.0):
    """World-space box projection (texels per metre stay constant on every face) and a vertex-colour grime/occlusion pass."""
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.new("UVMap")
    col = bm.loops.layers.color.get("Col") or bm.loops.layers.color.new("Col")
    rng = np.random.default_rng(11)
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            co = l.vert.co
            if ax == 0:
                u, v = co.y, co.z
            elif ax == 1:
                u, v = co.x, co.z
            else:
                u, v = co.x, co.y
            l[uv].uv = (u / tile, v / tile)
            # three coords: x = co.x, y = co.z, z = -co.y
            x3, y3, z3 = co.x, co.z, -co.y
            above = y3 - ground(x3, z3)
            occl = 0.55 + 0.45 * min(1.0, max(0.0, above / 9.0))
            streak = 0.9 + 0.1 * math.sin(x3 * 0.9 + z3 * 0.3)
            l[col] = (occl * streak, occl * streak, occl * streak, 1.0)
    bm.to_mesh(me)
    bm.free()


def export(objs, path, draco=True):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=draco,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=15,
        export_draco_normal_quantization=8,
        export_draco_texcoord_quantization=12,
        export_draco_color_quantization=8,
        export_vertex_color="ACTIVE",
        export_normals=True,
        export_apply=True,
        export_yup=True,
    )


if __name__ == "__main__":
    bpy.ops.wm.read_factory_settings(use_empty=True)
    heightmap()
    fort = build_fort()
    box_uv_and_grime(fort)
    me = fort.data
    me.calc_loop_triangles()
    print("fort triangles", len(me.loop_triangles))
    export([fort], os.path.join(OUT, "fort.glb"))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "legacy_fort.blend"))
    print("done", os.path.getsize(os.path.join(OUT, "fort.glb")))
