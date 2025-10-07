#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';
const projectId = '1eae4fca-561b-441f-a289-fa463137aef4';

async function testSimpleUpload() {
  try {
    console.log(chalk.blue('🧪 Testing simple upload endpoint...'));
    console.log(chalk.blue(`📂 Project ID: ${projectId}`));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // Create a simple test image (1x1 pixel PNG)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Create form data
    const formData = new FormData();
    formData.append('file', testImageData, {
      filename: 'test-simple.png',
      contentType: 'image/png'
    });

    console.log(chalk.yellow('📤 Uploading test image to simple endpoint...'));

    // Test the simple upload endpoint
    const response = await fetch(`${serverUrl}/api/desktop-sync/upload-simple?projectId=${projectId}`, {
      method: 'POST',
      body: formData
    });

    console.log(chalk.blue(`📊 Response status: ${response.status}`));

    if (response.ok) {
      const result = await response.json();
      console.log(chalk.green('✅ Simple upload successful!'));
      console.log(chalk.white(`   File: ${result.fileName}`));
      console.log(chalk.white(`   Image ID: ${result.imageId}`));
      console.log(chalk.white(`   Message: ${result.message}`));
    } else {
      const errorData = await response.json();
      console.log(chalk.red('❌ Simple upload failed!'));
      console.log(chalk.red(`   Error: ${errorData.error}`));
      if (errorData.details) {
        console.log(chalk.red(`   Details: ${errorData.details}`));
      }
    }

    console.log('');
    console.log(chalk.blue('🔍 Now check your project in the web app:'));
    console.log(chalk.yellow(`   http://localhost:3003/project/${projectId}`));

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  }
}

testSimpleUpload();
