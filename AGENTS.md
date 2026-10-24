<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI & Layout Integrity Rules (MANDATORY FOR ALL AGENTS)

### 1. Mandatory Header & Navigation Safe-Zone Clearance
* **Global Navigation Position**: The site navigation (`SiteNav`) is fixed at the top of the viewport (`fixed inset-x-0 top-0 z-[60]`) with an explicit height of `h-16` (64px) on mobile and `h-20` (80px) on desktop.
* **Top Clearance**: Every hero section, slideshow, full-viewport canvas, editorial banner, or custom page header MUST provide safe-zone top padding (minimum `pt-24` / `pt-28` or `clamp(5.5rem, 9vh, 7.5rem)`).
* **No Colliding Top Bars**: NEVER position secondary navigation bars, folios, reel tags, badges, replay controls, or playback buttons in the top 80px of the screen. They will directly collide with and superimpose over the `BLACK STALLION` logo, sound controls, or navigation links.

### 2. Zero Text Overlay & Collision Constraint
* **No Overlapping Text**: Text elements, captions, badges, and controls must never overlap or render on top of each other.
* **No Boxed Clutter Over Nav**: Keep editorial typography clean with dedicated negative space. Avoid absolute inset overlays (`inset-0`) with small arbitrary paddings (`1.5rem`) that place content directly beneath fixed navigation elements.
* **Flex Wrapping & Spacing**: All sub-bars and badges must use flex wrap with gap protection (`gap-4`, `min-h`) to prevent stacking or text collisions on medium and smaller viewports.

### 3. Mandatory Visual Verification via Headless Browser Screenshots
* **Visual Proof Required**: Never declare completion of a visual UI task without capturing and inspecting actual browser screenshots across Desktop (1440×900) and Mobile (390×844).
* **Nav Inspection**: Inspect the top 120px of every screenshot specifically to confirm that `SiteNav` is completely distinct, unobstructed, and legible with clean breathing room between it and any page content.

