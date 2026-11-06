"""Second half of the sky export (system Python + Pillow): the encoded 4096x2048 array -> sky-hi.webp / sky-lo.webp.
Only the top 56.25 % of the panorama is kept (everything below a few degrees under the horizon is hidden by the valley's
mountains); the sky shader maps v onto the cropped band and repeats the last row below it."""
import numpy as np, json
from PIL import Image
a = np.load("/root/work/origins/sky-hi.raw.npy")
h = a.shape[0]
keep = int(h * 0.5625)
band = a[:keep]
OUT = "/root/bsah/public/worlds/origins"
Image.fromarray(band).save(f"{OUT}/sky-hi.webp", quality=88, method=6)
Image.fromarray(band).resize((band.shape[1] // 2, keep // 2), Image.LANCZOS).save(f"{OUT}/sky-lo.webp", quality=86, method=6)
info = json.load(open("/root/work/origins/sky.json"))
info["crop"] = keep / h
json.dump(info, open("/root/work/origins/sky.json", "w"), indent=1)
print(keep / h)
