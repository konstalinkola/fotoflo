#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

console.log(chalk.blue('🚀 Building Fotoflo Desktop Sync Client...'));

// Create dist directory
const distDir = './dist';
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

try {
  // Install dependencies
  console.log(chalk.yellow('📦 Installing dependencies...'));
  execSync('npm install', { stdio: 'inherit' });

  // Build for different platforms
  console.log(chalk.yellow('🔨 Building for multiple platforms...'));
  
  const platforms = [
    { name: 'windows', target: 'node18-win-x64' },
    { name: 'macos', target: 'node18-macos-x64' },
    { name: 'linux', target: 'node18-linux-x64' }
  ];

  for (const platform of platforms) {
    console.log(chalk.blue(`📦 Building for ${platform.name}...`));
    
    try {
      execSync(`pkg . --target ${platform.target} --out-path ${distDir}`, { 
        stdio: 'inherit' 
      });
      
      // Rename the output file
      const outputFile = join(distDir, 'fotoflo-desktop-sync');
      const renamedFile = join(distDir, `fotoflo-sync-${platform.name}`);
      
      if (existsSync(outputFile)) {
        copyFileSync(outputFile, renamedFile);
        console.log(chalk.green(`✅ Built ${platform.name}: ${renamedFile}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to build for ${platform.name}:`), error.message);
    }
  }

  // Copy additional files
  console.log(chalk.yellow('📋 Copying additional files...'));
  
  const filesToCopy = [
    'README.md',
    'LICENSE'
  ];

  for (const file of filesToCopy) {
    if (existsSync(file)) {
      copyFileSync(file, join(distDir, file));
      console.log(chalk.green(`✅ Copied ${file}`));
    }
  }

  // Create installers (optional)
  console.log(chalk.yellow('📦 Creating installers...'));
  
  // Create a simple zip for each platform
  for (const platform of platforms) {
    const binaryFile = join(distDir, `fotoflo-sync-${platform.name}`);
    if (existsSync(binaryFile)) {
      try {
        execSync(`cd ${distDir} && zip -r fotoflo-sync-${platform.name}.zip fotoflo-sync-${platform.name} README.md LICENSE`, { 
          stdio: 'inherit' 
        });
        console.log(chalk.green(`✅ Created installer: fotoflo-sync-${platform.name}.zip`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not create zip for ${platform.name} (zip command not available)`));
      }
    }
  }

  console.log(chalk.green('🎉 Build completed successfully!'));
  console.log(chalk.blue('📁 Output files in ./dist/ directory'));
  
} catch (error) {
  console.error(chalk.red('❌ Build failed:'), error.message);
  process.exit(1);
}
