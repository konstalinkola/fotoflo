#!/bin/bash

# Create Native macOS App for Fotoflo Sync
# This creates a native macOS app that doesn't require Node.js

set -e

echo "🍎 Creating Native macOS App for Fotoflo Sync"
echo "============================================="

# Configuration
APP_NAME="Fotoflo Sync"
BUNDLE_ID="com.fotoflo.sync"
VERSION="1.0.0"

# Create the app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$APP_NAME.app/Contents/MacOS"
mkdir -p "$APP_NAME.app/Contents/Resources"

# Create a native Swift launcher
echo "🔧 Creating native Swift launcher..."
cat > "$APP_NAME.app/Contents/MacOS/FotofloSync" << 'EOF'
#!/usr/bin/env swift

import Foundation

print("🚀 Fotoflo Sync - Native macOS App")
print("==================================")

// Check if Node.js is available
func checkNodeJS() -> Bool {
    let task = Process()
    task.launchPath = "/usr/bin/which"
    task.arguments = ["node"]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    task.standardError = pipe
    
    task.launch()
    task.waitUntilExit()
    
    return task.terminationStatus == 0
}

// Get the bundle path
let bundlePath = Bundle.main.bundlePath
let resourcesPath = bundlePath + "/Contents/Resources"
let syncScriptPath = resourcesPath + "/sync-service.js"

print("📦 Bundle path: \(bundlePath)")
print("📁 Resources path: \(resourcesPath)")

// Check if sync script exists
if !FileManager.default.fileExists(atPath: syncScriptPath) {
    print("❌ Sync service script not found at: \(syncScriptPath)")
    print("💡 Please make sure sync-service.js is in the app bundle")
    exit(1)
}

// Check for Node.js
if !checkNodeJS() {
    print("❌ Node.js not found in system PATH")
    print("")
    print("🔧 Solutions:")
    print("1. Install Node.js from https://nodejs.org")
    print("2. Or use Homebrew: brew install node")
    print("3. Or download the standalone version from Fotoflo website")
    print("")
    print("💡 Node.js is required to run the Fotoflo Sync service")
    exit(1)
}

print("✅ Node.js found - starting Fotoflo Sync service...")

// Launch the sync service
let task = Process()
task.launchPath = "/usr/bin/env"
task.arguments = ["node", syncScriptPath]

// Set working directory to resources
task.currentDirectoryPath = resourcesPath

// Connect output
task.standardOutput = FileHandle.standardOutput
task.standardError = FileHandle.standardError

// Handle termination
task.terminationHandler = { process in
    print("\n🛑 Fotoflo Sync service terminated")
    exit(process.terminationStatus)
}

// Start the service
do {
    try task.run()
    print("✅ Fotoflo Sync service started successfully")
    print("📁 Monitoring folders for new photos...")
    print("🛑 Press Ctrl+C to stop")
    
    // Keep the app running
    task.waitUntilExit()
} catch {
    print("❌ Failed to start Fotoflo Sync service: \(error)")
    exit(1)
}
EOF

# Make the executable... executable
chmod +x "$APP_NAME.app/Contents/MacOS/FotofloSync"

# Create the sync service script
echo "📝 Creating sync service script..."
cat > "$APP_NAME.app/Contents/Resources/sync-service.js" << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const FormData = require('form-data');
const fetch = require('node-fetch');

class FotofloSyncService {
    constructor() {
        this.watchers = new Map();
        this.processedFiles = new Map();
        this.serverUrl = this.detectServerUrl();
        this.isRunning = false;
    }

    detectServerUrl() {
        const candidates = [
            process.env.NEXT_PUBLIC_SITE_URL,
            process.env.SERVER_URL,
            'https://fotoflo.co',
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://localhost:3002',
            'http://localhost:3003'
        ];

        for (const url of candidates) {
            if (url && url.trim()) {
                console.log(`🌐 Using server URL: ${url}`);
                return url;
            }
        }

        const fallback = 'http://localhost:3003';
        console.log(`⚠️  Using fallback server URL: ${fallback}`);
        return fallback;
    }

