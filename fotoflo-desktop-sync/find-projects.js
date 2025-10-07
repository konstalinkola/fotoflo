#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log(chalk.red('❌ Missing environment variables'));
  console.log(chalk.yellow('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'));
  process.exit(1);
}

async function findProjects() {
  try {
    console.log(chalk.blue('🔍 Finding projects in database...'));
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, created_at, owner')
      .order('created_at', { ascending: false });

    if (error) {
      console.log(chalk.red('❌ Database error:'), error.message);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log(chalk.yellow('⚠️  No projects found in database'));
      console.log(chalk.yellow('   Create a project first in your web app'));
      return;
    }

    console.log(chalk.green(`✅ Found ${projects.length} project(s):`));
    console.log('');

    projects.forEach((project, index) => {
      console.log(chalk.white(`${index + 1}. ${project.name}`));
      console.log(chalk.gray(`   ID: ${project.id}`));
      console.log(chalk.gray(`   Owner: ${project.owner}`));
      console.log(chalk.gray(`   Created: ${new Date(project.created_at).toLocaleString()}`));
      console.log(chalk.blue(`   URL: http://localhost:3003/project/${project.id}`));
      console.log('');
    });

    console.log(chalk.yellow('💡 Use one of these project IDs for desktop sync!'));
    console.log(chalk.yellow('Example: node working-sync.js ~/Desktop/Fotoflo\\ Photos ' + projects[0].id));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

findProjects();
