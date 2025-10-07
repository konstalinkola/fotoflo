#!/usr/bin/env node

import fetch from 'node-fetch';
import chalk from 'chalk';

const serverUrl = 'http://localhost:3003';
const projectId = process.argv[2];

if (!projectId) {
  console.log(chalk.red('❌ Please specify a project ID'));
  console.log(chalk.yellow('Usage: node check-project.js <project-id>'));
  process.exit(1);
}

async function checkProject() {
  try {
    console.log(chalk.blue(`🔍 Checking project: ${projectId}`));
    console.log(chalk.blue(`🌐 Server: ${serverUrl}`));
    console.log('');

    // Check project details
    const projectResponse = await fetch(`${serverUrl}/api/projects/${projectId}`);
    if (projectResponse.ok) {
      const project = await projectResponse.json();
      console.log(chalk.green(`✅ Project found: ${project.name}`));
      console.log(chalk.blue(`   Storage bucket: ${project.storage_bucket}`));
    } else {
      console.log(chalk.red(`❌ Project not found: ${projectId}`));
      return;
    }

    console.log('');

    // Check images in the project
    const imagesResponse = await fetch(`${serverUrl}/api/projects/${projectId}/images`);
    if (imagesResponse.ok) {
      const data = await imagesResponse.json();
      const images = data.images || [];
      
      console.log(chalk.blue(`📸 Images in project: ${images.length}`));
      
      if (images.length > 0) {
        console.log(chalk.blue('Recent images:'));
        images.slice(0, 5).forEach((img, index) => {
          const uploadTime = new Date(img.created_at || img.uploaded_at).toLocaleString();
          const source = img.upload_source || 'unknown';
          console.log(chalk.white(`   ${index + 1}. ${img.name || img.file_name} (${source}) - ${uploadTime}`));
        });
        
        if (images.length > 5) {
          console.log(chalk.gray(`   ... and ${images.length - 5} more`));
        }
      } else {
        console.log(chalk.yellow('   No images found in project'));
      }
    } else {
      console.log(chalk.red(`❌ Failed to fetch images: ${imagesResponse.status}`));
    }

    console.log('');

    // Check database directly
    console.log(chalk.blue('🔍 Checking database directly...'));
    const dbResponse = await fetch(`${serverUrl}/api/projects/${projectId}/images?direct=true`);
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log(chalk.green(`✅ Database check: ${dbData.images?.length || 0} images found`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
  }
}

checkProject();
