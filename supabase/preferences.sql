-- Run once in the future Getpes Supabase project's SQL editor.
create table if not exists public.getpes_preferences (
 company_id text primary key,
 settings jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.getpes_preferences enable row level security;
revoke all on public.getpes_preferences from anon, authenticated;
grant select, insert, update on public.getpes_preferences to service_role;
-- No browser policies: the existing Getpes server enforces company and role access.
