#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';

async function debugProject() {
  const projectId = process.argv[2];
  
  if (!projectId) {
    console.log(chalk.red('❌ Please provide a project ID'));
    console.log(chalk.yellow('Usage: node debug-project.js <project-id>'));
    console.log(chalk.yellow('Get project ID from your web app URL'));
    process.exit(1);
  }

  try {
    console.log(chalk.blue(`🔍 Debugging project: ${projectId}`));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // 1. Check if project exists
    console.log(chalk.blue('1️⃣ Checking if project exists...'));
    const projectResponse = await fetch(`${serverUrl}/api/projects/${projectId}`);
    console.log(chalk.blue(`   Status: ${projectResponse.status}`));
    
    if (projectResponse.ok) {
      const project = await projectResponse.json();
      console.log(chalk.green(`   ✅ Project found: ${project.name}`));
    } else {
      console.log(chalk.red(`   ❌ Project not found`));
      return;
    }

    console.log('');

    // 2. Check images in project
    console.log(chalk.blue('2️⃣ Checking images in project...'));
    const imagesResponse = await fetch(`${serverUrl}/api/projects/${projectId}/images`);
    console.log(chalk.blue(`   Status: ${imagesResponse.status}`));
    
    if (imagesResponse.ok) {
      const data = await imagesResponse.json();
      const images = data.images || [];
      console.log(chalk.green(`   ✅ Found ${images.length} images`));
      
      if (images.length > 0) {
        console.log(chalk.blue('   Recent images:'));
        images.slice(0, 3).forEach((img, index) => {
          const uploadTime = new Date(img.created_at || img.uploaded_at).toLocaleString();
          const source = img.upload_source || 'unknown';
          console.log(chalk.white(`     ${index + 1}. ${img.name || img.file_name} (${source}) - ${uploadTime}`));
        });
      }
    } else {
      console.log(chalk.red(`   ❌ Failed to fetch images: ${imagesResponse.status}`));
      const errorText = await imagesResponse.text();
      console.log(chalk.red(`   Error: ${errorText}`));
    }

    console.log('');

    // 3. Check storage directly
    console.log(chalk.blue('3️⃣ Checking storage bucket...'));
    const storageResponse = await fetch(`${serverUrl}/api/projects/${projectId}/images?sources=storage`);
    console.log(chalk.blue(`   Status: ${storageResponse.status}`));
    
    if (storageResponse.ok) {
      const storageData = await storageResponse.json();
      console.log(chalk.green(`   ✅ Storage check completed`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Storage check failed: ${storageResponse.status}`));
    }

    console.log('');
    console.log(chalk.blue('💡 Next steps:'));
    console.log(chalk.white('1. Check your Next.js server console for error messages'));
    console.log(chalk.white('2. Make sure you\'re using the correct project ID'));
    console.log(chalk.white('3. Try uploading a new image and watch the server logs'));

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

debugProject();
