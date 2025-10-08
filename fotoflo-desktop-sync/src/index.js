#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { createConfigManager } = require('./config.js');
const { createSyncManager } = require('./sync-manager.js');
const { createProjectManager } = require('./project-manager.js');
const { runSetupWizard } = require('./setup-wizard.js');

const program = new Command();

program
  .name('fotoflo-sync')
  .description('Fotoflo Desktop Sync Client - Automatically sync your photos to Fotoflo projects')
  .version('1.0.0');

// Main setup command - now runs the guided wizard
program
  .command('setup')
  .description('Set up Fotoflo desktop sync with guided wizard')
  .action(async () => {
    try {
      await runSetupWizard();
    } catch (error) {
      console.error(chalk.red('❌ Setup failed:'), error.message);
      process.exit(1);
    }
  });

// Quick setup command for advanced users
program
  .command('quick-setup')
  .description('Quick setup without wizard (for advanced users)')
  .option('-s, --server <url>', 'Fotoflo server URL', 'https://fotoflo.co')
  .action(async (options) => {
    try {
      const configManager = createConfigManager();
      
      // Get server URL
      const { serverUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'serverUrl',
          message: 'Enter your Fotoflo server URL:',
          default: options.server,
          validate: (input) => input.length > 0 || 'Server URL is required'
        }
      ]);

      configManager.set('serverUrl', serverUrl);
      console.log(chalk.green(`✅ Server URL saved: ${serverUrl}`));
      console.log(chalk.blue('💡 Run "fotoflo-sync setup" for the guided wizard'));
      
    } catch (error) {
      console.error(chalk.red('❌ Setup failed:'), error.message);
      process.exit(1);
    }
  });

// Add project command
program
  .command('add-project')
  .description('Add a new project to sync')
  .action(async () => {
    try {
      const configManager = createConfigManager();
      const serverUrl = configManager.get('serverUrl');
      
      if (!serverUrl) {
        console.log(chalk.red('❌ Please run "fotoflo-sync setup" first'));
        process.exit(1);
      }

      const projectManager = createProjectManager(serverUrl);
      
      // Get project details
      const { projectId, projectName, folderPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectId',
          message: 'Enter your Fotoflo project ID:',
          validate: (input) => input.length > 0 || 'Project ID is required'
        },
        {
          type: 'input',
          name: 'projectName',
          message: 'Enter a friendly name for this project:',
          default: (answers) => answers.projectId
        },
        {
          type: 'input',
          name: 'folderPath',
          message: 'Enter the folder path to sync (e.g., ~/Desktop/MyPhotos):',
          validate: (input) => input.length > 0 || 'Folder path is required'
        }
      ]);

      // Validate folder exists
      const fs = await import('fs');
      const path = await import('path');
      const expandedPath = folderPath.replace('~', require('os').homedir());
      
      if (!fs.existsSync(expandedPath)) {
        const { createFolder } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createFolder',
            message: `Folder doesn't exist. Create it?`,
            default: true
          }
        ]);

        if (createFolder) {
          fs.mkdirSync(expandedPath, { recursive: true });
          console.log(chalk.green(`✅ Created folder: ${expandedPath}`));
        } else {
          console.log(chalk.red('❌ Setup cancelled'));
          process.exit(1);
        }
      }

      // Save project configuration
      const projects = configManager.get('projects', []);
      projects.push({
        id: projectId,
        name: projectName,
        folderPath: expandedPath,
        active: true,
        createdAt: new Date().toISOString()
      });
      
      configManager.set('projects', projects);
      
      console.log(chalk.green(`✅ Project "${projectName}" added successfully!`));
      console.log(chalk.blue(`📁 Syncing folder: ${expandedPath}`));
      console.log(chalk.yellow('\n💡 You can now run "fotoflo-sync start" to begin syncing'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to add project:'), error.message);
      process.exit(1);
    }
  });

// Start sync command
program
  .command('start')
  .description('Start syncing all active projects')
  .option('-p, --project <id>', 'Sync specific project only')
  .action(async (options) => {
    try {
      const configManager = createConfigManager();
      const serverUrl = configManager.get('serverUrl');
      const projects = configManager.get('projects', []);
      
      if (!serverUrl) {
        console.log(chalk.red('❌ Please run "fotoflo-sync setup" first'));
        process.exit(1);
      }

      if (projects.length === 0) {
        console.log(chalk.red('❌ No projects configured. Run "fotoflo-sync add-project" first'));
        process.exit(1);
      }

      const activeProjects = options.project 
        ? projects.filter(p => p.id === options.project)
        : projects.filter(p => p.active);

      if (activeProjects.length === 0) {
        console.log(chalk.red('❌ No active projects found'));
        process.exit(1);
      }

      console.log(chalk.blue('🚀 Starting Fotoflo Desktop Sync...'));
      console.log(chalk.gray(`📊 Active projects: ${activeProjects.length}`));
      
      const syncManager = createSyncManager(serverUrl);
      await syncManager.startMultiProject(activeProjects);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start sync:'), error.message);
      process.exit(1);
    }
  });

// List projects command
program
  .command('list')
  .description('List all configured projects')
  .action(() => {
    try {
      const configManager = createConfigManager();
      const projects = configManager.get('projects', []);
      
      if (projects.length === 0) {
        console.log(chalk.yellow('No projects configured'));
        return;
      }

      console.log(chalk.blue('📋 Configured Projects:'));
      projects.forEach((project, index) => {
        const status = project.active ? chalk.green('✅ Active') : chalk.red('❌ Inactive');
        console.log(chalk.white(`  ${index + 1}. ${project.name} (${project.id})`));
        console.log(chalk.gray(`     Folder: ${project.folderPath}`));
        console.log(chalk.gray(`     Status: ${status}`));
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to list projects:'), error.message);
    }
  });

// Remove project command
program
  .command('remove-project')
  .description('Remove a project from sync')
  .action(async () => {
    try {
      const configManager = createConfigManager();
      const projects = configManager.get('projects', []);
      
      if (projects.length === 0) {
        console.log(chalk.yellow('No projects to remove'));
        return;
      }

      const { projectId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectId',
          message: 'Select project to remove:',
          choices: projects.map(p => ({ name: `${p.name} (${p.folderPath})`, value: p.id }))
        }
      ]);

      const updatedProjects = projects.filter(p => p.id !== projectId);
      configManager.set('projects', updatedProjects);
      
      console.log(chalk.green('✅ Project removed successfully'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to remove project:'), error.message);
    }
  });

// Status command
program
  .command('status')
  .description('Show sync status and statistics')
  .action(() => {
    try {
      const configManager = createConfigManager();
      const serverUrl = configManager.get('serverUrl');
      const projects = configManager.get('projects', []);
      
      console.log(chalk.blue('📊 Fotoflo Desktop Sync Status'));
      console.log(chalk.gray(`Server: ${serverUrl || 'Not configured'}`));
      console.log(chalk.gray(`Projects: ${projects.length}`));
      console.log(chalk.gray(`Active: ${projects.filter(p => p.active).length}`));
      
      if (projects.length > 0) {
        console.log(chalk.blue('\n📋 Projects:'));
        projects.forEach(project => {
          const status = project.active ? chalk.green('✅') : chalk.red('❌');
          console.log(chalk.white(`  ${status} ${project.name}`));
          console.log(chalk.gray(`     ${project.folderPath}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error.message);
    }
  });

// Parse command line arguments
program.parse();