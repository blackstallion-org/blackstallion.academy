"""World 04 Beyond: the observation platform, its terrace city and the gyroscope arcs, modelled procedurally in Blender.

Everything is built from bmesh primitives by code, so the assets are reproducible:
  OUT_DIR=/root/bsah/public/worlds/beyond ~/bpyenv/bin/python tools/blender/12_worlds/beyond/build_station.py

Outputs (Draco GLB, glTF Y-up):
  beyond-platform.glb  the 9 m observation disc (polished floor plates, concentric and radial inlaid light, brass rim, lit underside),
                       a lower terrace arc with a slender tower skyline, ribbed domes and a bridge
  beyond-arcs.glb      three truss arcs (radius 1 m in the file; the runtime scales and tilts each one), named Arc_A/B/C
Material names are the contract with the runtime (components/worlds/scenes/beyond.ts), which replaces them with its own shaders:
  Floor (dark polished stone-metal), Seam (gaps), Trim (brushed brass), Hull (dark gunmetal), Light (emissive gold; on light
  strips UV.x runs 0..1 along the strip so the runtime can send pulses along it), Glass (dark smoked glass on the domes).
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

OUT_DIR = os.environ.get("OUT_DIR", "/root/bsah/public/worlds/beyond")
os.makedirs(OUT_DIR, exist_ok=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    col = {"Floor": (0.02, 0.02, 0.025, 1), "Seam": (0.0, 0.0, 0.0, 1), "Trim": (0.55, 0.40, 0.22, 1), "Hull": (0.05, 0.05, 0.06, 1),
           "Light": (1.0, 0.7, 0.35, 1), "Glass": (0.02, 0.03, 0.04, 1)}[name]
    m.diffuse_color = col
    return m


class Builder:
    """Collects geometry per material into one bmesh with material indices."""

    def __init__(self, name, mats):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.mats = mats

    def face(self, verts, mi, uvs=None):
        vs = [self.bm.verts.new(v) for v in verts]
        f = self.bm.faces.new(vs)
        f.material_index = self.mats.index(mi)
        f.smooth = False
        if uvs:
            for loop, uv in zip(f.loops, uvs):
                loop[self.uv].uv = uv
        return f

    def quad_strip(self, rows, mi, closed=False, uv_u=None, flip=False):
        """rows: list of lists of points (each row is a cross-section ring); builds faces between consecutive rows."""
        n = len(rows)
        m = len(rows[0])
        for i in range(n - 1):
            for j in range(m if closed else m - 1):
                a = rows[i][j]; b = rows[i][(j + 1) % m]; c = rows[i + 1][(j + 1) % m]; d = rows[i + 1][j]
                u0 = uv_u[i] if uv_u else i / (n - 1)
                u1 = uv_u[i + 1] if uv_u else (i + 1) / (n - 1)
                uvs = [(u0, j / m), (u0, (j + 1) / m), (u1, (j + 1) / m), (u1, j / m)]
                if flip:
                    self.face([a, d, c, b], mi, [uvs[0], uvs[3], uvs[2], uvs[1]])
                else:
                    self.face([a, b, c, d], mi, uvs)

    def box(self, center, size, mi, rot=Matrix.Identity(3)):
        cx, cy, cz = center
        sx, sy, sz = (s / 2 for s in size)
        corners = [Vector((x, y, z)) for x in (-sx, sx) for y in (-sy, sy) for z in (-sz, sz)]
        c = [rot @ v + Vector(center) for v in corners]
        idx = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
        for q in idx:
            self.face([c[i] for i in q], mi)

    def finish(self, collection=None):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-5)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(mat(m))
        ob = bpy.data.objects.new(self.name, me)
        (collection or bpy.context.scene.collection).objects.link(ob)
        return ob


def ring_pts(r, z, n, a0=0.0, a1=2 * math.pi):
    return [Vector((r * math.cos(a0 + (a1 - a0) * i / n), r * math.sin(a0 + (a1 - a0) * i / n), z)) for i in range(n + 1)]


def annulus(b, r0, r1, z, n, mi, a0=0.0, a1=2 * math.pi, uv_along=False):
    """flat annulus facing +Z"""
    inner = ring_pts(r0, z, n, a0, a1)
    outer = ring_pts(r1, z, n, a0, a1)
    for i in range(n):
        u0, u1 = i / n, (i + 1) / n
        uvs = [(u0, 0), (u1, 0), (u1, 1), (u0, 1)] if uv_along else None
        b.face([inner[i], inner[i + 1], outer[i + 1], outer[i]], mi, uvs)


def cylinder_wall(b, r0, r1, z0, z1, n, mi, a0=0.0, a1=2 * math.pi, outward=True):
    lo = ring_pts(r0, z0, n, a0, a1)
    hi = ring_pts(r1, z1, n, a0, a1)
    for i in range(n):
        q = [lo[i], lo[i + 1], hi[i + 1], hi[i]]
        b.face(q if outward else list(reversed(q)), mi)


# ------------------------------------------------------------------------------------------------ platform
def build_platform():
    reset()
    b = Builder("Platform", ["Floor", "Seam", "Trim", "Hull", "Light", "Glass"])
    N = 192
    R = 9.0
    light_r = [2.2, 4.0, 6.0, 8.25]
    lw = 0.05
    # floor plates between light rings, split into sectors with seams
    bounds = [0.0] + light_r + [R]
    for k in range(len(bounds) - 1):
        r0 = bounds[k] + (lw / 2 if k > 0 else 0)
        r1 = bounds[k + 1] - (lw / 2 if k + 1 < len(bounds) - 1 else 0)
        if r1 <= r0:
            continue
        sectors = 1 if k == 0 else [8, 16, 24, 32, 40][min(k - 1, 4)]
        if k == 0:
            # centre medallion: a brass inlay ring and a dark disc
            annulus(b, 0.0001, 1.25, 0.0, 64, "Floor")
            annulus(b, 1.25, 1.33, 0.002, 64, "Trim")
            annulus(b, 1.33, r1, 0.0, 64, "Floor")
            continue
        gap = 0.012
        for s in range(sectors):
            a0 = 2 * math.pi * s / sectors + gap / r0
            a1 = 2 * math.pi * (s + 1) / sectors - gap / r0
            annulus(b, r0, r1, 0.0, max(4, N // sectors), "Floor", a0, a1)
        # seams: a dark sub-floor just below, visible through the gaps
        annulus(b, r0, r1, -0.006, 96, "Seam")
    # inlaid light rings (UV.x along the ring)
    for r in light_r:
        annulus(b, r - lw / 2, r + lw / 2, 0.003, N, "Light", uv_along=True)
    # radial light spokes between the 2nd and 4th rings, 12 of them
    for s in range(12):
        a = 2 * math.pi * s / 12 + math.pi / 12
        d = Vector((math.cos(a), math.sin(a), 0))
        t = Vector((-d.y, d.x, 0)) * 0.014
        p0 = d * (light_r[0] + 0.1)
        p1 = d * (light_r[3] - 0.1)
        z = Vector((0, 0, 0.003))
        b.face([p0 - t + z, p0 + t + z, p1 + t + z, p1 - t + z], "Light", [(0, 0), (0, 1), (1, 1), (1, 0)])
    # brass rim: a bevel down to the edge, then the outer wall
    cylinder_wall(b, R, R + 0.18, 0.0, -0.08, N, "Trim")
    cylinder_wall(b, R + 0.18, R + 0.18, -0.08, -0.28, N, "Hull")
    cylinder_wall(b, R + 0.185, R + 0.185, -0.28, -0.34, N, "Light")  # a line of light round the outer wall
    cylinder_wall(b, R + 0.18, R + 0.18, -0.34, -0.55, N, "Hull")
    cylinder_wall(b, R + 0.18, R - 0.4, -0.55, -0.7, N, "Trim")
    # underside: a long tapering keel with bands of light
    cylinder_wall(b, R - 0.4, 6.0, -0.7, -2.2, 96, "Hull")
    cylinder_wall(b, 6.0, 5.85, -2.2, -2.35, 96, "Light")
    cylinder_wall(b, 5.85, 3.2, -2.35, -5.5, 96, "Hull")
    cylinder_wall(b, 3.2, 3.1, -5.5, -5.62, 64, "Light")
    cylinder_wall(b, 3.1, 0.6, -5.62, -9.5, 64, "Hull")
    # a slim spire under the keel
    cylinder_wall(b, 0.6, 0.05, -9.5, -15.0, 16, "Trim")

    # ---------------------------------------------------------------- the terrace city: a lower arc behind and to one side
    T0, T1 = 12.5, 22.0
    tz = -3.2
    a0, a1 = math.radians(30), math.radians(140)
    annulus(b, T0, T1, tz, 160, "Floor", a0, a1)
    annulus(b, T0 + 0.6, T0 + 0.66, tz + 0.003, 160, "Light", a0, a1, uv_along=True)
    annulus(b, T1 - 0.9, T1 - 0.84, tz + 0.003, 160, "Light", a0, a1, uv_along=True)
    cylinder_wall(b, T1, T1 + 0.25, tz, tz - 0.4, 160, "Trim", a0, a1)
    cylinder_wall(b, T1 + 0.25, T1 - 2.0, tz - 0.4, tz - 3.0, 160, "Hull", a0, a1)
    cylinder_wall(b, T0, T0, tz, tz - 1.2, 160, "Hull", a0, a1, outward=False)
    annulus(b, T0, T1 - 2.0, tz - 3.0, 160, "Hull", a0, a1)
    # end caps
    for a in (a0, a1):
        d = Vector((math.cos(a), math.sin(a), 0))
        b.face([d * T0 + Vector((0, 0, tz)), d * T1 + Vector((0, 0, tz)), d * (T1 - 2) + Vector((0, 0, tz - 3)), d * T0 + Vector((0, 0, tz - 3))], "Hull")
    # bridge from the platform to the terrace (toward +Y)
    bw = 0.9
    ang = math.radians(90)
    d = Vector((math.cos(ang), math.sin(ang), 0))
    t = Vector((-d.y, d.x, 0)) * bw
    p0 = d * (R + 0.1)
    p1 = d * (T0 + 0.4)
    z0 = Vector((0, 0, -0.05))
    z1 = Vector((0, 0, tz))
    b.face([p0 - t + z0, p0 + t + z0, p1 + t + z1, p1 - t + z1], "Floor")
    b.face([p0 - t * 0.98 + z0 + Vector((0, 0, 0.004)), p0 - t * 0.94 + z0 + Vector((0, 0, 0.004)), p1 - t * 0.94 + z1 + Vector((0, 0, 0.004)), p1 - t * 0.98 + z1 + Vector((0, 0, 0.004))], "Light", [(0, 0), (0, 1), (1, 1), (1, 0)])
    b.face([p0 + t * 0.94 + z0 + Vector((0, 0, 0.004)), p0 + t * 0.98 + z0 + Vector((0, 0, 0.004)), p1 + t * 0.98 + z1 + Vector((0, 0, 0.004)), p1 + t * 0.94 + z1 + Vector((0, 0, 0.004))], "Light", [(0, 0), (0, 1), (1, 1), (1, 0)])
    b.face([p1 - t + z1 - Vector((0, 0, 0.6)), p1 + t + z1 - Vector((0, 0, 0.6)), p0 + t + z0 - Vector((0, 0, 0.4)), p0 - t + z0 - Vector((0, 0, 0.4))], "Hull")

    # skyline: slender octagonal towers with light bands, along the terrace's outer half
    import random
    rnd = random.Random(4)
    towers = 0
    for i in range(13):
        a = a0 + (a1 - a0) * (i + rnd.random() * 0.6) / 13
        if abs(a - ang) < 0.18:
            continue
        r = rnd.uniform(15.5, T1 - 1.5)
        c = Vector((r * math.cos(a), r * math.sin(a), tz))
        h = rnd.choice([2.5, 3.5, 4.5, 6, 7.5, 9, 12]) * rnd.uniform(0.8, 1.15)
        base = rnd.uniform(0.45, 0.9)
        top = base * rnd.uniform(0.25, 0.6)
        sides = 8
        levels = [0.0, 0.42, 0.425, 0.8, 0.805, 0.97, 1.0]
        rad = [base, base * 0.92, base * 0.92, base * 0.78, base * 0.78, top, 0.04]
        mats = ["Hull", "Light", "Hull", "Light", "Hull", "Trim"]
        for k in range(len(levels) - 1):
            lo = [c + Vector((rad[k] * math.cos(2 * math.pi * s / sides), rad[k] * math.sin(2 * math.pi * s / sides), h * levels[k])) for s in range(sides + 1)]
            hi = [c + Vector((rad[k + 1] * math.cos(2 * math.pi * s / sides), rad[k + 1] * math.sin(2 * math.pi * s / sides), h * levels[k + 1])) for s in range(sides + 1)]
            for s in range(sides):
                b.face([lo[s], lo[s + 1], hi[s + 1], hi[s]], mats[k])
        towers += 1
    # ribbed domes
    for (a_deg, r, dr) in [(120, 17.5, 3.0), (45, 18.0, 2.2), (100, 19.5, 1.5)]:
        a = math.radians(a_deg)
        c = Vector((r * math.cos(a), r * math.sin(a), tz))
        rings, segs = 10, 32
        for i in range(rings):
            e0 = (math.pi / 2) * i / rings
            e1 = (math.pi / 2) * (i + 1) / rings
            for s in range(segs):
                t0 = 2 * math.pi * s / segs
                t1 = 2 * math.pi * (s + 1) / segs
                P = lambda e, t: c + Vector((dr * math.cos(e) * math.cos(t), dr * math.cos(e) * math.sin(t), dr * math.sin(e)))
                rib = (s % 4 == 0)
                b.face([P(e0, t0), P(e0, t1), P(e1, t1), P(e1, t0)], "Trim" if rib else "Glass")
        cylinder_wall(b, dr + 0.05, dr + 0.05, tz, tz + 0.12, 48, "Light")
    ob = b.finish()
    print("platform faces", len(ob.data.polygons), "towers", towers)
    path = os.path.join(OUT_DIR, "beyond-platform.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_apply=True, export_materials="EXPORT", export_normals=True, export_texcoords=True)
    print("WROTE", path, os.path.getsize(path))


# ------------------------------------------------------------------------------------------------ arcs
def arc_object(name, R, span_deg, seg_len, w, h):
    """A truss arc of radius R in the XY plane, centred on +X, spanning span_deg. Units are metres (the runtime may scale)."""
    b = Builder(name, ["Hull", "Trim", "Light"])
    span = math.radians(span_deg)
    n = max(24, int(R * span / seg_len))
    a0 = -span / 2
    ang = [a0 + span * i / n for i in range(n + 1)]

    def P(a, dr, dz):
        return Vector(((R + dr) * math.cos(a), (R + dr) * math.sin(a), dz))

    # main beam: a rectangular tube (inner face carries the light strip)
    sec = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
    rows = [[P(a, x, z) for (x, z) in sec] for a in ang]
    b.quad_strip(rows, "Hull", closed=True)
    # brass caps on the top face: panels with gaps
    for i in range(n):
        if i % 2:
            continue
        aa = ang[i] + (ang[i + 1] - ang[i]) * 0.04
        bb = ang[i + 1] - (ang[i + 1] - ang[i]) * 0.04
        b.face([P(aa, -w * 0.42, h / 2 + 0.01 * w), P(aa, w * 0.42, h / 2 + 0.01 * w), P(bb, w * 0.42, h / 2 + 0.01 * w), P(bb, -w * 0.42, h / 2 + 0.01 * w)], "Trim")
    # the light strip on the inner face, UV.x along the arc
    lz = h * 0.12
    for i in range(n):
        u0, u1 = i / n, (i + 1) / n
        b.face([P(ang[i], -w / 2 - 0.004 * w, -lz), P(ang[i + 1], -w / 2 - 0.004 * w, -lz), P(ang[i + 1], -w / 2 - 0.004 * w, lz), P(ang[i], -w / 2 - 0.004 * w, lz)], "Light",
               [(u0, 0), (u1, 0), (u1, 1), (u0, 1)])
    # outer rails (two square tubes) and a lattice of braces to them
    rr = w * 0.16
    for (dx, dz) in [(w * 1.6, h * 0.9), (w * 1.6, -h * 0.9)]:
        sec2 = [(dx - rr, dz - rr), (dx + rr, dz - rr), (dx + rr, dz + rr), (dx - rr, dz + rr)]
        b.quad_strip([[P(a, x, z) for (x, z) in sec2] for a in ang], "Hull", closed=True)
    # thin light line along the outer rails
    for (dz) in (h * 0.9 + rr + 0.003 * w, -h * 0.9 - rr - 0.003 * w):
        for i in range(n):
            u0, u1 = i / n, (i + 1) / n
            f = [P(ang[i], w * 1.6 - rr * 0.35, dz), P(ang[i + 1], w * 1.6 - rr * 0.35, dz), P(ang[i + 1], w * 1.6 + rr * 0.35, dz), P(ang[i], w * 1.6 + rr * 0.35, dz)]
            b.face(f if dz > 0 else list(reversed(f)), "Light", [(u0, 0), (u1, 0), (u1, 1), (u0, 1)] if dz > 0 else [(u0, 1), (u1, 1), (u1, 0), (u0, 0)])
    # braces: zig-zag struts between the beam and each rail
    st = w * 0.09
    for i in range(n):
        for sgn in (1, -1):
            a = ang[i] if i % 2 == 0 else ang[i + 1]
            c = ang[i + 1] if i % 2 == 0 else ang[i]
            p0 = P(a, w / 2, sgn * h * 0.3)
            p1 = P(c, w * 1.6, sgn * h * 0.9)
            d = (p1 - p0)
            L = d.length
            zax = d.normalized()
            xax = zax.cross(Vector((0, 0, 1))).normalized()
            yax = zax.cross(xax)
            rot = Matrix((xax, yax, zax)).transposed()
            b.box(tuple((p0 + p1) / 2), (st, st, L), "Trim" if i % 6 == 0 else "Hull", rot)
        # vertical ties at every 3rd node with a small beacon
        if i % 3 == 0:
            p = P(ang[i], w * 1.6, 0)
            b.box(tuple(p), (rr * 1.2, rr * 1.2, h * 1.8), "Hull")
        if i % 9 == 0:
            p = P(ang[i], w * 1.6 + rr * 1.3, 0)
            b.box(tuple(p), (rr * 0.7, rr * 0.7, rr * 0.7), "Light")
    return b.finish()


def build_arcs():
    reset()
    # (name, radius, span, segment length, beam width, beam height)
    specs = [("Arc_A", 1.0, 300, 0.035, 0.026, 0.014), ("Arc_B", 1.0, 220, 0.04, 0.03, 0.016), ("Arc_C", 1.0, 160, 0.05, 0.04, 0.02)]
    for s in specs:
        ob = arc_object(*s)
        print(s[0], "faces", len(ob.data.polygons))
    path = os.path.join(OUT_DIR, "beyond-arcs.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_materials="EXPORT", export_normals=True, export_texcoords=True)
    print("WROTE", path, os.path.getsize(path))


if __name__ == "__main__":
    which = os.environ.get("BUILD", "platform,arcs").split(",")
    if "platform" in which:
        build_platform()
    if "arcs" in which:
        build_arcs()
