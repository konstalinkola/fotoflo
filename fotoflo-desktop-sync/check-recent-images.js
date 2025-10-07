#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRecentImages() {
  const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';
  
  try {
    console.log(chalk.blue(`🔍 Checking recent images for project: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the most recent images for this project
    const { data: recentImages, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log(chalk.red('❌ Error fetching images:'), error.message);
      return;
    }

    console.log(chalk.blue(`📸 Most recent images in database:`));
    recentImages.forEach((image, index) => {
      const uploadTime = new Date(image.created_at || image.uploaded_at).toLocaleString();
      console.log(chalk.white(`  ${index + 1}. ${image.file_name}`));
      console.log(chalk.gray(`     ID: ${image.id}`));
      console.log(chalk.gray(`     Storage: ${image.storage_path}`));
      console.log(chalk.gray(`     Uploaded: ${uploadTime}`));
      console.log('');
    });

    // Check if the latest image is the one we just uploaded
    const latestImage = recentImages[0];
    if (latestImage && latestImage.file_name.includes('20190501_KonstaLinkola_1006')) {
      console.log(chalk.green('✅ Latest image is the one we just uploaded!'));
      console.log(chalk.yellow('💡 The image is in the database but not showing in the web app'));
      console.log(chalk.yellow('   This suggests a collection assignment or display issue'));
    } else {
      console.log(chalk.yellow('⚠️  The uploaded image might not be in the database'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkRecentImages();
