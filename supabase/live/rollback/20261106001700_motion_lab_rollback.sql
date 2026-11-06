-- Rollback of 20261106001700_motion_lab.sql. Refuses while saved sessions or stored files exist (they are people's recordings).
-- Re-runnable: once the table is gone the guard has nothing to check.
do $$
declare has_rows boolean := false;
begin
  if to_regclass('public.motion_sessions') is not null then
    execute 'select exists (select 1 from public.motion_sessions)' into has_rows;
    if has_rows then raise exception 'motion_sessions still has rows; export or delete them first'; end if;
  end if;
  if exists (select 1 from storage.objects where bucket_id = 'motion-lab') then raise exception 'bucket motion-lab still has files; delete them first'; end if;
end $$;
drop policy if exists "motion-lab owner read" on storage.objects;
drop policy if exists "motion-lab owner insert" on storage.objects;
drop policy if exists "motion-lab owner update" on storage.objects;
drop policy if exists "motion-lab owner delete" on storage.objects;
delete from storage.buckets where id = 'motion-lab';
drop table if exists public.motion_sessions;
