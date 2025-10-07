#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCollectionsSchema() {
  try {
    console.log(chalk.blue('🔍 Checking collections table schema...'));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get one collection to see what columns exist
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .limit(1);

    if (error) {
      console.log(chalk.red('❌ Error fetching collections:'), error.message);
      return;
    }

    if (collections && collections.length > 0) {
      console.log(chalk.green('✅ Collections table exists'));
      console.log(chalk.blue('📊 Available columns:'));
      const collection = collections[0];
      Object.keys(collection).forEach(key => {
        console.log(chalk.white(`  - ${key}: ${typeof collection[key]} (${collection[key]})`));
      });
    } else {
      console.log(chalk.yellow('⚠️  No collections found, but table exists'));
    }

    console.log('');
    console.log(chalk.blue('💡 We need to use only the columns that exist in the collections table'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkCollectionsSchema();
