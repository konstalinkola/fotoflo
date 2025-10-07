#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';

async function testConnection() {
  try {
    console.log(chalk.blue('🔍 Testing server connection...'));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // Test 1: Basic connectivity
    console.log(chalk.blue('1️⃣ Testing basic connectivity...'));
    const response = await fetch(serverUrl);
    console.log(chalk.blue(`   Status: ${response.status}`));
    
    if (response.ok) {
      console.log(chalk.green('   ✅ Server is reachable'));
    } else {
      console.log(chalk.red(`   ❌ Server returned ${response.status}`));
    }

    console.log('');

    // Test 2: API endpoint
    console.log(chalk.blue('2️⃣ Testing API endpoint...'));
    const apiResponse = await fetch(`${serverUrl}/api/projects/test`);
    console.log(chalk.blue(`   Status: ${apiResponse.status}`));
    
    if (apiResponse.status === 404) {
      console.log(chalk.green('   ✅ API endpoint is working (404 is expected for non-existent project)'));
    } else if (apiResponse.status === 401) {
      console.log(chalk.green('   ✅ API endpoint is working (401 is expected without auth)'));
    } else {
      console.log(chalk.yellow(`   ⚠️  Unexpected status: ${apiResponse.status}`));
    }

    console.log('');

    // Test 3: Desktop sync endpoint
    console.log(chalk.blue('3️⃣ Testing desktop sync endpoint...'));
    const syncResponse = await fetch(`${serverUrl}/api/desktop-sync/upload?projectId=test`);
    console.log(chalk.blue(`   Status: ${syncResponse.status}`));
    
    if (syncResponse.status === 400) {
      console.log(chalk.green('   ✅ Desktop sync endpoint is working (400 is expected without file)'));
    } else {
      console.log(chalk.yellow(`   ⚠️  Unexpected status: ${syncResponse.status}`));
    }

    console.log('');
    console.log(chalk.blue('💡 If all tests pass, the server is working correctly'));
    console.log(chalk.blue('💡 Check your Next.js console for any error messages'));

  } catch (error) {
    console.error(chalk.red('❌ Connection failed:'), error.message);
    console.log('');
    console.log(chalk.yellow('💡 Possible issues:'));
    console.log(chalk.yellow('   1. Server is not running (run: npm run dev)'));
    console.log(chalk.yellow('   2. Wrong port (check if server is on 3003)'));
    console.log(chalk.yellow('   3. Firewall blocking connections'));
  }
}

testConnection();
