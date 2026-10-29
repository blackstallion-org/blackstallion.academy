// The mobile menu and the opening film (branch perf/mobile-scroll-media-speed). Source-level checks of the causes that were measured in a
// phone-sized browser; the behaviour itself (swipe in the open menu, tap a link and swipe at once, browser back) is in docs/qa/performance-pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { root } from "./helpers/load-ts.mjs";

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("menu: the open panel scrolls under Lenis (it is marked data-lenis-prevent) and does not chain to the page", () => {
  const nav = read("components/site/SiteNav.tsx");
  assert.match(nav, /id="site-menu"[\s\S]{0,300}data-lenis-prevent/, "Lenis prevents default on every wheel and touch event while stopped, except inside this attribute");
  assert.match(nav, /overscroll-contain/);
});

test("menu: the page is locked while the menu is open and released the moment it starts to close, by one effect that cleans up after itself", () => {
  const nav = read("components/site/SiteNav.tsx");
  assert.match(nav, /useEffect\(\(\) => \{\s*if \(!open\) return;\s*lenis\?\.stop\(\);\s*document\.documentElement\.style\.overflow = "hidden";\s*return \(\) => \{\s*document\.documentElement\.style\.overflow = "";\s*lenis\?\.start\(\);/);
  assert.match(nav, /\}, \[open, lenis\]\)/);
  // the old lock lived in the menu component and was released only when its 0.8 s exit animation had finished
  const menu = nav.slice(nav.indexOf("function Menu("));
  assert.doesNotMatch(menu.slice(0, menu.indexOf("return (")), /lenis|style\.overflow/, "the menu component no longer locks anything");
});

test("menu: it belongs to the route it was opened on (a new route closes it), and a page from the back-forward cache is never left locked", () => {
  const nav = read("components/site/SiteNav.tsx");
  assert.match(nav, /const open = openAt === pathname/);
  assert.match(nav, /addEventListener\("pageshow"/);
  assert.match(nav, /e\.persisted && !open/);
});

test("menu: while it wipes away it lets touches and the wheel through to the page (pointer-events none once it is no longer present)", () => {
  const nav = read("components/site/SiteNav.tsx");
  assert.match(nav, /import \{[^}]*useIsPresent[^}]*\} from "motion\/react"/);
  assert.match(nav, /const present = useIsPresent\(\)/);
  assert.match(nav, /style=\{present \? undefined : \{ pointerEvents: "none" \}\}/);
});

test("opening film: nothing is masked or faded; the baked black bars are cropped away, so the picture's own edges are sharp", () => {
  const film = read("components/sections/home/HeroFilm.tsx");
  assert.doesNotMatch(film, /maskImage|MaskImage|mask-image/);
  assert.doesNotMatch(film, /from-night\/75 to-transparent|from-night\/85 to-transparent/, "no held shades over the picture");
  assert.match(film, /PICTURE_ASPECT = "1606 \/ 635"/, "the crop is rows 133 to 767 of the 900-row frame: the picture is rows 131 to 769, minus its half-dark first and last rows (measured on the poster)");
  assert.match(film, /PICTURE_TOP = 133 \/ 635/);
  assert.match(film, /FRAME_HEIGHT = 900 \/ 635/);
  assert.match(film, /overflow-hidden md:w-\[128%\]/);
  assert.doesNotMatch(film, /backdrop-blur/);
});

test("videos loaded on demand have web encodes and the masters stay as the fallback", () => {
  for (const [file, web, master] of [
    ["components/sections/anatomy/AnatomyScenes.tsx", "marwari-ear-loop-web.mp4", "marwari_horse_ear_biomechanics_loop.mp4"],
    ["components/sections/why/WhyScenes.tsx", "portal-loop-web.mp4", "portal-loop.mp4"],
    ["components/site/Footer.tsx", "footer-ambient-web.mp4", "footer-ambient-h264.mp4"],
  ]) {
    const src = read(file);
    assert.ok(src.indexOf(web) > 0 && src.indexOf(web) < src.indexOf(master), `${file}: ${web} comes first`);
    assert.ok(fs.statSync(path.join(root, "public/video", web)).size < fs.statSync(path.join(root, "public/video", master)).size / 2, `${web} is under half the master`);
  }
  assert.match(read("components/sections/why/WhyScenes.tsx"), /preload="metadata"/);
});
