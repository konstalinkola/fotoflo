-- Projects table for branding and Drive folder connection
create table if not exists public.projects (
	id uuid primary key default gen_random_uuid(),
	owner uuid references auth.users(id) on delete cascade,
	name text not null,
	logo_url text,
	background_color text default '#ffffff',
	google_drive_folder_id text,
	google_drive_refresh_token text,
	-- Supabase Storage integration
	storage_bucket text,
	storage_prefix text,
	created_at timestamptz default now()
);

-- RLS
alter table public.projects enable row level security;
create policy "Owner can manage own projects"
	on public.projects for all
	to authenticated
	using (auth.uid() = owner)
	with check (auth.uid() = owner);
