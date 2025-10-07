#!/usr/bin/env node

/**
 * Fotoflo Auto Upload Setup Script
 * 
 * This script helps set up the auto upload system by applying the database migration
 * and creating initial configurations.
 * 
 * Usage: node setup_auto_upload.js [options]
 * 
 * Options:
 *   --migrate    Apply database migration
 *   --config     Create default config for all projects
 *   --help       Show this help message
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const shouldMigrate = args.includes('--migrate');
const shouldConfig = args.includes('--config');
const showHelp = args.includes('--help');

if (showHelp) {
    console.log(`
Fotoflo Auto Upload Setup Script

Usage: node setup_auto_upload.js [options]

Options:
  --migrate    Apply database migration
  --config     Create default config for all projects
  --help       Show this help message

Examples:
  node setup_auto_upload.js --migrate
  node setup_auto_upload.js --migrate --config
  node setup_auto_upload.js --help
`);
    process.exit(0);
}

async function applyMigration() {
    console.log('🔄 Applying database migration...');
    
    try {
        // Create auto_upload_config table
        const { error: configTableError } = await supabase.rpc('exec', {
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

        // Create upload_batches table
        const { error: batchTableError } = await supabase.rpc('exec', {
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

        // Add columns to images table if they don't exist
        const { error: imagesColumnsError } = await supabase.rpc('exec', {
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

                    -- Add upload_batch_id column to track which batch an image came from
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'images' AND column_name = 'upload_batch_id') THEN
                        ALTER TABLE images ADD COLUMN upload_batch_id TEXT;
                        CREATE INDEX IF NOT EXISTS idx_images_upload_batch ON images(upload_batch_id);
                    END IF;

                    -- Add upload_source column to track upload method
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'images' AND column_name = 'upload_source') THEN
                        ALTER TABLE images ADD COLUMN upload_source TEXT DEFAULT 'manual';
                        CREATE INDEX IF NOT EXISTS idx_images_upload_source ON images(upload_source);
                    END IF;

                    -- Add original_name column to preserve original filename
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'images' AND column_name = 'original_name') THEN
                        ALTER TABLE images ADD COLUMN original_name TEXT;
                    END IF;

                    -- Add external_metadata column for webhook metadata
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

        if (configTableError || batchTableError || imagesColumnsError) {
            console.log('⚠️  Some migration warnings (this is normal if tables already exist)');
        }

        console.log('✅ Migration completed successfully');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

async function createDefaultConfigs() {
    console.log('⚙️  Creating default configurations...');
    
    try {
        // Get all projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id');
        
        if (projectsError) {
            throw new Error(`Failed to fetch projects: ${projectsError.message}`);
        }
        
        if (!projects || projects.length === 0) {
            console.log('ℹ️  No projects found. Skipping config creation.');
            return;
        }
        
        // Create default config for each project
        const defaultConfigs = projects.map(project => ({
            project_id: project.id,
            auto_organize: true,
            duplicate_detection: true,
            max_file_size: 10485760, // 10MB
            allowed_formats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
            auto_collection_creation: true,
            collection_naming_pattern: "Auto Upload {date}",
            background_processing: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
            .from('auto_upload_config')
            .upsert(defaultConfigs, { 
                onConflict: 'project_id',
                ignoreDuplicates: true 
            });
        
        if (error) {
            throw new Error(`Failed to create configs: ${error.message}`);
        }
        
        console.log(`✅ Created default configurations for ${projects.length} projects`);
        
    } catch (error) {
        console.error('❌ Config creation failed:', error.message);
        process.exit(1);
    }
}

async function verifySetup() {
    console.log('🔍 Verifying setup...');
    
    try {
        // Check if tables exist
        const { data: configTable, error: configError } = await supabase
            .from('auto_upload_config')
            .select('count')
            .limit(1);
        
        if (configError) {
            throw new Error(`Config table check failed: ${configError.message}`);
        }
        
        const { data: batchTable, error: batchError } = await supabase
            .from('upload_batches')
            .select('count')
            .limit(1);
        
        if (batchError) {
            throw new Error(`Batch table check failed: ${batchError.message}`);
        }
        
        // Check if views exist
        const { data: statsView, error: statsError } = await supabase
            .from('upload_statistics')
            .select('project_id')
            .limit(1);
        
        if (statsError) {
            console.log('⚠️  Statistics view not accessible:', statsError.message);
        }
        
        console.log('✅ Setup verification completed');
        console.log('📋 Auto Upload API is ready to use!');
        
    } catch (error) {
        console.error('❌ Setup verification failed:', error.message);
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 Setting up Fotoflo Auto Upload System\n');
    
    if (shouldMigrate) {
        await applyMigration();
        console.log('');
    }
    
    if (shouldConfig) {
        await createDefaultConfigs();
        console.log('');
    }
    
    // Always verify setup
    await verifySetup();
    
    console.log('\n🎉 Auto Upload setup completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('   1. Start your Next.js development server');
    console.log('   2. Navigate to a project page');
    console.log('   3. Use the AutoUpload component to configure and test uploads');
    console.log('   4. Check the API documentation in AUTO_UPLOAD_API.md');
}

// Run setup
main().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
});
