# BSAH test results

Date: 17 October 2026 (Asia/Kolkata).

## Evidence policy

This document separates current task A1 runs from historical reports. Browser emulation does not prove physical-device FPS. Tests never submit real forms or access the live database.

## Current A1 runs

- First targeted ESLint run: failed on a `prefer-const` finding for the load-deadline variable. Corrected before subsequent verification.
- Targeted ESLint (two changed components): passed after correction.
- `npm run typecheck`: passed after correction (Next route type generation and TypeScript).
- `npm run lint`: passed with 0 errors and 4 pre-existing unused-import/variable warnings in CadetScenes, HomeClose, TorchHorseStage and VerifyScenes.
- `npm run build`: passed, including TypeScript and generation of 49 pages.
- Development-server attempts: incomplete. The first attempt targeted port 3100 without a running server; the existing developer server was on 3000. A later assertion incorrectly expected rendering after a mobile selection scrolled the viewer offscreen; the test was corrected to return the viewer to view. A reused development-server run also showed stale SSR attribute/hydration warnings and an incomplete failure-path wait. These attempts are not reported as passing. The existing developer server was not stopped.
- Fresh production-server browser regression: all 10 scenarios passed, with no uncaught page errors or hydration errors detected. Switching to archive during a delayed model load cancels the request without stale failure UI. A reduced-motion startup race in the first production attempt was corrected in the test by waiting for hydration/network quiescence before scrolling.

Browser script: `scripts/test-anatomy-browser.mjs`. It accepts BSAH_TEST_URL, BSAH_TEST_OUTPUT, BSAH_PLAYWRIGHT_MODULE and BSAH_BROWSER_CHANNEL. Use a development or production server; no credentials are needed. Playwright may come from the existing Codex runtime rather than a new project dependency.

Coverage: native vertical pan; DPR; default orbit; no repeated model load on controls; paused/hidden/offscreen draw calls; selection/reset wake-up; reduced-motion default and still 3D; renderer/model/decoder/context-loss/deadline failures; retry; desktop keyboard/layout; shared-homepage background.

Evidence: `scratch/audit/anatomy-stability/` contains earlier development attempt artifacts; `scratch/audit/anatomy-stability-production/results.json` and PNGs contain production results. Any `failure.json` records an earlier failed attempt, not a current passing result.

Measured on the passing production run:
- 0 WebGL draw calls in each 450 ms sample after paused settling, while offscreen, and under simulated hidden-tab state.
- Visible orbit and selection/reset wake-ups produce draw calls.
- One model request before and after selection/reset/orbit controls.
- DPR 1.5 at emulated device DPR 3; desktop drawing ratio 1 at device DPR 1.
- Native vertical touch swipe moves page scroll position; checked mobile/desktop layouts have no horizontal document overflow.
- Reduced motion downloads no model by default; an explicit still 3D selection renders on user changes and returns to 0 continuous draw calls.
- Renderer creation, model request, decoder request, context-loss event and accelerated-deadline failures select the interactive archive; model retry recovers.
- Keyboard selection and the homepage's shared archive mode/cream background pass.
- Switching to archive while a model request is in flight aborts the request and leaves no stale canvas or failure message.

Checks also run successfully: targeted ESLint for the two changed components; `node --check scripts/test-anatomy-browser.mjs`; `git diff --check`.

## Limitations

- Chromium emulation at mobile 360/390px and desktop 1440px; no physical Safari/iOS/Android device run.
- Hidden-tab and context-loss behavior are tested through browser-injected events.
- The model deadline is accelerated in that scenario; this verifies the failure path rather than waiting 20 real seconds.
- Draw-call counts verify idle/background lifecycle behavior; they are not FPS, power or memory benchmarks.
- Older evidence under `docs/qa/` and `scratch/audit/` is retained separately and is not a new passing run.


## Editorial motion verification — 17–18 October 2026

Scope: `/legend`, `/anatomy`, `/statue`, with a preservation check for the `/lithos` alias. All browser runs used a fresh local production build at `http://localhost:3100`; the existing development server at port 3000 was retained.

### Confirmed checks

