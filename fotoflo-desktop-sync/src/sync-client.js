import chokidar from 'chokidar';
import { readFileSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, saveConfig } from './config.js';

export class FotofloSyncClient {
  constructor(folder = null, projectId = null) {
    this.folder = folder;
    this.projectId = projectId;
    this.config = null;
    this.watcher = null;
    this.stats = {
      filesProcessed: 0,
      filesUploaded: 0,
      filesFailed: 0,
      lastSync: null
    };
    
    // Supported image formats
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  }
  
  async initialize() {
    try {
      this.config = loadConfig();
      this.serverUrl = this.config.serverUrl;
      
      if (this.projectId) {
        this.projectId = this.projectId;
      } else {
        this.projectId = this.config.defaultProjectId;
      }
      
      if (!this.projectId) {
        throw new Error('No project ID specified');
      }
      
      // Verify project access
      await this.verifyProjectAccess();
      
    } catch (error) {
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }
  
  async verifyProjectAccess() {
    const response = await fetch(`${this.serverUrl}/api/projects/${this.projectId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Cannot access project. Please check your authentication.');
    }
    
    const project = await response.json();
    this.projectName = project.name;
  }
  
  async start() {
    if (!this.folder || !existsSync(this.folder)) {
      throw new Error('Invalid folder path');
    }
    
    console.log(chalk.blue(`Watching folder: ${chalk.bold(this.folder)}`));
    console.log(chalk.blue(`Project: ${chalk.bold(this.projectName)} (${this.projectId})`));
    
    // Watch for new files
    this.watcher = chokidar.watch(this.folder, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // Don't process existing files
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2 seconds after file stops changing
        pollInterval: 100
      }
    });
    
    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('error', (error) => console.error(chalk.red('Watcher error:'), error));
    
    // Keep the process running
    return new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping sync client...'));
        this.stop();
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
    
    await this.uploadFile(filePath);
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
      
      // Upload to Fotoflo
      const response = await fetch(`${this.serverUrl}/api/auto-upload/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const result = await response.json();
      
      this.stats.filesProcessed++;
      this.stats.filesUploaded++;
      this.stats.lastSync = new Date().toISOString();
      
      spinner.succeed(chalk.green(`✅ Uploaded: ${fileName}`));
      
      // Show batch result
      if (result.successful_uploads > 0) {
        console.log(chalk.green(`   📊 Batch: ${result.successful_uploads} successful`));
      }
      
    } catch (error) {
      this.stats.filesProcessed++;
      this.stats.filesFailed++;
      
      spinner.fail(chalk.red(`❌ Failed: ${fileName}`));
      console.error(chalk.red(`   Error: ${error.message}`));
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
  
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    // Save stats
    this.saveStats();
    
    console.log(chalk.blue('\n📊 Sync Statistics:'));
    console.log(chalk.blue(`   Files processed: ${this.stats.filesProcessed}`));
    console.log(chalk.blue(`   Files uploaded: ${this.stats.filesUploaded}`));
    console.log(chalk.blue(`   Files failed: ${this.stats.filesFailed}`));
    if (this.stats.lastSync) {
      console.log(chalk.blue(`   Last sync: ${new Date(this.stats.lastSync).toLocaleString()}`));
    }
  }
  
  async showStatus() {
    try {
      this.config = loadConfig();
      
      console.log(chalk.blue('📊 Sync Status:'));
      console.log(chalk.blue(`   Server: ${this.config.serverUrl}`));
      console.log(chalk.blue(`   Email: ${this.config.email}`));
      console.log(chalk.blue(`   Default Project: ${this.config.defaultProjectId}`));
      console.log(chalk.blue(`   Last Updated: ${new Date(this.config.lastUpdated).toLocaleString()}`));
      
      // Test connection
      const spinner = ora('Testing connection...').start();
      
      const response = await fetch(`${this.config.serverUrl}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });
      
      if (response.ok) {
        spinner.succeed('Connection successful');
      } else {
        spinner.fail('Connection failed');
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error.message);
    }
  }
  
  async listProjects() {
    try {
      this.config = loadConfig();
      
      const response = await fetch(`${this.config.serverUrl}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projects = await response.json();
      
      console.log(chalk.blue('📁 Your Projects:'));
      projects.forEach(project => {
        const isDefault = project.id === this.config.defaultProjectId;
        console.log(chalk.blue(`   ${isDefault ? '★ ' : '  '}${project.name} (${project.id})`));
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to list projects:'), error.message);
    }
  }
  
  saveStats() {
    // Could save stats to a file for persistence
    // For now, just keep in memory
  }
}
