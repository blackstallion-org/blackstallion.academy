# Shared helpers for the anatomy-exhibit layers (skeleton, muscles, tack, cadet).
# Blender 5.2, rest pose, Z up, the horse faces -Y (glTF export turns that into +Z), metres.
# Everything is derived from the Marwari armature and the coat mesh of tools/blender/source/marwari_anatomy_source.blend,
# so the layers share the coat's rig and cannot float outside it: `Rig.depth` is the test every vertex is held to.
import bpy, bmesh, math, os
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SOURCE = os.path.join(ROOT, 'tools', 'blender', 'source', 'marwari_anatomy_source.blend')


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


class Rig:
    """The armature's rest joints and the coat's surface (BVH) for measuring against."""

    def __init__(self):
        self.arm = bpy.data.objects['MarwariRig']
        self.arm.data.pose_position = 'REST'
        self.coat = bpy.data.objects['Marwari_Low']
        self.J = {b.name: (self.arm.matrix_world @ b.head_local, self.arm.matrix_world @ b.tail_local) for b in self.arm.data.bones}
        bm = bmesh.new()
        bm.from_mesh(self.coat.data)
        bm.transform(self.coat.matrix_world)
        bm.faces.ensure_lookup_table()
        self.bm = bm
        self.bvh = BVHTree.FromBMesh(bm)

    def head(self, name):
        return self.J[name][0].copy()

    def tail(self, name):
        return self.J[name][1].copy()

    def along(self, name, t):
        a, b = self.J[name]
        return a.lerp(b, t)

    def ray(self, origin, direction, dist=6.0):
        """First coat hit: (location, normal) or None."""
        h = self.bvh.ray_cast(Vector(origin), Vector(direction).normalized(), dist)
        return (h[0], h[1]) if h and h[0] is not None else None

    def depth(self, p):
        """How far inside the coat p is (negative: outside)."""
        loc, n, idx, d = self.bvh.find_nearest(Vector(p))
        if loc is None:
            return -9.0
        return d if (Vector(p) - loc).dot(n) <= 0 else -d

    def topz(self, y, x=0.0):
        h = self.ray((x, y, 3.0), (0, 0, -1))
        return h[0].z if h else None

    def botz(self, y, x=0.0):
        h = self.ray((x, y, -1.0), (0, 0, 1))
        return h[0].z if h else None

    def halfwidth(self, y, z, side=1.0, x0=0.0):
        h = self.ray((x0, y, z), (side, 0, 0))
        return abs(h[0].x - x0) if h else None

    def fit_inside(self, p, ref, margin=0.012):
        """Move p toward ref until it is `margin` inside the coat (or give up at ref)."""
        p = Vector(p)
        ref = Vector(ref)
        for i in range(60):
            if self.depth(p) >= margin:
                return p
            p = p.lerp(ref, 0.04)
        return p


class MB:
    """Mesh builder: vertices, quad/tri faces, and the centre each vertex is pulled toward if it pokes through the coat."""

    def __init__(self):
        self.v, self.f, self.c, self.uv = [], [], [], []

    def add(self, verts, faces, centre=None, uvs=None):
        o = len(self.v)
        self.v += [Vector(p) for p in verts]
        self.f += [tuple(i + o for i in fc) for fc in faces]
        cs = centre if isinstance(centre, list) else [centre] * len(verts)
        self.c += [Vector(c) if c is not None else None for c in cs]
        if uvs is not None:
            self.uv += uvs
        return o

    def merge(self, other):
        o = len(self.v)
        self.v += other.v
        self.f += [tuple(i + o for i in fc) for fc in other.f]
        self.c += other.c
        return o


