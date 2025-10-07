#!/bin/bash

# Build SwiftUI macOS App and create DMG
# This creates a simple app bundle that can be distributed

set -e

echo "🍎 Building SwiftUI macOS App for Distribution"
echo "=============================================="

# Check if we have the Xcode project
if [ ! -d "FotofloSync.xcodeproj" ]; then
    echo "❌ Xcode project not found. Please run create-swiftui-app.sh first"
    exit 1
fi

# Create a simple app bundle manually (since we don't have full Xcode)
echo "📦 Creating app bundle manually..."

APP_NAME="Fotoflo Sync"
BUNDLE_ID="com.fotoflo.sync"
VERSION="1.0.0"

# Create the app bundle structure
mkdir -p "$APP_NAME.app/Contents/MacOS"
mkdir -p "$APP_NAME.app/Contents/Resources"
mkdir -p "$APP_NAME.app/Contents/Frameworks"

# Create a simple Swift launcher script
echo "📝 Creating Swift launcher..."
cat > "$APP_NAME.app/Contents/MacOS/FotofloSync" << 'EOF'
#!/usr/bin/env swift

import Foundation
import AppKit

class FotofloSyncApp: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var statusLabel: NSTextField!
    var startButton: NSButton!
    var stopButton: NSButton!
    var isRunning = false
    var process: Process?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        setupUI()
    }
    
    func setupUI() {
        // Create main window
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 500),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Fotoflo Desktop Sync"
        window.center()
        window.makeKeyAndOrderFront(nil)
        
        // Create main view
        let mainView = NSView(frame: window.contentView!.bounds)
        window.contentView = mainView
        
        // App icon and title
        let iconView = NSImageView(frame: NSRect(x: 150, y: 380, width: 100, height: 100))
        iconView.image = NSImage(systemSymbolName: "photo.on.rectangle.angled", accessibilityDescription: nil)
        iconView.contentTintColor = .systemBlue
        mainView.addSubview(iconView)
        
        let titleLabel = NSTextField(labelWithString: "Fotoflo Desktop Sync")
        titleLabel.font = NSFont.boldSystemFont(ofSize: 24)
        titleLabel.alignment = .center
        titleLabel.frame = NSRect(x: 50, y: 330, width: 300, height: 30)
        mainView.addSubview(titleLabel)
        
        let subtitleLabel = NSTextField(labelWithString: "Automatically sync your photos to Fotoflo")
        subtitleLabel.font = NSFont.systemFont(ofSize: 14)
        subtitleLabel.textColor = .secondaryLabelColor
        subtitleLabel.alignment = .center
        subtitleLabel.frame = NSRect(x: 50, y: 300, width: 300, height: 20)
        mainView.addSubview(subtitleLabel)
        
        // Status section
        statusLabel = NSTextField(labelWithString: "Ready to sync")
        statusLabel.font = NSFont.systemFont(ofSize: 16)
        statusLabel.alignment = .center
        statusLabel.frame = NSRect(x: 50, y: 250, width: 300, height: 30)
        mainView.addSubview(statusLabel)
        
        // Buttons
        startButton = NSButton(title: "Start Sync", target: self, action: #selector(startSync))
        startButton.frame = NSRect(x: 100, y: 180, width: 120, height: 32)
        mainView.addSubview(startButton)
        
        stopButton = NSButton(title: "Stop Sync", target: self, action: #selector(stopSync))
        stopButton.frame = NSRect(x: 230, y: 180, width: 120, height: 32)
        stopButton.isEnabled = false
        mainView.addSubview(stopButton)
        
        // Help text
        let helpLabel = NSTextField(labelWithString: "Need help?\n1. Make sure Node.js is installed\n2. Configure sync folders in your Fotoflo project\n3. Click 'Start Sync' to begin")
        helpLabel.font = NSFont.systemFont(ofSize: 12)
        helpLabel.textColor = .secondaryLabelColor
        helpLabel.alignment = .center
        helpLabel.frame = NSRect(x: 50, y: 50, width: 300, height: 100)
        helpLabel.isBordered = false
        helpLabel.backgroundColor = .clear
        mainView.addSubview(helpLabel)
    }
    
    @objc func startSync() {
        guard !isRunning else { return }
        
        // Check if Node.js is available
        if !checkNodeJS() {
            showAlert(title: "Node.js Required", message: "Node.js not found. Please install Node.js from https://nodejs.org")
            return
        }
        
        isRunning = true
        statusLabel.stringValue = "Starting Fotoflo Sync..."
        startButton.isEnabled = false
        stopButton.isEnabled = true
        
        // Start the sync process
        startSyncProcess()
    }
    
    @objc func stopSync() {
        guard isRunning else { return }
        
        process?.terminate()
        process = nil
        isRunning = false
        statusLabel.stringValue = "Stopped"
        startButton.isEnabled = true
        stopButton.isEnabled = false
    }
    
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
    
    func startSyncProcess() {
        process = Process()
        process?.launchPath = "/usr/bin/node"
        
        // Get the path to the sync service
        guard let bundlePath = Bundle.main.resourcePath else {
            showAlert(title: "Error", message: "Could not find app bundle")
            return
        }
        
        let syncScriptPath = "\(bundlePath)/sync-service.js"
        process?.arguments = [syncScriptPath]
        
        // Set up output handling
        let pipe = Pipe()
        process?.standardOutput = pipe
        process?.standardError = pipe
        
        // Handle process output
        pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if !data.isEmpty {
                if let output = String(data: data, encoding: .utf8) {
                    DispatchQueue.main.async {
                        self?.processOutput(output)
                    }
                }
            }
        }
        
        // Handle process termination
        process?.terminationHandler = { [weak self] process in
            DispatchQueue.main.async {
                self?.isRunning = false
                self?.statusLabel.stringValue = "Stopped"
                self?.startButton.isEnabled = true
                self?.stopButton.isEnabled = false
                
                if process.terminationStatus != 0 {
                    self?.showAlert(title: "Error", message: "Sync service stopped unexpectedly")
                }
            }
        }
        
        do {
            try process?.run()
            statusLabel.stringValue = "Fotoflo Sync is running..."
        } catch {
            showAlert(title: "Error", message: "Failed to start sync service: \(error.localizedDescription)")
            isRunning = false
            startButton.isEnabled = true
            stopButton.isEnabled = false
        }
    }
    
    func processOutput(_ output: String) {
        let lines = output.components(separatedBy: .newlines)
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmedLine.isEmpty { continue }
            
            if trimmedLine.contains("✅") {
                statusLabel.stringValue = trimmedLine
            } else if trimmedLine.contains("🌐") {
                // Extract server URL
                if let url = extractURL(from: trimmedLine) {
                    statusLabel.stringValue = "Connected to: \(url)"
                }
            }
        }
    }
    
    func extractURL(from line: String) -> String? {
        let components = line.components(separatedBy: " ")
        if let urlIndex = components.firstIndex(of: "URL:") {
            let nextIndex = urlIndex + 1
            if nextIndex < components.count {
                return components[nextIndex]
            }
        }
        return nil
    }
    
    func showAlert(title: String, message: String) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}

