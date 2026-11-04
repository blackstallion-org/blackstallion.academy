-- Media library on the public bucket bsah-media. THROWAWAY Postgres only.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  admin  uuid := '00000000-0000-0000-0000-0000000000a1';
  parent uuid := '00000000-0000-0000-0000-0000000000b1';
  school uuid := '00000000-0000-0000-0000-0000000000b2';
  ins text := $q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by, bucket, kind) values (%L, 'A described file', %L, %s, %L, %L, %L)$q$;
begin
  -- the bucket
  perform t.eq('bucket: exists, public, 50 MB limit', (select (public and file_size_limit = 52428800)::text from storage.buckets where id = 'bsah-media'), 'true');
  perform t.eq('bucket: only images, video and GLB', (select array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'bsah-media'),
    'image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm,model/gltf-binary');
  perform t.eq('bucket: the earlier website buckets are untouched', (select count(*)::text from storage.buckets where id in ('website-assets','user-uploads','private-documents') and file_size_limit is not null), '3');
  perform t.eq('bucket: exactly one row for it', (select count(*)::text from storage.buckets where id = 'bsah-media'), '1');

  -- storage policies: staff only
  perform t.eq('objects: staff adds a video', t.dml(admin, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('bsah-media', 'videos/2026/10/a.mp4')$q$), 'OK:1');
  perform t.eq('objects: staff adds a model', t.dml(admin, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('bsah-media', 'models/2026/10/b.glb')$q$), 'OK:1');
  perform t.eq('objects: staff lists the bucket', t.scalar(admin, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'bsah-media'$q$), '2');
  perform t.eq('objects: staff replaces a file', t.dml(admin, 'authenticated', $q$update storage.objects set name = 'videos/2026/10/a2.mp4' where bucket_id = 'bsah-media' and name = 'videos/2026/10/a.mp4'$q$), 'OK:1');
  perform t.eq('objects: parent cannot add', t.dml(parent, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('bsah-media', 'videos/2026/10/p.mp4')$q$), 'ERR:42501');
  perform t.eq('objects: school admin cannot add', t.dml(school, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('bsah-media', 'models/2026/10/s.glb')$q$), 'ERR:42501');
  perform t.eq('objects: anonymous visitor cannot add', t.dml(null, 'anon', $q$insert into storage.objects (bucket_id, name) values ('bsah-media', 'images/2026/10/x.png')$q$), 'ERR:42501');
  perform t.eq('objects: anonymous visitor cannot list', t.scalar(null, 'anon', $q$select count(*) from storage.objects where bucket_id = 'bsah-media'$q$), '0');
  perform t.eq('objects: parent cannot list', t.scalar(parent, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'bsah-media'$q$), '0');
  perform t.eq('objects: parent cannot delete', t.dml(parent, 'authenticated', $q$delete from storage.objects where bucket_id = 'bsah-media'$q$), 'OK:0');
  perform t.eq('objects: anonymous visitor cannot delete', t.dml(null, 'anon', $q$delete from storage.objects where bucket_id = 'bsah-media'$q$), 'OK:0');
  perform t.eq('objects: staff deletes a file', t.dml(admin, 'authenticated', $q$delete from storage.objects where bucket_id = 'bsah-media' and name = 'videos/2026/10/a2.mp4'$q$), 'OK:1');
  perform t.eq('objects: staff cannot write to an operations bucket through these policies', t.dml(admin, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('invoices', 'x/inv2.pdf')$q$), 'ERR:42501');

  -- media_assets rules
  perform t.eq('rows: the earlier image upload still records unchanged',
    t.dml(admin, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/legacy.png', 'A described file', 'image/png', 1200, %L)$q$, admin)), 'OK:1');
  perform t.eq('rows: the old row defaults to website-assets and image',
    (select bucket || '/' || kind from public.media_assets where storage_path = 'site/2026/10/legacy.png'), 'website-assets/image');
  perform t.eq('rows: staff records a video', t.dml(admin, 'authenticated', format(ins, 'videos/2026/10/v1.mp4', 'video/mp4', 4000000, admin, 'bsah-media', 'video')), 'OK:1');
  perform t.eq('rows: staff records a WebM', t.dml(admin, 'authenticated', format(ins, 'videos/2026/10/v2.webm', 'video/webm', 3000000, admin, 'bsah-media', 'video')), 'OK:1');
  perform t.eq('rows: staff records a 3D model', t.dml(admin, 'authenticated', format(ins, 'models/2026/10/m1.glb', 'model/gltf-binary', 1500000, admin, 'bsah-media', 'model')), 'OK:1');
  perform t.eq('rows: staff records an AVIF', t.dml(admin, 'authenticated', format(ins, 'images/2026/10/i1.avif', 'image/avif', 250000, admin, 'bsah-media', 'image')), 'OK:1');
  perform t.eq('rows: a 50 MB video is allowed', t.dml(admin, 'authenticated', format(ins, 'videos/2026/10/big.mp4', 'video/mp4', 52428800, admin, 'bsah-media', 'video')), 'OK:1');
  perform t.eq('rows: over 50 MB is refused', t.dml(admin, 'authenticated', format(ins, 'videos/2026/10/huge.mp4', 'video/mp4', 52428801, admin, 'bsah-media', 'video')), 'ERR:23514');
  perform t.eq('rows: the website-assets bucket still stops at 8 MB', t.dml(admin, 'authenticated', format(ins, 'site/2026/10/fat.png', 'image/png', 8388609, admin, 'website-assets', 'image')), 'ERR:23514');
  perform t.eq('rows: a video cannot go into website-assets', t.dml(admin, 'authenticated', format(ins, 'site/2026/10/v.mp4', 'video/mp4', 1000, admin, 'website-assets', 'video')), 'ERR:23514');
  perform t.eq('rows: a kind that does not match the type is refused', t.dml(admin, 'authenticated', format(ins, 'images/2026/10/i2.png', 'image/png', 1000, admin, 'bsah-media', 'video')), 'ERR:23514');
  perform t.eq('rows: a QuickTime movie is refused', t.dml(admin, 'authenticated', format(ins, 'videos/2026/10/q.mov', 'video/quicktime', 1000, admin, 'bsah-media', 'video')), 'ERR:23514');
  perform t.eq('rows: an SVG is refused', t.dml(admin, 'authenticated', format(ins, 'images/2026/10/s.svg', 'image/svg+xml', 1000, admin, 'bsah-media', 'image')), 'ERR:23514');
  perform t.eq('rows: a GIF is refused', t.dml(admin, 'authenticated', format(ins, 'images/2026/10/g.gif', 'image/gif', 1000, admin, 'bsah-media', 'image')), 'ERR:23514');
  perform t.eq('rows: an unknown bucket is refused', t.dml(admin, 'authenticated', format(ins, 'images/2026/10/z.png', 'image/png', 1000, admin, 'private-documents', 'image')), 'ERR:23514');
  perform t.eq('rows: a path with .. is refused', t.dml(admin, 'authenticated', format(ins, 'images/../x.png', 'image/png', 1000, admin, 'bsah-media', 'image')), 'ERR:23514');
  perform t.eq('rows: parent cannot record a file', t.dml(parent, 'authenticated', format(ins, 'images/2026/10/p.png', 'image/png', 1000, parent, 'bsah-media', 'image')), 'ERR:42501');
  perform t.eq('rows: anonymous visitor cannot record a file', t.dml(null, 'anon', format(ins, 'images/2026/10/a.png', 'image/png', 1000, null, 'bsah-media', 'image')), 'ERR:42501');
  perform t.eq('rows: staff cannot attribute a file to someone else', t.dml(admin, 'authenticated', format(ins, 'images/2026/10/o.png', 'image/png', 1000, parent, 'bsah-media', 'image')), 'ERR:42501');
  perform t.eq('rows: the public reads the library', t.scalar(null, 'anon', $q$select count(*) from public.media_assets where bucket = 'bsah-media'$q$), '5');
  perform t.eq('rows: staff deletes a record', t.dml(admin, 'authenticated', $q$delete from public.media_assets where storage_path = 'videos/2026/10/big.mp4'$q$), 'OK:1');
  perform t.eq('rows: parent cannot delete a record', t.dml(parent, 'authenticated', $q$delete from public.media_assets where bucket = 'bsah-media'$q$), 'OK:0');
  perform t.eq('rows: uploads and deletes are in the audit trail', (select (count(*) >= 5)::text from public.audit_events where entity_type = 'media_assets'), 'true');
end $$;
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end
from t.results where n > :start_n order by n;
