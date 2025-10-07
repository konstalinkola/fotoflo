#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createNewCollection() {
  const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';
  
  try {
    console.log(chalk.blue(`🔧 Creating new collection for project: ${projectId}`));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the highest collection number
    const { data: existingCollections, error: fetchError } = await supabase
      .from('collections')
      .select('collection_number')
      .eq('project_id', projectId)
      .order('collection_number', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.log(chalk.red('❌ Error fetching collections:'), fetchError.message);
      return;
    }

    const nextCollectionNumber = existingCollections && existingCollections.length > 0 
      ? existingCollections[0].collection_number + 1 
      : 1;

    console.log(chalk.blue(`📊 Next collection number: ${nextCollectionNumber}`));

    // Create a new inactive collection (the "New Collection")
    const { data: newCollection, error: createError } = await supabase
      .from('collections')
      .insert({
        project_id: projectId,
        collection_number: nextCollectionNumber,
        is_active: false  // This makes it the "New Collection"
      })
      .select('*')
      .single();

    if (createError) {
      console.log(chalk.red('❌ Error creating collection:'), createError.message);
      return;
    }

    console.log(chalk.green('✅ Created new collection:'));
    console.log(chalk.white(`   ID: ${newCollection.id}`));
    console.log(chalk.white(`   Collection #${newCollection.collection_number}`));
    console.log(chalk.white(`   Active: ${newCollection.is_active}`));
    console.log('');
    console.log(chalk.blue('💡 This is now the "New Collection" where desktop sync images will go'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

createNewCollection();
