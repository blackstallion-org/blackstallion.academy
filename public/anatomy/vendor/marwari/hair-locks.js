// Generated from components/3d/hair-locks.ts by scripts/build-anatomy-vendor.mjs. Do not edit.
/**
 * Mane, forelock, tail and dock built as soft, tapered locks of hair (plain typed arrays: no three.js here, so the shapes can be tested
 * in node and rebuilt cheaply when the quality tier changes).
 *
 * Why not the exported ribbons: the 125 flat ribbons in the GLB stand up from the crest as blades and hang from the croup as a slab. Here
 * every lock is a narrow card that
 *   - lies on the real surface of the neck (the caller measures the skin in a ring of stations along the neck; a lock rooted on the crest
 *     sweeps down the near side at the skin's own radius plus a layer offset, so it can neither float nor sink into the neck),
 *   - tapers to a point (width falls to about a fifth at the tip) and has a rounded cross-section (three columns, the middle one raised) so it
 *     catches light like hair and not like a plank,
 *   - sits in one of three layers (inner, middle, outer) whose tips lift off the neck a little more each, so the silhouette is layered,
 *   - is skinned to the neck and mane bones (mane) or the tail bones (tail), so the clips and the gait move it.
 * The tail is a bundle of strands whose roots fill a disc round the tail's axis (phyllotaxis: any prefix of the list is evenly spread, which is
 * how the quality tiers drop strands) and whose offsets open out toward the tip, so the end of the tail breaks into separate strands.
 * A short tapered tube covers the dock (the bony top of the tail), so the long hair starts below a proper root and not at the croup.
 *
 * Coordinates are the model's bind pose (glTF: +Y up, the horse faces +Z, its left flank is +X), in metres.
 */
