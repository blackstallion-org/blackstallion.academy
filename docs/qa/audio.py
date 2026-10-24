import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg=await b.new_page()
        await pg.add_init_script("""(()=>{const O=window.Audio;window.__aud=[];window.Audio=function(s){const a=new O(s);window.__aud.push(a);return a};window.Audio.prototype=O.prototype;})()""")
        resp={}
        pg.on("response", lambda r: resp.__setitem__(r.url.split('/')[-1], r.status) if "/audio/" in r.url else None)
        await pg.goto("http://localhost:3500/",wait_until="networkidle")
        st=pg.locator("button[aria-pressed]").filter(has_text="Sound").first
        await st.click(); await pg.wait_for_timeout(2500)
        amb=await pg.evaluate("window.__aud.map(a=>({src:a.src.split('/').pop(),t:a.currentTime,paused:a.paused,err:a.error&&a.error.code,dur:a.duration}))")
        await st.click(); await pg.wait_for_timeout(500)
        after=await pg.evaluate("window.__aud.map(a=>a.paused)")
        await pg.goto("http://localhost:3500/command",wait_until="networkidle")
        st=pg.locator("button[aria-pressed]").filter(has_text="Sound").first
        await st.click(); await pg.wait_for_timeout(300)
        await pg.locator("#cmd-input").type("abcdefghij", delay=20); await pg.wait_for_timeout(800)
        keys=await pg.evaluate("window.__aud.filter(a=>a.src.includes('keystroke')).map(a=>({t:a.currentTime,err:a.error&&a.error.code}))")
        await pg.goto("http://localhost:3500/legend",wait_until="networkidle"); await pg.wait_for_timeout(500)
        await pg.mouse.wheel(0,1500); await pg.wait_for_timeout(2500)
        br=await pg.evaluate("window.__aud.filter(a=>a.src.includes('breath')).map(a=>({t:a.currentTime,err:a.error&&a.error.code}))")
        print(json.dumps({"ambient_on":amb,"paused_after_off":after,"keystrokes":len(keys),"key_errors":[k for k in keys if k['err']],"breath":br,"responses":resp},indent=0))
        await b.close()
asyncio.run(main())
