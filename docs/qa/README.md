# QA evidence, 11 Oct 2026

Run in a cloud sandbox on a production build (`next build`, 42 static pages, passes) served with `next start`, driven by Playwright/Chromium.

| Check | Result |
| --- | --- |
| `next build`, `tsc --noEmit`, `eslint` | pass |
| 390 px and 1440 px, 24 routes each (incl. new /admissions and a 404) | no horizontal overflow; exactly one h1 per page; no console errors except blocked image downloads (sandbox cannot reach the Higgsfield CDN, so photos show their fallback gradient in these screenshots) |
| Keyboard focus (45 Tab presses on /, /contact, /command, /curriculum, /schools, /verify, /parents, /admissions) | every focused control shows a visible ring (after fixes below) |
| Reduced motion (/, /legend, /curriculum, /why, /command, /schools, /admissions) | Lenis off, no sticky/pinned columns, no headings left invisible (after fixes below) |

Found and fixed during these checks: pillar 13 drawn off-screen on Home (NaN SVG coordinate), faint focus cue on form fields / terminal / verifier inputs, stale fees on /command, command title delayed under reduced motion, sticky side columns under reduced motion.

Not covered: real photographs (CDN blocked here), real device testing, screen-reader pass, WebGL/gyro (no 3D model yet), contrast tool run (ratios checked by hand: copper #B87333 and Shwet #8C8882 on Kala #0F0E0D are about 5:1).

Files: `audit_results.json` (all numbers), `audit_console.txt`, `screens/*_top.jpg` and `*_full.jpg` (390 and 1440), `screens/reduced_*`.
