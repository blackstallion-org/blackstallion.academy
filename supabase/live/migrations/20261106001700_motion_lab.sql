-- Motion Lab sessions on the LIVE operations project (tgwadczrfbljnepoaqtb). 6 Nov 2026. Strictly additive and re-runnable.
--
-- What it adds (nothing existing is changed: no operations table, policy, function, trigger or grant is touched):
--   * public.motion_sessions: one row per saved session of the /motion-lab page (name, source, duration, the summary numbers,
--     which models produced them, and the storage paths of the measurements JSON and the recording). Private to its owner.
--   * a PRIVATE storage bucket `motion-lab` (not public; 50 MB per file, the Free plan's ceiling; JSON and video types only).
--   * Row Level Security: an owner reads, writes and deletes only their own rows and only objects under their own folder
--     (`<auth.uid()>/…`). Anonymous visitors have no access. Staff get no special read access: a recording of someone's horse
--     or child is not the console's business.
-- The browser keeps sessions locally first; rows only appear when a signed-in person presses "Save to account" (app/motion-lab/actions.ts).
-- Rollback: supabase/live/rollback/20261106001700_motion_lab_rollback.sql (refuses while rows exist).

create table if not exists public.motion_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  source text not null check (source in ('camera', 'upload')),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  duration_ms integer not null check (duration_ms between 0 and 14400000),
  video_width integer check (video_width is null or video_width between 0 and 16384),
  video_height integer check (video_height is null or video_height between 0 and 16384),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and pg_column_size(summary) <= 20000),
  models jsonb not null check (jsonb_typeof(models) = 'object' and pg_column_size(models) <= 2000),
  samples_path text check (samples_path is null or samples_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/samples\.json$'),
  video_path text check (video_path is null or video_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/recording\.(webm|mp4|mov)$'),
  video_bytes bigint check (video_bytes is null or video_bytes between 0 and 52428800),
  status text not null default 'uploading' check (status in ('uploading', 'complete')),
  unique (owner_id, client_id)
);
create index if not exists motion_sessions_owner_recorded_idx on public.motion_sessions (owner_id, recorded_at desc);

alter table public.motion_sessions enable row level security;
revoke all on public.motion_sessions from anon, authenticated;
grant select, insert, update, delete on public.motion_sessions to authenticated;

drop policy if exists motion_sessions_owner_select on public.motion_sessions;
create policy motion_sessions_owner_select on public.motion_sessions for select to authenticated
  using (owner_id = (select auth.uid()));
drop policy if exists motion_sessions_owner_insert on public.motion_sessions;
create policy motion_sessions_owner_insert on public.motion_sessions for insert to authenticated
  with check (owner_id = (select auth.uid()));
drop policy if exists motion_sessions_owner_update on public.motion_sessions;
create policy motion_sessions_owner_update on public.motion_sessions for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists motion_sessions_owner_delete on public.motion_sessions;
create policy motion_sessions_owner_delete on public.motion_sessions for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ------------------------------------------------------------------ private bucket and its policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('motion-lab', 'motion-lab', false, 52428800, array['application/json', 'video/webm', 'video/mp4', 'video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "motion-lab owner read" on storage.objects;
create policy "motion-lab owner read" on storage.objects for select to authenticated
  using (bucket_id = 'motion-lab' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "motion-lab owner insert" on storage.objects;
create policy "motion-lab owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'motion-lab' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "motion-lab owner update" on storage.objects;
create policy "motion-lab owner update" on storage.objects for update to authenticated
  using (bucket_id = 'motion-lab' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'motion-lab' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "motion-lab owner delete" on storage.objects;
create policy "motion-lab owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'motion-lab' and (storage.foldername(name))[1] = (select auth.uid())::text);
