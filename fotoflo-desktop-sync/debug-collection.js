#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debugCollection() {
  const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';
  
  try {
    console.log(chalk.blue(`🔍 Debugging collection assignment for project: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, display_mode')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log(chalk.red('❌ Project not found'));
      return;
    }

    console.log(chalk.green(`✅ Project found: ${project.name}`));
    console.log(chalk.blue(`   Display mode: ${project.display_mode || 'single'}`));
    console.log('');

    // Check collections in this project
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (collectionsError) {
      console.log(chalk.red('❌ Error fetching collections:'), collectionsError.message);
    } else {
      console.log(chalk.blue(`📁 Found ${collections.length} collections:`));
      collections.forEach((collection, index) => {
        console.log(chalk.white(`  ${index + 1}. ${collection.name}`));
        console.log(chalk.gray(`     ID: ${collection.id}`));
        console.log(chalk.gray(`     Created: ${new Date(collection.created_at).toLocaleString()}`));
        console.log('');
      });
    }

    // Check recent images and their collection assignments
    const { data: recentImages, error: imagesError } = await supabase
      .from('images')
      .select('id, file_name, collection_id, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (imagesError) {
      console.log(chalk.red('❌ Error fetching images:'), imagesError.message);
    } else {
      console.log(chalk.blue(`📸 Recent images and their collections:`));
      recentImages.forEach((image, index) => {
        console.log(chalk.white(`  ${index + 1}. ${image.file_name}`));
        console.log(chalk.gray(`     Collection ID: ${image.collection_id || 'None (unassigned)'}`));
        console.log(chalk.gray(`     Created: ${new Date(image.created_at).toLocaleString()}`));
        console.log('');
      });
    }

    // Check if there's a "New Collection" or similar
    const newCollection = collections.find(c => 
      c.name.toLowerCase().includes('new') || 
      c.name.toLowerCase().includes('default') ||
      c.name.toLowerCase().includes('unsorted')
    );

    if (newCollection) {
      console.log(chalk.green(`✅ Found default collection: ${newCollection.name}`));
    } else {
      console.log(chalk.yellow(`⚠️  No default collection found`));
      console.log(chalk.yellow(`   New images might not be assigned to any collection`));
    }

    console.log('');
    console.log(chalk.blue('💡 Possible solutions:'));
    console.log(chalk.yellow('   1. Create a "New Collection" for unassigned images'));
    console.log(chalk.yellow('   2. Update desktop sync to assign images to a specific collection'));
    console.log(chalk.yellow('   3. Check if the web app shows unassigned images separately'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

debugCollection();
