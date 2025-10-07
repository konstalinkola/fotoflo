#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';

async function debugStorage() {
  try {
    console.log(chalk.blue('🔍 Debugging storage configuration...'));
    console.log(chalk.blue(`📂 Project ID: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, storage_bucket, storage_prefix')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log(chalk.red('❌ Project not found'));
      return;
    }

    console.log(chalk.green(`✅ Project found: ${project.name}`));
    console.log(chalk.blue(`   Storage bucket: ${project.storage_bucket}`));
    console.log(chalk.blue(`   Storage prefix: ${project.storage_prefix || 'none'}`));
    console.log('');

    // Test storage bucket access
    console.log(chalk.blue('🧪 Testing storage bucket access...'));
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(chalk.red('❌ Failed to list buckets:'), bucketsError.message);
      return;
    }

    console.log(chalk.green('✅ Storage access working'));
    console.log(chalk.blue('Available buckets:'));
    buckets.forEach(bucket => {
      const isProjectBucket = bucket.name === project.storage_bucket;
      console.log(chalk.white(`  ${isProjectBucket ? '👉' : '  '} ${bucket.name} ${isProjectBucket ? '(project bucket)' : ''}`));
    });
    console.log('');

    // Test project bucket specifically
    if (project.storage_bucket) {
      console.log(chalk.blue(`🧪 Testing project bucket: ${project.storage_bucket}`));
      
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from(project.storage_bucket)
          .list(projectId, { limit: 5 });
        
        if (filesError) {
          console.log(chalk.red(`❌ Failed to list files in bucket: ${filesError.message}`));
        } else {
          console.log(chalk.green(`✅ Bucket access working`));
          console.log(chalk.blue(`   Found ${files.length} files in project folder`));
          if (files.length > 0) {
            console.log(chalk.blue('   Recent files:'));
            files.slice(0, 3).forEach(file => {
              console.log(chalk.white(`     - ${file.name}`));
            });
          }
        }
      } catch (error) {
        console.log(chalk.red(`❌ Bucket test error: ${error.message}`));
      }
    }

    console.log('');
    console.log(chalk.blue('💡 If storage tests fail:'));
    console.log(chalk.yellow('   - Check Supabase storage permissions'));
    console.log(chalk.yellow('   - Verify service role key has storage access'));
    console.log(chalk.yellow('   - Check if storage bucket exists'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

debugStorage();
