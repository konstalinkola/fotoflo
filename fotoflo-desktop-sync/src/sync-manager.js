import chokidar from 'chokidar';
import { readFileSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import chalk from 'chalk';
import ora from 'ora';
import { createConfigManager } from './config.js';

export function createSyncManager(serverUrl) {
  const configManager = createConfigManager();
  const settings = configManager.get('settings');
  
  return {
    async startMultiProject(projects) {
      console.log(chalk.blue('🚀 Starting multi-project sync...'));
      
      const watchers = [];
      
      for (const project of projects) {
        console.log(chalk.blue(`📁 Setting up sync for: ${project.name}`));
        console.log(chalk.gray(`   Folder: ${project.folderPath}`));
        console.log(chalk.gray(`   Project ID: ${project.id}`));
        
        const watcher = await this.setupProjectWatcher(project, serverUrl);
        watchers.push(watcher);
      }
      
      console.log(chalk.green('\n✅ All projects are now syncing!'));
      console.log(chalk.yellow('💡 Drop photos into any of your configured folders'));
      console.log(chalk.yellow('Press Ctrl+C to stop all syncing\n'));
      
      // Keep the process running
      return new Promise((resolve) => {
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n🛑 Stopping all sync clients...'));
          watchers.forEach(watcher => watcher.close());
          console.log(chalk.green('✅ All sync clients stopped'));
          resolve();
        });
      });
    },

    async setupProjectWatcher(project, serverUrl) {
      const { folderPath, id: projectId, name: projectName } = project;
      
      if (!existsSync(folderPath)) {
        throw new Error(`Folder does not exist: ${folderPath}`);
      }
      
      const fileProcessing = new Set();
      const stats = {
        filesProcessed: 0,
        filesUploaded: 0,
        filesFailed: 0
      };
      
      console.log(chalk.blue(`🔍 Watching: ${projectName} -> ${folderPath}`));
      
      const watcher = chokidar.watch(folderPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true, // Don't process existing files
        awaitWriteFinish: {
          stabilityThreshold: 2000, // Wait 2 seconds after file stops changing
          pollInterval: 100
        }
      });
      
      watcher
        .on('add', async (filePath) => {
          await handleNewFile(filePath, projectId, projectName, serverUrl, fileProcessing, stats);
        })
        .on('error', (error) => {
          console.error(chalk.red(`❌ Watcher error for ${projectName}:`), error);
        });
      
      return watcher;
    }
  };
}

async function handleNewFile(filePath, projectId, projectName, serverUrl, fileProcessing, stats) {
  const fileName = basename(filePath);
  const ext = extname(fileName).toLowerCase();
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];
  
  // Check if it's a supported image format
  if (!supportedFormats.includes(ext)) {
    console.log(chalk.gray(`⏭️  Skipping non-image file: ${fileName}`));
    return;
  }
  
  // Prevent duplicate uploads
  if (fileProcessing.has(filePath)) {
    console.log(chalk.gray(`⏭️  Already processing: ${fileName}`));
    return;
  }
  
  // Check if file is still being written
  try {
    const fileStats = statSync(filePath);
    const now = Date.now();
    const fileAge = now - fileStats.mtime.getTime();
    
    if (fileAge < 5000) { // File is less than 5 seconds old
      console.log(chalk.yellow(`⏳ File still being written: ${fileName}`));
      return;
    }
  } catch (error) {
    console.log(chalk.yellow(`⏳ File not ready: ${fileName}`));
    return;
  }
  
  // Mark file as being processed
  fileProcessing.add(filePath);
  
  // Set a timeout to clear the processing flag after 30 seconds (safety net)
  const timeoutId = setTimeout(() => {
    fileProcessing.delete(filePath);
  }, 30000);
  
  try {
    await uploadFile(filePath, projectId, projectName, serverUrl, stats);
  } finally {
    // Always remove from processing set when done
    clearTimeout(timeoutId);
    fileProcessing.delete(filePath);
  }
}

async function uploadFile(filePath, projectId, projectName, serverUrl, stats) {
  const fileName = basename(filePath);
  const spinner = ora(`Uploading ${fileName} to ${projectName}...`).start();
  
  try {
    // Read file
    const fileBuffer = readFileSync(filePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: getContentType(fileName)
    });
    
    // Use the desktop sync endpoint
    const response = await fetch(`${serverUrl}/api/desktop-sync/upload?projectId=${projectId}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to Fotoflo web app first.');
      }
      
      throw new Error(errorData.error || 'Upload failed');
    }
    
    const result = await response.json();
    
    stats.filesProcessed++;
    stats.filesUploaded++;
    
    spinner.succeed(chalk.green(`✅ Uploaded: ${fileName} to ${projectName}`));
    
    if (result.successful_uploads) {
      console.log(chalk.green(`   📊 Batch: ${result.successful_uploads} successful`));
    }
    
  } catch (error) {
    stats.filesProcessed++;
    stats.filesFailed++;
    
    spinner.fail(chalk.red(`❌ Failed: ${fileName} to ${projectName}`));
    console.error(chalk.red(`   Error: ${error.message}`));
    
    if (error.message.includes('Authentication required')) {
      console.log(chalk.yellow(`   💡 Tip: Open ${serverUrl} and log in first`));
    }
  }
}

function getContentType(fileName) {
  const ext = extname(fileName).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.tiff': 'image/tiff',
    '.bmp': 'image/bmp'
  };
  
  return contentTypes[ext] || 'image/jpeg';
}