/** The kinds of geometry, carried per vertex so the shader can treat the dock (opaque) differently from hair. */
export const KIND = { mane: 0, tail: 1, forelock: 2, dock: 3 };
export const HULL_BINS = 48;
/** The skin's radius at angle `phi` (radians from the crest toward the side), interpolated between bins. */
export function hullRadius(st, phi) {
    const n = st.hull.length;
    let f = ((phi + Math.PI) / (2 * Math.PI)) * n;
    f = ((f % n) + n) % n;
    const i = Math.floor(f);
    const t = f - i;
    return st.hull[i % n] * (1 - t) + st.hull[(i + 1) % n] * t;
}
/* ------------------------------------------------------------------ small helpers */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
    const l = len(a);
    return l < 1e-9 ? [0, 1, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Small deterministic generator (mulberry32). */
export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const GOLDEN = 0.6180339887498949;
const GOLDEN_ANGLE = 2.399963229728653;
/** The film's quality tier (0 richest .. 3 lightest) -> the hair tier: the top two tiers keep every lock and the soft fringe pass. */
export function hairLodForTier(tier) {
    return tier <= 1 ? 0 : tier === 2 ? 1 : 2;
}
/** A first guess, before any frame has been timed, from what the browser reports about the device. */
export function hairLodForDevice(d) {
    const cores = d.cores ?? 8, mem = d.memoryGb ?? 8;
    if (cores <= 2 || mem <= 2)
        return 2;
    if (cores <= 4 || mem <= 4 || d.saveData || (d.coarse && (d.width ?? 1000) <= 480 && cores <= 6))
        return 1;
    return 0;
}
/** How much of the hair's own movement (lag, flutter, tail lift) is applied: none when reduced motion is on. */
export function hairMotion(reduced, flow) {
    return reduced ? 0 : Math.max(0, Math.min(1, flow));
}
/** Rows along a lock for each tier. */
export const ROWS = { 0: 14, 1: 10, 2: 7 };
/** Share of the full lock count each tier draws. */
export const LOCK_SHARE = { 0: 1, 1: 0.66, 2: 0.4 };
const newWriter = () => ({ pos: [], nor: [], uv: [], tan: [], seed: [], across: [], kind: [], si: [], sw: [], idx: [], verts: 0 });
/** Keep the four largest weights and make them sum to one. */
function pack(w) {
    const top = [...w].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = top.reduce((s, x) => s + x[1], 0) || 1;
    const ids = [0, 0, 0, 0], ws = [0, 0, 0, 0];
    top.forEach(([id, x], k) => { ids[k] = id; ws[k] = x / sum; });
    return [ids, ws];
}
/** Writes one lock as a three-column card from its rows (root first). */
function writeLock(wr, rows, seed, slot, kind, bulge) {
    const base = wr.verts;
    const last = rows.length - 1;
    for (let r = 0; r <= last; r++) {
        const row = rows[r];
        const [ids, ws] = pack(row.weights);
        const v = 1 - r / last;
        for (let c = 0; c < 3; c++) {
            const a = c - 1; // -1, 0, 1
            const raised = a === 0 ? bulge * row.half : 0;
            const p = add(add(row.p, mul(row.w, a * row.half)), mul(row.n, raised));
            // a rounded section: the side columns lean their normals away from the ridge
            const nn = norm(add(row.n, mul(row.w, a * 0.55)));
            wr.pos.push(p[0], p[1], p[2]);
            wr.nor.push(nn[0], nn[1], nn[2]);
            wr.uv.push((slot + 0.06 + 0.88 * (c / 2)) / 8, v);
            wr.tan.push(row.t[0], row.t[1], row.t[2]);
            wr.seed.push(seed);
            wr.across.push(a);
            wr.kind.push(kind);
            for (let k = 0; k < 4; k++) {
                wr.si.push(ids[k]);
                wr.sw.push(ws[k]);
            }
            wr.verts++;
        }
    }
    for (let r = 0; r < last; r++) {
        for (let c = 0; c < 2; c++) {
            const a = base + r * 3 + c, b = a + 1, d = a + 3, e = d + 1;
            wr.idx.push(a, d, b, b, d, e);
        }
    }
}
function finish(wr, locks, rows) {
    return {
        position: Float32Array.from(wr.pos), normal: Float32Array.from(wr.nor), uv: Float32Array.from(wr.uv), tangent: Float32Array.from(wr.tan),
        seed: Float32Array.from(wr.seed), across: Float32Array.from(wr.across), kind: Float32Array.from(wr.kind),
        skinIndex: Uint16Array.from(wr.si), skinWeight: Float32Array.from(wr.sw), index: Uint32Array.from(wr.idx),
        locks, rows, indicesPerLock: rows * 12,
    };
}
/** Empty mesh data (for parts that are not built at a tier). */
export function emptyHair() {
    return finish(newWriter(), 0, 0);
}
/** Concatenates parts into one geometry (indices are rebased; the per-lock draw range only applies to a single part, so keep it separate). */
export function mergeHair(parts) {
    const cat = (k) => {
        const arrs = parts.map((p) => p[k]);
        const out = new arrs[0].constructor(arrs.reduce((s, a) => s + a.length, 0));
        let o = 0;
        for (const a of arrs) {
            out.set(a, o);
            o += a.length;
        }
        return out;
    };
    let vbase = 0;
    const idx = [];
    for (const p of parts) {
        for (let i = 0; i < p.index.length; i++)
            idx.push(p.index[i] + vbase);
        vbase += p.position.length / 3;
    }
    return {
        position: cat("position"), normal: cat("normal"), uv: cat("uv"), tangent: cat("tangent"), seed: cat("seed"), across: cat("across"), kind: cat("kind"),
        skinIndex: cat("skinIndex"), skinWeight: cat("skinWeight"), index: Uint32Array.from(idx),
    };
}
/** Locks in the mane at full quality (inner, middle and outer layers share them 1 : 1 : 1 by order). */
export const MANE_LOCKS = 170;
function lerpStation(st, t) {
    const f = clamp(t, 0, 1) * (st.length - 1);
    const i = Math.min(st.length - 2, Math.floor(f));
    const u = f - i;
    const a = st[i], b = st[i + 1];
    return {
        center: lerp3(a.center, b.center, u), tangent: norm(lerp3(a.tangent, b.tangent, u)), up: norm(lerp3(a.up, b.up, u)), side: norm(lerp3(a.side, b.side, u)),
        hull: a.hull.map((h, k) => h * (1 - u) + b.hull[k] * u),
        neck: u < 0.5 ? a.neck : b.neck, mane: u < 0.5 ? a.mane : b.mane,
    };
}
const LAYERS = [
    // offset from the skin (m), tip lift (m), length (m), half width (m), where on the side the root starts (rad)
    { off: 0.005, lift: 0.006, len: [0.2, 0.36], half: [0.011, 0.017], phi0: [0.1, 0.3] },
    { off: 0.013, lift: 0.018, len: [0.24, 0.46], half: [0.012, 0.019], phi0: [0.0, 0.2] },
    { off: 0.022, lift: 0.036, len: [0.26, 0.52], half: [0.013, 0.021], phi0: [-0.1, 0.1] },
];
export function buildMane(spec) {
    const { stations, bone, lod } = spec;
    const rnd = rng(spec.seed ?? 4242);
    const rows = ROWS[lod];
    const count = Math.round(MANE_LOCKS * LOCK_SHARE[lod]);
    const wr = newWriter();
    for (let i = 0; i < count; i++) {
        const layer = LAYERS[i % 3];
        // roots spread along the crest by the golden ratio, so any prefix of the list covers it evenly
        const t0 = 0.03 + 0.94 * ((0.5 + i * GOLDEN) % 1);
        const ends = Math.sin(Math.PI * t0);
        const envelope = 0.5 + 0.5 * Math.pow(ends, 0.6); // shorter at the withers and the poll, where the neck turns and a long lock would fold
        const L = (layer.len[0] + (layer.len[1] - layer.len[0]) * rnd()) * envelope;
        const half0 = (layer.half[0] + (layer.half[1] - layer.half[0]) * rnd()) * (0.7 + 0.3 * Math.pow(ends, 0.5));
        const phi0 = layer.phi0[0] + (layer.phi0[1] - layer.phi0[0]) * rnd();
        const drift = 0.035 + 0.11 * rnd(); // the locks slide toward the withers as they fall
        const lift = layer.lift * (0.6 + 0.8 * rnd());
        const wave = (rnd() - 0.5) * 0.05; // a lock is not straight: it drifts along the neck in a slow S
        const waveF = 2 + 3.5 * rnd();
        const seed = rnd();
        const slot = Math.floor(rnd() * 8);
        const rootSt = lerpStation(stations, t0);
        const rBase = Math.max(0.08, hullRadius(rootSt, 1.0));
        const sweepMax = clamp(L / rBase, 0.5, 2.0) * (0.9 + 0.2 * rnd());
        const rowsOut = [];
        for (let r = 0; r <= rows; r++) {
            const s = r / rows;
            const t = clamp(t0 - drift * s, 0, 1);
            const st = lerpStation(stations, t);
            const ease = 1 - (1 - s) * (1 - s) * (1 - 0.35 * s); // quick at first, then lying down
            const phi = phi0 + sweepMax * ease;
            const radial = add(mul(st.up, Math.cos(phi)), mul(st.side, Math.sin(phi)));
            // the root row sits a little under the skin so the crest edge is clean; the layers then rise to their own height
            const off = layer.off * smooth(0, 0.15, s) - 0.014 * (1 - smooth(0, 0.1, s)) + lift * Math.pow(s, 2.1) + 0.004 * Math.sin(Math.PI * s);
            const skin = hullRadius(st, phi) + off;
            let p = add(st.center, mul(radial, skin));
            p = add(p, mul(st.tangent, wave * Math.sin(s * waveF + seed * 6.28) * s));
            const half = half0 * (1 - 0.88 * smooth(0.25, 1, s)) * (0.85 + 0.15 * Math.sin(s * 3 + seed * 5));
            const w = st.tangent;
            const nOut = radial;
            const k = smooth(0, 1, s) * 0.85; // roots follow the neck, tips follow the mane bones
            const weights = [];
            for (const [b, wt] of st.neck)
                weights.push([bone[b], wt * (1 - k)]);
            for (const [b, wt] of st.mane)
                weights.push([bone[b], wt * k]);
            rowsOut.push({ p, t: [0, -1, 0], w, n: nOut, half, weights: weights.filter((x) => x[0] !== undefined && x[1] > 0) });
        }
        // strand direction from the path itself
        for (let r = 0; r <= rows; r++) {
            const a = rowsOut[Math.max(0, r - 1)].p, b = rowsOut[Math.min(rows, r + 1)].p;
            rowsOut[r].t = norm(sub(b, a));
        }
        writeLock(wr, rowsOut, seed, slot, KIND.mane, 0.4);
    }
    return finish(wr, count, rows);
}
/** Locks in the forelock at full quality. */
export const FORELOCK_LOCKS = 13;
export function buildForelock(spec) {
    const rnd = rng(spec.seed ?? 99);
    const rows = ROWS[spec.lod];
    const count = Math.max(4, Math.round(FORELOCK_LOCKS * LOCK_SHARE[spec.lod]));
    const wr = newWriter();
    const prof = spec.profile;
    const segLen = [0];
    for (let i = 1; i < prof.length; i++)
        segLen.push(segLen[i - 1] + len(sub(prof[i], prof[i - 1])));
    const total = segLen[segLen.length - 1];
    const at = (d) => {
        const x = clamp(d, 0, total + 0.6);
        if (x >= total) {
            // past the end of the forehead the lock hangs
            const end = prof[prof.length - 1];
            const dirEnd = norm(sub(end, prof[prof.length - 2]));
            const k = x - total;
            const droop = norm(add(mul(dirEnd, 0.5), [0, -1, 0]));
            return { p: add(end, mul(droop, k)), t: droop, n: norm(cross(spec.left, droop)) };
        }
        let i = 1;
        while (i < segLen.length - 1 && segLen[i] < x)
            i++;
        const u = (x - segLen[i - 1]) / Math.max(1e-6, segLen[i] - segLen[i - 1]);
        const p = lerp3(prof[i - 1], prof[i], u);
        const t = norm(sub(prof[i], prof[i - 1]));
        let n = norm(cross(spec.left, t));
        if (n[1] < 0)
            n = mul(n, -1);
        return { p, t, n };
    };
    // the order of the locks is shuffled across the poll, so the prefix kept at a lower tier still spans it
    for (let i = 0; i < count; i++) {
        const c = ((i * GOLDEN + 0.31) % 1) - 0.5; // -0.5 .. 0.5 across the poll, between the ears
        const lateral = c * 0.085 + (rnd() - 0.5) * 0.008;
        const L = 0.15 + 0.07 * rnd() - 0.06 * Math.abs(c); // short: the middle locks hang longest, to about the eyes
        const half0 = 0.016 + 0.006 * rnd();
        const seed = rnd();
        const slot = Math.floor(rnd() * 8);
        const waveA = (rnd() - 0.5) * 0.03;
        const waveF = 2 + 3 * rnd();
        // Each lock is turned about its own axis by a different angle: cards that all face forward vanish edge-on from the side, and the
        // forelock would be one wisp. Turned, some of them face sideways and the whole shows from every direction.
        const turn = (rnd() - 0.5) * 2.4;
        const cT = Math.cos(turn), sT = Math.sin(turn);
        const rowsOut = [];
        for (let r = 0; r <= rows; r++) {
            const s = r / rows;
            const q = at(0.01 + s * L);
            // an arch: the hair stands off the poll as it leaves it, then comes down over the forehead
            const off = 0.007 + 0.026 * Math.pow(Math.sin(Math.PI * clamp(0.12 + 0.8 * s, 0, 1)), 1.4);
            const side = lateral * (1 + 0.9 * s) + waveA * Math.sin(s * waveF * 2 + seed * 6.28) * s;
            const p = add(add(q.p, mul(q.n, off)), mul(spec.left, side));
            const half = half0 * (1 - 0.8 * smooth(0.3, 1, s));
            const w = norm(add(mul(spec.left, cT), mul(q.n, sT)));
            const n = norm(add(mul(q.n, cT), mul(spec.left, -sT)));
            rowsOut.push({ p, t: q.t, w, n, half, weights: spec.weights.map(([b, wt]) => [spec.bone[b], wt]).filter((x) => x[0] !== undefined) });
        }
        // the direction of the strand from the path itself
        for (let r = 0; r <= rows; r++) {
            const a = rowsOut[Math.max(0, r - 1)].p, b = rowsOut[Math.min(rows, r + 1)].p;
            rowsOut[r].t = norm(sub(b, a));
        }
        writeLock(wr, rowsOut, seed, slot, KIND.forelock, 0.4);
    }
    return finish(wr, count, rows);
}
export const TAIL_STRANDS = 110;
/** A smooth curve through the points (Catmull-Rom), as a function of arc length 0..1. */
export function tailCurve(points) {
    const n = points.length;
    const samples = [];
    const P = (i) => points[clamp(i, 0, n - 1)];
    for (let i = 0; i < n - 1; i++) {
        for (let k = 0; k < 12; k++) {
            const t = k / 12, t2 = t * t, t3 = t2 * t;
            const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
            const c = [0, 0, 0];
            for (let a = 0; a < 3; a++)
                c[a] = 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3);
            samples.push(c);
        }
    }
    samples.push(points[n - 1]);
    const cum = [0];
    for (let i = 1; i < samples.length; i++)
        cum.push(cum[i - 1] + len(sub(samples[i], samples[i - 1])));
    const total = cum[cum.length - 1];
    // A rotation-minimising frame along the curve (parallel transport). Recomputing "up across the axis" at each point flips where the
    // axis runs straight down, which is most of the tail; transporting the first frame never does.
    const axes = [], u1s = [], u2s = [];
    const worldUp = [0, 1, 0];
    for (let i = 0; i < samples.length; i++) {
        const a = norm(sub(samples[Math.min(samples.length - 1, i + 1)], samples[Math.max(0, i - 1)]));
        let u;
        if (i === 0)
            u = norm(sub(worldUp, mul(a, dot(worldUp, a))));
        else
            u = norm(sub(u1s[i - 1], mul(a, dot(u1s[i - 1], a))));
        axes.push(a);
        u1s.push(u);
        u2s.push(norm(cross(a, u)));
    }
    const locate = (s) => {
        const d = clamp(s, 0, 1) * total;
        let i = 1;
        while (i < cum.length - 1 && cum[i] < d)
            i++;
        return { i, u: clamp((d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]), 0, 1) };
    };
    return {
        total,
        at(s) {
            const { i, u } = locate(s);
            return lerp3(samples[i - 1], samples[i], u);
        },
        /** The frame at arc position s: the axis and two unit vectors across it. */
        frame(s) {
            const { i, u } = locate(s);
            return { axis: norm(lerp3(axes[i - 1], axes[i], u)), u1: norm(lerp3(u1s[i - 1], u1s[i], u)), u2: norm(lerp3(u2s[i - 1], u2s[i], u)) };
        },
        /** Arc-length position (0..1) of each control point. */
        stops: points.map((p) => {
            let best = 0, bd = Infinity;
            samples.forEach((q, i) => { const d = len(sub(q, p)); if (d < bd) {
                bd = d;
                best = i;
            } });
            return cum[best] / total;
        }),
    };
}
/** Bone weights along the tail by arc length: each bone's influence falls off smoothly with distance, so the tail bends in a curve and
 * not at the four joints (linear blending between neighbours leaves visible kinks when the tail is carried high). */
