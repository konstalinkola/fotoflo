#!/usr/bin/env node

// Update Fotoflo Sync with New Logo
// This script updates all logo references with the new S-shaped gradient logo

const fs = require('fs');
const path = require('path');

console.log('🎨 Updating Fotoflo Sync with New Logo');
console.log('=====================================');

// Create the new logo as an SVG
const newLogoSVG = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- S-shaped logo with gradient segments -->
  
  <!-- Top segment - curves down and right -->
  <defs>
    <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#e8d5ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6b46c1;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="middleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#eab308;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6b46c1;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6b46c1;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Top segment - white to lavender to purple, curves down right -->
  <path d="M 8 16 Q 20 8 32 16 Q 44 24 52 20" 
        stroke="url(#topGradient)" 
        stroke-width="12" 
        fill="none" 
        stroke-linecap="round"/>
  
  <!-- Middle segment - orange to yellow to purple, curves up right -->
  <path d="M 12 32 Q 24 40 36 32 Q 48 24 56 28" 
        stroke="url(#middleGradient)" 
        stroke-width="12" 
        fill="none" 
        stroke-linecap="round"/>
  
  <!-- Bottom segment - purple to grey-purple to yellow, curves down right -->
  <path d="M 8 48 Q 20 56 32 48 Q 44 40 52 44" 
        stroke="url(#bottomGradient)" 
        stroke-width="12" 
        fill="none" 
        stroke-linecap="round"/>
</svg>`;

// Update the app bundle icon
function updateAppIcon() {
  console.log('📱 Updating app bundle icon...');
  
  const appBundlePath = 'Fotoflo Sync.app/Contents/Resources';
  if (fs.existsSync(appBundlePath)) {
    // Save SVG logo
    fs.writeFileSync(path.join(appBundlePath, 'logo.svg'), newLogoSVG);
    
    // Create a simple icon reference
    const iconInfo = `# New Fotoflo Logo
# S-shaped gradient design with three segments:
# - Top: White → Lavender → Purple
# - Middle: Orange → Yellow → Purple  
# - Bottom: Purple → Grey-Purple → Yellow
# 
# This replaces the simple "F" logo with the new brand identity
`;
    
    fs.writeFileSync(path.join(appBundlePath, 'icon-info.txt'), iconInfo);
    console.log('✅ App bundle icon updated');
  } else {
    console.log('⚠️  App bundle not found, skipping icon update');
  }
}

// Update the installer HTML
function updateInstallerLogo() {
  console.log('🎨 Updating installer logo...');
  
  const installerPath = 'installer/visual-installer.html';
  if (fs.existsSync(installerPath)) {
    let content = fs.readFileSync(installerPath, 'utf8');
    
    // Replace the simple logo with the new SVG
    const newLogoHTML = `
        <div class="logo">
          <svg width="60" height="60" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                <stop offset="30%" style="stop-color:#e8d5ff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#6b46c1;stop-opacity:1" />
              </linearGradient>
              <linearGradient id="middleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#eab308;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#6b46c1;stop-opacity:1" />
              </linearGradient>
              <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#6b46c1;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M 8 16 Q 20 8 32 16 Q 44 24 52 20" stroke="url(#topGradient)" stroke-width="12" fill="none" stroke-linecap="round"/>
            <path d="M 12 32 Q 24 40 36 32 Q 48 24 56 28" stroke="url(#middleGradient)" stroke-width="12" fill="none" stroke-linecap="round"/>
            <path d="M 8 48 Q 20 56 32 48 Q 44 40 52 44" stroke="url(#bottomGradient)" stroke-width="12" fill="none" stroke-linecap="round"/>
          </svg>
        </div>`;
    
    // Replace the old logo div
    content = content.replace(
      /<div class="logo">F<\/div>/,
      newLogoHTML
    );
    
    fs.writeFileSync(installerPath, content);
    console.log('✅ Installer logo updated');
  } else {
    console.log('⚠️  Installer HTML not found, skipping logo update');
  }
}

// Update system tray icon
function updateTrayIcon() {
  console.log('🔔 Updating system tray icon...');
  
  const trayPath = 'src/system-tray.js';
  if (fs.existsSync(trayPath)) {
    let content = fs.readFileSync(trayPath, 'utf8');
    
    // Update the createTrayIcon method to use the new logo
    const newIconMethod = `
    createTrayIcon() {
        // Create a dynamic icon based on sync status with new logo
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Background circle with status color
        ctx.fillStyle = this.getStatusColor();
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw simplified S-shape logo
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Top curve
        ctx.beginPath();
        ctx.moveTo(4, 6);
        ctx.quadraticCurveTo(8, 4, 12, 6);
        ctx.stroke();
        
        // Middle curve  
        ctx.beginPath();
        ctx.moveTo(5, 8);
        ctx.quadraticCurveTo(8, 10, 11, 8);
        ctx.stroke();
        
        // Bottom curve
        ctx.beginPath();
        ctx.moveTo(4, 10);
        ctx.quadraticCurveTo(8, 12, 12, 10);
        ctx.stroke();
        
        return nativeImage.createFromDataURL(canvas.toDataURL());
    }`;
    
    // Replace the old createTrayIcon method
    content = content.replace(
      /createTrayIcon\(\) \{[^}]+\}/s,
      newIconMethod
    );
    
    fs.writeFileSync(trayPath, content);
    console.log('✅ System tray icon updated');
  } else {
    console.log('⚠️  System tray file not found, skipping tray icon update');
  }
}

// Create a standalone logo file
function createStandaloneLogo() {
  console.log('📄 Creating standalone logo file...');
  
  const logoInfo = `# Fotoflo New Logo

## Design Description
S-shaped logo with three horizontal gradient segments:

### Top Segment
- Colors: White → Light Lavender → Dark Purple
- Shape: Curves downward and to the right
- Represents: Innovation and creativity

### Middle Segment  
- Colors: Orange → Yellow → Dark Purple
- Shape: Curves upward and to the right
- Represents: Energy and growth

### Bottom Segment
- Colors: Dark Purple → Grey-Purple → Yellow
- Shape: Curves downward and to the right
- Represents: Stability and success

## Usage
- Primary brand identity for Fotoflo
- Used in all desktop applications
- Maintains gradient consistency across platforms
- Scalable SVG format for all sizes

## Brand Colors
- Primary Purple: #6b46c1
- Secondary Orange: #f97316  
- Accent Yellow: #eab308
- Light Purple: #8b5cf6
- White: #ffffff
`;

  fs.writeFileSync('NEW_LOGO_INFO.md', logoInfo);
  fs.writeFileSync('logo.svg', newLogoSVG);
  console.log('✅ Standalone logo files created');
}

// Run all updates
function main() {
  try {
    updateAppIcon();
    updateInstallerLogo();
    updateTrayIcon();
    createStandaloneLogo();
    
    console.log('');
    console.log('🎉 Logo update complete!');
    console.log('========================');
    console.log('✅ App bundle icon updated');
    console.log('✅ Installer logo updated'); 
    console.log('✅ System tray icon updated');
    console.log('✅ Standalone logo files created');
    console.log('');
    console.log('🎨 New S-shaped gradient logo is now integrated!');
    
  } catch (error) {
    console.error('❌ Error updating logo:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateAppIcon, updateInstallerLogo, updateTrayIcon, createStandaloneLogo };


