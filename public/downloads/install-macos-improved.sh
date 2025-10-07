#!/bin/bash

echo "🚀 Installing Fotoflo Desktop Sync for macOS (Improved Version)..."
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

# Copy the working sync script (improved version)
cat > "$APP_DIR/fotoflo-sync.sh" << 'EOF'
#!/bin/bash

# Improved Fotoflo Desktop Sync Script
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

# Check if folder exists
if [ ! -d "$FOLDER" ]; then
    echo "❌ Folder does not exist: $FOLDER"
    exit 1
fi

# Create a temporary file to track processed files
PROCESSED_FILES="/tmp/fotoflo-sync-processed-$$"

# Function to upload a file
upload_file() {
    local file="$1"
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
        # Add to processed files list
        echo "$file" >> "$PROCESSED_FILES"
    else
        echo "❌ Upload failed (HTTP $HTTP_CODE)"
        echo "   Response: $RESPONSE_BODY"
    fi
    echo ""
}

echo "💡 Drop photos into the folder and they will be uploaded automatically!"
echo "   Press Ctrl+C to stop"
echo ""

# Initial scan - upload all existing images
echo "🔍 Scanning for existing images..."
EXISTING_FILES=$(find "$FOLDER" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.gif" \) 2>/dev/null)

if [ ! -z "$EXISTING_FILES" ]; then
    echo "📁 Found $(echo "$EXISTING_FILES" | wc -l | tr -d ' ') existing images"
    echo "🤔 Upload existing images? (y/n)"
    read -n 1 -r UPLOAD_EXISTING
    echo ""
    
    if [[ $UPLOAD_EXISTING =~ ^[Yy]$ ]]; then
        for file in $EXISTING_FILES; do
            upload_file "$file"
        done
    else
        echo "⏭️  Skipping existing images"
        # Add existing files to processed list so we don't upload them again
        echo "$EXISTING_FILES" >> "$PROCESSED_FILES"
    fi
else
    echo "📁 No existing images found"
fi

echo "👀 Now monitoring folder for new images..."
echo ""

# Monitor for new files
while true; do
    # Find all image files
    ALL_FILES=$(find "$FOLDER" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.gif" \) 2>/dev/null)
    
    if [ ! -z "$ALL_FILES" ]; then
        for file in $ALL_FILES; do
            # Check if file is already processed
            if [ ! -f "$PROCESSED_FILES" ] || ! grep -q "^$file$" "$PROCESSED_FILES" 2>/dev/null; then
                # Check if file is newer than 5 seconds ago (to avoid processing files being written)
                if find "$file" -newermt "5 seconds ago" >/dev/null 2>&1; then
                    upload_file "$file"
                fi
            fi
        done
    fi
    
    sleep 3
done

# Cleanup on exit
trap 'rm -f "$PROCESSED_FILES"' EXIT
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
echo "💡 This improved version:"
echo "   • Asks if you want to upload existing images"
echo "   • Tracks processed files to avoid duplicates"
echo "   • Better file detection and error handling"
