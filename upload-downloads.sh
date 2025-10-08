#!/bin/bash

# Upload script for Fotoflo Desktop Sync downloads
# This script helps upload the Mac distribution files to your server

echo "🚀 Fotoflo Desktop Sync - Upload Script"
echo "======================================"
echo ""

# Check if files exist
if [ ! -f "public/downloads/fotoflo-sync-macos-arm64.zip" ]; then
    echo "❌ Apple Silicon version not found!"
    echo "   Expected: public/downloads/fotoflo-sync-macos-arm64.zip"
    exit 1
fi

if [ ! -f "public/downloads/fotoflo-sync-macos-x64.zip" ]; then
    echo "❌ Intel version not found!"
    echo "   Expected: public/downloads/fotoflo-sync-macos-x64.zip"
    exit 1
fi

echo "✅ Found distribution files:"
echo "   • fotoflo-sync-macos-arm64.zip ($(du -h public/downloads/fotoflo-sync-macos-arm64.zip | cut -f1))"
echo "   • fotoflo-sync-macos-x64.zip ($(du -h public/downloads/fotoflo-sync-macos-x64.zip | cut -f1))"
echo ""

echo "📋 Next steps to make downloads available:"
echo ""
echo "1. Upload files to your server's public directory:"
echo "   scp public/downloads/fotoflo-sync-macos-arm64.zip user@your-server:/path/to/public/downloads/"
echo "   scp public/downloads/fotoflo-sync-macos-x64.zip user@your-server:/path/to/public/downloads/"
echo ""
echo "2. Or if using a CDN/static hosting:"
echo "   • Upload both .zip files to your static file hosting"
echo "   • Make sure they're accessible at:"
echo "     - https://fotoflo.co/downloads/fotoflo-sync-macos-arm64.zip"
echo "     - https://fotoflo.co/downloads/fotoflo-sync-macos-x64.zip"
echo ""
echo "3. Test the downloads:"
echo "   • Visit your Desktop Sync page"
echo "   • Click the download buttons"
echo "   • Verify the files download correctly"
echo ""
echo "🎉 The Desktop Sync page is already updated to use these new files!"
echo "   Users will now get standalone executables that don't require Node.js."
echo ""
echo "📝 File details:"
echo "   • Apple Silicon (M1/M2/M3): fotoflo-sync-macos-arm64.zip"
echo "   • Intel Macs: fotoflo-sync-macos-x64.zip"
echo "   • Both are ~20MB standalone executables"
echo "   • Updated to use fotoflo.co domain"
echo "   • No Node.js installation required"
