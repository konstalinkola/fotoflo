#!/bin/bash

# Simple Fotoflo Sync Launcher
# Double-click this file to run the sync service

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Launching Fotoflo Desktop Sync..."
echo "===================================="

# Run the simple sync script
"$SCRIPT_DIR/simple-sync.sh"

# Keep the terminal window open so you can see any messages
echo ""
echo "Press any key to close this window..."
read -n 1