def catmull(points, n):
    """Uniform Catmull-Rom resample through the points: n samples."""
    pts = [Vector(p) for p in points]
    if len(pts) < 3:
        return [pts[0].lerp(pts[-1], i / (n - 1)) for i in range(n)]
    ext = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    out = []
    segs = len(pts) - 1
    for i in range(n):
        u = i / (n - 1) * segs
        k = min(int(u), segs - 1)
        t = u - k
        p0, p1, p2, p3 = ext[k], ext[k + 1], ext[k + 2], ext[k + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return out


def loft(pts, rx, ry, ref=(1, 0, 0), seg=12, caps=(True, True), cap_rings=3, centre=None):
    """A smooth tube along pts with an elliptical section (rx along `ref` projected normal to the path, ry across it).
    rx/ry: floats or functions of t in [0,1]. Rounded caps. Returns an MB."""
    mb = MB()
    n = len(pts)
    pts = [Vector(p) for p in pts]
    tang = []
    for i in range(n):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, n - 1)]
        tang.append((b - a).normalized())
    ref = Vector(ref).normalized()
    nrm = (ref - tang[0] * ref.dot(tang[0]))
    if nrm.length < 1e-4:
        nrm = Vector((0, 0, 1)).cross(tang[0])
    nrm.normalize()
    rings = []
    rxf = rx if callable(rx) else (lambda t, v=rx: v)
    ryf = ry if callable(ry) else (lambda t, v=ry: v)
    for i in range(n):
        t = i / (n - 1)
        if i:
            nrm = nrm - tang[i] * nrm.dot(tang[i])
            if nrm.length < 1e-5:
                nrm = tang[i].orthogonal()
            nrm.normalize()
        bn = tang[i].cross(nrm).normalized()
        rings.append((pts[i], tang[i], nrm.copy(), bn, rxf(t), ryf(t)))

    def ring_verts(c, nr, bn, a, b):
        return [c + nr * (a * math.cos(2 * math.pi * k / seg)) + bn * (b * math.sin(2 * math.pi * k / seg)) for k in range(seg)]

    all_rings = []
    if caps[0]:
        c, tg, nr, bn, a, b = rings[0]
        for j in range(cap_rings, 0, -1):
            ph = j / (cap_rings + 1) * math.pi / 2
            all_rings.append(ring_verts(c - tg * math.sin(ph) * min(a, b) * 1.0, nr, bn, a * math.cos(ph), b * math.cos(ph)))
    for c, tg, nr, bn, a, b in rings:
        all_rings.append(ring_verts(c, nr, bn, a, b))
    if caps[1]:
        c, tg, nr, bn, a, b = rings[-1]
        for j in range(1, cap_rings + 1):
            ph = j / (cap_rings + 1) * math.pi / 2
            all_rings.append(ring_verts(c + tg * math.sin(ph) * min(a, b) * 1.0, nr, bn, a * math.cos(ph), b * math.cos(ph)))
    verts, faces, cents = [], [], []
    for ri, rv in enumerate(all_rings):
        for p in rv:
            verts.append(p)
        mid = sum(rv, Vector()) / len(rv)
        cents += [mid] * len(rv)
    for ri in range(len(all_rings) - 1):
        for k in range(seg):
            a = ri * seg + k
            b = ri * seg + (k + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    first, last = rings[0][0], rings[-1][0]
    pole0 = len(verts)
    verts.append(sum(all_rings[0], Vector()) / seg)
    cents.append(cents[0])
    pole1 = len(verts)
    verts.append(sum(all_rings[-1], Vector()) / seg)
    cents.append(cents[-1])
    for k in range(seg):
        faces.append((pole0, (k + 1) % seg, k))
        faces.append((pole1, (len(all_rings) - 1) * seg + k, (len(all_rings) - 1) * seg + (k + 1) % seg))
    mb.add(verts, faces, cents)
    return mb


def blob(centre, radii, axes=None, seg=14, rings=9):
    """An ellipsoid: radii along (x, y, z) of the given 3x3 axes (columns); default world axes."""
    mb = MB()
    M = axes if axes is not None else Matrix.Identity(3)
    verts, faces = [], []
    for j in range(rings + 1):
        ph = math.pi * j / rings
        for k in range(seg):
            th = 2 * math.pi * k / seg
            local = Vector((radii[0] * math.sin(ph) * math.cos(th), radii[1] * math.sin(ph) * math.sin(th), radii[2] * math.cos(ph)))
            verts.append(Vector(centre) + M @ local)
    for j in range(rings):
        for k in range(seg):
            a = j * seg + k
            b = j * seg + (k + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    mb.add(verts, faces, Vector(centre))
    return mb


def basis_along(direction, ref=(1, 0, 0)):
    """3x3 whose Z column is `direction`, X column is `ref` projected normal to it."""
    z = Vector(direction).normalized()
    x = Vector(ref) - z * Vector(ref).dot(z)
    if x.length < 1e-4:
        x = z.orthogonal()
    x.normalize()
    y = z.cross(x)
    return Matrix((x, y, z)).transposed()


# ------------------------------------------------------------------ objects
_mats = {}


def material(name, color, rough=0.5, metal=0.0, emissive=None):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    _mats[name] = m
    return m


def make_object(rig, name, mb, mat, bone=None, weights=None, layer=None, extras=None, skin=True, uvs=None, closed=True, arm=None):
    """Create a mesh object from an MB. bone: rigid skin weight 1 to that bone; weights: list of dict(bone->w) per vertex."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in mb.v], [], mb.f)
    me.update()
    if closed:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
    try:
        me.shade_smooth()
    except Exception:
        for p in me.polygons:
            p.use_smooth = True
    if uvs is not None:
        uv = me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            for li in poly.loop_indices:
                uv.data[li].uv = uvs[me.loops[li].vertex_index]
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if skin:
        if bone:
            vg = ob.vertex_groups.new(name=bone)
            vg.add(list(range(len(mb.v))), 1.0, 'REPLACE')
        elif weights:
            groups = {}
            for i, wd in enumerate(weights):
                for bn, w in wd.items():
                    groups.setdefault(bn, []).append((i, w))
            for bn, lst in groups.items():
                vg = ob.vertex_groups.new(name=bn)
                for i, w in lst:
                    vg.add([i], w, 'REPLACE')
        mod = ob.modifiers.new('Armature', 'ARMATURE')
        mod.object = arm or rig.arm
        ob.parent = arm or rig.arm
    if layer:
        ob['layer'] = layer
    for k, v in (extras or {}).items():
        ob[k] = v
    return ob


def coat_weights(rig, verts):
    """Skin weights copied from the nearest coat vertex, so a layer under the coat deforms exactly as the coat does."""
    from mathutils import kdtree
    if not hasattr(rig, 'kd'):
        me = rig.coat.data
        rig.kd = kdtree.KDTree(len(me.vertices))
        for i, v in enumerate(me.vertices):
            rig.kd.insert(v.co, i)
        rig.kd.balance()
        rig.gname = {g.index: g.name for g in rig.coat.vertex_groups}
    out = []
    for p in verts:
        co, idx, d = rig.kd.find(p)
        v = rig.coat.data.vertices[idx]
        wd = {rig.gname[g.group]: g.weight for g in v.groups if g.weight > 1e-4}
        top = sorted(wd.items(), key=lambda kv: -kv[1])[:4]
        tot = sum(w for _, w in top) or 1.0
        out.append({k: w / tot for k, w in top})
    return out


def clamp_inside(rig, mb, margin=0.010, passes=3):
    """Pull any vertex that is closer than `margin` to (or outside) the coat back toward its centre. Returns the count moved."""
    moved = 0
    for i, p in enumerate(mb.v):
        c = mb.c[i]
        if c is None:
            continue
        for _ in range(passes * 8):
            if rig.depth(p) >= margin:
                break
            p = p.lerp(c, 0.06)
            moved += 1
        mb.v[i] = p
    return moved


def inside_report(rig, objs):
    """(vertices, outside count, worst exceedance in cm) of the given objects against the coat, rest pose."""
    n = out = 0
    worst = 0.0
    for ob in objs:
        for v in ob.data.vertices:
            n += 1
            d = rig.depth(ob.matrix_world @ v.co)
            if d < 0:
                out += 1
                worst = max(worst, -d)
    return n, out, worst * 100


def save(path):
    bpy.context.preferences.filepaths.save_version = 0   # no .blend1 backups (they double the scratch space)
    bpy.ops.wm.save_as_mainfile(filepath=path, check_existing=False)
