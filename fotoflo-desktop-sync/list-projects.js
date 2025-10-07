#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';

async function listProjects() {
  try {
    console.log(chalk.blue('📁 Listing all projects...'));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // Try to get all projects
    const response = await fetch(`${serverUrl}/api/projects`);
    
    console.log(chalk.blue(`📊 Response status: ${response.status}`));
    
    if (response.ok) {
      const projects = await response.json();
      
      if (projects && projects.length > 0) {
        console.log(chalk.green(`✅ Found ${projects.length} project(s):`));
        console.log('');
        
        projects.forEach((project, index) => {
          console.log(chalk.white(`${index + 1}. ${project.name}`));
          console.log(chalk.gray(`   ID: ${project.id}`));
          console.log(chalk.gray(`   URL: http://localhost:3003/project/${project.id}`));
          console.log('');
        });
        
        console.log(chalk.yellow('💡 Copy one of these project IDs for desktop sync!'));
        
      } else {
        console.log(chalk.yellow('⚠️  No projects found'));
        console.log(chalk.yellow('   Create a project first in your web app'));
      }
    } else {
      console.log(chalk.red(`❌ Failed to fetch projects: ${response.status}`));
      
      if (response.status === 401) {
        console.log(chalk.yellow('💡 You might need to log in first'));
        console.log(chalk.yellow('   Go to http://localhost:3003 and log in'));
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    console.log('');
    console.log(chalk.yellow('💡 Make sure your Fotoflo server is running:'));
    console.log(chalk.yellow('   cd /Users/konstalinkola/Documents/Kuvapalvelin/Code/kuvapalvelin'));
    console.log(chalk.yellow('   npm run dev'));
  }
}

listProjects();
