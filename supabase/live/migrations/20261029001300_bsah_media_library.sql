-- BSAH media library on the public bucket `bsah-media` of the LIVE project (tgwadczrfbljnepoaqtb). 29 Oct 2026.
--
-- STRICTLY ADDITIVE and re-runnable. Needs 20261023001000_website_layer.sql (public.media_assets, app_private.is_website_staff()).
-- It touches no operations table, policy, function or trigger. What it does:
--   1. makes sure the bucket `bsah-media` exists (the owner created it in the dashboard as a public bucket; if it is there already
--      it stays public) and limits what can be put in it: images (PNG, JPEG, WebP, AVIF), video (MP4, WebM) and 3D models (GLB),
--      up to 50 MB per file (the Free plan's ceiling),
--   2. lets website staff (public.users.role = 'SUPER_ADMIN') read, add, replace and delete objects in that bucket and nobody else:
--      the public reads files through their public URL, which needs no policy, so anonymous visitors get no write or list access,
--   3. teaches public.media_assets which bucket a file is in and what kind it is, with rules that tie bucket, kind, type and size
--      together. Rows already there (website-assets images) satisfy the new rule unchanged and keep working.
-- Rollback: supabase/live/rollback/20261029001300_bsah_media_library_rollback.sql (refuses to run while library rows exist).

-- ------------------------------------------------------------------ 1. the bucket
-- `public` is left as it is for an existing bucket; only the limits are set.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('bsah-media', 'bsah-media', true, 52428800,
   array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'model/gltf-binary'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------ 2. staff-only storage policies
drop policy if exists "bsah-media staff read" on storage.objects;
create policy "bsah-media staff read" on storage.objects for select to authenticated
  using (bucket_id = 'bsah-media' and (select app_private.is_website_staff()));
drop policy if exists "bsah-media staff insert" on storage.objects;
create policy "bsah-media staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'bsah-media' and (select app_private.is_website_staff()));
drop policy if exists "bsah-media staff update" on storage.objects;
create policy "bsah-media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'bsah-media' and (select app_private.is_website_staff()))
  with check (bucket_id = 'bsah-media' and (select app_private.is_website_staff()));
drop policy if exists "bsah-media staff delete" on storage.objects;
create policy "bsah-media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'bsah-media' and (select app_private.is_website_staff()));

-- ------------------------------------------------------------------ 3. media_assets knows its bucket and kind
alter table public.media_assets add column if not exists bucket text not null default 'website-assets';
alter table public.media_assets add column if not exists kind text not null default 'image';

alter table public.media_assets drop constraint if exists media_assets_mime_type_check;
alter table public.media_assets drop constraint if exists media_assets_bytes_check;
alter table public.media_assets drop constraint if exists media_assets_library_rules;
alter table public.media_assets add constraint media_assets_library_rules check (
  (bucket = 'website-assets' and kind = 'image' and mime_type in ('image/png', 'image/jpeg', 'image/webp') and bytes between 1 and 8388608)
  or (bucket = 'bsah-media' and bytes between 1 and 52428800 and (
       (kind = 'image' and mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/avif'))
    or (kind = 'video' and mime_type in ('video/mp4', 'video/webm'))
    or (kind = 'model' and mime_type = 'model/gltf-binary')))
);
create index if not exists media_assets_bucket_created_idx on public.media_assets (bucket, created_at desc);
