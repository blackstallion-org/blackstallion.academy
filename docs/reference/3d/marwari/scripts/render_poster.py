import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=argv[0]); sc = bpy.context.scene
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.angle = math.radians(30) * 1.6  # match the web camera (30 deg vertical at 16:10)
# web camera: eye (4.6,1.75,5.4) look (0,1.12,0.15) in glTF (x, y-up, z-fwd) -> Blender (x, -z, y)
eye, look = Vector((4.6,-5.4,1.75)), Vector((0,-0.15,1.12))
cam.location = eye; cam.rotation_euler = (look-eye).to_track_quat('-Z','Y').to_euler()
for name, energy, rot, col in [('k',3.4,(50,0,40),(1,0.95,0.86)),('r',5.5,(60,0,200),(0.95,0.85,0.65)),('f',1.0,(75,0,-70),(0.8,0.85,1))]:
    l = bpy.data.objects.new(name, bpy.data.lights.new(name,'SUN')); l.data.energy=energy; l.data.color=col; l.rotation_euler=[math.radians(a) for a in rot]; sc.collection.objects.link(l)
w = bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.3,0.27,0.24,1)
sc.render.engine='BLENDER_EEVEE'; sc.render.film_transparent=True
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
sc.render.image_settings.file_format='WEBP'; sc.render.image_settings.color_mode='RGBA'; sc.render.image_settings.quality=82
sc.render.filepath = argv[1]; bpy.ops.render.render(write_still=True)
