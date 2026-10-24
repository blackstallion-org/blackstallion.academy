# Media on Supabase Storage (prepared 25 Oct 2026, switched OFF)

**Status.** The website serves every picture, 3D model, video and audio file from its own folder on Vercel. The code that can
serve the same files from a public Supabase Storage bucket is built and tested, and it is **off**: nothing exists in
Supabase yet (no bucket, no upload), and the live site has not changed. Turning it on needs three actions that only the
owner can take, in this order:

1. **Approve and buy the Supabase Pro plan** (section 3).
2. **Run the upload on your Mac** (section 4): one double-click; you paste a key that only you see.
3. **Add one variable in Vercel and redeploy** (section 5).

Going back is one step: delete the variable and redeploy (section 8). The files stay inside the site, so nothing is lost and
the undo does not depend on Supabase.

## 1. What moves and what does not

The site's code names 185 media files that exist in `public/`. Those 185 files (118.1 MB) are the list in
`scripts/media-manifest.json`; the upload tool sends exactly that list and nothing else.

| Folder | Files | Size | What it holds |
| --- | ---: | ---: | --- |
| `images/` | 93 | 16.7 MB | stills for the pages, journal, schools, tournaments |
| `media/` | 57 | 28.3 MB | the film stills and posters keyed in `lib/content/media.ts` (WebP copies) |
| `models/` | 8 | 29.1 MB | 3D models (`.glb`, Draco-compressed) |
| `video/` | 16 | 43.0 MB | hero and scene clips (`.mp4`, one `.webm`) |
| `audio/` | 11 | 0.9 MB | ambient track and interface sounds |
| **Total** | **185** | **118.1 MB** | largest single file 7.8 MB |

Sizes are in 1,048,576-byte megabytes, as the upload tool prints them (123,799,074 bytes in all).

**Stays where it is**

- **200 other files (416.4 MB)** that the repository holds in the same folders and that no page asks for (source clips,
  unused stills and the like). They are not uploaded and nothing is deleted. The full-size PNG/JPEG masters that exist only
  on your Mac (git-ignored) are not uploaded either: the site never asks for a master, and with the switch on it requests the
  WebP copy that ships with the site.
- **`/brand`, `/draco`, `/animations` and `public/schools-citadel.html`** stay on the site. The Draco decoder has to come from
  the same address as the page, and the rest is small.
- **Content that comes from the image provider's own CDN** (Higgsfield) is not part of this switch: the eight `cdnOnly`
  stills, the 21 journal sphere shots, the Legend and Why scene images, the curriculum film, the Lithos hero images and the
  portal hero videos. Moving them means downloading each file from the provider first, which needs your approval file by
  file (name, source, size) and a check of the provider's terms. It is a possible next step, not part of this one.

**What visitors see:** nothing different. The same files load, from
`https://tgwadczrfbljnepoaqtb.supabase.co/storage/v1/object/public/website-media/<folder>/<file>` instead of
`https://project-t9r95.vercel.app/<folder>/<file>`.

## 2. Why, and what it costs you

- Pictures, models, video and audio no longer travel through Vercel; Supabase's content delivery network serves them.
- A file can be replaced in Supabase without redeploying the site (section 7 explains the one-day browser cache).

The honest other side:

- **Money.** Supabase's free plan allows only 1 GB of storage and 5 GB of uncached plus 5 GB of cached download traffic a
  month, and a project that keeps exceeding it can be restricted. These media are 118.1 MB, so storage is no problem, but a
  busy month of video views is. That is why you chose to upgrade first. The Pro plan is the cost in section 3.
- **One more thing the site depends on.** If the Supabase project is paused, restricted (answers HTTP 402) or its invoice is
  unpaid, the pages still open but pictures, videos and 3D scenes are missing until you remove the variable and redeploy.
- **Shared allowance.** Download traffic is counted for the whole Supabase *organization*, together with every other project in
  it, and the website's media would draw on the same allowance as your other applications. A separate Supabase project just
  for media would keep them apart; it is a second paid project, so ask me to price it before you decide.

