-- ROLLBACK for 20261023001000_website_layer.sql on the live project. Only run with the owner's approval.
-- Removes ONLY objects the website layer added. Operations tables, policies and data are not touched, except that
-- rows the layer mirrored into mou_requests / executive_appointments / qr_lead_captures stay (they are ordinary
-- operations records; delete them by hand if wanted: notes like 'Website MOU enquiry.%' or source like 'website%').
-- Website storage objects must be emptied first (Storage → bucket → delete files), then the buckets are removed.

begin;
drop policy if exists "website-assets staff insert" on storage.objects;
drop policy if exists "website-assets staff update" on storage.objects;
drop policy if exists "website-assets staff delete" on storage.objects;
drop policy if exists "user-uploads owner insert" on storage.objects;
drop policy if exists "user-uploads owner or staff read" on storage.objects;
drop policy if exists "user-uploads owner delete" on storage.objects;
drop policy if exists "private-documents staff read" on storage.objects;
drop policy if exists "private-documents staff insert" on storage.objects;
drop policy if exists "private-documents staff delete" on storage.objects;
delete from storage.buckets where id in ('website-assets', 'user-uploads', 'private-documents')
  and not exists (select 1 from storage.objects o where o.bucket_id = storage.buckets.id);

drop function if exists public.submit_lead_v2(public.lead_type, text, text, text, text, jsonb, text, boolean, jsonb, text);
drop function if exists public.consume_rate_limit(text, integer, integer);
drop function if exists public.verify_passport(text);
drop table if exists public.generated_documents;
drop table if exists public.media_assets;
drop table if exists public.onboarding_leads;
drop trigger if exists audit_events_no_update on public.audit_events;
drop table if exists public.audit_events;
drop table if exists app_private.rate_limits;
drop function if exists app_private.mirror_lead(text, public.lead_type, text, text, text, jsonb, jsonb, text);
drop function if exists app_private.audit_row_change();
drop function if exists app_private.audit(text, text, text, jsonb);
drop function if exists app_private.reject_mutation();
drop function if exists app_private.set_updated_at();
drop type if exists public.lead_status;
drop type if exists public.lead_type;
-- app_private.is_website_staff() and the schema stay if the security fixes (001100) are applied; otherwise:
-- drop function if exists app_private.is_website_staff(); drop schema if exists app_private;
commit;
