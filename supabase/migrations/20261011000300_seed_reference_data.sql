-- Seed: curriculum pillars (13) and regional zones (6), generated from lib/content/curriculum.ts and schools.ts.
-- No hubs, no cadets, no partners, no sample people are seeded. Zone-01 sub-zones are TARGET corridors, not signed partners;
-- they are added as 'prospect' hubs only (no contract evidence required for prospect).

insert into public.curriculum_pillars (id, title, skill_developed, trait_application, phase) values
  (1, 'Grooming & feeding', 'Responsibility, attention to detail', 'Reliability, conscientiousness', 'foundation'),
  (2, 'Mounting & initial handling', 'Patience, focus', 'Self-control, persistence', 'foundation'),
  (3, 'Learning commands & cues', 'Communication, clarity', 'Empathy, emotional awareness', 'foundation'),
  (4, 'Riding at different speeds & terrains', 'Courage, adaptability', 'Confidence, resilience', 'crucible'),
  (5, 'Jumping & challenging obstacles', 'Risk assessment, problem-solving', 'Bravery, critical thinking', 'crucible'),
  (6, 'Working with a stubborn / unpredictable horse', 'Flexibility, negotiation', 'Emotional intelligence, diplomacy', 'crucible'),
  (7, 'Regular practice & training', 'Discipline, consistency', 'Work ethic, perseverance', 'crucible'),
  (8, 'Building trust with the horse', 'Leadership, gentle authority', 'Integrity, trustworthiness', 'crucible'),
  (9, 'Dealing with mistakes & falls', 'Acceptance, recovery', 'Resilience, humility', 'crucible'),
  (10, 'Skill-at-arms & tent pegging runs', 'High-speed spatial convergence, absolute kinetic focus', 'Precision under velocity, target execution', 'command'),
  (11, 'Mounted archery & bow release', 'Dual-task coordination, breath-hold stillness', 'Poise under dynamic motion, split-second timing', 'command'),
  (12, 'High-velocity barrel racing', 'Centrifugal balance, split-second geometric agility', 'Calculated risk-taking, razor-sharp reflexes', 'command'),
  (13, 'Cavalry squad formation & parade command', 'Strategic synchronization, collective discipline', 'Institutional loyalty, executive leadership presence', 'command')
on conflict (id) do nothing;

insert into public.regional_zones (code, name, description) values
  ('01', 'Telangana & Andhra Pradesh Circuit', 'Hyderabad hub network'),
  ('02', 'National Capital Region Circuit', 'NCR'),
  ('03', 'Maharashtra & Western India Circuit', 'West'),
  ('04', 'Karnataka & Southern Metropolitan Circuit', 'South'),
  ('05', 'Northern Heritage & Boarding Circuit', 'Northern corridor'),
  ('06', 'Eastern & Central Regional Circuit', 'East & Centre')
on conflict (code) do nothing;

insert into public.school_hubs (zone_id, code, display_name, location_label, status)
select z.id, h.code, h.name, h.loc, 'prospect' from public.regional_zones z join (values
  ('01A', 'Financial District & Narsingi Corridor', 'Hyderabad'),
  ('01B', 'Begumpet & Jubilee Hills Heritage Belt', 'Hyderabad'),
  ('01C', 'Gachibowli & Madhapur Academic Axis', 'Hyderabad')
) as h(code, name, loc) on z.code = '01'
on conflict (code) do nothing;
