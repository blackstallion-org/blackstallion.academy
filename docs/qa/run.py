import asyncio, json, sys
sys.path.insert(0,"/tmp/audit")
from req import R, FORBID, ROUTES
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else "3500"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":1440,"height":900})
        texts={}; errs={}
        for r in ROUTES:
            e=[]; pg.on("console", lambda m, e=e: e.append(m.text) if m.type=="error" else None)
            resp=await pg.goto(f"http://localhost:{PORT}{r}",wait_until="networkidle")
            await pg.wait_for_timeout(500)
            texts[r]=(await pg.evaluate("document.body.textContent")).lower()
            errs[r]=(resp.status if resp else None, [x[:120] for x in e if "cloudfront" not in x and "Failed to load resource" not in x][:3])
            pg.remove_listener("console", pg.listeners("console")[0]) if hasattr(pg,"listeners") else None
        res={}
        for k,(r,subs) in R.items():
            miss=[s for s in subs if s.lower() not in texts.get(r,"")]
            res[k]="PASS" if not miss else "MISSING: "+"; ".join(miss)
        forb={f:[r for r in ROUTES if f.lower() in texts[r]] for f in FORBID}
        forb={k:v for k,v in forb.items() if v}
        print(json.dumps({"results":res,"forbidden_found":forb,"status_errors":{r:v for r,v in errs.items() if v[0]!=200 or v[1]}},indent=1))
        await b.close()
asyncio.run(main())
