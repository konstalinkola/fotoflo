#!/usr/bin/env node

import chokidar from 'chokidar';
import { readFileSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import chalk from 'chalk';
import ora from 'ora';

class WorkingFotofloSync {
  constructor(folder, projectId) {
    this.folder = folder;
    this.projectId = projectId;
    this.serverUrl = 'http://localhost:3001';
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    this.stats = {
      filesProcessed: 0,
      filesUploaded: 0,
      filesFailed: 0
    };
    this.fileProcessing = new Set(); // Track files currently being processed
  }
  
  async start() {
    if (!this.folder || !existsSync(this.folder)) {
      throw new Error('Invalid folder path');
    }
    
    console.log(chalk.blue(`📁 Watching folder: ${chalk.bold(this.folder)}`));
    console.log(chalk.blue(`🌐 Server: ${chalk.bold(this.serverUrl)}`));
    console.log(chalk.blue(`📂 Project ID: ${chalk.bold(this.projectId)}`));
    console.log(chalk.yellow('\n💡 Drop photos into the folder and watch them sync automatically!'));
    console.log(chalk.yellow('Press Ctrl+C to stop monitoring\n'));
    
    // Watch for new files
    const watcher = chokidar.watch(this.folder, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // Don't process existing files
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2 seconds after file stops changing
        pollInterval: 100
      }
    });
    
    watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('error', (error) => console.error(chalk.red('Watcher error:'), error));
    
    // Keep the process running
    return new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping sync client...'));
        watcher.close();
        this.showStats();
        resolve();
      });
    });
  }
  
  async handleNewFile(filePath) {
    const fileName = basename(filePath);
    const ext = extname(fileName).toLowerCase();
    
    // Check if it's a supported image format
    if (!this.supportedFormats.includes(ext)) {
      console.log(chalk.gray(`⏭️  Skipping non-image file: ${fileName}`));
      return;
    }
    
    // Prevent duplicate uploads - check if we're already processing this file
    if (this.fileProcessing.has(filePath)) {
      console.log(chalk.gray(`⏭️  Already processing: ${fileName}`));
      return;
    }
    
    // Check if file is still being written
    try {
      const stats = statSync(filePath);
      const now = Date.now();
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge < 5000) { // File is less than 5 seconds old
        console.log(chalk.yellow(`⏳ File still being written: ${fileName}`));
        return;
      }
    } catch (error) {
      console.log(chalk.yellow(`⏳ File not ready: ${fileName}`));
      return;
    }
    
    // Mark file as being processed
    this.fileProcessing.add(filePath);
    
    // Set a timeout to clear the processing flag after 30 seconds (safety net)
    const timeoutId = setTimeout(() => {
      this.fileProcessing.delete(filePath);
    }, 30000);
    
    try {
      await this.uploadFile(filePath);
    } finally {
      // Always remove from processing set when done
      clearTimeout(timeoutId);
      this.fileProcessing.delete(filePath);
    }
  }
  
  async uploadFile(filePath) {
    const fileName = basename(filePath);
    const spinner = ora(`Uploading ${fileName}...`).start();
    
    try {
      // Read file
      const fileBuffer = readFileSync(filePath);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: this.getContentType(fileName)
      });
      
      // Use the desktop sync endpoint (no auth required)
      const response = await fetch(`${this.serverUrl}/api/desktop-sync/upload?projectId=${this.projectId}`, {
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
      
      this.stats.filesProcessed++;
      this.stats.filesUploaded++;
      
      spinner.succeed(chalk.green(`✅ Uploaded: ${fileName}`));
      
      if (result.successful_uploads) {
        console.log(chalk.green(`   📊 Batch: ${result.successful_uploads} successful`));
      }
      
    } catch (error) {
      this.stats.filesProcessed++;
      this.stats.filesFailed++;
      
      spinner.fail(chalk.red(`❌ Failed: ${fileName}`));
      console.error(chalk.red(`   Error: ${error.message}`));
      
      if (error.message.includes('Authentication required')) {
        console.log(chalk.yellow(`   💡 Tip: Open http://localhost:3003 and log in first`));
      }
    }
  }
  
  getContentType(fileName) {
    const ext = extname(fileName).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
  
  showStats() {
    console.log(chalk.blue('\n📊 Sync Statistics:'));
    console.log(chalk.blue(`   Files processed: ${this.stats.filesProcessed}`));
    console.log(chalk.blue(`   Files uploaded: ${this.stats.filesUploaded}`));
    console.log(chalk.blue(`   Files failed: ${this.stats.filesFailed}`));
  }
}

// Get command line arguments
const folder = process.argv[2];
const projectId = process.argv[3];

if (!folder) {
  console.log(chalk.red('❌ Please specify a folder path'));
  console.log(chalk.yellow('Usage: node working-sync.js <folder> <project-id>'));
  console.log(chalk.yellow('Example: node working-sync.js ~/Desktop/Fotoflo\\ Photos your-project-id'));
  process.exit(1);
}

if (!projectId) {
  console.log(chalk.red('❌ Please specify a project ID'));
  console.log(chalk.yellow('Usage: node working-sync.js <folder> <project-id>'));
  console.log(chalk.yellow('Get your project ID from the URL in your Fotoflo web app'));
  process.exit(1);
}

// Start syncing
const sync = new WorkingFotofloSync(folder, projectId);
sync.start().catch(error => {
  console.error(chalk.red('❌ Sync failed:'), error.message);
  process.exit(1);
});
