#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';
const projectId = '1eae4fca-561b-441f-a289-fa463137aef4';

async function testProjectAPI() {
  try {
    console.log(chalk.blue(`🔍 Testing project API for: ${projectId}`));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // Test the project images endpoint
    console.log(chalk.blue('1️⃣ Testing project images endpoint...'));
    const response = await fetch(`${serverUrl}/api/projects/${projectId}/images`);
    
    console.log(chalk.blue(`   Status: ${response.status}`));
    
    if (response.ok) {
      const data = await response.json();
      console.log(chalk.green('   ✅ API endpoint working'));
      console.log(chalk.blue(`   📊 Response: ${JSON.stringify(data, null, 2)}`));
      
      if (data.images && data.images.length > 0) {
        console.log(chalk.green(`   📸 Found ${data.images.length} images via API`));
      } else {
        console.log(chalk.yellow('   ⚠️  No images returned by API'));
      }
    } else {
      console.log(chalk.red(`   ❌ API endpoint failed: ${response.status}`));
      const errorText = await response.text();
      console.log(chalk.red(`   Error: ${errorText}`));
    }

    console.log('');

    // Test the project details endpoint
    console.log(chalk.blue('2️⃣ Testing project details endpoint...'));
    const projectResponse = await fetch(`${serverUrl}/api/projects/${projectId}`);
    
    console.log(chalk.blue(`   Status: ${projectResponse.status}`));
    
    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      console.log(chalk.green('   ✅ Project details endpoint working'));
      console.log(chalk.blue(`   📊 Project: ${projectData.name}`));
    } else {
      console.log(chalk.red(`   ❌ Project details endpoint failed: ${projectResponse.status}`));
    }

    console.log('');
    console.log(chalk.blue('💡 If API returns images but web page doesn\'t show them:'));
    console.log(chalk.yellow('   - Check browser console for JavaScript errors'));
    console.log(chalk.yellow('   - Try hard refresh (Ctrl+F5)'));
    console.log(chalk.yellow('   - Check if there are authentication issues'));

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  }
}

testProjectAPI();
