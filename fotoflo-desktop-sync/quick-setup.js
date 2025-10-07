#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.fotoflo-sync.json');

// Create config for local development
const config = {
  serverUrl: 'http://localhost:3003',
  email: 'demo@example.com',
  token: 'demo-token-will-be-updated',
  defaultProjectId: 'demo-project-will-be-updated',
  lastUpdated: new Date().toISOString()
};

writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

console.log('✅ Updated config for port 3003');
console.log('📝 Config saved to:', CONFIG_PATH);
console.log('');
console.log('🚀 Ready to test desktop sync!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Open your Fotoflo web app: http://localhost:3003');
console.log('2. Create a project if you don\'t have one');
console.log('3. Run: node src/index.js start ~/Desktop/Fotoflo\\ Photos');
console.log('4. Drop photos into the folder and watch them sync!');
console.log('');
console.log('💡 The sync will work once you authenticate through the web interface');
