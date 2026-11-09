#!/usr/bin/env python3
"""
Depth maps for the painted reliefs of the history scrolls (IN01, WO02, JH01).

The relief is the accepted background plate itself, laid on a shallow mesh displaced by this map (white = near).
The map is built from the plate, with no neural model, so it stays a painter's bas-relief rather than a reconstruction:

  1. sky      = flood fill from the top rows of every pixel close to the sky's own colour; depth 0 (far)
  2. features = what stands above the horizon and is not sky (hills, forts, ranges): swelled from their silhouette
  3. ground   = rises gently toward the bottom edge (nearer the viewer)
  4. window   = the depth falls to 0 at all four edges, so the relief meets the flat plate with no seam

Usage: python3 -I scripts/history-relief-depth.py public/images/history/lakshmibai/jh01-b.webp [--horizon 0.42]
Writes <plate>-depth.webp next to the plate (512 px wide, greyscale).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def build(path: Path, horizon: float, width: int = 512) -> Image.Image:
    src = Image.open(path).convert("RGB")
    h = round(src.height * width / src.width)
    rgb = np.asarray(src.resize((width, h), Image.LANCZOS), dtype=np.float32) / 255.0

    top = rgb[: max(2, h // 20)].reshape(-1, 3)
    sky_colour = np.median(top, axis=0)
    spread = np.percentile(np.linalg.norm(top - sky_colour, axis=1), 90)
    close = np.linalg.norm(ndi.gaussian_filter(rgb, (2, 2, 0)) - sky_colour, axis=2) < max(0.09, spread * 1.6)
    labels, _ = ndi.label(close)
    seeds = np.unique(labels[0][labels[0] > 0])
    sky = np.isin(labels, seeds)
    sky = ndi.binary_closing(sky, iterations=3)

    rows = np.linspace(0, 1, h)[:, None] * np.ones((1, width))
    above = rows < horizon + 0.12
    features = (~sky) & above
    features = ndi.binary_opening(features, iterations=2)
    dist = ndi.distance_transform_edt(features)
    dome = np.sqrt(dist / max(dist.max(), 1e-6))

    ground = np.clip((rows - horizon) / (1 - horizon), 0, 1) ** 1.4
    depth = np.where(sky, 0.0, 0.65 * dome + 0.3 * ground)
    depth = ndi.gaussian_filter(depth, width * 0.006)

    wx = np.sin(np.linspace(0, np.pi, width)) ** 0.35
    wy = np.sin(np.linspace(0, np.pi, h)) ** 0.35
    depth *= wy[:, None] * wx[None, :]
    depth /= max(depth.max(), 1e-6)
    return Image.fromarray((depth * 255).astype(np.uint8), "L")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("plate", type=Path)
    ap.add_argument("--horizon", type=float, default=0.42, help="Where the far ground meets the sky, as a fraction of height")
    a = ap.parse_args()
    out = a.plate.with_name(a.plate.stem + "-depth.webp")
    build(a.plate, a.horizon).save(out, "WEBP", quality=90)
    print(out)
