import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0,"/tmp/audit")
from req import ROUTES
OUT="/tmp/audit/shots"; os.makedirs(OUT,exist_ok=True)
async def main():
    res={"overflow":[], "console":{}, "status":{}, "focus":{}, "reduced":{}}
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,h in ((390,844),(768,1024),(1440,900)):
            ctx=await b.new_context(viewport={"width":w,"height":h})
            pg=await ctx.new_page()
            errs=[]
            pg.on("console", lambda m: errs.append(m.text[:140]) if m.type=="error" and "cloudfront" not in m.text and "Failed to load resource" not in m.text else None)
            pg.on("pageerror", lambda e: errs.append("PAGEERROR "+str(e)[:140]))
            for r in ROUTES:
                errs.clear()
                resp=await pg.goto("http://localhost:3500"+r, wait_until="networkidle"); await pg.wait_for_timeout(700)
                res["status"][f"{w}{r}"]=resp.status
                ov=await pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                if ov>1: res["overflow"].append((w,r,ov))
                if errs: res["console"][f"{w}{r}"]=list(errs)
                name=(r.strip("/").replace("/","_").replace("?","_").replace("=","-") or "home")
                await pg.screenshot(path=f"{OUT}/{w}_{name}.jpg", type="jpeg", quality=60)
            await ctx.close()
        # keyboard focus visibility on key pages
        ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        for r in ["/","/contact?gate=parents","/curriculum","/command","/lore"]:
            await pg.goto("http://localhost:3500"+r, wait_until="networkidle"); await pg.wait_for_timeout(600)
            bad=[]; seen=0
            for i in range(25):
                await pg.keyboard.press("Tab")
                info=await pg.evaluate("""()=>{const e=document.activeElement; if(!e||e===document.body) return null; const c=getComputedStyle(e);
                  const vis=(c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>0)||c.boxShadow!=='none'||c.textDecorationLine.includes('underline');
                  return {tag:e.tagName, txt:(e.innerText||e.getAttribute('aria-label')||e.name||'').slice(0,30), vis}}""")
                if info: seen+=1
                if info and not info["vis"]: bad.append(info)
            res["focus"][r]={"tabbed":seen,"no_visible_focus":bad[:5]}
        await ctx.close()
        # reduced motion
        ctx=await b.new_context(viewport={"width":1440,"height":900}, reduced_motion="reduce"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:120]))
        for r in ["/","/legend","/lore","/curriculum","/cadets","/why","/schools"]:
            await pg.goto("http://localhost:3500"+r, wait_until="networkidle"); await pg.wait_for_timeout(600)
            st=await pg.evaluate("[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).position==='sticky').length")
            res["reduced"][r]={"sticky_elements":st}
        res["reduced"]["errors"]=errs
        await b.close()
    print(json.dumps(res,indent=1))
asyncio.run(main())
