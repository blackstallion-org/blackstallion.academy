# Media library on Supabase Storage (bucket `bsah-media`), 29 Oct 2026

Staff upload images, video and 3D models in the admin console; the public sees them on `/gallery`. The files live in
Supabase Storage, so they stay when the site is redeployed. **Status: code, migration and tests are done; nothing has been
applied to the Supabase project and no file has been uploaded.** Three steps that only the owner can take are in section 3.

## 1. Was Storage already connected?

Checked in the code and, read-only, against the project `tgwadczrfbljnepoaqtb` with its publishable key.

| Part | Finding |
| --- | --- |
| Project reachable | Yes (auth health 200) |
| Bucket `bsah-media` | **Exists and is public** (a public URL answers "object not found", not "bucket not found"). Nothing in the repository used it before this change. |
| Bucket `website-assets` | Exists, public. The older admin upload (images only, up to 4 MB) writes here. Unchanged. |
| Bucket `website-media` | Does not exist: the "serve the whole site's media from Supabase" switch in `MEDIA_HOSTING.md` is still off. |
| `user-uploads`, `private-documents` | Private (the public endpoint reports no bucket). Not touched. |
| Table `media_assets` | Reachable, empty: nothing was ever uploaded through the console. **It has no `bucket` column yet**: the migration below is not applied. |
| Anonymous upload to `bsah-media` | Refused (row-level security). |
| Anonymous list of `bsah-media` | Returns nothing. |
| Anonymous delete in `bsah-media` | Nothing to delete / refused. |
| Anonymous insert into `media_assets` | Refused (permission denied). |
| Staff account | None exists (readiness item B2), so no upload could be tried against the live project. |

## 2. What this adds

- **Migration** `supabase/live/migrations/20261029001300_bsah_media_library.sql` (additive, re-runnable) and its rollback. It keeps the
  bucket public and limits it to PNG, JPEG, WebP, AVIF, MP4, WebM and GLB up to 50 MB (the Free plan's ceiling); gives website staff
  (`public.users.role = 'SUPER_ADMIN'`) read, add, replace and delete on that bucket and nobody else (public reading needs no policy
  because the bucket is public); and teaches `public.media_assets` its `bucket` and `kind` with one rule tying bucket, kind, type and size
  together. Rows the older upload wrote still satisfy it. Replica tests: `supabase/live/tests/60_…` and `61_…` (the whole replica suite:
  227 passed, 0 failed, Postgres 18).
- **Upload** (`/admin/media`, new "Media library" section; the old "Website images" form is unchanged). The browser sends the file
  straight to Storage on a one-time link, because a server action cannot carry more than about 4.5 MB on Vercel.
  1. `prepareLibraryUpload`: staff check, then the declared name and size, then a signed upload link for a fresh random path
     `images|videos|models/<yyyy>/<mm>/<uuid>.<ext>` (Storage's own policy checks staff again).
  2. The browser uploads to that link.
  3. `recordLibraryUpload`: staff check, then **one ranged request for the first 64 bytes** of the stored file. Its real type (from its
     bytes, never from the name or the browser) must be the one its extension and folder promise; MP4 vs AVIF vs QuickTime/HEIC, WebM vs
     Matroska, and GLB version 2 are told apart. Only then is the file recorded. A file that fails is removed again.
- **Retrieval**: every file has a permanent public URL (`…/storage/v1/object/public/bsah-media/<path>`), shown in the console with
  Open and Copy link.
- **Deletion**: the file is removed from Storage first, then its record; if Storage refuses, the record stays so it can be retried.
- **On the website**: `/gallery` lists the library (photographs, films, 3D models with a lazy WebGL viewer). The list is read with the
  publishable key, cached, and refreshed the moment a file is added or deleted (`updateTag`). It survives any failure by showing an empty
  gallery. It is **not linked from the navigation**: where to link it is a design decision.

## 3. Steps for the owner (in this order)

1. **Check the bucket's policies by hand, then apply the migration.** In Supabase → Storage → Policies, `bsah-media` should have none of
   its own (policies added by hand while creating the bucket can be wider than these). Then run
   `supabase/live/migrations/20261029001300_bsah_media_library.sql` in the SQL editor (it is additive and can be run twice). The rule in
   `DATABASE_ARCHITECTURE.md` applies: live changes go through `supabase/live/migrations/` only, and this one has been run on the replica.
2. **Create a staff account** (`public.users.role = 'SUPER_ADMIN'`; see `ADMIN_CONSOLE.md`). Without one, `/admin/media` cannot be used.
3. **Set the two variables in Vercel and redeploy:** `SUPABASE_URL=https://tgwadczrfbljnepoaqtb.supabase.co` and
   `SUPABASE_PUBLISHABLE_KEY=<the publishable key>` (Production and Preview). The Content-Security-Policy is built from `SUPABASE_URL`
   when the site is built, so a redeploy is needed for images, video and models from Storage to be allowed.
   Local `.env.local` now points at this project (the old paused project's lines are kept as comments).

Then try it: sign in, `/admin/media`, upload a small image, a short MP4 and a GLB, open `/gallery`, delete one, reload.

## 4. Rollback

`supabase/live/rollback/20261029001300_bsah_media_library_rollback.sql` removes the policies, the two columns and the rule, and restores the
old checks. It **refuses to run while library files are recorded** (delete them in the console first). It does not touch the bucket, its
files or its limits (the bucket was created by hand and may hold other files).

## 5. Limits and things to know

- **Free plan**: 50 MB per file, no backups. Upload web-sized files: a visitor's phone downloads each image in full (nothing resizes
  them), and a film in full when played.
- **Abandoned uploads**: if the browser is closed between steps 2 and 3, the file stays in the bucket with no record (unguessable path,
  invisible on the site). Clean such files in Supabase → Storage by hand.
- **Not covered by the tests**: an upload against the real project (needs steps 1 to 3), speed on a real phone, and Safari and Firefox.
- **Two buckets, two jobs**: `bsah-media` is the editorial library staff manage in the console; `website-media` (not created) is the
  optional mirror of the site's own folders (`MEDIA_HOSTING.md`). They are independent.
- `/gallery` images and videos are served by Supabase's CDN with the `Cache-Control` the bucket sets; deleting a file can take a short
  while to disappear from the CDN.