export function tailWeights(s, stops, bone) {
    const names = ["Tail_1", "Tail_2", "Tail_3", "Tail_4"];
    const sigma = 0.16;
    const w = names.map((n, i) => {
        const d = i === names.length - 1 && s > stops[i] ? 0 : (s - stops[i]) / sigma; // beyond the last bone it keeps full weight
        return [bone[n], Math.exp(-d * d)];
    });
    return w;
}
export function buildTail(spec) {
    const rnd = rng(spec.seed ?? 777);
    const rows = ROWS[spec.lod];
    const count = Math.round(TAIL_STRANDS * LOCK_SHARE[spec.lod]);
    const ext = spec.tipExtension ?? 0.3;
    const last = spec.chain[spec.chain.length - 1];
    const prev = spec.chain[spec.chain.length - 2];
    const tip = add(last, mul(norm(sub(last, prev)), ext));
    const curve = tailCurve([...spec.chain, tip]);
    const wr = newWriter();
    for (let i = 0; i < count; i++) {
        // roots fill a disc round the axis (phyllotaxis): angle by the golden angle, radius by the square root of the rank
        const f = (i + 0.5) / count;
        const theta = i * GOLDEN_ANGLE;
        const rRoot = 0.036 * Math.sqrt(f);
        const spread = (0.03 + 0.1 * rnd()) * (0.35 + 0.65 * Math.sqrt(f));
        const seed = rnd();
        const slot = Math.floor(rnd() * 8);
        const wave = (0.008 + 0.014 * rnd());
        const waveF = 2.5 + 4 * rnd();
        const half0 = 0.013 + 0.008 * rnd();
        const rowsOut = [];
        let s0 = 0;
        for (let r = 0; r <= rows; r++) {
            // the strand's own start: the long hair begins below the dock, a little lower on top of it (sin(theta) > 0 is the top side)
            if (r === 0)
                s0 = 0.09 + 0.07 * rnd() + 0.05 * Math.max(0, Math.sin(theta));
            const s = s0 + (1 - s0) * (r / rows);
            const p0 = curve.at(s);
            const { axis, u1, u2 } = curve.frame(s);
            const dir = add(mul(u1, Math.sin(theta)), mul(u2, Math.cos(theta)));
            const open = smooth(0.2, 1, s) ** 1.15;
            const radial = rRoot + spread * open;
            const lateral = mul(norm(cross(axis, dir)), wave * Math.sin(s * waveF * 3 + seed * 6.28) * open);
            const p = add(add(p0, mul(dir, radial)), lateral);
            const along = (s - s0) / (1 - s0);
            const half = half0 * (1 - 0.86 * smooth(0.4, 1, along)) * (0.9 + 0.1 * Math.sin(along * 4 + seed * 5));
            rowsOut.push({ p, t: axis, w: norm(cross(axis, dir)), n: dir, half, weights: tailWeights(s, curve.stops, spec.bone) });
        }
        for (let r = 0; r <= rows; r++) {
            const a = rowsOut[Math.max(0, r - 1)].p, b = rowsOut[Math.min(rows, r + 1)].p;
            rowsOut[r].t = norm(sub(b, a));
        }
        writeLock(wr, rowsOut, seed, slot, KIND.tail, 0.35);
    }
    return finish(wr, count, rows);
}
/* ------------------------------------------------------------------ the dock */
/** How much of the pelvis the dock's first ring takes (measured: the coat round the tail root is 0.69 pelvis, 0.28 first tail bone). */
export const DOCK_ROOT_PELVIS = 0.69;
/** A short tapered tube round the top of the tail, opaque, in the hair's colour: the root the long hair grows from. */
export function buildDock(spec) {
    const curve = tailCurve(spec.chain);
    const rings = spec.lod === 2 ? 5 : 8;
    const sides = spec.lod === 2 ? 8 : 12;
    const wr = newWriter();
    const start = -0.035; // the tube begins just inside the rump and closes in a rounded cap, so no flat end can show above the croup
    for (let r = 0; r <= rings; r++) {
        const u = r / rings;
        const s = start + (0.22 - start) * u;
        const sc = clamp(s, 0, 1);
        let c, axis, u1, u2;
        if (s < 0) {
            const f0 = curve.frame(0);
            c = add(curve.at(0), mul(f0.axis, s * curve.total));
            axis = f0.axis;
            u1 = f0.u1;
            u2 = f0.u2;
        }
        else {
            c = curve.at(sc);
            ({ axis, u1, u2 } = curve.frame(sc));
        }
        const capT = clamp(u / 0.2, 0, 1);
        const radius = (0.042 - 0.016 * u) * Math.sqrt(1 - (1 - capT) * (1 - capT));
        // the croup is carried by the pelvis (about 0.7) and the first tail bone: the root of the dock follows it, so a lifted tail does not
        // pull the dock out of the rump
        const rootK = spec.bone.Pelvis === undefined ? 0 : (1 - smooth(0, 0.4, u)) * DOCK_ROOT_PELVIS;
        const w = tailWeights(sc, curve.stops, spec.bone).map(([b, x]) => [b, x * (1 - rootK)]);
        if (rootK > 0)
            w.push([spec.bone.Pelvis, rootK]);
        const [ids, ws] = pack(w);
        for (let k = 0; k < sides; k++) {
            const a = (k / sides) * Math.PI * 2;
            const dir = add(mul(u1, Math.sin(a)), mul(u2, Math.cos(a)));
            const p = add(c, mul(dir, radius));
            wr.pos.push(p[0], p[1], p[2]);
            wr.nor.push(dir[0], dir[1], dir[2]);
            wr.uv.push(0.5, 1 - u);
            wr.tan.push(axis[0], axis[1], axis[2]);
            wr.seed.push(0.5);
            wr.across.push(0);
            wr.kind.push(KIND.dock);
            for (let q = 0; q < 4; q++) {
                wr.si.push(ids[q]);
                wr.sw.push(ws[q]);
            }
            wr.verts++;
        }
    }
    for (let r = 0; r < rings; r++) {
        for (let k = 0; k < sides; k++) {
            const a = r * sides + k, b = r * sides + ((k + 1) % sides), d = a + sides, e = b + sides;
            wr.idx.push(a, d, b, b, d, e);
        }
    }
    return finish(wr, 1, rings);
}