## 3. Step 1 — Supabase Pro (your approval and your purchase)

```
APPROVAL REQUIRED
Service:   Supabase (organization that owns project tgwadczrfbljnepoaqtb)
Action:    change the organization's plan from Free to Pro
Reason:    the media (118.1 MB, with video and 3D models) would be downloaded straight from Supabase on every visit; the
           Free plan's monthly download allowance (5 GB uncached plus 5 GB cached) is shared by every application in the
           organization and covers only about 200 first visits to the home page (section 9 gives measured page weights)
What I must approve: $25 per month for the organization (the plan fee is charged up front each month); it includes $10 of
           compute credit, which covers one project at the default size; every further ACTIVE project in the same
           organization is about $10 per month more (paused projects are not charged); possible tax from your billing
           address; credit card only; invoices in US dollars. Included each month: 100 GB storage, 250 GB uncached and
           250 GB cached download traffic. Beyond that, $0.09 per GB uncached and $0.03 per GB cached, but only if the
           Spend Cap is switched off
What you will do next: Supabase dashboard → the organization → Billing → Change subscription plan → Pro. The page shows
           the exact total before you confirm
```

The figures were read from Supabase's pricing and billing pages on 24–25 Oct 2026. Check the Billing page before you
confirm, because it shows your real total.

**The Spend Cap** is on by default on Pro, and it is your choice:

- **On:** you cannot be billed above the plan price for covered items such as storage and download traffic. If a monthly
  allowance runs out, further use of that item is refused until the next billing cycle, and if it keeps happening Supabase's
  Fair Use Policy can restrict the whole organization (for example HTTP 402 for API requests).
- **Off:** the services keep working and the extra traffic is billed at the rates above.

I will not change it for you. Look at the Usage page of the organization (Billing → Usage) after the first month.

## 4. Step 2 — upload the files (on your Mac)

The upload tool is run by you, on your own computer, so the Supabase secret key never has to be shared with anyone (not with
me, not in a chat, not in a file). It is a single file that needs Node 18 or newer and nothing else. It sits in the project
folder in `output/media-upload/` (the tool, its list of files, a double-click launcher and a short README); the repository
holds the same tool as `scripts/upload-media.mjs` and the same list as `scripts/media-manifest.json`.

**Before the first run (optional, nothing is sent):**

```
cd ~/blackstallion-website
node output/media-upload/upload-media.mjs --dry-run
```

It compares the media files on your Mac with the list: same names, same sizes, same content (SHA-256). If a file on your Mac
differs from the one on the live site, it stops and tells you; run it again with `--from-url https://project-t9r95.vercel.app`
to take those files from the live site instead.

