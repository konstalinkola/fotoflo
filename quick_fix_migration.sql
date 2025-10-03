-- Quick fix: Add missing customization columns one by one
-- Run this in your Supabase SQL Editor

-- Add font_family column (the one causing the current error)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter';

-- Add other missing customization columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS font_weight integer DEFAULT 400;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qr_code_size integer DEFAULT 150;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS text_content text DEFAULT '';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS font_size integer DEFAULT 20;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS font_color text DEFAULT '#000000';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_size integer DEFAULT 120;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_position_y integer DEFAULT -200;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS text_position_y integer DEFAULT 200;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qr_visibility_duration integer DEFAULT 60;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS qr_expires_on_click boolean DEFAULT false;
