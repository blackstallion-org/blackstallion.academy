-- Auth profiles, Storage buckets/policies and generated documents (23 Oct 2026). Additive and re-runnable.
--
-- * Every new auth user gets a least-privilege profile ('cadet'): no admin rights. Staff are promoted by an
--   executive_admin (audited), never by hard-coded credentials.
-- * Buckets: website-assets (public read, admin write), user-uploads (owner folder, private), private-documents
--   (admins only; downloaded through short-lived signed URLs).
-- * generated_documents records every stored PDF (MOU drafts etc.); media_assets records website images.
-- Validate with supabase/tests/run.sh; apply to a live project only with owner approval.

-- ------------------------------------------------------------------ profile on sign-up
create or replace function app_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Member'))
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function app_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- ------------------------------------------------------------------ documents and media records
create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('mou_draft', 'campus_proposal', 'roi_export')),
  title text not null check (length(title) between 2 and 200),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9_/.-]+$' and length(storage_path) between 8 and 300 and storage_path !~ '\.\.'),
  lead_reference text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index if not exists generated_documents_created_idx on public.generated_documents (created_at desc);
create index if not exists generated_documents_created_by_idx on public.generated_documents (created_by);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9_/.-]+$' and length(storage_path) between 8 and 300 and storage_path !~ '\.\.'),
  alt_text text not null check (length(btrim(alt_text)) between 3 and 300),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  bytes integer not null check (bytes between 1 and 8388608),
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

alter table public.generated_documents enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists generated_documents_admin_read on public.generated_documents;
create policy generated_documents_admin_read on public.generated_documents for select to authenticated
  using ((select app_private.is_admin()));
drop policy if exists generated_documents_admin_insert on public.generated_documents;
create policy generated_documents_admin_insert on public.generated_documents for insert to authenticated
  with check ((select app_private.is_admin()) and created_by = (select auth.uid()));

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets for select to anon, authenticated using (true);
drop policy if exists media_assets_admin_insert on public.media_assets;
create policy media_assets_admin_insert on public.media_assets for insert to authenticated
  with check ((select app_private.is_admin()) and uploaded_by = (select auth.uid()));
drop policy if exists media_assets_admin_delete on public.media_assets;
create policy media_assets_admin_delete on public.media_assets for delete to authenticated
  using ((select app_private.is_admin()));

revoke all on public.generated_documents, public.media_assets from anon, authenticated;
grant select, insert on public.generated_documents to authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, delete on public.media_assets to authenticated;

-- ------------------------------------------------------------------ storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('website-assets', 'website-assets', true, 8388608, array['image/png', 'image/jpeg', 'image/webp']),
  ('user-uploads', 'user-uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('private-documents', 'private-documents', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- website-assets: anyone may read (public bucket); only admins write or delete.
drop policy if exists "website-assets admin insert" on storage.objects;
create policy "website-assets admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'website-assets' and (select app_private.is_admin()));
drop policy if exists "website-assets admin update" on storage.objects;
create policy "website-assets admin update" on storage.objects for update to authenticated
  using (bucket_id = 'website-assets' and (select app_private.is_admin()));
drop policy if exists "website-assets admin delete" on storage.objects;
create policy "website-assets admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'website-assets' and (select app_private.is_admin()));

-- user-uploads: a signed-in user works only inside the folder named after their user id; admins can read all.
drop policy if exists "user-uploads owner insert" on storage.objects;
create policy "user-uploads owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "user-uploads owner or admin read" on storage.objects;
create policy "user-uploads owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'user-uploads' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select app_private.is_admin())));
drop policy if exists "user-uploads owner delete" on storage.objects;
create policy "user-uploads owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- private-documents: admins only (signed URLs are minted for them on the server).
drop policy if exists "private-documents admin read" on storage.objects;
create policy "private-documents admin read" on storage.objects for select to authenticated
  using (bucket_id = 'private-documents' and (select app_private.is_admin()));
drop policy if exists "private-documents admin insert" on storage.objects;
create policy "private-documents admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-documents' and (select app_private.is_admin()));
drop policy if exists "private-documents admin delete" on storage.objects;
create policy "private-documents admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'private-documents' and (select app_private.is_admin()));

-- ------------------------------------------------------------------ audit trail for documents and media
drop trigger if exists audit_generated_documents on public.generated_documents;
create trigger audit_generated_documents after insert or update or delete on public.generated_documents
  for each row execute function public.audit_row_change();
drop trigger if exists audit_media_assets on public.media_assets;
create trigger audit_media_assets after insert or update or delete on public.media_assets
  for each row execute function public.audit_row_change();