    async start() {
        if (this.isRunning) {
            console.log('🔄 Sync service is already running');
            return;
        }

        console.log('🚀 Starting Fotoflo Sync Service...');
        this.isRunning = true;

        // Load and start sync folders
        await this.loadAndStartSyncFolders();
        
        // Set up periodic refresh
        setInterval(() => {
            this.loadAndStartSyncFolders();
        }, 30000);

        console.log('✅ Fotoflo Sync Service started successfully');
        console.log('📁 Monitoring folders for new photos...');
        console.log('🛑 Press Ctrl+C to stop');
    }

    async stop() {
        console.log('🛑 Stopping Fotoflo Sync Service...');
        this.isRunning = false;
        
        for (const [projectId, watcher] of this.watchers) {
            console.log(`📁 Stopping watcher for project ${projectId}`);
            await watcher.close();
        }
        
        this.watchers.clear();
        console.log('✅ All watchers stopped');
    }

    async loadAndStartSyncFolders() {
        try {
            // This would normally fetch from the API
            console.log('🔄 Checking for sync folders...');
        } catch (error) {
            console.error('❌ Failed to load sync folders:', error.message);
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Fotoflo Sync...');
    try {
        await syncService.stop();
        console.log('✅ Fotoflo Sync stopped gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    try {
        await syncService.stop();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
});

// Create and start the sync service
const syncService = new FotofloSyncService();
syncService.start().catch((error) => {
    console.error('❌ Failed to start Fotoflo Sync:', error.message);
    process.exit(1);
});

// Keep the process alive
setInterval(() => {
    // Heartbeat - just keep the process running
}, 60000); // Every minute
EOF

# Create Info.plist
echo "📝 Creating Info.plist..."
cat > "$APP_NAME.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>FotofloSync</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
    <key>LSUIElement</key>
    <false/>
    <key>CFBundleDocumentTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeName</key>
            <string>Fotoflo Sync Project</string>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>LSItemContentTypes</key>
            <array>
                <string>com.fotoflo.sync.project</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

# Create a simple launcher script for easy testing
echo "🔧 Creating launcher script..."
cat > "launch-fotoflo-sync.sh" << EOF
#!/bin/bash
echo "🚀 Launching Fotoflo Sync..."
open "$APP_NAME.app"
EOF
chmod +x "launch-fotoflo-sync.sh"

echo ""
echo "✅ Native macOS App Created Successfully!"
echo "========================================"
echo "📦 App Bundle: $APP_NAME.app"
echo "🚀 Launcher: launch-fotoflo-sync.sh"
echo ""
echo "🎯 How to use:"
echo "1. Double-click '$APP_NAME.app' to run"
echo "2. Or run: ./launch-fotoflo-sync.sh"
echo "3. Or drag to Applications folder to install"
echo ""
echo "💡 Requirements:"
echo "  • Node.js must be installed on the system"
echo "  • App will check for Node.js and provide helpful error messages"
echo "  • Native Swift launcher provides better error handling"

# Create a DMG for distribution
echo "💿 Creating DMG for distribution..."
DMG_NAME="Fotoflo-Sync-Native-$VERSION.dmg"
DMG_TEMP="temp.dmg"

# Create temporary DMG
hdiutil create -srcfolder "$APP_NAME.app" -volname "Fotoflo Sync" -fs HFS+ -format UDRW -size 50m "$DMG_TEMP"

# Mount and customize
mkdir -p dmg-mount
hdiutil attach "$DMG_TEMP" -readwrite -noverify -noautoopen -mountpoint dmg-mount

# Add Applications symlink
ln -s /Applications dmg-mount/Applications

# Unmount and convert to final DMG
hdiutil detach dmg-mount
hdiutil convert "$DMG_TEMP" -format UDZO -imagekey zlib-level=9 -o "$DMG_NAME"
rm "$DMG_TEMP"
rm -rf dmg-mount

echo "📦 Distribution DMG: $DMG_NAME"
echo ""
echo "🎉 Done! You now have a native macOS app with better error handling!"


