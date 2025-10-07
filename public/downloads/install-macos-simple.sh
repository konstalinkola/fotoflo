#!/bin/bash

echo "🚀 Installing Fotoflo Desktop Sync for macOS (Simple Version)..."
echo ""

# Check if we're running from the Downloads folder
if [ ! -f "fotoflo-sync-simple.js" ]; then
    echo "❌ Error: fotoflo-sync-simple.js file not found in current directory"
    echo "💡 Make sure you downloaded the file and are running this from the Downloads folder"
    exit 1
fi

# Create application directory
APP_DIR="$HOME/Applications/Fotoflo Sync"
echo "📁 Creating application directory: $APP_DIR"

# Remove existing installation if it exists
if [ -d "$APP_DIR" ]; then
    echo "🔄 Removing existing installation..."
    rm -rf "$APP_DIR"
fi

mkdir -p "$APP_DIR"

# Copy the sync script
echo "📦 Installing Fotoflo Desktop Sync..."
cp fotoflo-sync-simple.js "$APP_DIR/fotoflo-sync.js"
chmod +x "$APP_DIR/fotoflo-sync.js"

# Create a simple launcher script
cat > "$APP_DIR/start-sync.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Fotoflo Desktop Sync..."
echo ""
echo "This script will help you set up folder syncing for your Fotoflo projects."
echo ""

# Get folder path
echo "📁 Enter the path to the folder you want to sync:"
echo "   (e.g., ~/Desktop/Fotoflo Photos or ~/Pictures/Sync)"
read -p "Folder path: " FOLDER_PATH

# Expand tilde
FOLDER_PATH="${FOLDER_PATH/#\~/$HOME}"

# Check if folder exists
if [ ! -d "$FOLDER_PATH" ]; then
    echo "❌ Folder does not exist: $FOLDER_PATH"
    echo "💡 Creating the folder for you..."
    mkdir -p "$FOLDER_PATH"
fi

# Get project ID
echo ""
echo "🆔 Enter your Fotoflo project ID:"
echo "   (You can find this in your project URL or settings)"
read -p "Project ID: " PROJECT_ID

# Get server URL
echo ""
echo "🌐 Enter your Fotoflo server URL:"
echo "   (e.g., http://localhost:3001 or https://yourdomain.com)"
read -p "Server URL: " SERVER_URL

echo ""
echo "✅ Configuration complete!"
echo ""
echo "🚀 Starting sync..."
echo "📁 Monitoring folder: $FOLDER_PATH"
echo "🎯 Project ID: $PROJECT_ID"
echo "🌐 Server: $SERVER_URL"
echo ""
echo "💡 Drop photos into the folder and watch them sync automatically!"
echo "   Press Ctrl+C to stop monitoring"
echo ""

# Start the sync
node fotoflo-sync.js "$FOLDER_PATH" "$PROJECT_ID" "$SERVER_URL"
EOF

chmod +x "$APP_DIR/start-sync.sh"

# Create desktop shortcut
DESKTOP_SHORTCUT="$HOME/Desktop/Start Fotoflo Sync.command"
cat > "$DESKTOP_SHORTCUT" << EOF
#!/bin/bash
cd "$APP_DIR"
./start-sync.sh
EOF

chmod +x "$DESKTOP_SHORTCUT"

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 Fotoflo Desktop Sync is now installed!"
echo "📁 Application: $APP_DIR"
echo "🖥️  Desktop shortcut: Start Fotoflo Sync.command"
echo ""
echo "🚀 Next steps:"
echo "1. Double-click 'Start Fotoflo Sync.command' on your Desktop"
echo "2. Follow the setup prompts to configure your sync"
echo "3. Start syncing photos automatically!"
echo ""
echo "📖 The setup will guide you through:"
echo "   • Choosing a folder to monitor"
echo "   • Entering your project ID"
echo "   • Setting your server URL"
echo "   • Starting the sync process"
echo ""
echo "💡 Tip: You can now delete the downloaded files from your Downloads folder"
