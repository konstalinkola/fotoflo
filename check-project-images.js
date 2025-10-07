#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkProjectImages() {
  const projectId = process.argv[2];
  
  if (!projectId) {
    console.log(chalk.red('❌ Please provide a project ID'));
    console.log(chalk.yellow('Usage: node check-project-images.js <project-id>'));
    console.log(chalk.yellow('Example: node check-project-images.js 1eae4fca-561b-441f-a289-fa463137aef4'));
    process.exit(1);
  }

  try {
    console.log(chalk.blue(`🔍 Checking images for project: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log(chalk.red('❌ Project not found'));
      return;
    }

    console.log(chalk.green(`✅ Project found: ${project.name}`));
    console.log('');

    // Get images for this project
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(chalk.red('❌ Error querying images:'), error.message);
      return;
    }

    console.log(chalk.blue(`📊 Found ${images.length} images for this project`));
    
    if (images.length > 0) {
      console.log(chalk.blue('Recent images:'));
      images.forEach((img, index) => {
        const uploadTime = new Date(img.created_at || img.uploaded_at).toLocaleString();
        const source = img.upload_source || 'unknown';
        console.log(chalk.white(`  ${index + 1}. ${img.original_name || img.file_name}`));
        console.log(chalk.gray(`     Storage: ${img.storage_path}`));
        console.log(chalk.gray(`     Source: ${source}`));
        console.log(chalk.gray(`     Uploaded: ${uploadTime}`));
        console.log('');
      });
    } else {
      console.log(chalk.yellow('⚠️  No images found for this project'));
      console.log(chalk.yellow('   This explains why photos don\'t show up'));
    }

    // Check all images to see what project_ids exist
    console.log(chalk.blue('🔍 Checking all images in database...'));
    const { data: allImages, error: allError } = await supabase
      .from('images')
      .select('project_id, original_name, upload_source')
      .limit(10);

    if (!allError && allImages) {
      console.log(chalk.blue('All images in database:'));
      allImages.forEach((img, index) => {
        console.log(chalk.white(`  ${index + 1}. ${img.original_name} -> Project: ${img.project_id} (${img.upload_source})`));
      });
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkProjectImages();
