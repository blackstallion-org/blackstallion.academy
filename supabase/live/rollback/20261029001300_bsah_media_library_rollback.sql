-- Rollback of 20261029001300_bsah_media_library.sql. Re-runnable.
--
-- Refuses to run while media_assets still lists files in `bsah-media`: delete them first (Admin > Website images > Media library),
-- otherwise the files would be left in the bucket with no record. The bucket itself, its files and its limits are NOT touched:
-- the bucket was created by hand and may hold other files. To lift the limits, edit the bucket in the dashboard.
-- (dynamic SQL: the column is gone on the second run, and a static query would fail to plan)
do $$
declare listed boolean := false;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_assets' and column_name = 'bucket') then
    execute 'select exists (select 1 from public.media_assets where bucket = ''bsah-media'')' into listed;
  end if;
  if listed then
    raise exception 'media_assets still lists files in bsah-media: delete them in the admin media library first';
  end if;
end $$;

drop policy if exists "bsah-media staff read" on storage.objects;
drop policy if exists "bsah-media staff insert" on storage.objects;
drop policy if exists "bsah-media staff update" on storage.objects;
drop policy if exists "bsah-media staff delete" on storage.objects;

-- Skipped when the website layer itself was rolled back first (media_assets is gone then).
do $$
begin
  if to_regclass('public.media_assets') is null then return; end if;
  drop index if exists public.media_assets_bucket_created_idx;
  alter table public.media_assets drop constraint if exists media_assets_library_rules;
  alter table public.media_assets drop column if exists kind;
  alter table public.media_assets drop column if exists bucket;
  alter table public.media_assets drop constraint if exists media_assets_mime_type_check;
  alter table public.media_assets drop constraint if exists media_assets_bytes_check;
  alter table public.media_assets add constraint media_assets_mime_type_check check (mime_type in ('image/png', 'image/jpeg', 'image/webp'));
  alter table public.media_assets add constraint media_assets_bytes_check check (bytes between 1 and 8388608);
end $$;
