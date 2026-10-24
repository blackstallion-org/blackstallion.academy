-- READ-ONLY SNAPSHOT of the live Supabase project tgwadczrfbljnepoaqtb ("operations schema"), taken 23 Oct 2026
-- from pg_catalog through the dashboard SQL editor. Used ONLY to build a local replica for tests
-- (supabase/live/tests/run.sh). Never run this against the live project: those objects already exist there.
-- Data at snapshot time: 5 auth users (one per role), 1 cadet, 1 hub, 6 site_settings rows, 0 leads, 0 storage objects.

-- tables
create table public.school_hubs (
  id uuid default gen_random_uuid() not null,
  school_name character varying(255) not null,
  slug character varying(100) not null,
  architectural_tier character varying(50) default 'TIER_1_STANDARD'::character varying,
  address text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  contact_email character varying(255),
  revenue_share_percentage numeric(5,2) default 25.00,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  constraint school_hubs_pkey primary key (id),
  constraint school_hubs_slug_key unique (slug)
);

create table public.users (
  id uuid not null,
  full_name character varying(255) not null,
  email character varying(255) not null,
  phone_number character varying(20),
  role character varying(50) not null,
  hub_id uuid,
  created_at timestamp with time zone default now(),
  constraint users_email_key unique (email),
  constraint users_phone_number_key unique (phone_number),
  constraint users_pkey primary key (id),
  constraint users_role_check check (((role)::text = any ((array['PARENT'::character varying, 'INSTRUCTOR'::character varying, 'GROOM'::character varying, 'SCHOOL_ADMIN'::character varying, 'SUPER_ADMIN'::character varying])::text[])))
);

create table public.equine_fleet (
  id uuid default gen_random_uuid() not null,
  hub_id uuid,
  name character varying(100) not null,
  breed character varying(100) default 'Marwari'::character varying,
  microchip_iso_id character varying(100) not null,
  stall_cctv_rtsp_url text,
  height_hands numeric(4,1),
  temperament character varying(100),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  constraint equine_fleet_microchip_iso_id_key unique (microchip_iso_id),
  constraint equine_fleet_pkey primary key (id)
);

create table public.cadets (
  id uuid default gen_random_uuid() not null,
  parent_id uuid,
  hub_id uuid,
  assigned_horse_id uuid,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  passport_code character varying(100) not null,
  current_rank character varying(50) default 'CADET_SQUIRE'::character varying,
  efi_registration_id character varying(50),
  onboarding_fee_paid boolean default false,
  created_at timestamp with time zone default now(),
  constraint cadets_current_rank_check check (((current_rank)::text = any ((array['CADET_SQUIRE'::character varying, 'CADET_RIDER'::character varying, 'CADET_KNIGHT'::character varying, 'SOVEREIGN_LANCER'::character varying])::text[]))),
  constraint cadets_passport_code_key unique (passport_code),
  constraint cadets_pkey primary key (id)
);

create table public.achievements (
  id uuid default gen_random_uuid() not null,
  cadet_id uuid,
  hub_id uuid,
  achievement_type character varying(100) not null,
  title character varying(255) not null,
  description text,
  awarded_at timestamp with time zone default now(),
  constraint achievements_pkey primary key (id)
);

create table public.consent_records (
  id uuid default gen_random_uuid() not null,
  parent_id uuid,
  cadet_id uuid,
  consent_type character varying(100) not null,
  consent_text_version character varying(20) not null,
  consented_at timestamp with time zone default now(),
  ip_address character varying(45),
  is_active boolean default true,
  constraint consent_records_pkey primary key (id)
);

create table public.device_tokens (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  token text not null,
  platform character varying(10) not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  constraint device_tokens_pkey primary key (id),
  constraint device_tokens_platform_check check (((platform)::text = any ((array['ios'::character varying, 'android'::character varying, 'web'::character varying])::text[]))),
  constraint device_tokens_token_key unique (token)
);

