#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkImagesTable() {
  try {
    console.log(chalk.blue('🔍 Checking images table...'));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to query the images table
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .limit(5);

    if (error) {
      console.log(chalk.red('❌ Images table error:'), error.message);
      
      if (error.message.includes('relation "images" does not exist')) {
        console.log(chalk.yellow('💡 The images table does not exist!'));
        console.log(chalk.yellow('   This explains why photos upload but don\'t show up'));
        console.log('');
        console.log(chalk.blue('🔧 Solution: Run the database migration'));
        console.log(chalk.yellow('   node apply_auto_upload_migration.js'));
      }
    } else {
      console.log(chalk.green('✅ Images table exists'));
      console.log(chalk.blue(`📊 Found ${images.length} images in database`));
      
      if (images.length > 0) {
        console.log(chalk.blue('Recent images:'));
        images.forEach((img, index) => {
          console.log(chalk.white(`  ${index + 1}. ${img.original_name || img.file_name} (${img.upload_source || 'unknown'})`));
        });
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkImagesTable();
