#!/bin/bash

# Quick Fix for macOS Security Warning
# Run this script to immediately fix the "Apple ei voinut vahvistaa" error

echo "🛡️  Quick Fix for Fotoflo Sync Security Warning"
echo "==============================================="

# Find and fix the app
find ~/Downloads ~/Desktop . -name "Fotoflo-Sync-macOS*" -type f 2>/dev/null | head -1 | while read app_path; do
    if [ -n "$app_path" ]; then
        echo "🔍 Found: $app_path"
        echo "🔧 Removing security quarantine..."
        
        if xattr -d com.apple.quarantine "$app_path" 2>/dev/null; then
            echo "✅ Fixed! You can now run the app without warnings."
            echo ""
            echo "🎯 To run Fotoflo Sync:"
            echo "   Double-click: $app_path"
        else
            echo "❌ Failed. Try: sudo xattr -d com.apple.quarantine \"$app_path\""
        fi
    fi
done

echo ""
echo "💡 Alternative: Right-click the app → Open"