create table public.executive_appointments (
  id uuid default gen_random_uuid() not null,
  school_name character varying(255) not null,
  representative_name character varying(255) not null,
  designation character varying(100) not null,
  phone_number character varying(20) not null,
  email character varying(255) not null,
  campus_land_area_sqft integer,
  preferred_date date not null,
  preferred_time_slot character varying(50) not null,
  status character varying(50) default 'SCHEDULED'::character varying,
  created_at timestamp with time zone default now(),
  constraint executive_appointments_pkey primary key (id),
  constraint executive_appointments_status_check check (((status)::text = any ((array['SCHEDULED'::character varying, 'CONFIRMED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);

create table public.groom_daily_logs (
  id uuid default gen_random_uuid() not null,
  hub_id uuid,
  groom_id uuid,
  horse_id uuid,
  log_type character varying(50) not null,
  proof_photo_s3_url text not null,
  latitude numeric(10,8) not null,
  longitude numeric(11,8) not null,
  ai_verified boolean default true,
  scheduled_time timestamp with time zone not null,
  completed_time timestamp with time zone default now(),
  constraint groom_daily_logs_log_type_check check (((log_type)::text = any ((array['FEED_MORNING'::character varying, 'WATER_MIDDAY'::character varying, 'GROOMING_HOOF'::character varying, 'FEED_NIGHT'::character varying, 'VET_MED'::character varying])::text[]))),
  constraint groom_daily_logs_pkey primary key (id)
);

create table public.mou_requests (
  id uuid default gen_random_uuid() not null,
  school_name character varying(255) not null,
  representative_name character varying(255) not null,
  designation character varying(100),
  email character varying(255) not null,
  phone_number character varying(20) not null,
  campus_tier character varying(50),
  land_area_sqft integer,
  preferred_signing_date date,
  status character varying(50) default 'PENDING'::character varying,
  notes text,
  created_at timestamp with time zone default now(),
  constraint mou_requests_pkey primary key (id),
  constraint mou_requests_status_check check (((status)::text = any ((array['PENDING'::character varying, 'REVIEWING'::character varying, 'SIGNED'::character varying, 'REJECTED'::character varying])::text[])))
);

create table public.payment_records (
  id uuid default gen_random_uuid() not null,
  cadet_id uuid,
  parent_id uuid,
  gateway_order_id character varying(100) not null,
  gateway_payment_id character varying(100),
  gateway_subscription_id character varying(100),
  amount_paid numeric(10,2) not null,
  gst_amount numeric(10,2) default 0 not null,
  payment_type character varying(50) not null,
  status character varying(50) default 'PENDING'::character varying,
  pdf_invoice_s3_url text,
  created_at timestamp with time zone default now(),
  constraint payment_records_gateway_order_id_key unique (gateway_order_id),
  constraint payment_records_gateway_payment_id_key unique (gateway_payment_id),
  constraint payment_records_payment_type_check check (((payment_type)::text = any ((array['ONBOARDING'::character varying, 'SAFETY_KIT'::character varying, 'MONTHLY_TUITION'::character varying])::text[]))),
  constraint payment_records_pkey primary key (id),
  constraint payment_records_status_check check (((status)::text = any ((array['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying])::text[])))
);

create table public.qr_lead_captures (
  id uuid default gen_random_uuid() not null,
  hub_slug character varying(100) not null,
  parent_name character varying(255),
  parent_phone character varying(20),
  student_grade character varying(50),
  device_info text,
  ip_address character varying(45),
  source character varying(100) default 'flyer'::character varying,
  converted_to_enrollment boolean default false,
  created_at timestamp with time zone default now(),
  constraint qr_lead_captures_pkey primary key (id)
);

create table public.rank_history (
  id uuid default gen_random_uuid() not null,
  cadet_id uuid,
  from_rank character varying(50),
  to_rank character varying(50) not null,
  promoted_by uuid,
  promoted_at timestamp with time zone default now(),
  constraint rank_history_pkey primary key (id)
);

create table public.skills (
  id uuid default gen_random_uuid() not null,
  name character varying(150) not null,
  category character varying(50) not null,
  description text,
  is_active boolean default true,
  constraint skills_category_check check (((category)::text = any ((array['RIDING'::character varying, 'GROUND'::character varying, 'STABLE'::character varying])::text[]))),
  constraint skills_pkey primary key (id)
);

create table public.training_sessions (
  id uuid default gen_random_uuid() not null,
  cadet_id uuid,
  instructor_id uuid,
  horse_id uuid,
  session_date date default current_date not null,
  riding_score integer,
  ground_score integer,
  stable_score integer,
  instructor_notes text,
  video_log_s3_url text,
  posture_index numeric(5,2),
  posture_data jsonb,
  brass_stamp_verified boolean default true,
  created_at timestamp with time zone default now(),
  constraint training_sessions_ground_score_check check (((ground_score >= 1) and (ground_score <= 10))),
  constraint training_sessions_pkey primary key (id),
  constraint training_sessions_riding_score_check check (((riding_score >= 1) and (riding_score <= 10))),
  constraint training_sessions_stable_score_check check (((stable_score >= 1) and (stable_score <= 10)))
);

create table public.session_skills (
  session_id uuid not null,
  skill_id uuid not null,
  constraint session_skills_pkey primary key (session_id, skill_id)
);

create table public.site_settings (
  id uuid default gen_random_uuid() not null,
  key character varying(100) not null,
  value text,
  description text,
  updated_at timestamp with time zone default now(),
  constraint site_settings_key_key unique (key),
  constraint site_settings_pkey primary key (id)
);

create table public.staff_attendance (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  hub_id uuid,
  punch_in_time timestamp with time zone default now(),
  punch_out_time timestamp with time zone,
  punch_in_latitude numeric(10,8) not null,
  punch_in_longitude numeric(11,8) not null,
  biometric_verified boolean default true,
  constraint staff_attendance_pkey primary key (id)
);

create table public.system_anomalies (
  id uuid default gen_random_uuid() not null,
  hub_id uuid,
  severity character varying(20) not null,
  title character varying(255) not null,
  description text,
  resolved boolean default false,
  created_at timestamp with time zone default now(),
  constraint system_anomalies_pkey primary key (id),
  constraint system_anomalies_severity_check check (((severity)::text = any ((array['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[])))
);

-- foreign keys
alter table public.achievements add constraint achievements_cadet_id_fkey foreign key (cadet_id) references public.cadets(id) on delete cascade;
alter table public.achievements add constraint achievements_hub_id_fkey foreign key (hub_id) references public.school_hubs(id);
alter table public.cadets add constraint cadets_assigned_horse_id_fkey foreign key (assigned_horse_id) references public.equine_fleet(id);
alter table public.cadets add constraint cadets_hub_id_fkey foreign key (hub_id) references public.school_hubs(id);
alter table public.cadets add constraint cadets_parent_id_fkey foreign key (parent_id) references public.users(id) on delete cascade;
alter table public.consent_records add constraint consent_records_cadet_id_fkey foreign key (cadet_id) references public.cadets(id) on delete cascade;
alter table public.consent_records add constraint consent_records_parent_id_fkey foreign key (parent_id) references public.users(id) on delete cascade;
alter table public.device_tokens add constraint device_tokens_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.equine_fleet add constraint equine_fleet_hub_id_fkey foreign key (hub_id) references public.school_hubs(id) on delete set null;
alter table public.groom_daily_logs add constraint groom_daily_logs_groom_id_fkey foreign key (groom_id) references public.users(id);
alter table public.groom_daily_logs add constraint groom_daily_logs_horse_id_fkey foreign key (horse_id) references public.equine_fleet(id);
alter table public.groom_daily_logs add constraint groom_daily_logs_hub_id_fkey foreign key (hub_id) references public.school_hubs(id) on delete cascade;
alter table public.payment_records add constraint payment_records_cadet_id_fkey foreign key (cadet_id) references public.cadets(id) on delete cascade;
alter table public.payment_records add constraint payment_records_parent_id_fkey foreign key (parent_id) references public.users(id);
alter table public.rank_history add constraint rank_history_cadet_id_fkey foreign key (cadet_id) references public.cadets(id) on delete cascade;
alter table public.rank_history add constraint rank_history_promoted_by_fkey foreign key (promoted_by) references public.users(id);
alter table public.session_skills add constraint session_skills_session_id_fkey foreign key (session_id) references public.training_sessions(id) on delete cascade;
alter table public.session_skills add constraint session_skills_skill_id_fkey foreign key (skill_id) references public.skills(id) on delete cascade;
alter table public.staff_attendance add constraint staff_attendance_hub_id_fkey foreign key (hub_id) references public.school_hubs(id);
alter table public.staff_attendance add constraint staff_attendance_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.system_anomalies add constraint system_anomalies_hub_id_fkey foreign key (hub_id) references public.school_hubs(id);
alter table public.training_sessions add constraint training_sessions_cadet_id_fkey foreign key (cadet_id) references public.cadets(id) on delete cascade;
alter table public.training_sessions add constraint training_sessions_horse_id_fkey foreign key (horse_id) references public.equine_fleet(id);
alter table public.training_sessions add constraint training_sessions_instructor_id_fkey foreign key (instructor_id) references public.users(id);
alter table public.users add constraint users_hub_id_fkey foreign key (hub_id) references public.school_hubs(id) on delete set null;
alter table public.users add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- indexes
create index training_sessions_instructor_id_idx on public.training_sessions using btree (instructor_id);
create index cadets_hub_id_idx on public.cadets using btree (hub_id);
create index payment_records_status_idx on public.payment_records using btree (status);
create index cadets_parent_id_idx on public.cadets using btree (parent_id);
create index training_sessions_cadet_id_session_date_idx on public.training_sessions using btree (cadet_id, session_date);
create index payment_records_cadet_id_idx on public.payment_records using btree (cadet_id);
create index groom_daily_logs_hub_id_completed_time_idx on public.groom_daily_logs using btree (hub_id, completed_time);
create index achievements_hub_id_awarded_at_idx on public.achievements using btree (hub_id, awarded_at desc);
create index groom_daily_logs_groom_id_idx on public.groom_daily_logs using btree (groom_id);
create index staff_attendance_user_id_punch_in_time_idx on public.staff_attendance using btree (user_id, punch_in_time);

-- functions
create or replace function public.current_role_name() returns text language sql stable security definer set search_path to 'public' as $function$
 select role from public.users where id = auth.uid()
$function$;

create or replace function public.current_hub_id() returns uuid language sql stable security definer set search_path to 'public' as $function$
 select hub_id from public.users where id = auth.uid()
$function$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
 insert into public.users (id, full_name, email, role)
 values (
 new.id,
 coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
 new.email,
 coalesce(new.raw_user_meta_data->>'role', 'PARENT')
 );
 return new;
end;
$function$;

create or replace function public.rls_auto_enable() returns event_trigger language plpgsql security definer set search_path to 'pg_catalog' as $function$
declare
 cmd record;
begin
 for cmd in
 select *
 from pg_event_trigger_ddl_commands()
 where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
 and object_type in ('table','partitioned table')
 loop
 if cmd.schema_name is not null and cmd.schema_name in ('public') and cmd.schema_name not in ('pg_catalog','information_schema') and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%' then
 begin
 execute format('alter table if exists %s enable row level security', cmd.object_identity);
 raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
 exception
 when others then
 raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
 end;
 else
 raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
 end if;
 end loop;
end;
$function$;

-- rls
alter table public.achievements enable row level security;
alter table public.cadets enable row level security;
alter table public.consent_records enable row level security;
alter table public.device_tokens enable row level security;
alter table public.equine_fleet enable row level security;
alter table public.executive_appointments enable row level security;
alter table public.groom_daily_logs enable row level security;
alter table public.mou_requests enable row level security;
alter table public.payment_records enable row level security;
alter table public.qr_lead_captures enable row level security;
alter table public.rank_history enable row level security;
alter table public.school_hubs enable row level security;
alter table public.session_skills enable row level security;
alter table public.site_settings enable row level security;
alter table public.skills enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.system_anomalies enable row level security;
alter table public.training_sessions enable row level security;
alter table public.users enable row level security;

-- policies
create policy public_read_achievements on public.achievements as permissive for select to public using (true);
create policy super_admin_all on public.achievements as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy instructor_hub_cadets on public.cadets as permissive for select to public using (((current_role_name() = 'INSTRUCTOR'::text) and (hub_id = current_hub_id())));
create policy parent_own_cadets on public.cadets as permissive for select to public using ((parent_id = auth.uid()));
create policy school_admin_hub_cadets on public.cadets as permissive for select to public using (((current_role_name() = 'SCHOOL_ADMIN'::text) and (hub_id = current_hub_id())));
create policy super_admin_all on public.cadets as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy parent_own_consent on public.consent_records as permissive for all to public using ((parent_id = auth.uid())) with check ((parent_id = auth.uid()));
create policy groom_own_tokens on public.device_tokens as permissive for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy parent_own_tokens on public.device_tokens as permissive for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy public_read_horses on public.equine_fleet as permissive for select to public using ((is_active = true));
create policy super_admin_all on public.equine_fleet as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy public_insert_appointment on public.executive_appointments as permissive for insert to anon, authenticated with check (true);
create policy super_admin_read_appointments on public.executive_appointments as permissive for select to public using ((current_role_name() = 'SUPER_ADMIN'::text));
create policy groom_insert_log on public.groom_daily_logs as permissive for insert to public with check (((current_role_name() = 'GROOM'::text) and (groom_id = auth.uid())));
create policy groom_own_logs on public.groom_daily_logs as permissive for select to public using ((groom_id = auth.uid()));
create policy school_admin_hub_logs on public.groom_daily_logs as permissive for select to public using (((current_role_name() = 'SCHOOL_ADMIN'::text) and (hub_id = current_hub_id())));
create policy super_admin_all on public.groom_daily_logs as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy public_insert_mou on public.mou_requests as permissive for insert to anon, authenticated with check (true);
create policy super_admin_read_mou on public.mou_requests as permissive for select to public using ((current_role_name() = 'SUPER_ADMIN'::text));
create policy parent_own_payments on public.payment_records as permissive for select to public using ((parent_id = auth.uid()));
create policy super_admin_all on public.payment_records as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy public_insert_lead on public.qr_lead_captures as permissive for insert to anon, authenticated with check (true);
create policy super_admin_read_leads on public.qr_lead_captures as permissive for select to public using ((current_role_name() = 'SUPER_ADMIN'::text));
create policy instructor_insert_rank on public.rank_history as permissive for insert to public with check (((current_role_name() = 'INSTRUCTOR'::text) and (promoted_by = auth.uid())));
create policy super_admin_all on public.rank_history as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy public_read_hubs on public.school_hubs as permissive for select to public using (true);
create policy super_admin_all on public.school_hubs as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy instructor_insert_session_skills on public.session_skills as permissive for insert to public with check ((current_role_name() = 'INSTRUCTOR'::text));
create policy read_session_skills on public.session_skills as permissive for select to public using (true);
create policy public_read_settings on public.site_settings as permissive for select to public using (true);
create policy public_read_skills on public.skills as permissive for select to public using ((is_active = true));
create policy groom_own_attendance on public.staff_attendance as permissive for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy school_admin_hub_attendance on public.staff_attendance as permissive for select to public using (((current_role_name() = 'SCHOOL_ADMIN'::text) and (hub_id = current_hub_id())));
create policy super_admin_all on public.staff_attendance as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy super_admin_all on public.system_anomalies as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy instructor_insert_session on public.training_sessions as permissive for insert to public with check (((current_role_name() = 'INSTRUCTOR'::text) and (instructor_id = auth.uid())));
create policy instructor_own_sessions on public.training_sessions as permissive for select to public using ((instructor_id = auth.uid()));
create policy parent_own_sessions on public.training_sessions as permissive for select to public using ((cadet_id in ( select cadets.id from public.cadets where (cadets.parent_id = auth.uid()))));
create policy school_admin_hub_sessions on public.training_sessions as permissive for select to public using (((current_role_name() = 'SCHOOL_ADMIN'::text) and (cadet_id in ( select cadets.id from public.cadets where (cadets.hub_id = current_hub_id())))));
create policy super_admin_all on public.training_sessions as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));
create policy own_profile_select on public.users as permissive for select to public using ((id = auth.uid()));
create policy own_profile_update on public.users as permissive for update to public using ((id = auth.uid())) with check ((id = auth.uid()));
create policy super_admin_all on public.users as permissive for all to public using ((current_role_name() = 'SUPER_ADMIN'::text)) with check ((current_role_name() = 'SUPER_ADMIN'::text));

-- triggers
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- event trigger (owner-created)
create event trigger ensure_rls on ddl_command_end execute function public.rls_auto_enable();

-- buckets (no storage.objects policies exist at snapshot time)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('session-videos', 'session-videos', false, 52428800, '{video/mp4,video/quicktime}');
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('proof-photos', 'proof-photos', false, 10485760, '{image/jpeg,image/png,image/webp}');
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('invoices', 'invoices', false, 5242880, '{application/pdf}');
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('site-assets', 'site-assets', true, 10485760, '{image/jpeg,image/png,image/webp,image/svg+xml,video/mp4}');

-- grants: Supabase default (anon and authenticated hold all table privileges; RLS restricts)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;
