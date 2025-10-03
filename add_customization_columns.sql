-- Add customization columns to projects table for public page customization
alter table public.projects 
add column if not exists font_color text default '#000000',
add column if not exists logo_size integer default 120,
add column if not exists logo_position_y integer default -200,
add column if not exists background_color text default '#ffffff',
add column if not exists qr_code_size integer default 150,
add column if not exists text_content text default '',
add column if not exists font_size integer default 20,
add column if not exists font_family text default 'Inter',
add column if not exists font_weight integer default 400,
add column if not exists text_position_y integer default 200,
add column if not exists qr_visibility_duration integer default 60,
add column if not exists qr_expires_on_click boolean default false;
