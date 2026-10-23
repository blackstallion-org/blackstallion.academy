# Admissions and Command redesign QA — 19 October 2026

final result: passed

## Scope and visual truth

The three user screenshots are art-direction references for `/contact`, `/command`, and homepage `#home-command`. Existing BSAH brand, real navigation, fields, knowledge answers and demo limitations take precedence over illustrative UI in the references.

Source directory: `/var/folders/ty/42gywtp95t1cv4png65y0rdw0000gn/T/`:
- Contact: `codex-clipboard-b21135f9-9acd-4819-8709-75a3421fa5d7.png`
- Command: `codex-clipboard-ea83dd29-eb75-454c-a3c1-0a9ef48693bb.png`
- Homepage: `codex-clipboard-945d1ae0-f475-439e-a1cf-8418db7d454a.png`

Rendered evidence directory: `/Users/stingraj/blackstallion-website/output/playwright/redesign/`.
- `contact-desktop-final.png`
- `command-desktop-final.png`
- `home-command-desktop-final.png`
- `contact-mobile.png`, `command-mobile.png`

Desktop sources and final screenshots are 1536×1024 pixels, captured at a 1536×1024 CSS viewport, normalized 1:1. Mobile checks used 390×844 CSS pixels. Homepage final capture has the section start 36px below the viewport top; the retained fixed site navigation occupies the top 80px. This known scroll-state difference is not treated as layout drift.

## Combined visual comparisons

Source and rendered output were placed side by side and opened together:
- `contact-comparison.jpg`, `contact-detail-comparison.jpg`
- `command-comparison.jpg`, `command-detail-comparison.jpg`
- `home-command-comparison.jpg`, `home-command-detail-comparison.jpg`

Full comparisons evaluate proportions and hierarchy; focused crops evaluate fields, chat copy and composer controls. Contact source has no persistent navigation; implementation reserves 80px for existing navigation. Source's eight-field display is intentionally divided into existing-schema details, programme and review steps. Existing combined student/age field and privacy text are retained. The form therefore has less initial density than the reference.

## Findings and iterations

1. Initial contact aside was too narrow (P2). Changed desktop columns from .32fr to .38fr. Final capture shows an approximately 395px admissions rail matching the source's roughly 393px rail.
2. Initial dedicated command layout placed dossier below its intended position and pushed composer down (P2). Tightened heading/panel rhythm, aligned the dossier alongside the introduction, and bounded tall terminal to 640px. Final source/output comparison shows the composer and three dossier panels in the desktop frame.
3. Homepage inherited a heading override making it too small (P2). Removed only the command heading from that pre-existing shared selector. Raised teaser terminal to 690px. Final comparison shows the three-line monumental headline, matching cream chat hierarchy and clearly accessible composer.
4. An early admissions final capture caught the page loader; an early home capture showed the wrong scroll region. These were invalid evidence, replaced after actual browser render and checked visually. Current final files are the rendered screens.
5. Continue initially allowed native form submission when React replaced the advance button with a submit button (P0). Added distinct keys and prevented the advance click default. Repeated review/back navigation confirmed no submit and retained selections. See incident below.

No actionable P0/P1/P2 findings remain within this redesign scope.

## Required fidelity surfaces

- Typography: existing Newsreader/serif, sans and mono families remain. Editorial display hierarchy, multiline command heading and small tracked labels reflect the references. Existing site masthead is preserved rather than replaced by the reference logo.
- Layout: three entry corridors, dark admissions sidebar/paper form, command rail/chat/dossier and homepage two-column composition are present. Mobile stacks the content with 0px measured horizontal overflow on all three surfaces.
- Colors: cream/ivory paper and warm brown accents follow the supplied references and existing brand direction. No artificial online/active status is shown for the scripted demo.
- Image quality: original generated 1536×1024 equestrian arcade backdrop is compressed as WebP; existing local cadet, campus and passport images are reused. No image placeholders or traced brand graphics were introduced. Source's horse sketch is intentionally omitted rather than approximated in CSS/SVG.
- Content: retained existing admissions field names, fees, answer text and unverified-record caveats. Demo/source labels replace misleading live status. Actual destination links are retained. No new institutional approval or safety evidence was invented.

## Functional verification

- Required first-step validation, all three corridor changes, step progression, review, Back and retained programme selection checked in the browser.
- Command opening fees and a typed safety question checked against existing scripted answers.
- Replay headline has no mode/replay buttons; reload changed from line to word reveal. Reduced-motion guard is present; this task did not emulate the OS preference.
- Contact and command mobile screenshots inspected; homepage mobile width measured 390px with document width 390px.
- Browser error logs were empty in checked command/mobile and homepage sessions.
- Focused ESLint, TypeScript, production build and scoped whitespace check passed.

## Test incident

Before the advance-button correction, browser testing unintentionally sent one synthetic enquiry named `QA Parent`, student `QA Cadet, 11`, email `qa@example.invalid`, zone `01A · Financial District & Narsingi Corridor`, Core Cadets tier, through the existing configured submission action. The UI confirmed receipt. The user was informed. No deletion or database mutation was attempted afterward; retests left contact fields blank and did not activate final submission.

## Limits and follow-up

Physical-device, Safari/Firefox, screen reader, Lighthouse and production backend delivery checks are not claimed. Automated full-site lint was not run; focused changed-file lint passed. Command remains the existing scripted demo. Final aesthetic approval belongs to the user. No packages installed or deployment performed.

Checklist: [x] references compared; [x] responsive checks; [x] real interactions; [x] fixes recaptured; [x] validation passed; [x] temporary browser viewport reset.
