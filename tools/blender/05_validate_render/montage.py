# Tile PNGs into one sheet (no PIL): uses Blender image API.
import bpy, sys, numpy as np
argv = sys.argv[sys.argv.index('--')+1:]
out, cols, files = argv[0], int(argv[1]), argv[2:]
ims = [bpy.data.images.load(f) for f in files]
w, h = ims[0].size; rows = (len(ims)+cols-1)//cols
sheet = np.ones((rows*h, cols*w, 4), np.float32)
for i, im in enumerate(ims):
    p = np.array(im.pixels[:], np.float32).reshape(h, w, 4)
    r, c = divmod(i, cols); r = rows-1-r
    sheet[r*h:(r+1)*h, c*w:(c+1)*w] = p
img = bpy.data.images.new('sheet', cols*w, rows*h); img.pixels[:] = sheet.ravel()
img.filepath_raw = out; img.file_format = 'PNG'; img.save()
