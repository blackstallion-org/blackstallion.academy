"""Markdown tables from the before/after JSON files of qa-marwari/perf.mjs.
usage: python3 summarize_perf.py <dir with before-<profile>[-uncapped].json and after-<profile>[-uncapped].json>
"""
import json, os, sys, statistics as st
d = sys.argv[1] if len(sys.argv) > 1 else "out/perf"
def load(tag, prof, suffix=""):
    p = f"{d}/{tag}-{prof}{suffix}.json"
    return json.load(open(p)) if os.path.exists(p) else None
def sync(s):
    meds = [b["median"] for b in s["syncRenderMs"]]
    return round(st.mean(meds), 2)
def row(b, a):
    return (b["fps"], a["fps"], b["frameMs"]["p95"], a["frameMs"]["p95"], b["frameMs"]["p99"], a["frameMs"]["p99"], b["over20ms"], a["over20ms"], b["over33ms"], a["over33ms"], sync(b), sync(a),
            (b["gpuMs"].get("p50") if isinstance(b["gpuMs"], dict) else None), (a["gpuMs"].get("p50") if isinstance(a["gpuMs"], dict) else None),
            b["drawCalls"]["median"], a["drawCalls"]["median"], b["triangles"]["median"], a["triangles"]["median"], b["pixelRatio"], a["pixelRatio"], b["tier"], a["tier"])
out = []
for suffix, label in (("", "capped (vsync, 60 Hz)"), ("-uncapped", "uncapped (no vsync: shows the real cost per frame)")):
    for prof in ["desktop1", "desktop2", "mobile", "mobile4x"]:
        b, a = load("before", prof, suffix), load("after", prof, suffix)
        if not b or not a: continue
        out.append(f"\n#### {prof} {label}  (canvas {b['scenarios'][0]['canvasPx']} / {a['scenarios'][0]['canvasPx']}; {a['device']['renderer'][:60]})\n")
        out.append("| scenario | fps before > after | frame p95 ms | frame p99 ms | frames over 20 ms | over 33 ms | sync render ms (render+readPixels) | GPU ms p50 | draw calls | triangles | quality tier |")
        out.append("|---|---|---|---|---|---|---|---|---|---|---|")
        bs = {s["scenario"]: s for s in b["scenarios"]}
        for s in a["scenarios"]:
            if s["scenario"] not in bs: continue
            r = row(bs[s["scenario"]], s)
            out.append(f"| {s['scenario']} | {r[0]} > {r[1]} | {r[2]} > {r[3]} | {r[4]} > {r[5]} | {r[6]} > {r[7]} | {r[8]} > {r[9]} | {r[10]} > {r[11]} | {r[12]} > {r[13]} | {r[14]} > {r[15]} | {r[16]:,} > {r[17]:,} | {r[20]} > {r[21]} |")
print("\n".join(out))
