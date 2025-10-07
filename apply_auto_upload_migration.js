// Script to apply the auto upload migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Your Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please check your .env.local file and make sure these variables are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying auto upload migration...');
    
    // Create auto_upload_config table
    console.log('Creating auto_upload_config table...');
    const { error: configError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS auto_upload_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          auto_organize BOOLEAN DEFAULT true,
          duplicate_detection BOOLEAN DEFAULT true,
          max_file_size INTEGER DEFAULT 10485760,
          allowed_formats TEXT[] DEFAULT ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          webhook_url TEXT,
          webhook_secret TEXT,
          auto_collection_creation BOOLEAN DEFAULT true,
          collection_naming_pattern TEXT DEFAULT 'Auto Upload {date}',
          background_processing BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(project_id)
        );
      `
    });
    
    if (configError) {
      console.log('⚠️  Config table warning:', configError.message);
    } else {
      console.log('✅ auto_upload_config table created');
    }

    // Create upload_batches table
    console.log('Creating upload_batches table...');
    const { error: batchError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS upload_batches (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          batch_id TEXT NOT NULL UNIQUE,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          total_files INTEGER NOT NULL DEFAULT 0,
          successful_uploads INTEGER NOT NULL DEFAULT 0,
          failed_uploads INTEGER NOT NULL DEFAULT 0,
          duplicates_skipped INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
          upload_source TEXT DEFAULT 'manual',
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(batch_id, project_id)
        );
      `
    });
    
    if (batchError) {
      console.log('⚠️  Batch table warning:', batchError.message);
    } else {
      console.log('✅ upload_batches table created');
    }

    // Add columns to images table
    console.log('Adding columns to images table...');
    const { error: imagesError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          -- Add file_hash column for duplicate detection
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'images' AND column_name = 'file_hash') THEN
            ALTER TABLE images ADD COLUMN file_hash TEXT;
            CREATE INDEX IF NOT EXISTS idx_images_file_hash ON images(file_hash);
            CREATE INDEX IF NOT EXISTS idx_images_project_hash ON images(project_id, file_hash);
          END IF;

          -- Add upload_batch_id column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'images' AND column_name = 'upload_batch_id') THEN
            ALTER TABLE images ADD COLUMN upload_batch_id TEXT;
            CREATE INDEX IF NOT EXISTS idx_images_upload_batch ON images(upload_batch_id);
          END IF;

          -- Add upload_source column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'images' AND column_name = 'upload_source') THEN
            ALTER TABLE images ADD COLUMN upload_source TEXT DEFAULT 'manual';
            CREATE INDEX IF NOT EXISTS idx_images_upload_source ON images(upload_source);
          END IF;

          -- Add original_name column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'images' AND column_name = 'original_name') THEN
            ALTER TABLE images ADD COLUMN original_name TEXT;
          END IF;

          -- Add external_metadata column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'images' AND column_name = 'external_metadata') THEN
            ALTER TABLE images ADD COLUMN external_metadata JSONB;
          END IF;

          -- Add collection_id column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'images' AND column_name = 'collection_id') THEN
            ALTER TABLE images ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_images_collection_id ON images(collection_id);
          END IF;
        END $$;
      `
    });
    
    if (imagesError) {
      console.log('⚠️  Images columns warning:', imagesError.message);
    } else {
      console.log('✅ Images table columns added');
    }

    console.log('🎉 Migration completed successfully!');
    
    // Verify the tables were created
    console.log('🔍 Verifying migration...');
    
    const { data: configTable } = await supabase
      .from('auto_upload_config')
      .select('count')
      .limit(1);
    
    const { data: batchTable } = await supabase
      .from('upload_batches')
      .select('count')
      .limit(1);
    
    console.log('✅ auto_upload_config table accessible');
    console.log('✅ upload_batches table accessible');
    console.log('');
    console.log('🚀 Auto Upload API is ready to use!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to any project settings page');
    console.log('3. Click on the "Auto Upload" tab');
    console.log('4. Configure and test the auto upload feature');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
