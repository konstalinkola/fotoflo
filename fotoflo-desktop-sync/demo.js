#!/usr/bin/env node

import { writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

const CONFIG_PATH = join(homedir(), '.fotoflo-sync.json');

console.log(chalk.blue.bold('🎯 Fotoflo Desktop Sync Demo'));
console.log('');

// Check if config exists
if (!existsSync(CONFIG_PATH)) {
  console.log(chalk.red('❌ Configuration not found.'));
  console.log(chalk.yellow('Please run: node setup-sync.js'));
  process.exit(1);
}

console.log(chalk.green('✅ Configuration found'));
console.log('');

console.log(chalk.blue('📁 Test Folder Created:'));
console.log(chalk.white('   ~/Desktop/Fotoflo Photos'));
console.log('');

console.log(chalk.blue('🚀 To start syncing:'));
console.log(chalk.yellow('   1. Make sure your Fotoflo server is running (npm run dev)'));
console.log(chalk.yellow('   2. Run: node src/index.js start ~/Desktop/Fotoflo\\ Photos'));
console.log('');

console.log(chalk.blue('📸 How to test:'));
console.log(chalk.white('   1. Start the sync client (command above)'));
console.log(chalk.white('   2. Drag some photos into ~/Desktop/Fotoflo Photos'));
console.log(chalk.white('   3. Watch them upload automatically to your Fotoflo project!'));
console.log('');

console.log(chalk.blue('💡 Pro tip:'));
console.log(chalk.white('   You can also copy photos from your camera/phone directly into the folder'));
console.log(chalk.white('   and they will sync automatically, just like Dropbox!'));
console.log('');

// Check if server is running
try {
  const response = await fetch('http://localhost:3000/api/projects');
  if (response.ok) {
    console.log(chalk.green('✅ Fotoflo server is running on http://localhost:3000'));
  } else {
    console.log(chalk.red('❌ Fotoflo server is not responding'));
    console.log(chalk.yellow('Please start your server: npm run dev'));
  }
} catch (error) {
  console.log(chalk.red('❌ Fotoflo server is not running'));
  console.log(chalk.yellow('Please start your server: npm run dev'));
}

console.log('');
console.log(chalk.green.bold('🎉 Ready to sync! Drop photos into the folder and watch them upload!'));