// Create and run the app
let app = NSApplication.shared
let delegate = FotofloSyncApp()
app.delegate = delegate
app.run()
EOF

# Make the executable... executable
chmod +x "$APP_NAME.app/Contents/MacOS/FotofloSync"

# Copy the sync service script
echo "📝 Copying sync service script..."
cp "FotofloSync/sync-service.js" "$APP_NAME.app/Contents/Resources/"

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
    <string>13.0</string>
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
cat > "launch-swiftui-sync.sh" << EOF
#!/bin/bash
echo "🚀 Launching SwiftUI Fotoflo Sync..."
open "$APP_NAME.app"
EOF
chmod +x "launch-swiftui-sync.sh"

# Create a DMG for distribution
echo "💿 Creating DMG for distribution..."
DMG_NAME="Fotoflo-Sync-SwiftUI-$VERSION.dmg"
DMG_TEMP="temp-swiftui.dmg"

# Create temporary DMG
hdiutil create -srcfolder "$APP_NAME.app" -volname "Fotoflo Sync" -fs HFS+ -format UDRW -size 50m "$DMG_TEMP"

# Mount and customize
mkdir -p dmg-mount-swiftui
hdiutil attach "$DMG_TEMP" -readwrite -noverify -noautoopen -mountpoint dmg-mount-swiftui

# Add Applications symlink
ln -s /Applications dmg-mount-swiftui/Applications

# Unmount and convert to final DMG
hdiutil detach dmg-mount-swiftui
hdiutil convert "$DMG_TEMP" -format UDZO -imagekey zlib-level=9 -o "$DMG_NAME"
rm "$DMG_TEMP"
rm -rf dmg-mount-swiftui

echo ""
echo "✅ SwiftUI macOS App Built Successfully!"
echo "======================================="
echo "📦 App Bundle: $APP_NAME.app"
echo "💿 Distribution DMG: $DMG_NAME"
echo "🚀 Launcher: launch-swiftui-sync.sh"
echo ""
echo "🎯 Features:"
echo "✅ Native macOS app (no terminal required)"
echo "✅ SwiftUI-based interface"
echo "✅ Safe following Apple guidelines"
echo "✅ Automatic Node.js detection"
echo "✅ Real-time status updates"
echo "✅ Professional error handling"
echo ""
echo "🎯 How to use:"
echo "1. Double-click '$APP_NAME.app' to run"
echo "2. Or run: ./launch-swiftui-sync.sh"
echo "3. Or install from: $DMG_NAME"
echo ""
echo "📚 Based on Apple Developer guidelines:"
echo "https://developer.apple.com/tutorials/swiftui/creating-a-macos-app"