| Check | Result |
|---|---|
| `npm run lint` | Passed, zero errors; four existing unused-variable warnings in CadetScenes, HomeClose, TorchHorseStage and VerifyScenes |
| `npm run typecheck` | Passed; route types generated and TypeScript completed |
| `npm run build` | Passed; all 49 generated pages completed |
| Targeted ESLint | Passed without warnings for changed application files |
| `node --check scripts/test-editorial-motion.mjs` and `git diff --check` | Passed |
| Layout suite | 12 cases passed: all three routes at 1440, 768, 390 and 320 CSS pixels |
| Accessibility / failure / navigation | 10 cases passed; repeated after strengthening no-JS assertions and final fallback changes |
| Existing Anatomy regression harness | All 10 scenarios passed on the production build; separate evidence directory preserves earlier task artifacts |
| Final Anatomy photo focus | Focused 390/320 phone layout rerun passed, with zero observed CLS and no failed images |

The layout suite checks primary heading semantics, horizontal overflow, selected heading widths, failed image elements and normal-flow page errors/hydration messages. It exercises Monument chapter buttons in both directions and captures screenshots. Accessibility cases check reduced motion, no-JS server copy, ancestor visibility, unobscured primary headings, static Monument chapter flow, failed model, accelerated loading deadline, keyboard ear rotation, route entry/back restoration and the unchanged legacy alias. Next Cache Components retains inactive routes in hidden Activity trees; the homepage assertion therefore checks visible presentation, rather than requiring inactive DOM to be deleted.

Existing Anatomy regression coverage: mobile controls and native vertical swipe, one model request across controls, DPR cap of 1.5 in the mobile scenario, zero sampled draw calls while paused/hidden/offscreen, context loss, reduced-motion archive and explicit still 3D, renderer/model/decoder/deadline failures, retry, cancellation of an in-flight load, desktop keyboard controls, and shared homepage background/viewer behavior. No unexpected page errors were captured in those scenarios.

### Performance observations

Maximum cumulative layout-shift observation across the four tested widths:

| Route | Observed CLS |
|---|---:|
| Legend | 0.001606 |
| Anatomy | 0.001529 |
| Monument | 0.001702 |

These are local Chromium observations during initialization and scripted scrolling, not field Core Web Vitals, a Lighthouse score, FPS measurements or a controlled before/after benchmark. An earlier implementation iteration exposed approximately 0.285 desktop Monument CLS; matching the first chapter's initial and enhanced layout reduced the latest observation to approximately 0.0017. No production performance guarantee is inferred.

### Failures found and resolved

- Monument chapter offsets were authored against a normalized timeline without its full final reading hold. Added an explicit duration/hold so chapter buttons land on readable copy.
- Initial DOM-only no-JS checks missed the site-wide loader overlay. Visual inspection caught it; route-only noscript styling and an element-at-point assertion now verify unobscured headings.
- Ancestor checks exposed initially hidden shared-component copy; restored it in the route-only no-JS fallback. Intentional responsive alternate presentations (desktop timeline versus mobile dates) are excluded from hidden-copy failures.
- Default Monument enhancement caused an initialization shift. Initial first-chapter layout now matches its enhanced position.
- An inactive route retained by Next Activity caused an overly strict DOM-removal assertion. The revised check verifies that no editorial presentation appears on the homepage.

Earlier failed-run JSON files are superseded by successful results and retained with explicit superseded names.

### Evidence and reproduction

- `scratch/audit/editorial-motion/results.json`: full 22-case motion suite, including 12 responsive cases.
- `scratch/audit/editorial-motion/final-accessibility/results.json`: stronger 10-case accessibility/failure/navigation rerun.
- `scratch/audit/editorial-motion/final-framing/results.json`: final 390/320 phone image-focus rerun.
- `scratch/audit/editorial-anatomy-regression/results.json`: 10-case existing Anatomy harness.
- `scratch/audit/editorial-motion/`: desktop/tablet/mobile screenshots and a task-only source patch against the pre-edit working files.
- `docs/editorial-motion-review.md`: human-readable review, preview links and changed-file list.

