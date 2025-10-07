#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3001';
const projectId = '301affb9-bcd1-4eb8-bae5-c30bbc12abc7';

async function testImagesAPI() {
  try {
    console.log(chalk.blue(`🔍 Testing images API for project: ${projectId}`));
    console.log('');

    // Test the images endpoint
    const response = await fetch(`${serverUrl}/api/projects/${projectId}/images`);
    
    console.log(chalk.blue(`📊 Response status: ${response.status}`));
    
    if (response.ok) {
      const data = await response.json();
      console.log(chalk.green('✅ Images API working'));
      console.log(chalk.blue(`📸 Found ${data.images?.length || 0} images`));
      
      if (data.images && data.images.length > 0) {
        console.log(chalk.blue('Recent images:'));
        data.images.slice(0, 5).forEach((img, index) => {
          console.log(chalk.white(`  ${index + 1}. ${img.name}`));
          console.log(chalk.gray(`     URL: ${img.url ? 'Available' : 'None'}`));
          console.log(chalk.gray(`     Source: ${img.source || 'unknown'}`));
          console.log('');
        });
      }
    } else {
      console.log(chalk.red(`❌ Images API failed: ${response.status}`));
      const errorText = await response.text();
      console.log(chalk.red(`Error: ${errorText}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

testImagesAPI();
