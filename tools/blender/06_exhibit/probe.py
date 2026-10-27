# Probe the coat in rest pose: topline, belly line, half widths. usage: blender -b src.blend -P probe.py
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
coat = bpy.data.objects['Marwari_Low']
dg = bpy.context.evaluated_depsgraph_get()
bm = bmesh.new(); bm.from_mesh(coat.data); bm.transform(coat.matrix_world)
bvh = BVHTree.FromBMesh(bm)
def ray(o, d, dist=5.0):
    h = bvh.ray_cast(Vector(o), Vector(d).normalized(), dist)
    return h[0] if h and h[0] is not None else None
print('matrix', coat.matrix_world.is_identity)
print('TOPLINE x=0 (y: ztop zbottom) ')
for y in [-1.0,-0.9,-0.8,-0.7,-0.6,-0.5,-0.4,-0.3,-0.2,-0.1,0.0,0.1,0.2,0.3,0.4,0.5,0.6]:
    top = ray((0,y,3.0),(0,0,-1)); bot = ray((0,y,-1.0),(0,0,1))
    # lateral half width at several heights
    ws=[]
    for z in [1.0,1.15,1.3,1.45,1.6]:
        h = ray((1.0,y,z),(-1,0,0))
        ws.append(round(1.0-h.x,3) if h else None)
    print(y, round(top.z,3) if top else None, round(bot.z,3) if bot else None, 'halfw@z1.0/1.15/1.3/1.45/1.6', ws)
print('HEAD: ')
for y in [-1.38,-1.3,-1.2,-1.1,-1.0]:
    top = ray((0,y,3.0),(0,0,-1))
    print(y, 'top', round(top.z,3) if top else None)
bb=[(v.co.x,v.co.y,v.co.z) for v in coat.data.vertices]
print('min',[min(c[i] for c in bb) for i in range(3)],'max',[max(c[i] for c in bb) for i in range(3)])
