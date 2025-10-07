#!/usr/bin/env node

import { writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.fotoflo-sync.json');

// Simple setup for local development
const config = {
  serverUrl: 'http://localhost:3000',
  email: 'your-email@example.com', // Replace with your actual email
  token: 'your-token-here', // This will be set after authentication
  defaultProjectId: 'your-project-id', // This will be set after project selection
  lastUpdated: new Date().toISOString()
};

console.log('🔧 Setting up Fotoflo Desktop Sync...');
console.log('');
console.log('📝 Manual Setup Required:');
console.log('');
console.log('1. First, make sure your Fotoflo server is running:');
console.log('   cd /Users/konstalinkola/Documents/Kuvapalvelin/Code/kuvapalvelin');
console.log('   npm run dev');
console.log('');
console.log('2. Then run the interactive setup:');
console.log('   cd fotoflo-desktop-sync');
console.log('   node src/index.js setup');
console.log('');
console.log('3. Or create a folder and start syncing:');
console.log('   mkdir ~/Desktop/Fotoflo\\ Photos');
console.log('   node src/index.js start ~/Desktop/Fotoflo\\ Photos');
console.log('');

// Create a basic config file if it doesn't exist
if (!existsSync(CONFIG_PATH)) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('✅ Created basic config file at:', CONFIG_PATH);
  console.log('📝 Please edit this file with your actual credentials');
} else {
  console.log('✅ Config file already exists at:', CONFIG_PATH);
}

console.log('');
console.log('🎯 Quick Start:');
console.log('1. Create a folder: mkdir ~/Desktop/Fotoflo\\ Photos');
console.log('2. Start syncing: node src/index.js start ~/Desktop/Fotoflo\\ Photos');
console.log('3. Drop photos into the folder and watch them sync!');
console.log('');
console.log('📖 For detailed instructions, see README.md');
