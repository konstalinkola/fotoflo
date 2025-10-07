#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function findNewCollection() {
  const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';
  
  try {
    console.log(chalk.blue(`🔍 Finding collections for project: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all collections for this project
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(chalk.red('❌ Error fetching collections:'), error.message);
      return;
    }

    console.log(chalk.blue(`📁 Found ${collections.length} collections:`));
    collections.forEach((collection, index) => {
      console.log(chalk.white(`  ${index + 1}. Collection #${collection.collection_number}`));
      console.log(chalk.gray(`     ID: ${collection.id}`));
      console.log(chalk.gray(`     Active: ${collection.is_active}`));
      console.log(chalk.gray(`     Created: ${new Date(collection.created_at).toLocaleString()}`));
      console.log('');
    });

    // Look for inactive collections (likely the "New Collection")
    const inactiveCollections = collections.filter(c => !c.is_active);
    if (inactiveCollections.length > 0) {
      console.log(chalk.green(`✅ Found ${inactiveCollections.length} inactive collection(s) - likely the "New Collection"`));
      inactiveCollections.forEach(collection => {
        console.log(chalk.white(`   Collection #${collection.collection_number} (ID: ${collection.id})`));
      });
    } else {
      console.log(chalk.yellow(`⚠️  No inactive collections found`));
    }

    console.log('');
    console.log(chalk.blue('💡 We should assign desktop sync images to the inactive collection'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

findNewCollection();
