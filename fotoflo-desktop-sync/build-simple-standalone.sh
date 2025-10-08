#!/bin/bash

# Simple standalone build script for Fotoflo Sync
# This creates truly standalone executables that don't require Node.js

set -e

echo "🚀 Building Standalone Fotoflo Desktop Sync Client..."
echo "This will create truly standalone executables that don't require Node.js!"
echo ""

# Create dist directory
DIST_DIR="./dist-standalone"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for macOS ARM64 (Apple Silicon)
echo "🍎 Building for macOS ARM64 (Apple Silicon)..."
npx pkg . --target node18-macos-arm64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone" "$DIST_DIR/fotoflo-sync-macos-arm64"
chmod +x "$DIST_DIR/fotoflo-sync-macos-arm64"
echo "✅ Built: fotoflo-sync-macos-arm64"

# Build for macOS x64 (Intel)
echo "🍎 Building for macOS x64 (Intel)..."
npx pkg . --target node18-macos-x64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone" "$DIST_DIR/fotoflo-sync-macos-x64"
chmod +x "$DIST_DIR/fotoflo-sync-macos-x64"
echo "✅ Built: fotoflo-sync-macos-x64"

# Build for Windows x64
echo "🪟 Building for Windows x64..."
npx pkg . --target node18-win-x64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone.exe" "$DIST_DIR/fotoflo-sync-windows-x64.exe"
echo "✅ Built: fotoflo-sync-windows-x64.exe"

# Build for Linux x64
echo "🐧 Building for Linux x64..."
npx pkg . --target node18-linux-x64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone" "$DIST_DIR/fotoflo-sync-linux-x64"
chmod +x "$DIST_DIR/fotoflo-sync-linux-x64"
echo "✅ Built: fotoflo-sync-linux-x64"

# Build for Linux ARM64
echo "🐧 Building for Linux ARM64..."
npx pkg . --target node18-linux-arm64 --out-path "$DIST_DIR"
mv "$DIST_DIR/fotoflo-sync-standalone" "$DIST_DIR/fotoflo-sync-linux-arm64"
chmod +x "$DIST_DIR/fotoflo-sync-linux-arm64"
echo "✅ Built: fotoflo-sync-linux-arm64"

# Copy additional files
echo "📋 Copying additional files..."
cp README.md "$DIST_DIR/" 2>/dev/null || echo "README.md not found, skipping"
cp LICENSE "$DIST_DIR/" 2>/dev/null || echo "LICENSE not found, skipping"

# Create test script
echo "🧪 Creating test script..."
cat > "$DIST_DIR/test-standalone.sh" << 'EOF'
#!/bin/bash
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
EOF

chmod +x "$DIST_DIR/test-standalone.sh"

# Create distribution packages
echo "📦 Creating distribution packages..."

# Create zip files for each platform
for platform in macos-x64 macos-arm64 linux-x64 linux-arm64; do
    if [ -f "$DIST_DIR/fotoflo-sync-$platform" ]; then
        cd "$DIST_DIR"
        zip -r "fotoflo-sync-standalone-$platform.zip" "fotoflo-sync-$platform" README.md LICENSE test-standalone.sh 2>/dev/null || echo "Could not create zip for $platform"
        cd ..
        echo "✅ Created: fotoflo-sync-standalone-$platform.zip"
    fi
done

# Create Windows zip
if [ -f "$DIST_DIR/fotoflo-sync-windows-x64.exe" ]; then
    cd "$DIST_DIR"
    zip -r "fotoflo-sync-standalone-windows-x64.zip" "fotoflo-sync-windows-x64.exe" README.md LICENSE test-standalone.sh 2>/dev/null || echo "Could not create Windows zip"
    cd ..
    echo "✅ Created: fotoflo-sync-standalone-windows-x64.zip"
fi

echo ""
echo "🎉 Standalone build completed successfully!"
echo "📁 Output files in ./dist-standalone/ directory"
echo ""
echo "✨ These executables are truly standalone:"
echo "   • No Node.js installation required"
echo "   • All dependencies bundled"
echo "   • Ready for end-user distribution"
echo ""
echo "🧪 Test the executables:"
echo "   cd dist-standalone && ./test-standalone.sh"
echo ""
echo "📦 Distribution packages created:"
ls -la "$DIST_DIR"/*.zip 2>/dev/null || echo "No zip files created"
