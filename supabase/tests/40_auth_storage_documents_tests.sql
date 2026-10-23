-- Auth profile trigger, Storage policies and generated documents. THROWAWAY Postgres only. Runs after 10_/20_/30_.
select coalesce(max(n), 0) as start_n from t.results \gset
do $$
declare
  ops uuid := '00000000-0000-0000-0000-0000000000a1';
  g1  uuid := '00000000-0000-0000-0000-0000000000c1';
  newbie uuid := '00000000-0000-0000-0000-00000000aa01';
begin
  -- sign-up creates a least-privilege profile
  insert into auth.users (id, email) values (newbie, 'new.member@example.test');
  perform t.eq('auth: sign-up creates a profile', (select count(*)::text from public.profiles where id = newbie), '1');
  perform t.eq('auth: new profile is least-privilege', (select role::text from public.profiles where id = newbie), 'cadet');
  perform t.eq('auth: new member cannot promote self', t.dml(newbie, 'authenticated', format($q$update public.profiles set role = 'operations' where id = %L$q$, newbie)), 'ERR:42501');
  perform t.eq('auth: new member is not admin', t.scalar(newbie, 'authenticated', 'select app_private.is_admin()::text'), 'false');

  -- buckets
  perform t.eq('storage: three buckets exist', (select count(*)::text from storage.buckets where id in ('website-assets','user-uploads','private-documents')), '3');
  perform t.eq('storage: only website-assets is public', (select string_agg(id, ',' order by id) from storage.buckets where public), 'website-assets');
  perform t.eq('storage: private-documents accepts PDF only', (select allowed_mime_types::text from storage.buckets where id = 'private-documents'), '{application/pdf}');

  -- website-assets
  perform t.eq('storage: admin can add a website asset', t.dml(ops, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('website-assets', 'site/2026/10/a.webp')$q$), 'OK:1');
  perform t.eq('storage: member cannot add a website asset', t.dml(newbie, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('website-assets', 'site/2026/10/b.webp')$q$), 'ERR:42501');
  perform t.eq('storage: anon cannot add a website asset', t.dml(null, 'anon', $q$insert into storage.objects (bucket_id, name) values ('website-assets', 'site/2026/10/c.webp')$q$), 'ERR:42501');

  -- user-uploads: own folder only
  perform t.eq('storage: member uploads into own folder', t.dml(newbie, 'authenticated', format($q$insert into storage.objects (bucket_id, name) values ('user-uploads', '%s/photo.jpg')$q$, newbie)), 'OK:1');
  perform t.eq('storage: member cannot upload into another folder', t.dml(newbie, 'authenticated', format($q$insert into storage.objects (bucket_id, name) values ('user-uploads', '%s/photo.jpg')$q$, g1)), 'ERR:42501');
  perform t.eq('storage: other user cannot see the upload', t.scalar(g1, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'user-uploads'$q$), '0');
  perform t.eq('storage: owner sees own upload', t.scalar(newbie, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'user-uploads'$q$), '1');
  perform t.eq('storage: admin sees uploads', t.scalar(ops, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'user-uploads'$q$), '1');

  -- private-documents: admins only
  perform t.eq('storage: admin stores a private document', t.dml(ops, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('private-documents', 'mou/2026/10/x.pdf')$q$), 'OK:1');
  perform t.eq('storage: member cannot read private documents', t.scalar(newbie, 'authenticated', $q$select count(*) from storage.objects where bucket_id = 'private-documents'$q$), '0');
  perform t.eq('storage: anon cannot read private documents', t.scalar(null, 'anon', $q$select count(*) from storage.objects where bucket_id = 'private-documents'$q$), '0');
  perform t.eq('storage: member cannot write private documents', t.dml(newbie, 'authenticated', $q$insert into storage.objects (bucket_id, name) values ('private-documents', 'mou/2026/10/y.pdf')$q$), 'ERR:42501');

  -- generated_documents
  perform t.eq('docs: admin records a document', t.dml(ops, 'authenticated', format($q$insert into public.generated_documents (kind, title, storage_path, created_by) values ('mou_draft', 'MOU draft · Test School', 'mou/2026/10/x.pdf', %L)$q$, ops)), 'OK:1');
  perform t.eq('docs: admin cannot attribute to someone else', t.dml(ops, 'authenticated', format($q$insert into public.generated_documents (kind, title, storage_path, created_by) values ('mou_draft', 'Spoof', 'mou/2026/10/z.pdf', %L)$q$, g1)), 'ERR:42501');
  perform t.eq('docs: member cannot read documents', t.scalar(newbie, 'authenticated', 'select count(*) from public.generated_documents'), '0');
  perform t.eq('docs: anon cannot read documents', t.scalar(null, 'anon', 'select count(*) from public.generated_documents'), 'ERR:42501');
  perform t.eq('docs: bad storage path rejected', t.dml(ops, 'authenticated', format($q$insert into public.generated_documents (kind, title, storage_path, created_by) values ('mou_draft', 'Bad', '../../etc/passwd', %L)$q$, ops)), 'ERR:23514');
  perform t.eq('docs: document insert audited', (select count(*)::text from public.audit_events where entity_type = 'generated_documents'), '1');

  -- media_assets
  perform t.eq('media: admin records an asset', t.dml(ops, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/a.webp', 'A stallion at dusk', 'image/webp', 1200, %L)$q$, ops)), 'OK:1');
  perform t.eq('media: anon can list public assets', t.scalar(null, 'anon', 'select count(*) from public.media_assets'), '1');
  perform t.eq('media: member cannot add assets', t.dml(newbie, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/b.webp', 'Alt text', 'image/webp', 10, %L)$q$, newbie)), 'ERR:42501');
  perform t.eq('media: svg mime refused', t.dml(ops, 'authenticated', format($q$insert into public.media_assets (storage_path, alt_text, mime_type, bytes, uploaded_by) values ('site/2026/10/c.svg', 'Alt text', 'image/svg+xml', 10, %L)$q$, ops)), 'ERR:23514');
end $$;

select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok then '' else '   [' || detail || ']' end as result
from t.results where n > :start_n order by n;