The scripts accept `BSAH_PLAYWRIGHT_MODULE` to reuse the installed/bundled JavaScript Playwright package, `BSAH_TEST_URL` and `BSAH_TEST_OUTPUT`. `scripts/test-editorial-motion.mjs` also accepts `BSAH_MOTION_WIDTHS`, `BSAH_MOTION_ROUTES`, `BSAH_MOTION_LAYOUT_ONLY=1` and `BSAH_MOTION_SKIP_LAYOUT=1` for focused reruns. No browser runtime or npm package was downloaded by this task.

### Limits

Chromium desktop/mobile emulation was used; physical iOS/Android and Safari/Firefox are untested. Loading deadlines were accelerated in the failure tests. No full automated accessibility audit, screen-reader session, Lighthouse, hardware FPS profile or field-data comparison was performed. Existing photography/model sources were retained; source resolution limits remain. Final aesthetic approval belongs to the user. No production deployment was performed or approved by this implementation request.

## Homepage typography — prior to Matrix Phase 1, 18 October 2026

Seven production-browser scenarios passed: 1440/768/390/320 headings/overflow/images, reduced motion, no JavaScript and non-home route isolation. Additional existing control checks passed (comparison keyboard, specimen hotspot, verifier input without submission). TypeScript and production build passed. The homepage typography run observed CLS of 0.228 desktop / 0.558 tablet / 0.008 and 0.027 phones; desktop/tablet performance is not marked passed. No before baseline or field data exists. Details and evidence: docs/home-typography-review.md and scratch/audit/home-typography/results.json. Matrix's earlier animation treatment was superseded by the latest static Phase 1 request.


## Interactive image effects — 18 October 2026

Typecheck, focused ESLint and production build passed. Chromium checks confirmed all six gallery selections, exact heading restoration after hover/keyboard, 0 px horizontal overflow at 390 px, and arrow-key focus/selection. WebGL portrait interaction produced draws, then 0 additional draw calls during the measured idle interval. Reduced motion hid cube/particle rendering while retaining image selection and unsplit text; browser reported 0 errors in that check. Physical-device and cross-browser profiling are not claimed. Evidence and screenshot paths: docs/interactive-image-effects.md.


## Admissions / Command / automatic headline reveals — 19 October 2026

PASS: `npm run typecheck`; focused ESLint for the two route files and changed TSX components; `npm run build` (49 pages generated); scoped `git diff --check`. Browser checks covered required-step validation, corridor changes, programme selection, review/Back retention, scripted fee and safety responses, absence of headline mode controls and varied reveal selection on reload. Contact/command desktop and mobile captures were inspected. At 390px, all three redesigned surfaces showed 0px document horizontal overflow. Checked command/mobile and home console error logs were empty.

A Continue-button race accidentally submitted one synthetic QA Parent enquiry (`qa@example.invalid`) before correction. Distinct button keys plus preventing the advance click default fixed the race; review/Back retested without activating final submission. No backend records removed. See design-qa.md for detailed evidence, limitations and screenshots. Physical devices, cross-browser, Lighthouse and production delivery are untested.


## Reference-inspired typography — 19 October 2026

TypeScript, focused lint, production build (49 pages), scoped whitespace check passed. Browser checks at 390×844 on all 13 opted-in routes confirmed intended font family and 0px horizontal document overflow; output/typography/mobile-checks.json. Desktop western/brush/condensed and mobile western screenshots inspected; final checked browser error log empty. No reduced-motion emulation, physical-device, cross-browser or performance benchmark claimed. Details: docs/typography-font-review.md.


## Interaction soundscape — 19 October 2026

Typecheck, focused lint, production build (49 static pages), scoped diff check and scripts/test-soundscape.cjs passed. Nine media files decoded with ffprobe. Browser confirmed no media before consent, actual recorded snort/tack/chariot playback, immediate mute/reset, silent OFF interactions, no overlapping rapid-click playback and preference across navigation. Final browser error log empty; left sound OFF. Unit tests cover saved-consent gesture, volume caps, all assets, cooldown, hidden tab, video priority, rejection and cleanup. Headphone mix review, physical/cross-browser checks and real visibility/video transitions remain untested. No forms submitted. Evidence: docs/soundscape-review.md.
