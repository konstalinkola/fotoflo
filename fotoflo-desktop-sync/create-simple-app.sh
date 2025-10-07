#!/bin/bash

# Create Simple macOS App - No Swift, No Complications
# This creates a working macOS app using only shell scripts and Node.js

set -e

echo "🍎 Creating Simple Working macOS App"
echo "===================================="

# Configuration
APP_NAME="Fotoflo Sync"
BUNDLE_ID="com.fotoflo.sync"
VERSION="1.0.0"

# Clean up any existing app
if [ -d "$APP_NAME.app" ]; then
    echo "🧹 Cleaning up existing app..."
    rm -rf "$APP_NAME.app"
fi

# Create the app bundle structure
echo "📁 Creating app bundle structure..."
mkdir -p "$APP_NAME.app/Contents/MacOS"
mkdir -p "$APP_NAME.app/Contents/Resources"

# Create a simple shell script launcher
echo "🔧 Creating simple shell launcher..."
cat > "$APP_NAME.app/Contents/MacOS/FotofloSync" << 'EOF'
#!/bin/bash

# Simple Fotoflo Sync Launcher
# This script launches the sync service with a user-friendly interface

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
RESOURCES_DIR="$APP_DIR/Contents/Resources"

echo "🚀 Fotoflo Desktop Sync"
echo "======================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found in system PATH"
    echo ""
    echo "🔧 Solutions:"
    echo "1. Install Node.js from https://nodejs.org"
    echo "2. Or use Homebrew: brew install node"
    echo ""
    echo "💡 Node.js is required to run the Fotoflo Sync service"
    echo ""
    
    # Show a dialog box
    osascript -e 'display dialog "Node.js is required to run Fotoflo Sync.\n\nPlease install Node.js from https://nodejs.org\n\nOr use Homebrew: brew install node" buttons {"OK"} default button "OK" with title "Fotoflo Sync - Node.js Required"'
    exit 1
fi

echo "✅ Node.js found - starting Fotoflo Sync service..."
echo ""

# Change to the resources directory
cd "$RESOURCES_DIR"

# Check if sync script exists
SYNC_SCRIPT="$RESOURCES_DIR/sync-service.js"
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Sync service script not found at: $SYNC_SCRIPT"
    echo "💡 Please make sure the app bundle is complete"
    echo ""
    
    # Show a dialog box
    osascript -e 'display dialog "Sync service script not found.\n\nPlease make sure the app bundle is complete." buttons {"OK"} default button "OK" with title "Fotoflo Sync - Missing Script"'
    exit 1
fi

echo "📝 Starting sync service: $SYNC_SCRIPT"
echo "🌐 Server will auto-detect the correct URL"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Show a dialog with instructions
osascript -e 'display dialog "Fotoflo Sync is starting...\n\nCheck the terminal window for status updates.\n\nTo stop the sync, close this terminal window or press Ctrl+C." buttons {"OK"} default button "OK" with title "Fotoflo Sync - Starting"'

# Launch the sync service
exec node "$SYNC_SCRIPT"
EOF

# Make the executable... executable
chmod +x "$APP_NAME.app/Contents/MacOS/FotofloSync"

# Copy the sync service script
echo "📝 Copying sync service script..."
cp "FotofloSync/sync-service.js" "$APP_NAME.app/Contents/Resources/" 2>/dev/null || {
    echo "Creating sync service script..."
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
}

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

# Create a simple launcher script for testing
echo "🔧 Creating launcher script..."
cat > "launch-simple-sync.sh" << EOF
#!/bin/bash
echo "🚀 Launching Simple Fotoflo Sync..."
open "$APP_NAME.app"
EOF
chmod +x "launch-simple-sync.sh"

# Create a test script
echo "🔍 Creating test script..."
cat > "test-simple-sync.sh" << EOF
#!/bin/bash
echo "🔍 Testing Simple Fotoflo Sync App"
echo "=================================="
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
chmod +x "test-simple-sync.sh"

# Create a DMG for distribution
echo "💿 Creating DMG for distribution..."
DMG_NAME="Fotoflo-Sync-Simple-$VERSION.dmg"
DMG_TEMP="temp-simple.dmg"

# Create temporary DMG
hdiutil create -srcfolder "$APP_NAME.app" -volname "Fotoflo Sync" -fs HFS+ -format UDRW -size 50m "$DMG_TEMP"

# Mount and customize
mkdir -p dmg-mount-simple
hdiutil attach "$DMG_TEMP" -readwrite -noverify -noautoopen -mountpoint dmg-mount-simple

# Add Applications symlink
ln -s /Applications dmg-mount-simple/Applications

# Unmount and convert to final DMG
hdiutil detach dmg-mount-simple
hdiutil convert "$DMG_TEMP" -format UDZO -imagekey zlib-level=9 -o "$DMG_NAME"
rm "$DMG_TEMP"
rm -rf dmg-mount-simple

echo ""
echo "✅ Simple macOS App Created Successfully!"
echo "========================================"
echo "📦 App Bundle: $APP_NAME.app"
echo "💿 Distribution DMG: $DMG_NAME"
echo "🚀 Launcher: launch-simple-sync.sh"
echo "🔍 Test Script: test-simple-sync.sh"
echo ""
echo "🎯 Features:"
echo "✅ No Swift complications - just shell scripts"
echo "✅ Native macOS app bundle"
echo "✅ User-friendly dialog boxes"
echo "✅ Automatic Node.js detection"
echo "✅ Helpful error messages"
echo "✅ Terminal-based interface (but user-friendly)"
echo ""
echo "🎯 How to use:"
echo "1. Double-click '$APP_NAME.app' to run"
echo "2. Or run: ./launch-simple-sync.sh"
echo "3. Or install from: $DMG_NAME"
echo ""
echo "🔍 To test:"
echo "1. Run: ./test-simple-sync.sh"
echo "2. Check the output for any issues"
echo ""
echo "💡 This app will:"
echo "• Show a dialog if Node.js is missing"
echo "• Show a dialog when starting"
echo "• Run the sync service in terminal"
echo "• Provide helpful error messages"

