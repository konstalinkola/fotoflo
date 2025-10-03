-- Add font_color column to projects table
alter table public.projects 
add column if not exists font_color text default '#000000';
