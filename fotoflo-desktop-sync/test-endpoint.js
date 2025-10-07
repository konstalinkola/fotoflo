#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';
const projectId = '1eae4fca-561b-441f-a289-fa463137aef4';

async function testEndpoint() {
  try {
    console.log(chalk.blue('🔍 Testing desktop sync endpoint...'));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log(chalk.blue(`📂 Project ID: ${projectId}`));
    console.log('');

    // Test GET request (should return 405)
    console.log(chalk.blue('1️⃣ Testing GET request...'));
    const getResponse = await fetch(`${serverUrl}/api/desktop-sync/upload?projectId=${projectId}`);
    console.log(chalk.blue(`   Status: ${getResponse.status}`));
    
    if (getResponse.status === 405) {
      console.log(chalk.green('   ✅ GET method not allowed (expected)'));
    } else {
      console.log(chalk.yellow(`   ⚠️  Unexpected status: ${getResponse.status}`));
    }

    console.log('');

    // Test POST request with empty body (should return 400)
    console.log(chalk.blue('2️⃣ Testing POST request with empty body...'));
    const postResponse = await fetch(`${serverUrl}/api/desktop-sync/upload?projectId=${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(chalk.blue(`   Status: ${postResponse.status}`));
    
    if (postResponse.status === 400) {
      console.log(chalk.green('   ✅ POST method working (400 expected for invalid request)'));
      const errorData = await postResponse.json();
      console.log(chalk.white(`   Error: ${errorData.error}`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Unexpected status: ${postResponse.status}`));
      const responseText = await postResponse.text();
      console.log(chalk.yellow(`   Response: ${responseText}`));
    }

    console.log('');
    console.log(chalk.blue('💡 If POST returns 400, the endpoint is working correctly'));
    console.log(chalk.blue('💡 The 405 on GET is normal (only POST is allowed)'));

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  }
}

testEndpoint();
