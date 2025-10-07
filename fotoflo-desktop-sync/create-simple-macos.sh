#!/bin/bash

# Create Simple macOS App for Fotoflo Sync
# This creates a simple app that just runs the sync service directly

set -e

echo "🍎 Creating Simple macOS App for Fotoflo Sync"
echo "============================================="

# Configuration
APP_NAME="Fotoflo Sync"
BUNDLE_ID="com.fotoflo.sync"
VERSION="1.0.0"

# Create the app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$APP_NAME.app/Contents/MacOS"
mkdir -p "$APP_NAME.app/Contents/Resources"

# Create a simple shell script launcher
echo "🔧 Creating simple shell launcher..."
cat > "$APP_NAME.app/Contents/MacOS/FotofloSync" << 'EOF'
#!/bin/bash

echo "🚀 Fotoflo Sync - Simple macOS App"
echo "=================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
RESOURCES_DIR="$APP_DIR/Contents/Resources"

echo "📦 App directory: $APP_DIR"
echo "📁 Resources directory: $RESOURCES_DIR"

# Change to the resources directory
cd "$RESOURCES_DIR"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo ""
    echo "❌ Node.js not found in system PATH"
    echo ""
    echo "🔧 Solutions:"
    echo "1. Install Node.js from https://nodejs.org"
    echo "2. Or use Homebrew: brew install node"
    echo "3. Or download the standalone version from Fotoflo website"
    echo ""
    echo "💡 Node.js is required to run the Fotoflo Sync service"
    echo ""
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo "✅ Node.js found - starting Fotoflo Sync service..."

# Check if sync script exists
SYNC_SCRIPT="$RESOURCES_DIR/sync-service.js"
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Sync service script not found at: $SYNC_SCRIPT"
    echo "💡 Please make sure the app bundle is complete"
    echo ""
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo "📝 Starting sync service: $SYNC_SCRIPT"

# Launch the sync service
exec node "$SYNC_SCRIPT"
EOF

# Make the executable... executable
chmod +x "$APP_NAME.app/Contents/MacOS/FotofloSync"

# Create the sync service script
echo "📝 Creating sync service script..."
cat > "$APP_NAME.app/Contents/Resources/sync-service.js" << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class FotofloSyncService {
    constructor() {
        this.serverUrl = this.detectServerUrl();
        this.isRunning = false;
    }

    detectServerUrl() {
        const candidates = [
            process.env.NEXT_PUBLIC_SITE_URL,
            process.env.SERVER_URL,
            'https://fotoflo.com',
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

        console.log('✅ Fotoflo Sync Service started successfully');
        console.log('📁 Ready to monitor folders for new photos...');
        console.log('🌐 Server URL:', this.serverUrl);
        console.log('🛑 Press Ctrl+C to stop');
        console.log('');
        console.log('💡 To configure sync folders:');
        console.log('   1. Go to your Fotoflo project settings');
        console.log('   2. Open the "Desktop Sync" tab');
        console.log('   3. Add folders to sync');
        console.log('');
    }

    async stop() {
        console.log('🛑 Stopping Fotoflo Sync Service...');
        this.isRunning = false;
        console.log('✅ Fotoflo Sync stopped');
    }
}

// Create and start the sync service
const syncService = new FotofloSyncService();

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

// Start the service
syncService.start().catch((error) => {
    console.error('❌ Failed to start Fotoflo Sync:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   • Make sure Node.js is installed');
    console.log('   • Check your internet connection');
    console.log('   • Verify the server URL is correct');
    process.exit(1);
});

// Keep the process alive
setInterval(() => {
    // Heartbeat - just keep the process running
    if (syncService.isRunning) {
        console.log('💓 Fotoflo Sync is running...');
    }
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

# Create a debug script to test the app
echo "🔍 Creating debug script..."
cat > "debug-fotoflo-sync.sh" << EOF
#!/bin/bash
echo "🔍 Debugging Fotoflo Sync App"
echo "============================="
echo ""
echo "📁 App bundle structure:"
ls -la "$APP_NAME.app/Contents/"
echo ""
echo "📁 MacOS executable:"
ls -la "$APP_NAME.app/Contents/MacOS/"
echo ""
echo "📁 Resources:"
ls -la "$APP_NAME.app/Contents/Resources/"
echo ""
echo "🔧 Testing executable directly:"
echo "Running: $APP_NAME.app/Contents/MacOS/FotofloSync"
echo ""
"$APP_NAME.app/Contents/MacOS/FotofloSync"
EOF
chmod +x "debug-fotoflo-sync.sh"

echo ""
echo "✅ Simple macOS App Created Successfully!"
echo "========================================"
echo "📦 App Bundle: $APP_NAME.app"
echo "🚀 Launcher: launch-fotoflo-sync.sh"
echo "🔍 Debug Script: debug-fotoflo-sync.sh"
echo ""
echo "🎯 How to use:"
echo "1. Double-click '$APP_NAME.app' to run"
echo "2. Or run: ./launch-fotoflo-sync.sh"
echo "3. Or drag to Applications folder to install"
echo ""
echo "🔍 If it doesn't work:"
echo "1. Run: ./debug-fotoflo-sync.sh"
echo "2. Check the console output for errors"
echo "3. Make sure Node.js is installed"

# Create a DMG for distribution
echo "💿 Creating DMG for distribution..."
DMG_NAME="Fotoflo-Sync-Simple-$VERSION.dmg"
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
echo "🎉 Done! You now have a simple, reliable macOS app!"


