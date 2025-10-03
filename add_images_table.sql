-- Create images table to store image metadata including EXIF capture time
create table if not exists public.images (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade,
	storage_path text not null,
	file_name text not null,
	file_size bigint,
	file_type text,
	uploaded_at timestamptz default now(),
	-- EXIF metadata
	capture_time timestamptz,
	camera_make text,
	camera_model text,
	lens_model text,
	focal_length numeric,
	aperture numeric,
	shutter_speed text,
	iso numeric,
	flash boolean,
	-- Image dimensions
	width integer,
	height integer,
	-- GPS data (optional)
	gps_latitude numeric,
	gps_longitude numeric,
	gps_altitude numeric,
	created_at timestamptz default now()
);

-- Create index for faster queries
create index if not exists idx_images_project_id on public.images(project_id);
create index if not exists idx_images_capture_time on public.images(capture_time);
create index if not exists idx_images_storage_path on public.images(storage_path);

-- RLS
alter table public.images enable row level security;
create policy "Users can manage images in their own projects"
	on public.images for all
	to authenticated
	using (
		exists (
			select 1 from public.projects 
			where projects.id = images.project_id 
			and projects.owner = auth.uid()
		)
	)
	with check (
		exists (
			select 1 from public.projects 
			where projects.id = images.project_id 
			and projects.owner = auth.uid()
		)
	);
