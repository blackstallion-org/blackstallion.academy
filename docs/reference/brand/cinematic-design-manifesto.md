# Cinematic UI Design Manifesto

> Source: `instructions/02_Brand_Guide/cinematic_design_manifesto.md.docx` (converted to Markdown for Claude Code; the original file is unchanged).

# BSAH Cinematic UI Design Manifesto

## 1. Visual Hierarchy & Theme Philosophy

- **Surfaces over Pitch Black:** Never use raw `#000000` for cards or dialogs. Background canvasses sit at `#0A0B0E` (Royal Obsidian), while cards and modals use `#12141A` (Deep Carbon).

- **Gold Application Discipline:** Gold (`#C5A059`) must act as a precise accent—used for borders, active tabs, crests, and key telemetry metrics. Avoid large solid gold fills.

- **Card Borders & Ambient Glow:** All cards must feature 1px brushed brass borders (`rgba(197, 160, 89, 0.25)`) with an outer ambient shadow glow (`rgba(197, 160, 89, 0.10)`).

## 2. Motion, Pacing & Easing

- **Weighted Transitions:** Avoid bouncy, light animations. Use weighted cubic-bezier curves for drawers, modals, and page routes:

`transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);`

- **Micro-Interactions:** Buttons and navigation links must utilize subtle gold border highlights on hover with a 200ms ease-in-out transition.

## 3. Typography Rules

- **Headings (Cinzel / Cormorant Garamond):** Reserved for page headers, card titles, and cadet creed callouts.

- **Body & Controls (Inter):** Used for main readable text, forms, inputs, and navigation links.

- **Telemetry & Numbers (JetBrains Mono):** Reserved for live session scores, timestamps, ledger balances, and data tables.
