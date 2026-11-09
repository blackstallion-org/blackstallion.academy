#!/usr/bin/env python3
"""
Ingest generated master images for the history scrolls.

    python3 -I scripts/history-ingest.py <raw_dir> [--accept "review note"]

<raw_dir> holds <ID>.png files (for example JH01-S.png) and an optional jobs.json mapping id -> Higgsfield job id.
Each file is converted to WebP at its ledger path under public/ (alpha kept for transparent layers, backgrounds capped
at 2400 px wide), and the ledger entry gets its real width and height, job id and status "candidate". With --accept the
status becomes "accepted" and the review note is stored: use it only after looking at every image yourself.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "docs/history-scrolls/ASSET_LEDGER.json"
MAX_W = {"B": 2400, "opening": 2400}


def main() -> None:
    raw = Path(sys.argv[1])
    accept = sys.argv[sys.argv.index("--accept") + 1] if "--accept" in sys.argv else None
    jobs = json.loads((raw / "jobs.json").read_text()) if (raw / "jobs.json").exists() else {}
    data = json.loads(LEDGER.read_text())
    by_id = {a["id"]: a for a in data["assets"]}
    done = []
    for src in sorted(raw.glob("*.png")):
        a = by_id.get(src.stem)
        if not a:
            continue
        im = Image.open(src)
        im = im.convert("RGBA") if a["alpha"] else im.convert("RGB")
        if a["alpha"] and im.getextrema()[3][0] > 0:
            print(f"! {a['id']} has no transparent pixels; left as pending", file=sys.stderr)
            continue
        limit = MAX_W.get(a["role"])
        if limit and im.width > limit:
            im = im.resize((limit, round(im.height * limit / im.width)), Image.LANCZOS)
        out = ROOT / "public" / a["path"].lstrip("/")
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, "WEBP", quality=84, method=6, exact=a["alpha"])
        a["width"], a["height"] = im.size
        if src.stem in jobs:
            a.setdefault("generation", {})["job_id"] = jobs[src.stem]
        if a["status"] != "accepted":
            a["status"] = "accepted" if accept else "candidate"
        if accept:
            a["review"] = accept
            a["version"] = a.get("version", 1)
        done.append(f"{a['id']} {im.size[0]}x{im.size[1]} {out.stat().st_size // 1024} KB")
    LEDGER.write_text(json.dumps(data, indent=2) + "\n")
    print("\n".join(done) or "nothing ingested")


if __name__ == "__main__":
    main()