**The key.** The tool looks for `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the environment and in the project's `.env.local`
(the file the site already uses on your Mac). If both are there it says `Secret key: found in .env.local (not shown)` and
you paste nothing. If the key is missing it asks for it (see step 2 below). If you would rather use a key that exists only for
this job: Supabase dashboard → the website's project → Project Settings → API Keys → *Secret keys* → create a key named
`website-media-upload`, copy it (it starts with `sb_secret_`), and delete it on the same page when the upload has
succeeded; nothing else uses it. Never paste a key into a chat. The older `service_role` key also works, but it is more
powerful than needed, so prefer a secret key.

**Run it:** double-click `output/media-upload/upload-media.command` in the project folder, or in Terminal:

```
cd ~/blackstallion-website
node output/media-upload/upload-media.mjs
```

If macOS says the launcher cannot be opened, right-click it → Open → Open. The tool then:

1. checks the local files against the list (as above);
2. finds the key (see above) or asks for it: **paste it and press Return; each character shows as `*`** and the key is never
   shown or saved;
3. prints what it is about to do (project address, bucket `website-media`, 185 files, 118.1 MB) and waits for you to type
   `yes`;
4. creates the bucket if it is missing: **public**, 50 MB per file, only the file types in the list;
5. uploads every file that is not there yet (files already there are left alone), a few at a time, retrying on a busy
   server;
6. opens every file at its public address and checks size, type, the cross-site headers (CORS) that WebGL and the 3D loader
   need, the one-day cache header and that video can be scrubbed (HTTP Range);
7. prints one line to copy into Vercel:

```
NEXT_PUBLIC_MEDIA_BASE_URL=https://tgwadczrfbljnepoaqtb.supabase.co/storage/v1/object/public/website-media
```

Safe to repeat: a second run uploads nothing new and just checks again. `--verify-only` re-checks the public addresses without
any key. `--deep` downloads every file and compares its content. `--help` lists every option.

**What the tool will never do.** It never deletes or moves anything, in Supabase or on your Mac. It leaves an existing file
alone unless you pass `--force`. It does not touch your database, your users or any other bucket. It only creates the one
bucket named in the list. The key is held in memory, sent only to your own project's address over HTTPS (never printed,
never written to a file or a log), and it is replaced by `***` in any error message.

## 5. Step 3 — switch the website over (Vercel)

Vercel → project `blackstallion-academy` → Settings → Environment Variables → Add:

| Key | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | the address the tool printed (no key in it, no slash at the end) | Production first; add Preview later if you want previews to use the bucket too |

It is a public address, so do not mark it *Sensitive*. The value is read **when the site is built**, so changing it does
nothing until the next deployment: Deployments → the latest production deployment → ⋯ → Redeploy, and untick *Use existing
Build Cache*. If the value is not a clean `https://` address (no password, no `?query`, no `#fragment`), the site ignores it
and keeps using its own files, so a typo cannot break the site; it just does not switch.

I can make this change for you in the Vercel dashboard when you tell me to. It changes how the live site loads its media,
so I will wait for your "go".

## 6. Step 4 — check that it worked

- Open the site, reload with the cache bypassed (Cmd+Shift+R), open the browser's developer tools → Network → filter *Img* or
  *Media*: the *Domain* column should show `tgwadczrfbljnepoaqtb.supabase.co` for pictures, videos, models and audio.
- Open a 3D page (`/statue`, `/anatomy`), a page with video (`/`, `/fleet`) and the sound toggle. Videos must play and scrub.
- Or ask me to run the same check in a browser: it lists every media request per page and flags anything still loaded from
  the site, any error answer and any cross-site (CORS) or security-policy message.

## 7. Changing media later

- **Adding or replacing a file in the code:** put it in `public/<folder>/`, name it through `asset()` or `lib/content/media.ts`,
  run `node scripts/media-manifest.mjs` (it rewrites the list; a test fails if the list is out of date), deploy, then run
  the upload tool again. It adds only what is new.
- **Replacing a file that is already uploaded:** run the tool with `--force`. Supabase's content delivery network refreshes
  its own copy within about a minute, but visitors' browsers keep their copy for one day (the tool sets
  `cache-control: max-age=86400`). If a change must show for everyone at once, upload the new file under a **new file name**
  and change the name in the code; that is also Supabase's own advice.
- **Never delete a bucket file that the live site names**: the page would show a gap. Deleting needs your approval.

## 8. Undo / rollback

Vercel → Settings → Environment Variables → delete `NEXT_PUBLIC_MEDIA_BASE_URL` → Redeploy. The site returns to its own
copies as soon as the deployment is ready. The bucket and its files can stay (they cost nothing to leave) or be removed
later with your approval. If Supabase is unavailable and you need the media back immediately, this is also the fix.

## 9. Download traffic, in numbers

These figures come from the browser crawl in section 11: 38 pages, 54 page views (a page at one screen width, scrolled from
top to bottom the way a visitor reads it), against a production build with the switch on. Sizes are the **listed file sizes**
(1 MB = 1,048,576 bytes, as the upload tool prints them), each distinct file counted once. They are **upper bounds**: a
browser fetches only the first part of a video it never plays to the end, and a visitor who comes back within a day
downloads almost nothing again (the files carry `cache-control: max-age=86400`).

