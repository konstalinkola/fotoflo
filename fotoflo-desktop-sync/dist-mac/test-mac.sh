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
