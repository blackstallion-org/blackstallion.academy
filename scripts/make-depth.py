#!/usr/bin/env python3
"""
Neural depth maps for the relighting scenes (components/3d/relight).

Runs Depth Anything V2 *Small* (Apache-2.0; the Base/Large/Giant checkpoints are CC-BY-NC and must not be used) as the
int8 ONNX export published at huggingface.co/onnx-community/depth-anything-v2-small (onnx/model_quantized.onnx).
The model file is not committed; pass its path with --model.

Output follows the Codrops relighting convention: 8-bit greyscale, white = near, same size as the photograph.

    python3 scripts/make-depth.py --model /path/to/depth-anything-v2-small.onnx \
        public/images/fleet/fleet-chetak.webp:public/images/relight/chetak-depth.webp ...
"""
import argparse

import numpy as np
import onnxruntime as ort
from PIL import Image
from scipy.ndimage import gaussian_filter

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def snap(n: float) -> int:
    return max(14, int(round(n / 14)) * 14)


def infer(session: ort.InferenceSession, image: Image.Image, long_side: int) -> np.ndarray:
    w, h = image.size
    scale = long_side / max(w, h)
    size = (snap(w * scale), snap(h * scale))
    x = np.asarray(image.convert("RGB").resize(size, Image.BICUBIC), dtype=np.float32) / 255.0
    x = ((x - MEAN) / STD).transpose(2, 0, 1)[None]
    return session.run(None, {"pixel_values": x})[0][0]


def depth_map(session, image: Image.Image, long_side: int) -> Image.Image:
    # Two passes: one near the training resolution for a stable overall shape, one larger for edge detail.
    base = infer(session, image, 518)
    fine = infer(session, image, long_side)
    w, h = image.size

    def norm(d):
        lo, hi = np.percentile(d, 0.5), np.percentile(d, 99.5)
        d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
        return np.asarray(Image.fromarray(d.astype(np.float32), "F").resize((w, h), Image.BICUBIC), dtype=np.float32)

    b, f = norm(base), norm(fine)
    # Keep the low frequencies of the base pass and the high frequencies of the fine pass.
    sigma = max(w, h) / 120

    def blur(a):
        return gaussian_filter(a, sigma)

    d = np.clip(blur(b) + (f - blur(f)), 0, 1)
    # The subject sits far in front of a dark backdrop, so a plain normalisation squeezes all of its relief into the top
    # few levels. Give the subject most of the range: backdrop -> [0, 0.3], subject -> [0.3, 1].
    subject = d[d > 0.35]
    if subject.size > d.size * 0.05:
        t, hi = np.percentile(subject, 1), np.percentile(subject, 99.7)
        d = np.where(d < t, d / max(t, 1e-6) * 0.3, 0.3 + (d - t) / max(hi - t, 1e-6) * 0.7)
        d = np.clip(d, 0, 1)
    return Image.fromarray((d * 255).round().astype(np.uint8), "L")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--long-side", type=int, default=1022)
    parser.add_argument("pairs", nargs="+", help="source:target")
    args = parser.parse_args()
    session = ort.InferenceSession(args.model, providers=["CPUExecutionProvider"])
    for pair in args.pairs:
        source, target = pair.split(":")
        image = Image.open(source)
        depth_map(session, image, args.long_side).save(target, "WEBP", quality=92, method=6)
        print("wrote", target, image.size)


if __name__ == "__main__":
    main()
