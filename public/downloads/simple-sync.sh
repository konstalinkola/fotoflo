#!/bin/bash

echo "🚀 Fotoflo Desktop Sync - Simple Version"
echo "========================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found in system PATH"
    echo ""
    echo "🔧 Solutions:"
    echo "1. Install Node.js from https://nodejs.org"
    echo "2. Or use Homebrew: brew install node"
    echo ""
    echo "💡 Node.js is required to run the Fotoflo Sync service"
    exit 1
fi

echo "✅ Node.js found - starting Fotoflo Sync service..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Try different possible locations for the sync service
SYNC_SERVICE=""
if [ -f "$SCRIPT_DIR/sync-service.js" ]; then
    SYNC_SERVICE="$SCRIPT_DIR/sync-service.js"
elif [ -f "$SCRIPT_DIR/../src/services/sync-service.js" ]; then
    SYNC_SERVICE="$SCRIPT_DIR/../src/services/sync-service.js"
else
    echo "❌ Sync service script not found"
    echo "💡 Please make sure you're running this from the correct directory"
    exit 1
fi

# Check if sync service exists
if [ ! -f "$SYNC_SERVICE" ]; then
    echo "❌ Sync service script not found at: $SYNC_SERVICE"
    echo "💡 Please make sure you're running this from the correct directory"
    exit 1
fi

echo "📝 Starting sync service: $SYNC_SERVICE"
echo "🌐 Server will auto-detect the correct URL"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Launch the sync service
node "$SYNC_SERVICE"
