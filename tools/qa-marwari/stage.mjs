// Page helpers for the BSAH stallion stage: open it, hide dev chrome, drive the film engine, place a custom camera.
import { sleep } from "./harness.mjs";

export const URL_HOME = "http://localhost:3100/?stallion=preview&filmdebug=1";

export async function newPage(browser, { width = 1440, height = 900, mobile = false, dpr = 1, hour = null, reduced = false, assets = null } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced ? "reduce" : "no-preference",
    serviceWorkers: "block",
  });
  if (assets) await assets(ctx);
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => {
    const t = m.type();
    if (t === "error" || t === "warning") logs.push(`${t}: ${m.text().slice(0, 240)}`);
  });
  page.on("pageerror", (e) => logs.push("pageerror: " + String(e).slice(0, 240)));
  page.on("requestfailed", (r) => logs.push("requestfailed: " + r.url().slice(0, 160) + " " + (r.failure()?.errorText ?? "")));
  if (hour !== null) await page.clock.setFixedTime(new Date(2026, 9, 25, Math.floor(hour), Math.round((hour % 1) * 60)));
  page._logs = logs;
  return page;
}

export async function hideDevChrome(page) {
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], #__next-build-watcher, [data-next-badge-root] { display: none !important; }" });
}

/** Go to the home page, scroll the pinned stallion section into view and wait for the horse and film engine. */
export async function openStage(page, { timeout = 60000 } = {}) {
  await page.goto(URL_HOME, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('section[aria-label="The Marwari stallion"]', { timeout });
  await hideDevChrome(page);
  await page.evaluate(() => {
    const s = document.querySelector('section[aria-label="The Marwari stallion"]');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY);
  });
  await page.waitForFunction(() => {
    const c = document.querySelector('section[aria-label="The Marwari stallion"] canvas');
    return c && getComputedStyle(c).opacity === "1" && window.__stallionFilm && window.__stallionFilm.ready;
  }, null, { timeout });
  await sleep(1500);
}

/** Install a QA camera: replaces the film's camera rig with a pose in the horse's own frame. */
export async function installCam(page) {
  await page.evaluate(() => {
    const f = window.__stallionFilm;
    const V = f.loco.position.constructor;
    const st = { on: false, pos: new V(), look: new V(), fov: 30, rel: null };
    window.__qa = st;
    const orig = f.stepCamera.bind(f);
    f.__origStep = orig;
    f.stepCamera = (dt) => {
      if (!st.on) return orig(dt);
      if (st.bone) {
        const P = f.loco.position, h = f.loco.heading;
        const Fx = Math.sin(h), Fz = Math.cos(h), Lx = Math.cos(h), Lz = -Math.sin(h);
        const hs = f.ctx.horse.bones;
        const at = (spec) => { const [name, o] = spec; const b = hs[name].getWorldPosition(new V()); return [b.x + Fx * o[0] + Lx * o[1], b.y + o[2], b.z + Fz * o[0] + Lz * o[1]]; };
        const a = at(st.bone.cam), l = at(st.bone.look);
        st.pos.set(a[0], a[1], a[2]); st.look.set(l[0], l[1], l[2]); st.fov = st.bone.fov;
      } else if (st.rel) {
        const P = f.loco.position, h = f.loco.heading;
        const Fx = Math.sin(h), Fz = Math.cos(h), Lx = Math.cos(h), Lz = -Math.sin(h);
        const r = st.rel;
        // rel: { a: [fwd, left, up] camera offset from horse origin, b: [fwd, left, up] look-at point, fov }
        st.pos.set(P.x + Fx * r.a[0] + Lx * r.a[1], P.y + r.a[2], P.z + Fz * r.a[0] + Lz * r.a[1]);
        st.look.set(P.x + Fx * r.b[0] + Lx * r.b[1], P.y + r.b[2], P.z + Fz * r.b[0] + Lz * r.b[1]);
        st.fov = r.fov;
      }
      return { pos: st.pos, look: st.look, fov: st.fov };
    };
  });
}

/** Place the QA camera relative to the horse. a/b are [forward, left, up] metres in the horse's frame (forward = nose direction, left = its left flank). */
export async function camRel(page, a, b, fov = 30) {
  await page.evaluate(({ a, b, fov }) => { window.__qa.on = true; window.__qa.bone = null; window.__qa.rel = { a, b, fov }; }, { a, b, fov });
}
/** Bone-anchored camera: camera and look-at points are offsets [forward, left, up] (horse frame, metres) from a named bone's world position, so close-ups follow the head. */
export async function camBone(page, cam, look, fov) {
  await page.evaluate(({ cam, look, fov }) => { window.__qa.on = true; window.__qa.rel = null; window.__qa.bone = { cam, look, fov }; }, { cam, look, fov });
}
export async function camOff(page) { await page.evaluate(() => { window.__qa.on = false; }); }

/** Go to chapter 1|2|3 (desert, village, academy), freeze the director and stand the horse. */
export async function enterPlace(page, chapter, { speed = 0, timeout = 60000 } = {}) {
  await page.evaluate((c) => window.__stallionFilm.goTo(c), chapter);
  await page.waitForFunction((c) => { const f = window.__stallionFilm; return f.chapter === c && f.active && f.veilAmount < 0.02; }, chapter, { timeout });
  await page.evaluate((sp) => { const f = window.__stallionFilm; f.setManual({ speed: sp, alert: 0 }); }, speed);
  await sleep(2500);
}

export async function snap(page, file, clip) {
  await page.screenshot({ path: file, ...(clip ? { clip } : {}) });
}

export async function stats(page) {
  return page.evaluate(() => {
    const f = window.__stallionFilm;
    const r = f.ctx.renderer;
    const t = f.telemetry();
    return { calls: r.info.render.calls, triangles: r.info.render.triangles, geometries: r.info.memory.geometries, textures: r.info.memory.textures, programs: r.info.programs?.length, chapter: f.chapter, env: t?.env, speed: t?.speed, gait: t?.gait, quality: f.quality.tier };
  });
}
