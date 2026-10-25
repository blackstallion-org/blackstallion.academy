#!/usr/bin/env python3
"""Frame-to-frame ground shift of a stepped sequence (frame k-1 -> k) against the geometric expectation from the recorded cameras.
A smooth world gives a steady residual; a jumpy one gives a residual that alternates.   usage: ncc-consec.py DIR [PREFIX S|X] [row] [LP]"""
import json, sys, os
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
D = Path(sys.argv[1]); PRE = sys.argv[2] if len(sys.argv) > 2 else 'S'
ROW = float(sys.argv[3]) if len(sys.argv) > 3 else 0.86
LP = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0
meta = json.load(open(D / 'meta.json')); M = meta['stepped'] if PRE == 'S' else meta['fixed']
def mat(a): return np.array(a, dtype=float).reshape(4, 4).T
def project(cam, P, w, h):
    p = mat(cam['proj']) @ mat(cam['view']) @ np.array([P[0], P[1], P[2], 1.0]); n = p[:3] / p[3]
    return np.array([(n[0] + 1) / 2 * w, (1 - n[1]) / 2 * h])
def ray(cam, px, py, w, h):
    inv = np.linalg.inv(mat(cam['proj']) @ mat(cam['view']))
    un = lambda z: (lambda q: q[:3] / q[3])(inv @ np.array([2 * px / w - 1, 1 - 2 * py / h, z, 1.0]))
    n, f = un(-1.0), un(1.0); d = f - n; return n, d / np.linalg.norm(d)
def gray(p): return np.asarray(Image.open(p).convert('L'), dtype=np.float64)
def ncc_shift(a, b, maxs=60):
    h, w = a.shape; sc = {}
    for s in range(-maxs, maxs + 1):
        if s >= 0: bb, aa = b[:, s:], a[:, :w - s]
        else: bb, aa = b[:, :w + s], a[:, -s:]
        bb = bb - bb.mean(); aa = aa - aa.mean()
        sc[s] = float((aa * bb).sum() / (np.sqrt((aa * aa).sum() * (bb * bb).sum()) + 1e-9))
    s0 = max(sc, key=sc.get)
    if -maxs < s0 < maxs:
        m1, c, p1 = sc[s0 - 1], sc[s0], sc[s0 + 1]; d = m1 - 2 * c + p1
        return s0 + (0.0 if abs(d) < 1e-12 else 0.5 * (m1 - p1) / d), sc[s0]
    return float(s0), sc[s0]
w, h = M[0]['w'], M[0]['h']
cols = (int(0.15 * w), int(0.85 * w)); yc = int(ROW * h); y0, y1 = yc - 8, yc + 8
prev = gaussian_filter(gray(D / f'{PRE}0.png'), LP)
rows = []
for k in range(1, len(M)):
    cur = gaussian_filter(gray(D / f'{PRE}{k}.png'), LP)
    camA = {'view': M[k - 1]['view'], 'proj': M[k - 1]['proj']}; camB = {'view': M[k]['view'], 'proj': M[k]['proj']}
    delta = M[k]['d'] - M[k - 1]['d']
    o, dd = ray(camA, 0.5 * (cols[0] + cols[1]), 0.5 * (y0 + y1), w, h); t = -o[1] / dd[1]; P0 = o + t * dd
    exp = (project(camB, P0 + np.array([0, 0, -delta]), w, h) - project(camA, P0, w, h))[0]
    s, c = ncc_shift(prev[y0:y1, cols[0]:cols[1]], cur[y0:y1, cols[0]:cols[1]])
    rows.append((k, delta, s, exp, c)); prev = cur
meas = np.array([r[2] for r in rows]); exp = np.array([r[3] for r in rows]); ncc = np.array([r[4] for r in rows])
ratio = meas / exp; dev = meas - exp * np.median(ratio)
print(f"{PRE} {D.name}: step {np.median([r[1] for r in rows]):.4f} m, expected {np.median(exp):.2f} px/step, measured median {np.median(meas):.2f}, ratio median {np.median(ratio):.3f}; jump from the steady ratio: max {np.abs(dev).max():.2f} px, rms {np.sqrt((dev**2).mean()):.2f} px; ncc min {ncc.min():.2f}")
if len(sys.argv) > 5: print(' '.join(f"{x:.1f}" for x in dev))
