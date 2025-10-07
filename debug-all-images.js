#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debugAllImages() {
  try {
    console.log(chalk.blue('🔍 Debugging all images in database...'));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all images from database
    const { data: allImages, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(chalk.red('❌ Error querying images:'), error.message);
      return;
    }

    console.log(chalk.blue(`📊 Total images in database: ${allImages.length}`));
    console.log('');

    if (allImages.length > 0) {
      console.log(chalk.blue('All images:'));
      allImages.forEach((img, index) => {
        const uploadTime = new Date(img.created_at || img.uploaded_at).toLocaleString();
        const source = img.upload_source || 'unknown';
        console.log(chalk.white(`  ${index + 1}. ${img.original_name || img.file_name}`));
        console.log(chalk.gray(`     Project: ${img.project_id}`));
        console.log(chalk.gray(`     Source: ${source}`));
        console.log(chalk.gray(`     Storage: ${img.storage_path}`));
        console.log(chalk.gray(`     Uploaded: ${uploadTime}`));
        console.log('');
      });

      // Group by project
      const projectGroups = allImages.reduce((groups, img) => {
        const projectId = img.project_id;
        if (!groups[projectId]) {
          groups[projectId] = [];
        }
        groups[projectId].push(img);
        return groups;
      }, {});

      console.log(chalk.blue('📊 Images by project:'));
      Object.entries(projectGroups).forEach(([projectId, images]) => {
        console.log(chalk.white(`  Project ${projectId}: ${images.length} images`));
        images.forEach(img => {
          const source = img.upload_source || 'unknown';
          console.log(chalk.gray(`    - ${img.original_name || img.file_name} (${source})`));
        });
      });

    } else {
      console.log(chalk.yellow('⚠️  No images found in database'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

debugAllImages();
