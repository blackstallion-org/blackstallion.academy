#!/usr/bin/env python3
"""Compare the horse's coat between the places. Input: the pairs of pictures that t-coat.cjs writes (the horse alone on grey 64 and on grey 192).

A pixel that reads the same on both greys is the opaque horse. The soft contact shadow, the anti-aliased rim and the see-through hair cards
read differently on the two greys, so they are left out: this is the coat of the body, not the mane and tail.

usage: python3 analyse-coat.py DIR [--json out.json]
"""
import json
import os
import sys

import numpy as np
from PIL import Image

PLACES = ["desert", "field", "village"]


def luma(rgb):
    # Rec. 709 weights on the 8-bit sRGB values the visitor sees
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def stats(dir_, place):
    lo = np.asarray(Image.open(os.path.join(dir_, f"coat-{place}-64.png")).convert("RGB")).astype(np.int16)
    hi = np.asarray(Image.open(os.path.join(dir_, f"coat-{place}-192.png")).convert("RGB")).astype(np.int16)
    same = (np.abs(lo - hi).max(axis=2) <= 1)
    # drop the one-pixel rim of the silhouette (a pixel next to a different one may still be a blend that happened to match)
    inner = same.copy()
    inner[1:-1, 1:-1] = same[1:-1, 1:-1] & same[:-2, 1:-1] & same[2:, 1:-1] & same[1:-1, :-2] & same[1:-1, 2:]
    inner[0, :] = inner[-1, :] = False
    inner[:, 0] = inner[:, -1] = False
    px = ((lo + hi) // 2)[inner].astype(np.float64)
    y = luma(px)
    out = {
        "place": place,
        "pixels": int(inner.sum()),
        "share_of_frame_pct": round(100 * inner.sum() / inner.size, 2),
        "mean_rgb": [round(float(v), 1) for v in px.mean(axis=0)],
        "luma_mean": round(float(y.mean()), 1),
        "luma_p10": round(float(np.percentile(y, 10)), 1),
        "luma_median": round(float(np.percentile(y, 50)), 1),
        "luma_p90": round(float(np.percentile(y, 90)), 1),
        "luma_p99": round(float(np.percentile(y, 99)), 1),
        "share_below_24_pct": round(100 * float((y < 24).mean()), 1),
        "share_below_40_pct": round(100 * float((y < 40).mean()), 1),
        "share_below_64_pct": round(100 * float((y < 64).mean()), 1),
        # how warm or cool the coat reads: red minus blue, on the same pixels
        "warmth_r_minus_b": round(float((px[:, 0] - px[:, 2]).mean()), 1),
    }
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    dir_ = sys.argv[1]
    rows = [stats(dir_, p) for p in PLACES]
    keys = ["pixels", "share_of_frame_pct", "mean_rgb", "luma_mean", "luma_p10", "luma_median", "luma_p90", "luma_p99",
            "share_below_24_pct", "share_below_40_pct", "share_below_64_pct", "warmth_r_minus_b"]
    print(f"{'':22}" + "".join(f"{r['place']:>22}" for r in rows))
    for k in keys:
        print(f"{k:22}" + "".join(f"{str(r[k]):>22}" for r in rows))
    spread = {k: round(max(r[k] for r in rows) - min(r[k] for r in rows), 1)
              for k in ["luma_mean", "luma_p10", "luma_median", "luma_p90", "luma_p99", "share_below_40_pct", "warmth_r_minus_b"]}
    print("\nspread between the three places (max - min):", json.dumps(spread))
    if "--json" in sys.argv:
        with open(sys.argv[sys.argv.index("--json") + 1], "w") as f:
            json.dump({"places": rows, "spread": spread}, f, indent=1)


if __name__ == "__main__":
    main()
