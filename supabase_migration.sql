-- Add new columns to projects table for QR code management
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS active_image_path TEXT,
ADD COLUMN IF NOT EXISTS qr_visibility_duration INTEGER DEFAULT 0, -- 0 = forever, >0 = minutes
ADD COLUMN IF NOT EXISTS qr_expires_on_click BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customization_settings JSONB;

-- Add comments explaining the new fields
COMMENT ON COLUMN projects.active_image_path IS 'Path to the currently active image for QR code display';
COMMENT ON COLUMN projects.qr_visibility_duration IS 'How long QR code is visible in minutes (0 = forever)';
COMMENT ON COLUMN projects.qr_expires_on_click IS 'Whether QR code expires after first click/view';
COMMENT ON COLUMN projects.customization_settings IS 'JSON object containing public page customization settings (logo size/position, background, text)';
