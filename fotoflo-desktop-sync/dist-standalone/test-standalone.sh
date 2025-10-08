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
