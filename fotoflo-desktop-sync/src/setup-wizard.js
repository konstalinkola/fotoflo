#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { createConfigManager } from './config.js';
import { createProjectManager } from './project-manager.js';

export async function runSetupWizard() {
  console.log(chalk.blue('🎉 Welcome to Fotoflo Desktop Sync!'));
  console.log(chalk.gray('This wizard will help you set up automatic photo syncing to your Fotoflo projects.\n'));

  const configManager = createConfigManager();
  
  // Step 1: Server URL
  console.log(chalk.blue('📡 Step 1: Connect to Fotoflo'));
  const { serverUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'serverUrl',
      message: 'Enter your Fotoflo server URL:',
      default: 'https://fotoflo.co',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL (e.g., https://fotoflo.co)';
        }
      }
    }
  ]);

  configManager.set('serverUrl', serverUrl);
  console.log(chalk.green(`✅ Connected to: ${serverUrl}\n`));

  // Step 2: Test connection
  console.log(chalk.blue('🔍 Step 2: Testing connection...'));
  const projectManager = createProjectManager(serverUrl);
  
  try {
    const connectionTest = await projectManager.testConnection();
    if (connectionTest.connected) {
      console.log(chalk.green('✅ Connection successful!'));
    } else {
      console.log(chalk.yellow(`⚠️  Connection test failed: ${connectionTest.message}`));
      console.log(chalk.yellow('You can still continue, but some features may not work.\n'));
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not test connection: ${error.message}`));
    console.log(chalk.yellow('You can still continue, but some features may not work.\n'));
  }

  // Step 3: Add first project
  console.log(chalk.blue('📁 Step 3: Add Your First Project'));
  console.log(chalk.gray('You can add more projects later from the Fotoflo web app.\n'));

  const { addProject } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addProject',
      message: 'Would you like to add your first project now?',
      default: true
    }
  ]);

  if (addProject) {
    await addFirstProject(configManager, projectManager);
  }

  // Step 4: Auto-start option
  console.log(chalk.blue('🚀 Step 4: Startup Options'));
  const { autoStart } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'autoStart',
      message: 'Would you like Fotoflo Sync to start automatically when you log in?',
      default: false
    }
  ]);

  configManager.set('settings.autoStart', autoStart);
  
  if (autoStart) {
    console.log(chalk.green('✅ Auto-start enabled'));
    console.log(chalk.gray('Note: You may need to grant permission for startup access in your system settings.'));
  }

  // Final step
  console.log(chalk.green('\n🎉 Setup Complete!'));
  console.log(chalk.blue('📋 What happens next:'));
  console.log(chalk.white('• Fotoflo Sync is now configured and ready to use'));
  console.log(chalk.white('• Drop photos into your configured folders to sync them automatically'));
  console.log(chalk.white('• You can add more projects anytime from the Fotoflo web app'));
  console.log(chalk.white('• Use "fotoflo-sync" commands to manage your setup\n'));

  const { startNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startNow',
      message: 'Would you like to start syncing now?',
      default: true
    }
  ]);

  if (startNow) {
    console.log(chalk.blue('🚀 Starting Fotoflo Sync...'));
    console.log(chalk.yellow('Press Ctrl+C to stop syncing\n'));
    
    // Import and start the sync manager
    const { createSyncManager } = await import('./sync-manager.js');
    const projects = configManager.get('projects', []);
    const activeProjects = projects.filter(p => p.active);
    
    if (activeProjects.length > 0) {
      const syncManager = createSyncManager(serverUrl);
      await syncManager.startMultiProject(activeProjects);
    } else {
      console.log(chalk.yellow('No active projects found. Add a project first!'));
    }
  } else {
    console.log(chalk.blue('💡 To start syncing later, run: fotoflo-sync start'));
  }
}

async function addFirstProject(configManager, projectManager) {
  try {
    console.log(chalk.gray('Fetching your Fotoflo projects...'));
    const projects = await projectManager.getProjects();
    
    if (projects.length === 0) {
      console.log(chalk.yellow('No projects found. You may need to log in to Fotoflo first.'));
      console.log(chalk.blue('💡 Tip: Open your Fotoflo web app and log in, then try again.'));
      return;
    }

    console.log(chalk.green(`Found ${projects.length} project(s)!`));

    const { selectedProject } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProject',
        message: 'Select a project to sync:',
        choices: projects.map(p => ({
          name: `${p.name} (${p.display_mode} mode)`,
          value: p
        }))
      }
    ]);

    const { folderPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'folderPath',
        message: 'Choose a folder to sync photos to this project:',
        default: `~/Desktop/${selectedProject.name.replace(/[^a-zA-Z0-9]/g, '')}Photos`,
        validate: (input) => input.length > 0 || 'Folder path is required'
      }
    ]);

    // Expand ~ to home directory
    const expandedPath = folderPath.replace('~', require('os').homedir());
    
    // Check if folder exists, offer to create
    const fs = await import('fs');
    if (!fs.existsSync(expandedPath)) {
      const { createFolder } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createFolder',
          message: `Create folder "${expandedPath}"?`,
          default: true
        }
      ]);

      if (createFolder) {
        fs.mkdirSync(expandedPath, { recursive: true });
        console.log(chalk.green(`✅ Created folder: ${expandedPath}`));
      } else {
        console.log(chalk.red('❌ Setup cancelled - folder is required'));
        return;
      }
    }

    // Save project configuration
    const projects = configManager.get('projects', []);
    projects.push({
      id: selectedProject.id,
      name: selectedProject.name,
      folderPath: expandedPath,
      active: true,
      createdAt: new Date().toISOString()
    });
    
    configManager.set('projects', projects);
    
    console.log(chalk.green(`✅ Project "${selectedProject.name}" configured!`));
    console.log(chalk.blue(`📁 Sync folder: ${expandedPath}`));
    console.log(chalk.gray('Drop photos into this folder to sync them automatically!\n'));
    
  } catch (error) {
    console.log(chalk.red('❌ Failed to add project:'), error.message);
    console.log(chalk.yellow('💡 You can add projects later using: fotoflo-sync add-project\n'));
  }
}
