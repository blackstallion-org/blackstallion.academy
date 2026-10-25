#!/usr/bin/env python3
"""Compare how far each isolated layer's picture moved between frame A and B (phase correlation) with where the camera geometry
says a point of that layer must move when the world slides toward -Z by `delta` metres.
usage: analyse-layers.py DIR"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

import os
from scipy.ndimage import gaussian_filter
D = Path(sys.argv[1])
LP = float(os.environ.get('LP', '0'))  # optional low-pass (sigma, px) to calm sub-pixel aliasing of fine ripples
meta = json.load(open(D / 'meta.json'))


def mat(a):
    return np.array(a, dtype=float).reshape(4, 4).T  # three.js toArray() is column-major


def project(cam, P, w, h):
    p = mat(cam['proj']) @ mat(cam['view']) @ np.array([P[0], P[1], P[2], 1.0])
    n = p[:3] / p[3]
    return np.array([(n[0] + 1) / 2 * w, (1 - n[1]) / 2 * h])


def ray(cam, px, py, w, h):
    inv = np.linalg.inv(mat(cam['proj']) @ mat(cam['view']))

    def un(z):
        q = inv @ np.array([2 * px / w - 1, 1 - 2 * py / h, z, 1.0])
        return q[:3] / q[3]

    n, f = un(-1.0), un(1.0)
    d = f - n
    return n, d / np.linalg.norm(d)


def gray(p):
    return np.asarray(Image.open(p).convert('L'), dtype=np.float64)


def rgb(p):
    return np.asarray(Image.open(p).convert('RGB'), dtype=np.float64)


def phase_corr(a, b):
    """Shift (dx, dy) in px such that b(x) ~ a(x - shift); also the height of the correlation peak (1 = perfect)."""
    wy = np.hanning(a.shape[0])[:, None]
    wx = np.hanning(a.shape[1])[None, :]
    A = np.fft.fft2((a - a.mean()) * wy * wx)
    B = np.fft.fft2((b - b.mean()) * wy * wx)
    R = np.conj(A) * B
    R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real
    iy, ix = np.unravel_index(np.argmax(r), r.shape)
    hh, ww = r.shape

    def par(m1, c, p1):
        d = m1 - 2 * c + p1
        return 0.0 if abs(d) < 1e-12 else 0.5 * (m1 - p1) / d

    fy = iy + par(r[(iy - 1) % hh, ix], r[iy, ix], r[(iy + 1) % hh, ix])
    fx = ix + par(r[iy, (ix - 1) % ww], r[iy, ix], r[iy, (ix + 1) % ww])
    if fy > hh / 2:
        fy -= hh
    if fx > ww / 2:
        fx -= ww
    return fx, fy, float(r.max())


def content_rows(img, cols):
    """Rows where the picture differs from its background colour (the most common colour), within the given columns."""
    q = (img // 4).astype(np.int32)
    key = q[..., 0] * 4096 + q[..., 1] * 64 + q[..., 2]
    vals, counts = np.unique(key, return_counts=True)
    bg = vals[np.argmax(counts)]
    mask = key != bg
    sub = mask[:, cols[0]:cols[1]]
    frac = sub.mean(axis=1)
    return np.where(frac > (0.03 if cols[1] - cols[0] > img.shape[1] * 0.6 else 0.12))[0]


rows_out = []
for m in meta:
    w, h = m['w'], m['h']
    base = f"{m['world']}-{m['layer']}"
    ga, gb = gray(D / f'{base}-A.png'), gray(D / f'{base}-B.png')
    if LP:
        ga, gb = gaussian_filter(ga, LP), gaussian_filter(gb, LP)
    ca, cb = rgb(D / f'{base}-A.png'), None
    cols = (int(0.05 * w), int(0.95 * w)) if m['layer'] == 'fore' else (int(0.30 * w), int(0.70 * w))
    delta = m['delta']
    jobs = []  # (label, y0, y1, expected-fn or None)
    if m['layer'] == 'ground':
        for frac, label in ((0.86, 'near'), (0.72, 'middle'), (0.60, 'far')):
            yc = int(frac * h)
            jobs.append((f'ground {label}', yc - 8, yc + 8, 'plane-y'))
    else:
        rows = content_rows(ca, cols)
        if len(rows) < 20:
            rows_out.append({'world': m['world'], 'layer': m['layer'], 'note': 'no content found'})
            continue
        lo, hi = rows.min(), rows.max()
        if m['layer'] == 'ring':
            mid = int(0.5 * (lo + hi))
            jobs.append(('ring', mid - 10, mid + 10, 'ring'))
        elif m['layer'] == 'mid':
            y0 = int(lo + 0.25 * (hi - lo)); y1 = min(int(lo + 0.85 * (hi - lo)), y0 + 160)
            jobs.append(('mid', y0, y1, 'plane-x' if m['midLayout'] == 'row' else None))
        else:  # fore
            y0 = int(lo + 0.1 * (hi - lo)); y1 = min(hi, y0 + 200)
            jobs.append(('fore', y0, y1, None))
    for label, y0, y1, kind in jobs:
        y0, y1 = max(0, y0), min(h, y1)
        sx, sy, peak = phase_corr(ga[y0:y1, cols[0]:cols[1]], gb[y0:y1, cols[0]:cols[1]])
        cx, cy = 0.5 * (cols[0] + cols[1]), 0.5 * (y0 + y1)
        exp = None
        if kind:
            o, d = ray(m['A'], cx, cy, w, h)
            if kind == 'plane-y':
                t = -o[1] / d[1]
                P0 = o + t * d
                P1 = P0 + np.array([0, 0, -delta])
            elif kind == 'plane-x':
                t = (m['midX'][0] - o[0]) / d[0]
                P0 = o + t * d
                P1 = P0 + np.array([0, 0, -delta])
            else:  # ring: a cylinder of radius R about the camera, content turned by delta / R
                c = np.array(m['A']['camPos'])
                R = m['radius']
                oxz, dxz = np.array([o[0] - c[0], o[2] - c[2]]), np.array([d[0], d[2]])
                A_ = dxz @ dxz; B_ = 2 * oxz @ dxz; C_ = oxz @ oxz - R * R
                t = (-B_ + np.sqrt(B_ * B_ - 4 * A_ * C_)) / (2 * A_)
                P0 = o + t * d
                th = delta / R
                X, Z = P0[0] - c[0], P0[2] - c[2]
                P1 = np.array([c[0] + X * np.cos(th) + Z * np.sin(th), P0[1], c[2] + Z * np.cos(th) - X * np.sin(th)])
                # the ring follows the camera: both frames use the same camera here, so no extra term
            p0 = project(m['A'], P0, w, h)
            p1 = project(m['B'], P1, w, h)
            exp = p1 - p0
            depth = float(np.linalg.norm(P0 - np.array(m['A']['camPos'])))
        rows_out.append({
            'world': m['world'], 'layer': label, 'delta_m': delta, 'measured_px': round(sx, 2), 'measured_dy': round(sy, 2), 'peak': round(peak, 2),
            'expected_px': None if exp is None else round(float(exp[0]), 2),
            'error_px': None if exp is None else round(sx - float(exp[0]), 2),
            'error_pct': None if exp is None else round(100 * (sx - float(exp[0])) / float(exp[0]), 1),
            'px_per_m': round(sx / delta, 1),
            'depth_m': None if exp is None else round(depth, 1),
        })

print(json.dumps(rows_out, indent=1))
print()
print(f"{'world':8} {'layer':14} {'dist':>6} {'delta':>6} {'measured':>9} {'expected':>9} {'err px':>7} {'err %':>7} {'px/m':>8} {'peak':>5}")
for r in rows_out:
    if 'note' in r:
        print(r['world'], r['layer'], r['note']); continue
    print(f"{r['world']:8} {r['layer']:14} {str(r['depth_m']):>6} {r['delta_m']:>6} {r['measured_px']:>9} {str(r['expected_px']):>9} {str(r['error_px']):>7} {str(r['error_pct']):>7} {r['px_per_m']:>8} {r['peak']:>5}")
