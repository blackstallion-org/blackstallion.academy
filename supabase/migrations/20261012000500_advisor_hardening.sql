-- Applied 12 Oct 2026 after the Supabase security/performance advisors.
-- The view is no longer a public path: it runs with the caller's rights and app roles cannot read it.
alter view public.public_hub_labels set (security_invoker = true);
revoke all on public.public_hub_labels from anon, authenticated;

-- Public hub labels come from a narrow function instead (no finance or contract columns).
create function public.list_public_hubs()
returns table (code text, display_name text, location_label text, status public.hub_status, zone_code text)
language sql stable security definer set search_path = '' as $$
  select h.code, h.display_name, h.location_label, h.status, z.code
  from public.school_hubs h join public.regional_zones z on z.id = h.zone_id
  order by h.code
$$;
revoke all on function public.list_public_hubs() from public;
grant execute on function public.list_public_hubs() to anon, authenticated;

alter function public.set_updated_at() set search_path = '';
