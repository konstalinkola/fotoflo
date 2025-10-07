#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAllImages() {
  const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';
  
  try {
    console.log(chalk.blue(`🔍 Checking ALL images for project: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all images for this project, ordered by creation time
    const { data: allImages, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(chalk.red('❌ Error fetching images:'), error.message);
      return;
    }

    console.log(chalk.blue(`📸 Total images in database: ${allImages.length}`));
    console.log('');

    if (allImages.length > 0) {
      console.log(chalk.blue('All images (newest first):'));
      allImages.forEach((image, index) => {
        const uploadTime = new Date(image.created_at || image.uploaded_at).toLocaleString();
        console.log(chalk.white(`  ${index + 1}. ${image.file_name}`));
        console.log(chalk.gray(`     ID: ${image.id}`));
        console.log(chalk.gray(`     Uploaded: ${uploadTime}`));
        console.log(chalk.gray(`     Storage: ${image.storage_path}`));
        console.log('');
      });

      // Check for recent uploads (last 10 minutes)
      const recentTime = new Date(Date.now() - 10 * 60 * 1000);
      const recentImages = allImages.filter(img => 
        new Date(img.created_at || img.uploaded_at) > recentTime
      );

      if (recentImages.length > 0) {
        console.log(chalk.green(`🆕 Recent uploads (last 10 minutes): ${recentImages.length}`));
        recentImages.forEach(img => {
          console.log(chalk.white(`   - ${img.file_name}`));
        });
      } else {
        console.log(chalk.yellow('⚠️  No recent uploads found'));
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkAllImages();