| Page view | Files | Most it downloads on a first visit |
| --- | ---: | ---: |
| Home page, laptop (1440 px wide) | 56 | 24.0 MB |
| Home page, phone (390 px wide) | 47 | 19.1 MB |
| `/equipment`, laptop | 10 | 14.8 MB |
| `/anatomy`, laptop and phone | 11 | 14.6 MB |
| `/cadets`, laptop | 16 | 14.0 MB |
| `/fleet`, laptop | 21 | 12.4 MB |
| `/cadets`, phone | 15 | 12.4 MB |
| the middle one of all 54 page views | | 4.1 MB |
| the lightest, `/command` on a phone | 1 | 0.1 MB |

33 of the 54 page views stay under 5 MB, 44 under 10 MB, 52 under 15 MB; only the two home-page views are above that. The 123
files that pages asked for add up to 93.1 MB of the 118.1 MB; the other 62 listed files (24.9 MB) cost storage, not
downloads, until a visitor uses the feature that needs them (section 11).

**Against Supabase's monthly allowance.** The allowance belongs to the whole organization (section 2). The figures are those on
Supabase's pricing page on 24–25 Oct 2026; the Billing page shows the current ones. The last two columns are plain
arithmetic on the upper bounds above (first visits with nothing cached), to show the scale; they are not a forecast of
how many people will visit.

| Plan | Included download traffic per month | First visits to the heaviest page (24 MB) | First visits to a middle page (4 MB) |
| --- | --- | ---: | ---: |
| Free | 5 GB uncached + 5 GB cached | about 200 | about 1,200 |
| Pro | 250 GB uncached + 250 GB cached | about 10,000 | about 60,000 |

Supabase counts a download served from its content-delivery cache ("cached") separately from one served from storage itself
("uncached"). A public bucket should serve most repeat downloads from the cache, but I could not measure that split from
here: it will show on Billing → Usage after the switch. Past the allowance the cost is $0.09 per GB uncached and $0.03 per GB
cached if the Spend Cap is off; if it is on, use beyond the allowance is refused until the next billing cycle (section 3).

**What to watch.** Open Billing → Usage a week after the switch and again after a month. If the download figure stays far below
the allowance there is nothing to do. If it climbs, the cheapest fixes are a lighter home page (on a laptop its video and 3D
model are about half of the 24 MB, and the hero video `video/hero-main-desktop.mp4`, 7.8 MB, is the largest single file) or
going back to the site's own files (section 8).

## 10. How it works (for developers)

- `lib/content/media-base.mjs` parses `NEXT_PUBLIC_MEDIA_BASE_URL` (https only; plain http only for a loopback address in
  tests; no credentials, query or fragment; anything else means "off") and builds addresses for the five media folders
  (`/images`, `/media`, `/models`, `/video`, `/audio`) with each path segment percent-encoded.
- `lib/content/asset.ts` exports `asset(path)`. Every code path to a media file goes through it, so one setting moves the
  whole site. `mediaCrossOrigin(url)` returns `"anonymous"` for bucket addresses; `AsciiRipple.tsx` sets it because it
  reads pixels back.
- `lib/content/media.ts`: `mediaSrc()` wraps its result in `asset()`. With the switch on it always uses the WebP copy that ships
  with the site, never a PNG master (the bucket mirrors the shipped files, whatever `NEXT_PUBLIC_LOCAL_MEDIA` says).
- `next.config.mjs` adds the bucket's origin to the `img-src`, `media-src` and `connect-src` entries of the security policy
  and to `images.remotePatterns` (only that exact folder, no query strings). `BSAH_ALLOW_LOCAL_IMAGE_HOST=1` is a test-only
  switch that lets the image optimizer reach a stand-in bucket on `127.0.0.1`; never set it in Vercel.
