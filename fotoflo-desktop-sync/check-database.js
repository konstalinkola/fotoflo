#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';

async function checkDatabase() {
  try {
    console.log(chalk.blue('🔍 Checking database structure...'));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // Try to access the images endpoint to see if the table exists
    const response = await fetch(`${serverUrl}/api/projects/test/images`);
    
    console.log(chalk.blue(`📊 Response status: ${response.status}`));
    
    if (response.status === 404) {
      console.log(chalk.yellow('⚠️  Images table might not exist'));
      console.log(chalk.yellow('   This would explain why photos upload but don\'t show'));
    } else if (response.status === 500) {
      console.log(chalk.red('❌ Server error - check your Next.js console'));
    } else {
      console.log(chalk.green('✅ Images endpoint is accessible'));
    }

    console.log('');
    console.log(chalk.blue('💡 Solutions:'));
    console.log(chalk.white('1. Run the database migration:'));
    console.log(chalk.yellow('   cd /Users/konstalinkola/Documents/Kuvapalvelin/Code/kuvapalvelin'));
    console.log(chalk.yellow('   node apply_auto_upload_migration.js'));
    console.log('');
    console.log(chalk.white('2. Check your Next.js server console for error messages'));
    console.log('');
    console.log(chalk.white('3. Make sure your .env.local has the correct Supabase credentials'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkDatabase();
