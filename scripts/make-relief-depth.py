#!/usr/bin/env python3
# SUPERSEDED (26 Oct 2026) by scripts/make-depth.py (neural depth, Depth Anything V2 Small). Kept for reference.
"""
Relief depth maps for the "Light the stable" scene (components/3d/relight).

The relighting effect wants a depth map: white = near the viewer, black = far. A neural monocular depth model
(Depth Anything V2 Small is Apache-2.0; the Codrops article credits Depth Anything 3 and the Depth Generation Tool)
is the better source. This script is the offline fallback used when no model can be downloaded: it builds a
smooth bas-relief of a studio portrait on a dark ground from the photograph itself.

  1. subject mask  = blurred luminance above an adaptive threshold, closed, holes filled, small islands dropped
  2. dome          = distance to the mask edge, square-rooted, so the subject swells from its silhouette
  3. form          = blurred luminance inside the mask (brighter planes sit nearer)
  depth = ground + (1 - ground) * (0.68 * dome + 0.32 * form), feathered at the silhouette

The map is deliberately smooth: the effect adds fine surface detail itself from the photograph's luminance.
Replace any output with a neural depth map of the same picture (same name, same aspect) to improve it.

Usage: make-relief-depth.py INPUT OUTPUT [--width 768]
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def build(path: str, width: int) -> Image.Image:
    src = Image.open(path).convert("RGB")
    height = round(src.height * width / src.width)
    img = src.resize((width, height), Image.LANCZOS)
    rgb = np.asarray(img, dtype=np.float32) / 255.0
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

    sigma = width * 0.006
    blurred = ndi.gaussian_filter(lum, sigma)

    # Adaptive threshold between the ground (darkest decile) and the bright body of the subject. A dark coat on a
    # dark ground sits only a little above the ground, so the threshold is low and the mask is then rounded off.
    floor = np.percentile(blurred, 8)
    top = np.percentile(blurred, 92)
    threshold = floor + 0.07 * (top - floor)
    mask = blurred > threshold
    mask = ndi.binary_closing(mask, structure=np.ones((3, 3)), iterations=max(4, width // 28))
    mask = ndi.binary_fill_holes(mask)
    labels, count = ndi.label(mask)
    if count > 1:
        sizes = ndi.sum(mask, labels, range(1, count + 1))
        mask = np.isin(labels, 1 + np.flatnonzero(sizes >= 0.04 * mask.sum()))
    # Round the silhouette: blur the mask and cut it again, which fills notches and drops thin spurs.
    mask = ndi.gaussian_filter(mask.astype(np.float32), width * 0.025) > 0.5
    mask = ndi.binary_fill_holes(mask)

    # The frame cuts the body off at the left, right and bottom edges, so the subject carries on past them: pad before
    # measuring distance, or the relief would fall away to nothing at the edge of the picture.
    pad = width // 2
    padded = np.pad(mask, ((0, pad), (pad, pad)), mode="edge")
    distance = ndi.distance_transform_edt(padded)[: mask.shape[0], pad : pad + mask.shape[1]]
    dome = np.sqrt(distance / max(distance.max(), 1e-6))

    form = ndi.gaussian_filter(lum, width * 0.03)
    inside = form[mask]
    lo, hi = np.percentile(inside, 5), np.percentile(inside, 98)
    form = np.clip((form - lo) / max(hi - lo, 1e-6), 0, 1)

    ground = 0.06
    depth = ground + (1.0 - ground) * (0.68 * dome + 0.32 * form * mask)
    feather = ndi.gaussian_filter(mask.astype(np.float32), width * 0.01)
    depth = ground + (depth - ground) * feather
    depth = ndi.gaussian_filter(depth, width * 0.004)
    depth = np.clip(depth / max(depth.max(), 1e-6), 0, 1)
    return Image.fromarray((depth * 255).astype(np.uint8), "L")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--width", type=int, default=768)
    args = parser.parse_args()
    build(args.input, args.width).save(args.output, "WEBP", lossless=True, method=6)
