# Claude implementation prompt — trainers, parents, schools and real horses

Work in `/Users/stingraj/blackstallion-website`. The owner wants the successful **student uniform visual pattern** extended to trainer imagery, parent and school storytelling, and real-horse galleries. Implement this in the existing website. Read `AGENTS.md` and the relevant installed Next.js guides before coding. Inspect `UniformGallery`, `UniformViewer`, the parent and school pages, and the fleet page so the new work follows their real design system.

## New campaign assets, already supplied

All nine assets are in `public/images/campaign/trainer-parent/`:

| File | Intended role |
| --- | --- |
| `trainer-standing-with-horse.png` | Adult trainer uniform portrait / trainer section lead |
| `trainer-uniform-detail.png` | Trainer uniform detail, analogous to student uniform detail |
| `trainer-riding-ring-lesson.png` | Main instructor teaching image in the horse riding ring |
| `trainer-courtyard-lesson.png` | Secondary trainer and cadet care image |
| `parent-riding-ring-visit.png` | Parent page: parents observe a child riding in the ring |
| `parent-stable-visit.png` | Secondary parent image at horse preparation area |
| `school-horse-care.png` | School hub: cadets learn horse care |
| `school-riding-ring-lesson.png` | Main school program image in the horse riding ring |
| `horse-riding-ring-background.png` | Wide ring/field background, environmental hero or section backdrop |

These are **AI-generated campaign concepts with fictional people and horses**, based on the site's existing student uniform image style. Do not present their people as named academy staff, parents, students, or actual enrolled people. Do not use the generated horse as evidence for the identity of any real fleet horse. Convert to optimized WebP/AVIF derivatives if appropriate, but preserve source PNGs and semantic filenames. Check crops at desktop and mobile; keep the horse's head, ears, and the key people visible.

## Design and placement

1. Give the trainer uniform a visual series that matches the student uniform page's deliberate photo grid: full standing view, detail view, and action in the arena. Navy and gold tailoring, cream breeches, black boots, warm sandstone and sand-ring light should feel related to the existing academy uniforms. Show the **horse riding ring and open field background** prominently in the trainer action and school/parent scenes; `horse-riding-ring-background.png` is a separate environmental asset for depth, section backdrop, or gentle parallax. Never let background typography lose contrast.
2. Build or extend a trainer section in the appropriate academy/command area after inspecting the information architecture. Keep clear that images illustrate a proposed trainer uniform, unless real staff/approved uniform documentation exists. If a trainer uniform viewer helps, follow the interaction of `UniformViewer`: drag, arrow keys, buttons, reduced-motion, image fallback. Only claim a true 3D uniform if an actual 3D model exists or you build one. A photo gallery alone must not be described as 3D.
3. Place `parent-riding-ring-visit.png` on `/parents` where the parent sees their child learning in the ring; use `parent-stable-visit.png` as a secondary view where it fits. Place `school-riding-ring-lesson.png` on `/schools` as the main program image and `school-horse-care.png` as a secondary campus detail. Use the ring background to connect the pages visually, without turning every section into the same full-bleed hero.
4. The real horse originals are currently in `real marwari horse images/`. Implement the separate brief in `docs/marwari-scroll/CLAUDE_REAL_HORSE_PHOTO_GALLERY_PROMPT.md`: identify verified views of each *individual* horse, make one gallery per horse, and use real photographs in `/fleet`. Apply the student uniform gallery's editorial rhythm and the uniform viewer's clear navigation, but never simulate an unverified 360-degree horse view by cloning or inventing angles. Keep historical `/legend` paintings intact.

## Real passport / identity photos

The owner mentions real passport photos. First locate and inspect the actual files; none should be inferred from the attached campaign reference or the generated images. Establish whether each is a **person's ID headshot** or a **horse passport/identification photograph**, and confirm the matching record before using it. An actual person's passport-style photo belongs only in the relevant private, authorized account, application, trainer profile, or credential view with appropriate access controls; do not put it in a public campaign section by default. A horse identity photo belongs with its verified horse record or passport view. Do not replace a real identity photo with an AI face or modify identity-defining features. If the originals are not present, finish the public campaign work and state exactly which files are still needed for identity placement.

## Finish and verify

Preserve existing behavior. The cinematic **“Next reel”** section at the foot of each page is the existing `EndCard` component in `components/film/EndCard.tsx`. Keep it at the bottom of each changed or newly created page, after the page's main content and before the footer, with the correct `current` reel number so it links to the actual next page. Do not create an unrelated generic next-page card.

Follow fixed `SiteNav` clearance: hero and gallery content below the 64px mobile / 80px desktop navigation, no caption or control collisions. Add truthful alt text and captioning that distinguishes generated campaign images from real photography. Optimize loading and use the site's supported image component. Run lint/typecheck/build as appropriate. Capture and inspect desktop **1440×900** and mobile **390×844** screenshots of each changed page, including the top 120px, trainer imagery, ring field, horse gallery, and `EndCard`. Test each next-page link. Report changed files, placement of every new asset, status of real horse galleries, and any passport photos that still require originals or identity verification.