- `tests/asset-guard.test.mjs` reads the syntax tree of `app/`, `components/` and `lib/` and fails when a media path is
  written without `asset()`.
- `scripts/lib/media-refs.mjs` + `scripts/media-manifest.mjs` build `scripts/media-manifest.json` from what the code names and
  what `public/` holds. `tests/media-manifest.test.mjs` fails when the list is stale, when a name is not valid for Storage,
  when a file is over the 50 MB limit, or when an address the site can build is not in the list.
- `scripts/upload-media.mjs` is the owner's tool (Node 18 or newer, nothing to install). `tests/upload-media.test.mjs` runs it
  end to end against `tests/helpers/fake-storage.mjs`, a stand-in for the parts of the Storage API it uses: key placement
  (`apikey` header only for the new `sb_secret_` keys), duplicate answers (409), size and type refusals (413, 415), retries,
  `--force`, `--only`, `--from-url`, CORS and Range checks, and that the key never appears in the output.
- `scripts/e2e-media.mjs` crawls a production build in a real browser and compares which files each page asks for with the
  switch off and on (section 11).

Supabase details that the tool relies on (read from Supabase's documentation on 24–25 Oct 2026): the public address of an object is
`<project>/storage/v1/object/public/<bucket>/<path>`; a new-format secret key goes in the `apikey` header only (not as a
bearer token) and is refused when sent with a browser-like User-Agent; object names may only contain the characters in
`KEY_RULE`; a duplicate upload answers 409 unless `x-upsert: true`; Smart CDN is on for Pro and above.

## 11. Proof run (24–25 Oct 2026)

**Question.** With the switch on, does every page still get every picture, model, video and sound it needs, and does nothing
still load from the site's own folders?

**Method.** The same code was built twice with `next build` (production): once with the switch off ("baseline") and once with
it on, pointing at a local stand-in for the Supabase bucket. The stand-in held exactly the 185 listed files, put there by the
real upload tool (`scripts/upload-media.mjs`), which then opened all 185 at their public addresses and found them fine.
`scripts/e2e-media.mjs` drove Chromium (Playwright) through 38 pages, all at laptop width (1440 px) and 16 of them also at
phone width (390 px): 54 page views. Each page was scrolled from top to bottom in steps and back to the top, and every
picture, video, model and sound it asked for was recorded with its answer code, together with every console message and
page error.

| What was checked | Switch off | Switch on |
| --- | --- | --- |
| Page views | 54 | 54 |
| Media requests | 503, all to the site's own folders | 502, none to the site's own folders (435 straight to the bucket address, 67 through the site's image service, which fetched the original from the bucket) |
| Distinct files asked for | 123 | 123 |
| Requests answered with an error | 0 | 0 |
| Console errors, security-policy (CSP) or cross-site (CORS) messages, page errors | 0 | 0 |
| Files asked for that are not in the upload list | 0 | 0 |

The two runs asked for the same files on every page view but one: on `/tournaments` at laptop width the baseline run
requested `media/tourn-crowd.webp` and the switch-on run did not. That is timing, not the switch. The picture belongs to a story
reel whose slides load only when scrolled near, and a slower, slide-by-slide scroll against the bucket requested it and got a
200.

**Screenshots.** The first screen of 13 pages at both widths was captured in both modes and compared pixel by pixel (26 pairs;
`/curriculum` has no pair because its 3D scene is too slow to capture in the software-rendered test browser, with or without
the switch). In 21 pairs no pixel differs by more than 24 of 255 levels. The other five differ for reasons unrelated to the
files: two `/cadets` shots caught a different frame of the looping background video, two `/journal` shots a different
position of the rotating sphere, and one `/fleet` phone shot caught the navigation bar mid-slide (every differing pixel is
inside the top 64 px, and 0.00% elsewhere). The top 120 px of every page was also inspected on strips of all 13 pages at both
widths.

**The site's own checks** pass on the final code: `npm test` 133 of 133, typecheck, lint (0 errors; 8 warnings that were
already there) and, on the normal switch-off build, the 19-check browser smoke test (`npm run test:e2e`).

**What this does not prove**

- **It was a stand-in, not Supabase.** The stand-in answers the way Supabase's documentation says a public bucket does
  (the public address, content types, a one-day cache header, byte ranges, cross-site headers), but the real bucket's headers
  have not been seen from here. The last step of the upload tool checks exactly that on the real bucket and says so if
  something is off (section 12 has the row for 3D scenes and CORS).
- **62 of the 185 files (24.9 MB) were never asked for in this crawl.** They are uploaded and checked by the tool, but not seen
  loading in a browser. 40 are frames of a horse sequence whose component no page uses today (2.3 MB); 11 are sounds that
  load only after a visitor turns sound on (0.9 MB); 2 are 3D models, one for a hero stage no page mounts today and one used
  only if the first statue model fails to load (6.3 MB); 3 are second-choice video sources that a browser uses only if the
  first one cannot be played (11.9 MB); 5 are film stills in the media list that no crawled page showed (3.3 MB); and 1 is the
  handwritten letter that appears when the home-page verifier is switched to "letter" (0.3 MB).
- **The test browser draws 3D with software rendering**, so frame rates say nothing about real devices. What it did show is
  that all 15 model requests were answered without error and that no page error was recorded.
- **Real visitors vary.** A crawl is one scripted visit per page. Section 9 turns it into upper bounds, not a forecast.

**Repeating the proof** (needs Playwright; the script starts and stops its own server on port 3124, and each crawl takes up
to half an hour on a two-core machine):

```
# 1. switch off
npm run build
node scripts/e2e-media.mjs --label baseline
# 2. switch on, against a stand-in or the real bucket
NEXT_PUBLIC_MEDIA_BASE_URL=<the address from section 4> npm run build
node scripts/e2e-media.mjs --label remote --media-base <the same address>
# 3. compare (exits 1 on any problem)
node scripts/e2e-media.mjs --compare
```

`--shots` adds the screenshot pass, `--only /fleet` limits a run to one page, `--update` merges a re-run into the earlier
result. Results are written to `output/media-proof/` (git-ignored). With a stand-in on `127.0.0.1`, build the switch-on
version with `BSAH_ALLOW_LOCAL_IMAGE_HOST=1` as well; never set that in Vercel.

## 12. Troubleshooting

| What you see | Meaning | What to do |
| --- | --- | --- |
| "That is the old public (anon) key" or "Invalid API key" (401/403) | wrong key | use the secret key (`sb_secret_…`) of the website's project, or run with `--url https://<ref>.supabase.co` for the right project |
| "larger than the upload limit … (413)" | the project or bucket limit is below the file size | Supabase → Storage → Settings, raise the global limit (the largest file is 7.8 MB, so this only happens if a limit was lowered) |
| "invalid mime type" (415) | the bucket accepts only the file types that were in the list when it was created | Supabase → Storage → `website-media` → Edit bucket → Allowed MIME types: add the new type, then run the tool again |
| "already exists" (409) | the file is already uploaded | nothing; it is skipped unless you pass `--force` |
| "A bucket named website-media already exists but it is private" | someone created it without public access | Supabase → Storage → `website-media` → Edit bucket → Public bucket |
| local files differ from the list | your Mac has other versions of some files | rerun with `--from-url https://project-t9r95.vercel.app` |
| pictures missing after the switch, console shows `Refused to load` | the redeploy did not pick up the variable, or its value has a typo | check the value, redeploy without the build cache |
| 3D scene stays empty, console mentions CORS | the bucket answered without cross-site headers | run `node output/media-upload/upload-media.mjs --verify-only` and read the CORS line |
| everything is slow or answers 402 | the allowance is used up / the organization is restricted | Supabase → Billing → Usage; section 3; or roll back (section 8) |
