import asyncio, json, io, sys
import numpy as np
from PIL import Image
import cv2
from playwright.async_api import async_playwright

B = "http://localhost:3500"
B2 = "http://localhost:3501"  # same build, LEAD_WEBHOOK_URL configured to a local test receiver
GL = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
R = {}

def rec(k, ok, note=""):
    R[k] = ("PASS" if ok else "FAIL") + (f" — {note}" if note else ""); print(k, R[k], flush=True)

async def shot_arr(pg, clip=None):
    return np.asarray(Image.open(io.BytesIO(await pg.screenshot(clip=clip))).convert("L")).astype(int)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=GL)

        # ---- L2 stallion (preview mode, real WebGL via SwiftShader)
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(B + "/?stallion=preview", wait_until="networkidle")
        await pg.wait_for_timeout(3500)
        c = pg.locator("canvas[role=img]")
        ready = await c.count() == 1 and await c.evaluate("e => getComputedStyle(e).opacity") == "1"
        rec("L2.model_loads", ready)
        box = await c.bounding_box()
        clip = {"x": box["x"], "y": box["y"], "width": box["width"], "height": box["height"]}
        await pg.mouse.move(box["x"] + 5, box["y"] + 5)
        await pg.wait_for_timeout(1800)
        a = await shot_arr(pg, clip)
        await pg.mouse.move(box["x"] + box["width"] - 5, box["y"] + box["height"] * 0.6)
        await pg.wait_for_timeout(1800)
        bb = await shot_arr(pg, clip)
        diff = float(np.abs(a - bb).mean())
        rec("L2.gaze_responds_to_cursor", diff > 0.5, f"mean pixel change {diff:.2f}")
        s1 = await shot_arr(pg, clip); await pg.wait_for_timeout(2200); s2 = await shot_arr(pg, clip)
        rec("L2.animates_idle(breath+sway)", float(np.abs(s1 - s2).mean()) > 0.05, f"{float(np.abs(s1 - s2).mean()):.3f}")
        navs = []
        pg.on("framenavigated", lambda f: navs.append(f.url) if f == pg.main_frame else None)
        await c.evaluate("e => { e.click(); e.click(); e.click(); }")  # repeated clicks must start one transition only
        await pg.wait_for_url("**/cadets#passport", timeout=6000)
        await pg.wait_for_timeout(800)
        rec("L2.click_dolly_opens_passport", pg.url.endswith("/cadets#passport"), pg.url)
        rec("L2.no_duplicate_transition", len([u for u in navs if "/cadets" in u]) <= 1, str(navs))
        rec("L2.no_page_errors", not errs, "; ".join(errs)[:200])
        await pg.close()

        # default home: no 3D until the real model is configured (documented fallback)
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        await pg.goto(B + "/", wait_until="networkidle"); await pg.wait_for_timeout(1000)
        rec("L2.default_hero_keeps_film_without_model", await pg.locator("canvas[role=img]").count() == 0)
        await pg.close()

        # reduced motion + preview: click goes straight to the passport
        ctx = await b.new_context(reduced_motion="reduce", viewport={"width": 1440, "height": 900})
        pg = await ctx.new_page()
        await pg.goto(B + "/?stallion=preview", wait_until="networkidle"); await pg.wait_for_timeout(1500)
        n = await pg.locator("text=Open the Sovereign Passport").count()
        if n:
            await pg.locator("text=Open the Sovereign Passport").first.click()
            await pg.wait_for_timeout(1500)
        rec("L2.reduced_motion_path", "/cadets" in pg.url or n == 0, f"buttons={n} url={pg.url}")
        await ctx.close()

        # WebGL unavailable -> canvas hidden, no passport button
        b2 = await p.chromium.launch(args=["--disable-3d-apis", "--disable-gpu"])
        pg = await b2.new_page(viewport={"width": 1440, "height": 900})
        await pg.goto(B + "/?stallion=preview", wait_until="networkidle"); await pg.wait_for_timeout(1500)
        op = await pg.locator("canvas[role=img]").evaluate("e => getComputedStyle(e).opacity") if await pg.locator("canvas[role=img]").count() else "absent"
        btn = await pg.locator("text=Open the Sovereign Passport").count()
        rec("L2.webgl_failure_fallback", op in ("0", "absent") and btn == 0, f"opacity={op} buttons={btn}")
        await b2.close()

        pg = await b.new_page(viewport={"width": 1440, "height": 900})

        # ---- L9 Brain & Spine HUD
        await pg.goto(B + "/", wait_until="networkidle")
        await pg.locator("#tab-spine").scroll_into_view_if_needed()
        await pg.locator("#tab-spine").click(); await pg.wait_for_timeout(900)
        lab = await pg.locator("text=Pelvic Kinematics: 3D Core Realignment").count()
        grid = await pg.locator("[data-hud=alignment-grid]").count()
        rec("L9.spine_hud", lab >= 1 and grid == 1, f"label={lab} goldgrid={grid}")
        await pg.locator("#tab-brain").click(); await pg.wait_for_timeout(500)
        rec("L9.brain_hud", await pg.locator("[data-hud=alignment-grid]").count() == 1)

        # ---- L9 crisis slider keyboard
        sl = pg.locator("[role=slider]").first
        await sl.scroll_into_view_if_needed(); await sl.focus()
        v0 = await sl.get_attribute("aria-valuenow")
        await pg.keyboard.press("ArrowLeft"); await pg.keyboard.press("ArrowLeft")
        v1 = await sl.get_attribute("aria-valuenow")
        rec("L9.compare_slider_keyboard", v0 != v1, f"{v0}->{v1}")
        cured = await pg.locator("text=Regal carriage").count()
        rec("L9.crisis_cure_concepts", cured >= 1 and await pg.locator("text=Tech-neck slouch").count() >= 1)

        # ---- L10 anatomy: five touchpoints, exact two
        await pg.goto(B + "/anatomy", wait_until="networkidle")
        btns = pg.locator("button[aria-label*=':']")
        cnt = await btns.count()
        names = []
        for i in range(cnt):
            lbl = await btns.nth(i).get_attribute("aria-label")
            if lbl not in names: names.append(lbl)
        rec("L10.five_touchpoints", len(names) >= 5, "; ".join(names))
        res = {}
        for key, want in [("Ears", ["180° Independent Acoustic Swivel", "Composure & Active Environmental Reading", "180° Radar"]), ("Neck", ["Cervical Biomechanical Lever", "Poise & Dynamic Weight Distribution", "The Balancer"])]:
            bt = pg.locator(f"button[aria-label^='{key}:']").first
            await bt.scroll_into_view_if_needed(); await bt.focus(); await bt.click(force=True); await pg.wait_for_timeout(1200)
            txt = await pg.evaluate("document.body.innerText")
            res[key] = [w for w in want if w.lower() not in txt.lower()]
        rec("L10.ears_neck_exact", not any(res.values()), json.dumps(res))
        ok = True
        for i in range(min(cnt, 5)):
            bt = btns.nth(i)
            if not await bt.is_visible(): continue
            await bt.click(); await pg.wait_for_timeout(250)
            ok = ok and (await bt.get_attribute("aria-pressed")) == "true"
        rec("L10.touchpoints_interactive", ok)

        # ---- L13 codex: 13 pillars, each expands with skill & trait
        await pg.goto(B + "/curriculum", wait_until="networkidle")
        tiles = pg.locator("button[aria-controls^=codex-]:not([aria-controls=codex-panel])")
        n = await tiles.count()
        from_content = {d["n"]: d for d in json.load(open("/tmp/audit/pillars.json"))}
        missing = []
        for i in range(n):
            t = tiles.nth(i)
            num = int((await t.get_attribute("aria-controls")).split("-")[1])
            await t.scroll_into_view_if_needed()
            if (await t.get_attribute("aria-expanded")) != "true":
                await t.click(); await pg.wait_for_timeout(900)
            txt = (await pg.locator(f"#codex-{num}").inner_text()).lower()
            p_ = from_content[num]
            for k in ("skill", "trait"):
                if p_[k].lower() not in txt: missing.append(f"{p_['n']}.{k}")
        rec("L13.thirteen_pillars_expand", n == 13 and not missing, f"tiles={n} missing={missing}")

        # ---- L12 ranks interactive
        await pg.locator("#rank-tab-lancer").scroll_into_view_if_needed()
        await pg.locator("#rank-tab-lancer").click(); await pg.wait_for_timeout(400)
        panel = await pg.locator("#rank-panel").inner_text()
        rec("L12.rank_progression", "Sovereign Lancer" in panel and "epaulettes" in panel.lower(), panel[:120].replace("\n", " | "))

        # ---- L17 terminal chips
        await pg.goto(B + "/command", wait_until="networkidle"); await pg.wait_for_timeout(4000)
        chip_want = {"CapEx & revenue share": ("What is the financial model for partner school boards?", "zero capital expenditure"),
                     "Insurance & safety record": ("What is the safety record for Cadet Lancer drills?", "helmets"),
                     "STPCI accreditation": ("Is this program officially recognized for competitions?", "School Tent Pegging Council of India"),
                     "Curriculum & class timings": ("How do riding sessions fit into academic schedules?", "06:15 AM")}
        bad = []
        for chip, (q, a) in chip_want.items():
            btn = pg.locator(f"button:has-text('{chip}')").first
            await btn.scroll_into_view_if_needed()
            for _ in range(30):
                if await btn.is_enabled(): break
                await pg.wait_for_timeout(300)
            await btn.click()
            for _ in range(60):
                if await btn.is_enabled(): break
                await pg.wait_for_timeout(300)
            log = await pg.locator("[role=log]").inner_text()
            if q not in log or a.lower() not in log.lower(): bad.append(chip)
        rec("L17.chips_answer", not bad, f"failed={bad}")
        await pg.locator("#cmd-input").fill("Who are the instructors?"); await pg.keyboard.press("Enter")
        await pg.wait_for_timeout(5000)
        log = await pg.locator("[role=log]").inner_text()
        rec("L16.faculty_pipeline", "61st Cavalry" in log and "not confirmed affiliations" in log)

        # ---- L18 gates
        for gate, header in [("parents", "Enrol a Cadet"), ("schools", "Partner Your Campus"), ("audit", "Schedule a Board Audit")]:
            await pg.goto(B + f"/contact?gate={gate}", wait_until="networkidle"); await pg.wait_for_timeout(1800)
            h = await pg.locator("h3").filter(has_text=header).count()
            rec(f"L18.gate_{gate}_direct_url", h == 1)
        # validation: empty submit
        await pg.goto(B + "/contact?gate=schools", wait_until="networkidle"); await pg.wait_for_timeout(800)
        await pg.locator("button:has-text('REQUEST CAMPUS BLUEPRINT')").click(); await pg.wait_for_timeout(1500)
        errs_n = await pg.locator("[aria-invalid=true]").count()
        rec("L18.required_validation", errs_n >= 5, f"invalid fields={errs_n}")
        # invalid email/phone
        await pg.fill("input[name=name]", "Test Trustee"); await pg.fill("input[name=organisation]", "Test Campus, Pune")
        await pg.select_option("select[name=acreage]", index=1); await pg.select_option("select[name=capacity]", index=1)
        await pg.fill("input[name=email]", "not-an-email"); await pg.fill("input[name=phone]", "12")
        await pg.locator("button:has-text('REQUEST CAMPUS BLUEPRINT')").click(); await pg.wait_for_timeout(1500)
        em = await pg.locator("input[name=email][aria-invalid=true]").count(); ph = await pg.locator("input[name=phone][aria-invalid=true]").count()
        kept = await pg.input_value("input[name=organisation]")
        rec("L18.email_phone_validation_and_values_kept", em == 1 and ph == 1 and kept == "Test Campus, Pune", f"email={em} phone={ph} kept={kept!r}")
        # valid, no backend -> truthful "not sent"
        await pg.fill("input[name=email]", "principal@example.org"); await pg.fill("input[name=phone]", "+91 98765 43210")
        await pg.locator("button:has-text('REQUEST CAMPUS BLUEPRINT')").click(); await pg.wait_for_timeout(1800)
        al = pg.locator("[role=alert]").filter(has_text="NOT")
        alert = await al.first.inner_text() if await al.count() else ""
        seal = await pg.locator("text=RECEIVED").count()
        rec("L18.truthful_when_not_configured", "NOT SENT" in alert.upper() and seal == 0, alert[:100])
        # audit date validation (past date)
        await pg.goto(B + "/contact?gate=audit", wait_until="networkidle"); await pg.wait_for_timeout(800)
        await pg.fill("input[name=name]", "Board Member"); await pg.fill("input[name=designation]", "Trustee"); await pg.fill("input[name=organisation]", "Zone 02A")
        await pg.fill("input[name=date]", "2020-01-01"); await pg.select_option("select[name=slot]", index=1); await pg.fill("input[name=email]", "b@example.org")
        await pg.locator("button:has-text('CONFIRM BOARD AUDIT')").click(); await pg.wait_for_timeout(1500)
        rec("L18.date_validation", await pg.locator("input[name=date][aria-invalid=true]").count() == 1)
        # with a configured backend -> delivered, then sealed
        await pg.goto(B2 + "/contact?gate=parents", wait_until="networkidle"); await pg.wait_for_timeout(800)
        await pg.fill("input[name=name]", "Parent Test"); await pg.fill("input[name=student]", "Aarav, 11")
        await pg.select_option("select[name=zone]", label="03B · Baner-Wakad & Pimpri-Chinchwad Axis (Pune)")
        await pg.select_option("select[name=tier]", index=1); await pg.fill("input[name=email]", "parent@example.org")
        btn = pg.locator("button:has-text('SUBMIT CADET APPLICATION')")
        await btn.click()
        await pg.wait_for_timeout(2500)
        sealed = await pg.locator("text=Received.").count()
        try:
            lines = open("/tmp/hook.log").read().strip().splitlines()
        except FileNotFoundError:
            lines = []
        last = json.loads(lines[-1]) if lines else {}
        rec("L18.delivered_when_configured", sealed == 1 and len(lines) == 1 and last.get("auth") == "Bearer testsecret" and last["body"]["fields"]["zone"].startswith("03B"),
            f"sealed={sealed} posts={len(lines)}")

        # ---- L14 zones
        await pg.goto(B + "/schools", wait_until="networkidle")
        txt = await pg.evaluate("document.body.textContent")
        codes = ["01A","01B","01C","02A","02B","02C","03A","03B","03C","04A","04B","04C","05A","05B","05C","06A","06B"]
        rec("L14.seventeen_zones", all(c_ in txt for c_ in codes), str([c_ for c_ in codes if c_ not in txt]))

        # ---- L18/20 QR seal decodes to the verify URL
        await pg.goto(B + "/verify/BSAH-2026-HYD-042", wait_until="networkidle")
        svg = pg.locator("svg[aria-label^='QR code']").first
        await svg.scroll_into_view_if_needed()
        img = np.asarray(Image.open(io.BytesIO(await svg.screenshot())).convert("L"))
        img = cv2.resize(img, (img.shape[1] * 4, img.shape[0] * 4), interpolation=cv2.INTER_NEAREST)
        dec = cv2.QRCodeDetector().detectAndDecode(img)[0]
        rec("L20.qr_seal_decodes", dec == "https://blackstallion.academy/verify/BSAH-2026-HYD-042", dec)

        # ---- L19 sound toggle default off, toggles, survives missing files
        await pg.goto(B + "/", wait_until="networkidle")
        st = pg.locator("button[aria-pressed]").filter(has_text="Sound").first
        before = await st.get_attribute("aria-pressed")
        reqs = []
        pg.on("request", lambda r: reqs.append(r.url) if "/audio/" in r.url else None)
        perrs = []
        pg.on("pageerror", lambda e: perrs.append(str(e)))
        await st.click(); await pg.wait_for_timeout(1500)
        after = await st.get_attribute("aria-pressed")
        await st.click(); await pg.wait_for_timeout(300)
        off_again = await st.get_attribute("aria-pressed")
        rec("L19.sound_default_off_and_toggles", before == "false" and after == "true" and off_again == "false", f"{before}->{after}->{off_again}; audio requests={len(reqs)}; errors={len(perrs)}")

        await b.close()
    print(json.dumps(R, indent=1, ensure_ascii=False))

asyncio.run(main())
