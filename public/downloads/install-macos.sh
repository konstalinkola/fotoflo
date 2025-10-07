#!/bin/bash

echo "🚀 Installing Fotoflo Desktop Sync for macOS..."
echo ""

# Check if we're running from the Downloads folder
if [ ! -f "Fotoflo-Sync-macOS" ]; then
    echo "❌ Error: Fotoflo-Sync-macOS file not found in current directory"
    echo "💡 Make sure you downloaded both files and are running this from the Downloads folder"
    exit 1
fi

# Create application directory
APP_DIR="/Applications/Fotoflo Sync.app"
echo "📁 Creating application directory: $APP_DIR"

# Remove existing installation if it exists
if [ -d "$APP_DIR" ]; then
    echo "🔄 Removing existing installation..."
    rm -rf "$APP_DIR"
fi

mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Copy the binary
echo "📦 Installing Fotoflo Desktop Sync..."
cp Fotoflo-Sync-macOS "$APP_DIR/Contents/MacOS/fotoflo-sync"
chmod +x "$APP_DIR/Contents/MacOS/fotoflo-sync"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << 'EOF'
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

# Create command line symlink (requires sudo)
echo "🔗 Creating command line access..."
if sudo ln -sf "$APP_DIR/Contents/MacOS/fotoflo-sync" /usr/local/bin/fotoflo-sync 2>/dev/null; then
    echo "✅ Command line access created: fotoflo-sync"
else
    echo "⚠️  Could not create command line access (requires admin password)"
    echo "💡 You can still run the app from Applications folder"
fi

# Create a simple launcher script
cat > "$APP_DIR/Contents/Resources/start-sync.command" << 'EOF'
#!/bin/bash
echo "🚀 Starting Fotoflo Desktop Sync..."
echo "This will open the setup wizard to configure your sync folders."
echo ""
"/Applications/Fotoflo Sync.app/Contents/MacOS/fotoflo-sync" setup
EOF

chmod +x "$APP_DIR/Contents/Resources/start-sync.command"

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 Fotoflo Desktop Sync is now installed!"
echo "📁 Application: /Applications/Fotoflo Sync.app"
echo ""
echo "🚀 Next steps:"
echo "1. Double-click 'Fotoflo Sync.app' in Applications folder to run the setup wizard"
echo "2. Or run 'fotoflo-sync setup' in Terminal (if command line access was created)"
echo "3. Follow the guided setup to add your projects"
echo ""
echo "📖 The setup wizard will guide you through:"
echo "   • Connecting to your Fotoflo server"
echo "   • Selecting projects to sync"
echo "   • Choosing folders to monitor"
echo "   • Starting the sync process"
echo ""
echo "💡 Tip: You can now delete the downloaded files from your Downloads folder"
