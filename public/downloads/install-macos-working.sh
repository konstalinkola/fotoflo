#!/bin/bash

echo "🚀 Installing Fotoflo Desktop Sync for macOS..."
echo ""

# Create application directory
APP_DIR="$HOME/Applications/Fotoflo Sync"
echo "📁 Creating application directory: $APP_DIR"

# Remove existing installation if it exists
if [ -d "$APP_DIR" ]; then
    echo "🔄 Removing existing installation..."
    rm -rf "$APP_DIR"
fi

mkdir -p "$APP_DIR"

# Copy the working sync script (we'll create a simple version)
cat > "$APP_DIR/fotoflo-sync.sh" << 'EOF'
#!/bin/bash

# Simple Fotoflo Desktop Sync Script
# Usage: ./fotoflo-sync.sh <folder_path> <project_id> <server_url>

if [ $# -ne 3 ]; then
    echo "Usage: $0 <folder_path> <project_id> <server_url>"
    echo "Example: $0 ~/Desktop/Fotoflo\\ Photos 301affb9-bcd1-4eb8-bae5-c30bbc12abc7 http://localhost:3001"
    exit 1
fi

FOLDER="$1"
PROJECT_ID="$2"
SERVER_URL="$3"

echo "🚀 Starting Fotoflo Desktop Sync..."
echo "📁 Folder: $FOLDER"
echo "🎯 Project: $PROJECT_ID"
echo "🌐 Server: $SERVER_URL"
echo ""
echo "💡 Drop photos into the folder and they will be uploaded automatically!"
echo "   Press Ctrl+C to stop"
echo ""

# Check if folder exists
if [ ! -d "$FOLDER" ]; then
    echo "❌ Folder does not exist: $FOLDER"
    exit 1
fi

# Simple file monitoring using find
echo "👀 Monitoring folder for new images..."
echo ""

while true; do
    # Find image files modified in the last 10 seconds
    NEW_FILES=$(find "$FOLDER" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.gif" \) -newermt "10 seconds ago" 2>/dev/null)
    
    if [ ! -z "$NEW_FILES" ]; then
        for file in $NEW_FILES; do
            echo "📸 Found new image: $(basename "$file")"
            
            # Upload the file using curl
            echo "⬆️  Uploading..."
            echo "   File: $file"
            echo "   Project: $PROJECT_ID"
            echo "   Server: $SERVER_URL/api/desktop-sync/upload"
            
            RESPONSE=$(curl -s -w "%{http_code}" -X POST \
                -F "file=@$file" \
                -F "projectId=$PROJECT_ID" \
                "$SERVER_URL/api/desktop-sync/upload")
            
            HTTP_CODE="${RESPONSE: -3}"
            RESPONSE_BODY="${RESPONSE%???}"
            
            if [ "$HTTP_CODE" = "200" ]; then
                echo "✅ Uploaded successfully!"
            else
                echo "❌ Upload failed (HTTP $HTTP_CODE)"
                echo "   Response: $RESPONSE_BODY"
            fi
            echo ""
        done
    fi
    
    sleep 5
done
EOF

chmod +x "$APP_DIR/fotoflo-sync.sh"

# Create a simple launcher script
cat > "$APP_DIR/start-sync.sh" << 'EOF'
#!/bin/bash
echo "🚀 Fotoflo Desktop Sync Setup"
echo ""
echo "This will help you set up folder syncing for your Fotoflo projects."
echo ""

# Get folder path
echo "📁 Enter the path to the folder you want to sync:"
echo "   (e.g., ~/Desktop/Fotoflo Photos)"
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
echo "   (You can find this in your project URL: /project/[PROJECT_ID])"
read -p "Project ID: " PROJECT_ID

# Get server URL
echo ""
echo "🌐 Enter your Fotoflo server URL:"
echo "   (e.g., http://localhost:3001)"
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
./fotoflo-sync.sh "$FOLDER_PATH" "$PROJECT_ID" "$SERVER_URL"
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
echo "💡 This version uses a simple file monitoring approach that works without Node.js dependencies!"
