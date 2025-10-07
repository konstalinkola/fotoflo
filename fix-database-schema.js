#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixDatabaseSchema() {
  try {
    console.log(chalk.blue('🔧 Fixing database schema...'));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Add the missing original_name column
    console.log(chalk.blue('Adding original_name column to images table...'));
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'images' AND column_name = 'original_name') THEN
                ALTER TABLE images ADD COLUMN original_name TEXT;
                RAISE NOTICE 'Added original_name column to images table';
            ELSE
                RAISE NOTICE 'original_name column already exists';
            END IF;
        END $$;
      `
    });

    if (error) {
      console.log(chalk.red('❌ Error adding column:'), error.message);
      
      // Try alternative approach - direct SQL
      console.log(chalk.yellow('Trying alternative approach...'));
      
      const { data: directResult, error: directError } = await supabase
        .from('images')
        .select('original_name')
        .limit(1);
        
      if (directError && directError.message.includes('original_name')) {
        console.log(chalk.yellow('Column definitely missing, trying manual approach...'));
        
        // Since we can't use exec_sql, let's just update the desktop sync endpoint
        // to not use original_name for now
        console.log(chalk.blue('Column is missing. We need to update the desktop sync endpoint.'));
      } else {
        console.log(chalk.green('✅ Column exists and is accessible'));
      }
    } else {
      console.log(chalk.green('✅ Successfully added original_name column'));
    }

    console.log('');
    console.log(chalk.blue('💡 If the column addition failed, we can fix the desktop sync endpoint instead.'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

fixDatabaseSchema();
