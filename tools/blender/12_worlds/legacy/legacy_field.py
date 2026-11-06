"""
World 03 (Legacy) height field and layout, shared by the Blender build scripts.

All coordinates here are three.js / glTF world coordinates: metres, +Y up, the hero horse at the origin facing +Z.
Blender is Z-up, so a point (x, y, z) here is (x, -z, y) in Blender: use `bl()` to convert.

Layout (top view, +Z away from the opening camera):
  camera start      z = -260   (inside the dust)
  cavalry track     z = -105   (a column crossing along X)
  hero horse        (0, 0, 0)  on wet sand flats, facing the fort
  fort ridge crest  z ~ 760    x from about -470 to +40 (screen right of the horse when looking up +Z)
  distant hills     ring from ~1400 m around (0, 300)
"""
import numpy as np

SEED = 1729


def _hash(ix, iz, seed):
    h = (ix * 374761393 + iz * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 0xFFFFFF) / float(0xFFFFFF)


def vnoise(x, z, seed=0):
    """Value noise in [0, 1], vectorised over numpy arrays."""
    x = np.asarray(x, dtype=np.float64)
    z = np.asarray(z, dtype=np.float64)
    ix = np.floor(x).astype(np.int64)
    iz = np.floor(z).astype(np.int64)
    fx = x - ix
    fz = z - iz
    ux = fx * fx * (3 - 2 * fx)
    uz = fz * fz * (3 - 2 * fz)
    a = _hash(ix, iz, seed)
    b = _hash(ix + 1, iz, seed)
    c = _hash(ix, iz + 1, seed)
    d = _hash(ix + 1, iz + 1, seed)
    return (a * (1 - ux) + b * ux) * (1 - uz) + (c * (1 - ux) + d * ux) * uz


def fbm(x, z, octaves=5, seed=0):
    s = 0.0
    a = 0.5
    norm = 0.0
    for i in range(octaves):
        s = s + a * vnoise(x, z, seed + i * 31)
        norm += a
        x = x * 2.03 + 11.7
        z = z * 2.03 - 5.3
        a *= 0.5
    return s / norm


def smoothstep(a, b, x):
    t = np.clip((np.asarray(x, dtype=np.float64) - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ the fort ridge
FORT_X = (-470.0, 40.0)


def ridge_z(x):
    x = np.asarray(x, dtype=np.float64)
    return 760.0 + 55.0 * np.sin(x / 260.0) + 22.0 * np.sin(x / 97.0 + 1.0)


def ridge_env(x):
    return smoothstep(-1150.0, -720.0, x) * (1.0 - smoothstep(420.0, 950.0, x))


def height(x, z):
    x = np.asarray(x, dtype=np.float64)
    z = np.asarray(z, dtype=np.float64)
    # rolling sand and low dune lines
    base = 3.2 * (fbm(x / 210.0, z / 210.0, 4, SEED) - 0.5)
    dunes = 1.6 * (1 - np.abs(2 * vnoise(x / 70.0 + z / 260.0, z / 46.0, SEED + 5) - 1)) - 0.8
    fine = 0.25 * (fbm(x / 9.0, z / 9.0, 3, SEED + 9) - 0.5)
    h = base + dunes + fine
    # the flats around the horse and along the cavalry track: nearly level, a few centimetres of relief
    r_hero = np.hypot(x, z)
    flat_hero = 1.0 - smoothstep(45.0, 160.0, r_hero)
    flat_track = (1.0 - smoothstep(14.0, 60.0, np.abs(z + 105.0))) * (1.0 - smoothstep(380.0, 650.0, np.abs(x)))
    flat = np.maximum(flat_hero, flat_track)
    h = h * (1 - flat) + flat * (0.06 * (fbm(x / 6.0, z / 6.0, 3, SEED + 21) - 0.5))
    # the ridge the fort stands on: a broad hill, a steeper rock face toward the plain, broken by gullies
    d = z - ridge_z(x)
    env = ridge_env(x)
    broad = np.exp(-((d / 210.0) ** 2))
    face = smoothstep(-150.0, -20.0, d) * (1.0 - smoothstep(60.0, 260.0, d))
    rock = fbm(x / 38.0, z / 38.0, 5, SEED + 40)
    gully = 1 - np.abs(2 * vnoise(x / 55.0, z / 140.0, SEED + 44) - 1)
    ridge = env * (62.0 * broad + 58.0 * face * (0.75 + 0.5 * rock) - 5.0 * face * gully * smoothstep(-140.0, -40.0, d) * (1 - smoothstep(-40, 0, d)))
    # a level crest for the fort along its length
    in_fort = smoothstep(FORT_X[0] - 60, FORT_X[0] + 20, x) * (1 - smoothstep(FORT_X[1] - 20, FORT_X[1] + 60, x))
    crest = in_fort * np.exp(-((d / 55.0) ** 4))
    ridge = ridge * (1 - 0.35 * crest) + crest * 0.35 * 112.0
    h = h + ridge
    # distant hills ringing the plain (fade into the haze)
    r = np.hypot(x, z - 300.0)
    hills = smoothstep(1250.0, 2300.0, r) * (70.0 + 210.0 * fbm(x / 520.0, z / 520.0, 4, SEED + 60) ** 1.6)
    hills = hills + smoothstep(900.0, 1500.0, r) * 25.0 * fbm(x / 160.0, z / 160.0, 3, SEED + 70)
    return h + hills


def rockiness(x, z, h=None, slope=None):
    """0 sand .. 1 rock: steep ground and the ridge face."""
    d = np.asarray(z) - ridge_z(x)
    face = ridge_env(x) * smoothstep(-200.0, -60.0, d) * (1 - smoothstep(120.0, 300.0, d))
    s = 0 if slope is None else smoothstep(0.25, 0.6, slope)
    return np.clip(np.maximum(face * 0.85, s), 0, 1)


def bl(x, y, z):
    """three.js (x, y, z) -> Blender (x, y, z)."""
    return (x, -z, y)
