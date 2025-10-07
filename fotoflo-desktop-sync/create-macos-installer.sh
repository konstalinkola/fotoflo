#!/bin/bash

# Create a proper macOS installer package

echo "🍎 Creating macOS installer package..."

# Create temporary directory for package contents
PKG_DIR="Fotoflo-Sync-Package"
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR"

# Copy the binary
cp final-installers/Fotoflo-Sync-macOS "$PKG_DIR/fotoflo-sync"

# Create the installer script
cat > "$PKG_DIR/install.sh" << 'EOF'
#!/bin/bash

echo "🚀 Installing Fotoflo Desktop Sync..."

# Create application directory
APP_DIR="/Applications/Fotoflo Sync.app"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Copy the binary
cp fotoflo-sync "$APP_DIR/Contents/MacOS/fotoflo-sync"
chmod +x "$APP_DIR/Contents/MacOS/fotoflo-sync"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << 'PLIST_EOF'
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
PLIST_EOF

# Create symbolic link for command line access
sudo ln -sf "$APP_DIR/Contents/MacOS/fotoflo-sync" /usr/local/bin/fotoflo-sync

# Create desktop shortcut
cat > "/Applications/Fotoflo Sync.app/Contents/Resources/start-sync.command" << 'SHORTCUT_EOF'
#!/bin/bash
echo "🚀 Starting Fotoflo Desktop Sync..."
echo "This will open the setup wizard to configure your sync folders."
echo ""
"/Applications/Fotoflo Sync.app/Contents/MacOS/fotoflo-sync" setup
SHORTCUT_EOF

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
EOF

chmod +x "$PKG_DIR/install.sh"

# Create a simple wrapper that runs the installer
cat > "Fotoflo-Sync-macOS.pkg" << 'WRAPPER_EOF'
#!/bin/bash

# Extract and run the installer
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Find the installer script in the same directory as this file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR/Fotoflo-Sync-Package"/* .

# Run the installer
./install.sh

# Cleanup
cd /
rm -rf "$TEMP_DIR"
WRAPPER_EOF

chmod +x "Fotoflo-Sync-macOS.pkg"

echo "✅ macOS installer package created: Fotoflo-Sync-macOS.pkg"
echo "📁 Package contents: $PKG_DIR/"
echo "🚀 Users can now download and run Fotoflo-Sync-macOS.pkg"
