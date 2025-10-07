#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

console.log(chalk.blue('🚀 Creating Fotoflo Desktop Sync Installer...'));

// Create installer directory
const installerDir = './installer';
if (!existsSync(installerDir)) {
  mkdirSync(installerDir, { recursive: true });
}

try {
  // First, build the application
  console.log(chalk.yellow('📦 Building application...'));
  execSync('npm run build', { stdio: 'inherit' });

  // Create installer scripts for each platform
  console.log(chalk.yellow('🔧 Creating installer scripts...'));

  // macOS Installer (PKG)
  const macosInstaller = `#!/bin/bash
# Fotoflo Desktop Sync - macOS Installer

echo "🚀 Installing Fotoflo Desktop Sync..."

# Create application directory
APP_DIR="/Applications/Fotoflo Sync.app"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Copy the binary
cp dist/fotoflo-sync-macos "$APP_DIR/Contents/MacOS/fotoflo-sync"
chmod +x "$APP_DIR/Contents/MacOS/fotoflo-sync"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>fotoflo-sync</string>
    <key>CFBundleIdentifier</key>
    <string>com.fotoflo.desktop-sync</string>
    <key>CFBundleName</key>
    <string>Fotoflo Sync</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
</dict>
</plist>
EOF

# Create symbolic link for command line access
ln -sf "$APP_DIR/Contents/MacOS/fotoflo-sync" /usr/local/bin/fotoflo-sync

# Create desktop shortcut
cat > "/Applications/Fotoflo Sync.app/Contents/Resources/start-sync.command" << EOF
#!/bin/bash
echo "🚀 Starting Fotoflo Desktop Sync..."
echo "This will open the setup wizard to configure your sync folders."
echo ""
"/Applications/Fotoflo Sync.app/Contents/MacOS/fotoflo-sync" setup
EOF

chmod +x "/Applications/Fotoflo Sync.app/Contents/Resources/start-sync.command"

echo "✅ Installation complete!"
echo ""
echo "🎉 Fotoflo Desktop Sync is now installed!"
echo "📁 Application: /Applications/Fotoflo Sync.app"
echo "💻 Command line: fotoflo-sync"
echo ""
echo "🚀 Next steps:"
echo "1. Double-click 'Fotoflo Sync.app' to run the setup wizard"
echo "2. Or run 'fotoflo-sync setup' in Terminal"
echo "3. Follow the guided setup to add your projects"
`;

  writeFileSync(join(installerDir, 'install-macos.sh'), macosInstaller);

  // Windows Installer (Batch + PowerShell)
  const windowsInstaller = `@echo off
REM Fotoflo Desktop Sync - Windows Installer

echo 🚀 Installing Fotoflo Desktop Sync...

REM Create installation directory
set INSTALL_DIR="C:\\Program Files\\Fotoflo Sync"
mkdir %INSTALL_DIR%

REM Copy the binary
copy "dist\\fotoflo-sync-windows.exe" %INSTALL_DIR%\\fotoflo-sync.exe

REM Add to PATH
setx PATH "%PATH%;%INSTALL_DIR%" /M

REM Create desktop shortcut
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\Fotoflo Sync.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\fotoflo-sync.exe'; $Shortcut.Arguments = 'setup'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Fotoflo Desktop Sync'; $Shortcut.Save()"

REM Create start menu shortcut
set START_MENU="%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs"
mkdir "%START_MENU%\\Fotoflo Sync"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU%\\Fotoflo Sync\\Fotoflo Sync.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\fotoflo-sync.exe'; $Shortcut.Arguments = 'setup'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Fotoflo Desktop Sync'; $Shortcut.Save()"

echo ✅ Installation complete!
echo.
echo 🎉 Fotoflo Desktop Sync is now installed!
echo 📁 Installation: %INSTALL_DIR%
echo 💻 Command line: fotoflo-sync
echo.
echo 🚀 Next steps:
echo 1. Look for "Fotoflo Sync" in your Start Menu
echo 2. Or run "fotoflo-sync setup" in Command Prompt
echo 3. Follow the guided setup to add your projects
echo.
pause
`;

  writeFileSync(join(installerDir, 'install-windows.bat'), windowsInstaller);

  // Linux Installer
  const linuxInstaller = `#!/bin/bash
# Fotoflo Desktop Sync - Linux Installer

echo "🚀 Installing Fotoflo Desktop Sync..."

# Create installation directory
INSTALL_DIR="/opt/fotoflo-sync"
sudo mkdir -p "$INSTALL_DIR"

# Copy the binary
sudo cp dist/fotoflo-sync-linux "$INSTALL_DIR/fotoflo-sync"
sudo chmod +x "$INSTALL_DIR/fotoflo-sync"

# Create symbolic link for command line access
sudo ln -sf "$INSTALL_DIR/fotoflo-sync" /usr/local/bin/fotoflo-sync

# Create desktop entry
DESKTOP_ENTRY="/usr/share/applications/fotoflo-sync.desktop"
sudo tee "$DESKTOP_ENTRY" > /dev/null << EOF
[Desktop Entry]
Name=Fotoflo Sync
Comment=Sync photos to Fotoflo projects
Exec=fotoflo-sync setup
Icon=applications-graphics
Terminal=true
Type=Application
Categories=Graphics;Photography;
EOF

echo "✅ Installation complete!"
echo ""
echo "🎉 Fotoflo Desktop Sync is now installed!"
echo "📁 Installation: $INSTALL_DIR"
echo "💻 Command line: fotoflo-sync"
echo "🖥️  Desktop: Look for 'Fotoflo Sync' in your applications menu"
echo ""
echo "🚀 Next steps:"
echo "1. Run 'fotoflo-sync setup' to configure your sync folders"
echo "2. Follow the guided setup to add your projects"
echo "3. Start syncing your photos!"
`;

  writeFileSync(join(installerDir, 'install-linux.sh'), linuxInstaller);
  
  // Make Linux installer executable
  execSync(`chmod +x ${join(installerDir, 'install-linux.sh')}`);

  // Create a simple download page HTML
  const downloadPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download Fotoflo Desktop Sync</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        h1 { color: #2563eb; text-align: center; margin-bottom: 20px; }
        .download-buttons { display: flex; gap: 20px; justify-content: center; margin: 30px 0; }
        .download-btn { padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .download-btn.windows { background: #0078d4; color: white; }
        .download-btn.macos { background: #007aff; color: white; }
        .download-btn.linux { background: #f7931e; color: white; }
        .download-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .features { margin-top: 40px; }
        .feature { display: flex; align-items: center; margin: 15px 0; }
        .feature-icon { width: 24px; height: 24px; margin-right: 15px; color: #10b981; }
        .steps { background: #f8fafc; padding: 30px; border-radius: 8px; margin-top: 30px; }
        .step { margin: 15px 0; }
        .step-number { display: inline-block; width: 30px; height: 30px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>📸 Fotoflo Desktop Sync</h1>
            <p>Automatically sync your photos to Fotoflo projects</p>
        </div>
        
        <div class="download-buttons">
            <a href="Fotoflo-Sync-Windows.exe" class="download-btn windows">📥 Download for Windows</a>
            <a href="Fotoflo-Sync-macOS.pkg" class="download-btn macos">📥 Download for macOS</a>
            <a href="Fotoflo-Sync-Linux.sh" class="download-btn linux">📥 Download for Linux</a>
        </div>
        
        <div class="features">
            <h3>✨ Features</h3>
            <div class="feature">
                <span class="feature-icon">🔄</span>
                <span>Real-time photo syncing</span>
            </div>
            <div class="feature">
                <span class="feature-icon">📁</span>
                <span>Project-specific folders</span>
            </div>
            <div class="feature">
                <span class="feature-icon">📊</span>
                <span>Full EXIF data preservation</span>
            </div>
            <div class="feature">
                <span class="feature-icon">🛡️</span>
                <span>Duplicate prevention</span>
            </div>
            <div class="feature">
                <span class="feature-icon">🎯</span>
                <span>Works with collections</span>
            </div>
        </div>
        
        <div class="steps">
            <h3>🚀 Getting Started</h3>
            <div class="step">
                <span class="step-number">1</span>
                <span>Download and run the installer for your platform</span>
            </div>
            <div class="step">
                <span class="step-number">2</span>
                <span>The setup wizard will guide you through configuration</span>
            </div>
            <div class="step">
                <span class="step-number">3</span>
                <span>Choose folders to sync to your Fotoflo projects</span>
            </div>
            <div class="step">
                <span class="step-number">4</span>
                <span>Drop photos into folders and watch them sync automatically!</span>
            </div>
        </div>
    </div>
</body>
</html>`;

  writeFileSync(join(installerDir, 'index.html'), downloadPage);

  console.log(chalk.green('✅ Installer files created successfully!'));
  console.log(chalk.blue('📁 Installer files in ./installer/ directory:'));
  console.log(chalk.white('• install-windows.bat - Windows installer'));
  console.log(chalk.white('• install-macos.sh - macOS installer'));
  console.log(chalk.white('• install-linux.sh - Linux installer'));
  console.log(chalk.white('• index.html - Download page'));
  console.log('');
  console.log(chalk.yellow('💡 To create final installers:'));
  console.log(chalk.white('1. Copy the appropriate installer script to your web server'));
  console.log(chalk.white('2. Rename them to have .exe/.pkg/.sh extensions'));
  console.log(chalk.white('3. Users can download and run them directly'));

} catch (error) {
  console.error(chalk.red('❌ Installer creation failed:'), error.message);
  process.exit(1);
}
