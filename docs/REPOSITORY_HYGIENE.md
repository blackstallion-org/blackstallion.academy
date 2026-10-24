# Repository hygiene: what is in the working tree and what to do about it

Recorded 23 October 2026 on branch `restore/original-bsah-design` (HEAD `293042e`, "before minimal cleanup",
14 Oct). **Nothing was deleted, reset, stashed or checked out.** A rollback snapshot of the pre-session state is in
`_session_snapshots/2026-10-23-pre-session/` (git-ignored): `tracked-changes.patch` (all tracked edits, binary-safe),
`untracked-source.tar.gz` (every untracked file outside `public/`), `git-status.txt` and `HEAD.txt`.

## The 759 uncommitted entries before this session (the audit's "763" included 4 later entries)

| Kind | Count | What it is | Recommendation |
| --- | ---: | --- | --- |
| Modified tracked files | 117 | Real site work since 14 Oct (pages, sections, styles, docs) | **Commit** on a session branch after review |
| Deleted tracked files | 11 | `GridScrollSection.tsx` and 10 `public/images/cinematic-images/*.webp` | Confirm intent, then commit the deletions |
| Untracked `scratch/` | 363 | Capture experiments and screenshots | Now git-ignored; archive outside the repo |
| Untracked `public/` | 139 | Media (images, models, video) used by the site | Commit referenced media via Git LFS or move to a CDN; see `docs/MEDIA_INVENTORY.md` |
| Untracked `components/`, `lib/`, `app/` | 70 | New site components (motion, 3D, editorial) | **Commit**: the site imports them, so a clean clone currently cannot build |
| Untracked `scripts/` | 20 | Test and asset scripts | Commit the test scripts |
| Untracked docs and reports | 19 | Progress/audit reports in the root and `docs/` | Commit `docs/`; move root reports into `docs/history/` |
| `.playwright-mcp/`, `.playwright-cli/`, `output/` | 16 | Tool logs and test evidence | `.playwright-cli/` and `output/` now git-ignored; `.playwright-mcp/` is partly tracked: untrack it |
| `index.html` (root) | 1 | Stray standalone page | Move to `docs/reference/` or delete after review |

**Important:** because 70 source files the site imports are untracked, the last commit does not build on its own. Until
they are committed, the only complete copy of the site is this working folder (plus the session snapshot).

## Large files

| File | Size | Status |
| --- | ---: | --- |
| `hf_20261009_040342_….mp4` (root) | 526 MB | Git-ignored; reference footage; move out of the project folder |
| `public/` | 927 MB | 139 untracked media files; see `docs/MEDIA_INVENTORY.md` for referenced vs unreferenced |
| `.next/`, `node_modules/` | 770 / 696 MB | Build output and dependencies (ignored, regenerable) |

## Nested `bsah-platform/`

`bsah-platform/` is a separate git repository recorded in this repo as a gitlink (mode 160000, commit `a767bc8`)
**without a `.gitmodules` entry**, so a clone of this repo gets an empty folder. Its own working tree currently shows
**187 deleted files under `apps/web/`** (the platform's web app) plus one untracked folder. The files still exist in
its git history. This session did not touch it.

Decisions for the owner:

1. Is `bsah-platform` part of this repository (convert to a proper submodule with `.gitmodules`) or a separate
   repository (remove the gitlink)?
2. Was deleting `bsah-platform/apps/web` intentional? If not: `git -C bsah-platform restore apps/web`.

## Proposed cleanup sequence (not executed; each step needs approval)

1. `git switch -c session/2026-10-23-completion` (non-destructive; keeps every change).
2. Commit source, scripts and docs in logical commits (site code, tests and CI, docs).
3. Decide the media strategy (Git LFS vs CDN) and commit or externalise `public/` media accordingly.
4. Archive `scratch/` and root reports outside the repo; untrack `.playwright-mcp/`.
5. Resolve the `bsah-platform` gitlink question.
