#!/bin/bash

# Fotoflo Sync - macOS Security Fix
# This script removes the quarantine attribute from the Fotoflo Sync app

echo "🛡️  Fixing macOS Security Warning for Fotoflo Sync"
echo "=================================================="

# Find the Fotoflo Sync app
APP_PATH=""

# Common locations to check
POSSIBLE_PATHS=(
    "./Fotoflo-Sync-macOS"
    "../Fotoflo-Sync-macOS"
    "~/Downloads/Fotoflo-Sync-macOS"
    "~/Desktop/Fotoflo-Sync-macOS"
    "/Applications/Fotoflo Sync.app"
)

echo "🔍 Looking for Fotoflo Sync app..."

for path in "${POSSIBLE_PATHS[@]}"; do
    expanded_path=$(eval echo "$path")
    if [ -f "$expanded_path" ] || [ -d "$expanded_path" ]; then
        APP_PATH="$expanded_path"
        echo "✅ Found: $APP_PATH"
        break
    fi
done

# If not found, ask user to specify
if [ -z "$APP_PATH" ]; then
    echo "❌ Fotoflo Sync app not found in common locations"
    echo ""
    echo "Please specify the path to your Fotoflo-Sync-macOS file:"
    read -p "Path: " user_path
    
    # Expand user input (handle ~ and relative paths)
    expanded_user_path=$(eval echo "$user_path")
    
    if [ -f "$expanded_user_path" ] || [ -d "$expanded_user_path" ]; then
        APP_PATH="$expanded_user_path"
        echo "✅ Found: $APP_PATH"
    else
        echo "❌ File not found: $expanded_user_path"
        echo ""
        echo "Please make sure the file exists and try again."
        exit 1
    fi
fi

# Check if the file has quarantine attributes
echo "🔍 Checking quarantine status..."

if xattr -l "$APP_PATH" | grep -q "com.apple.quarantine"; then
    echo "⚠️  Quarantine attribute found - this is causing the security warning"
    
    # Remove quarantine attribute
    echo "🔧 Removing quarantine attribute..."
    
    if xattr -d com.apple.quarantine "$APP_PATH" 2>/dev/null; then
        echo "✅ Quarantine attribute removed successfully!"
        echo ""
        echo "🎉 The security warning should no longer appear."
        echo "You can now double-click the app to run it normally."
    else
        echo "❌ Failed to remove quarantine attribute"
        echo ""
        echo "This might be because:"
        echo "• You don't have permission to modify the file"
        echo "• The file is in a protected location"
        echo ""
        echo "Try running this script with sudo:"
        echo "sudo ./fix-macos-security.sh"
        exit 1
    fi
else
    echo "✅ No quarantine attribute found"
    echo "The security warning might be caused by something else."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Try double-clicking the Fotoflo Sync app"
echo "2. If you still see a warning, right-click and select 'Open'"
echo "3. The app should now run without issues"

echo ""
echo "🆘 Still having problems?"
echo "• Email: support@fotoflo.com"
echo "• Check: https://fotoflo.com/help/desktop-sync"



