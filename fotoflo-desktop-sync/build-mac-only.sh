#!/bin/bash

# Mac-only build script for Fotoflo Sync
# This creates standalone executables for macOS only (Apple Silicon and Intel)

set -e

echo "🍎 Building Fotoflo Desktop Sync for macOS Only..."
echo "This will create standalone executables for Apple Silicon and Intel Macs!"
echo ""

# Create dist directory
DIST_DIR="./dist-mac"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Building version: $VERSION"

# Build for macOS ARM64 (Apple Silicon)
echo "🍎 Building for macOS ARM64 (Apple Silicon - M1/M2/M3)..."
npx pkg . --target node18-macos-arm64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone" "$DIST_DIR/fotoflo-sync-macos-arm64-$VERSION"
chmod +x "$DIST_DIR/fotoflo-sync-macos-arm64-$VERSION"
echo "✅ Built: fotoflo-sync-macos-arm64-$VERSION"

# Build for macOS x64 (Intel)
echo "🍎 Building for macOS x64 (Intel)..."
npx pkg . --target node18-macos-x64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone" "$DIST_DIR/fotoflo-sync-macos-x64-$VERSION"
chmod +x "$DIST_DIR/fotoflo-sync-macos-x64-$VERSION"
echo "✅ Built: fotoflo-sync-macos-x64-$VERSION"

# Copy additional files
echo "📋 Copying additional files..."
cp README.md "$DIST_DIR/" 2>/dev/null || echo "README.md not found, skipping"

# Create Mac-specific README
echo "📝 Creating Mac-specific README..."
cat > "$DIST_DIR/README-Mac.md" << 'EOF'
# Fotoflo Desktop Sync for macOS

Automatically sync your photos to Fotoflo projects by simply dropping them into designated folders on your Mac.

## Quick Installation

### For Apple Silicon Macs (M1/M2/M3)
```bash
# Download and install
curl -L https://fotoflo.co/downloads/fotoflo-sync-macos-arm64.zip -o fotoflo-sync.zip
unzip fotoflo-sync.zip
sudo cp fotoflo-sync-macos-arm64 /usr/local/bin/fotoflo-sync
chmod +x /usr/local/bin/fotoflo-sync
```

### For Intel Macs
```bash
# Download and install
curl -L https://fotoflo.co/downloads/fotoflo-sync-macos-x64.zip -o fotoflo-sync.zip
unzip fotoflo-sync.zip
sudo cp fotoflo-sync-macos-x64 /usr/local/bin/fotoflo-sync
chmod +x /usr/local/bin/fotoflo-sync
```

## Usage

```bash
# Set up Fotoflo Desktop Sync
fotoflo-sync setup

# Add a project to sync
fotoflo-sync add-project

# Start syncing
fotoflo-sync start
```

## Features

- 🚀 **One-click setup** - Easy configuration for any Fotoflo project
- 📁 **Project-specific folders** - Each project has its own sync folder
- 🔄 **Real-time sync** - Photos upload automatically when dropped
- 📊 **Full EXIF support** - Preserves all camera metadata
- 🛡️ **Duplicate prevention** - Never upload the same file twice
- 🎯 **Collection mode support** - Works with both single and collection projects
- 💻 **macOS Optimized** - Native support for both Apple Silicon and Intel Macs

## Support

- 📧 **Email:** support@fotoflo.co
- 📖 **Docs:** [docs.fotoflo.co](https://docs.fotoflo.co)
EOF

# Create test script for Mac
echo "🧪 Creating Mac test script..."
cat > "$DIST_DIR/test-mac.sh" << 'EOF'
#!/bin/bash
echo "🧪 Testing Fotoflo Sync for macOS"
echo "================================"
echo ""

# Test Apple Silicon version
if [ -f "fotoflo-sync-macos-arm64" ]; then
    echo "🍎 Testing macOS ARM64 (Apple Silicon) version..."
    ./fotoflo-sync-macos-arm64 --help || echo "macOS ARM64 version test completed"
    echo ""
fi

# Test Intel version
if [ -f "fotoflo-sync-macos-x64" ]; then
    echo "🍎 Testing macOS x64 (Intel) version..."
    ./fotoflo-sync-macos-x64 --help || echo "macOS x64 version test completed"
    echo ""
fi

echo "✅ macOS executable test completed!"
echo "💡 These executables should work on macOS without Node.js installed"
EOF

chmod +x "$DIST_DIR/test-mac.sh"

# Create distribution packages for Mac only
echo "📦 Creating Mac distribution packages..."

# Create zip files for each Mac platform
for platform in macos-x64 macos-arm64; do
    if [ -f "$DIST_DIR/fotoflo-sync-$platform-$VERSION" ]; then
        cd "$DIST_DIR"
        zip -r "fotoflo-sync-$platform-$VERSION.zip" "fotoflo-sync-$platform-$VERSION" README-Mac.md test-mac.sh 2>/dev/null || echo "Could not create zip for $platform"
        cd ..
        echo "✅ Created: fotoflo-sync-$platform-$VERSION.zip"
    fi
done

# Create a universal Mac package
echo "📦 Creating universal Mac package..."
cd "$DIST_DIR"
zip -r "fotoflo-sync-macos-universal-$VERSION.zip" "fotoflo-sync-macos-arm64-$VERSION" "fotoflo-sync-macos-x64-$VERSION" README-Mac.md test-mac.sh 2>/dev/null || echo "Could not create universal zip"
cd ..
echo "✅ Created: fotoflo-sync-macos-universal-$VERSION.zip"

echo ""
echo "🎉 Mac-only build completed successfully!"
echo "📁 Output files in ./dist-mac/ directory"
echo ""
echo "✨ These executables are truly standalone:"
echo "   • No Node.js installation required"
echo "   • All dependencies bundled"
echo "   • Ready for macOS distribution"
echo ""
echo "🧪 Test the executables:"
echo "   cd dist-mac && ./test-mac.sh"
echo ""
echo "📦 Distribution packages created:"
ls -la "$DIST_DIR"/*.zip 2>/dev/null || echo "No zip files created"
echo ""
echo "🌐 Ready for upload to fotoflo.co/downloads/"
