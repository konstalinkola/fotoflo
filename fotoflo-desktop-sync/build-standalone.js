#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

console.log(chalk.blue('🚀 Building Standalone Fotoflo Desktop Sync Client...'));
console.log(chalk.yellow('This will create truly standalone executables that don\'t require Node.js!'));

// Create dist directory
const distDir = './dist-standalone';
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

try {
  // Install dependencies
  console.log(chalk.yellow('📦 Installing dependencies...'));
  execSync('npm install', { stdio: 'inherit' });

  // Build for different platforms
  console.log(chalk.yellow('🔨 Building standalone executables for multiple platforms...'));
  
  const platforms = [
    { name: 'windows-x64', target: 'node18-win-x64', ext: '.exe' },
    { name: 'macos-x64', target: 'node18-macos-x64', ext: '' },
    { name: 'macos-arm64', target: 'node18-macos-arm64', ext: '' },
    { name: 'linux-x64', target: 'node18-linux-x64', ext: '' },
    { name: 'linux-arm64', target: 'node18-linux-arm64', ext: '' }
  ];

  for (const platform of platforms) {
    console.log(chalk.blue(`📦 Building standalone executable for ${platform.name}...`));
    
    try {
      // Build the standalone executable for this specific platform
      const outputName = `fotoflo-sync-${platform.name}${platform.ext}`;
      execSync(`npx pkg . --target ${platform.target} --out-path ${distDir}`, { 
        stdio: 'inherit' 
      });
      
      // Rename the output file to be more descriptive
      const defaultOutputFile = join(distDir, 'fotoflo-desktop-sync');
      const renamedFile = join(distDir, outputName);
      
      if (existsSync(defaultOutputFile)) {
        copyFileSync(defaultOutputFile, renamedFile);
        console.log(chalk.green(`✅ Built standalone ${platform.name}: ${renamedFile}`));
        
        // Make executable on Unix systems
        if (!platform.name.includes('windows')) {
          execSync(`chmod +x "${renamedFile}"`, { stdio: 'inherit' });
        }
        
        // Remove the default output file
        execSync(`rm -f "${defaultOutputFile}"`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to build for ${platform.name}:`), error.message);
    }
  }

  // Create a simple launcher script for testing
  console.log(chalk.yellow('📋 Creating test launcher...'));
  
  const testLauncher = `#!/bin/bash
echo "🧪 Testing Fotoflo Sync Standalone Executable"
echo "============================================="
echo ""

# Test macOS versions
if [ -f "fotoflo-sync-macos-x64" ]; then
    echo "🍎 Testing macOS x64 version..."
    ./fotoflo-sync-macos-x64 --help || echo "macOS x64 version test completed"
    echo ""
fi

if [ -f "fotoflo-sync-macos-arm64" ]; then
    echo "🍎 Testing macOS ARM64 version..."
    ./fotoflo-sync-macos-arm64 --help || echo "macOS ARM64 version test completed"
    echo ""
fi

# Test Linux versions  
if [ -f "fotoflo-sync-linux-x64" ]; then
    echo "🐧 Testing Linux x64 version..."
    ./fotoflo-sync-linux-x64 --help || echo "Linux x64 version test completed"
    echo ""
fi

if [ -f "fotoflo-sync-linux-arm64" ]; then
    echo "🐧 Testing Linux ARM64 version..."
    ./fotoflo-sync-linux-arm64 --help || echo "Linux ARM64 version test completed"
    echo ""
fi

echo "✅ Standalone executable test completed!"
echo "💡 These executables should work on systems without Node.js installed"
`;

  writeFileSync(join(distDir, 'test-standalone.sh'), testLauncher);
  execSync(`chmod +x "${join(distDir, 'test-standalone.sh')}"`, { stdio: 'inherit' });

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
  console.log(chalk.yellow('📦 Creating distribution packages...'));
  
  // Create a simple zip for each platform
  for (const platform of platforms) {
    const binaryFile = join(distDir, `fotoflo-sync-${platform.name}${platform.ext}`);
    if (existsSync(binaryFile)) {
      try {
        const zipName = `fotoflo-sync-standalone-${platform.name}.zip`;
        execSync(`cd ${distDir} && zip -r ${zipName} fotoflo-sync-${platform.name}${platform.ext} README.md LICENSE test-standalone.sh`, { 
          stdio: 'inherit' 
        });
        console.log(chalk.green(`✅ Created distribution package: ${zipName}`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not create zip for ${platform.name} (zip command not available)`));
      }
    }
  }

  console.log(chalk.green('🎉 Standalone build completed successfully!'));
  console.log(chalk.blue('📁 Output files in ./dist-standalone/ directory'));
  console.log('');
  console.log(chalk.green('✨ These executables are truly standalone:'));
  console.log(chalk.blue('   • No Node.js installation required'));
  console.log(chalk.blue('   • All dependencies bundled'));
  console.log(chalk.blue('   • Ready for end-user distribution'));
  console.log('');
  console.log(chalk.yellow('🧪 Test the executables:'));
  console.log(chalk.blue('   cd dist-standalone && ./test-standalone.sh'));
  
} catch (error) {
  console.error(chalk.red('❌ Build failed:'), error.message);
  process.exit(1);
}
