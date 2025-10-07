#!/bin/bash

echo "🚀 Installing Fotoflo Desktop Sync (Simple File Monitor)..."
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

# Create a simple, reliable sync script
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

# Check if folder exists
if [ ! -d "$FOLDER" ]; then
    echo "❌ Folder does not exist: $FOLDER"
    exit 1
fi

# Create a processed files list
PROCESSED_FILES="/tmp/fotoflo-processed-$$"

# Function to upload a file
upload_file() {
    local file="$1"
    echo "📸 Uploading: $(basename "$file")"
    
    # Upload using curl with project ID as query parameter
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -F "file=@\"$file\"" \
        "$SERVER_URL/api/desktop-sync/upload?projectId=$PROJECT_ID")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Upload successful!"
        echo "$file" >> "$PROCESSED_FILES"
    else
        echo "❌ Upload failed (HTTP $HTTP_CODE)"
        echo "   Error: $RESPONSE_BODY"
    fi
    echo ""
}

echo "💡 Drop photos into the folder and they will be uploaded automatically!"
echo "   Press Ctrl+C to stop"
echo ""

# Get initial file list (already processed files)
cd "$FOLDER"
for file in *.jpg *.jpeg *.png *.webp *.gif; do
    if [ -f "$file" ] 2>/dev/null; then
        full_path="$FOLDER/$file"
        echo "$full_path" >> "$PROCESSED_FILES"
        echo "⏭️  Skipping existing file: $(basename "$file")"
    fi
done

echo "👀 Monitoring for new images..."
echo ""

# Simple monitoring loop - check for new files every 2 seconds
while true; do
    cd "$FOLDER"
    
    # Check each image file
    for file in *.jpg *.jpeg *.png *.webp *.gif; do
        if [ -f "$file" ] 2>/dev/null; then
            full_path="$FOLDER/$file"
            
            # Check if file was already processed
            if [ ! -f "$PROCESSED_FILES" ] || ! grep -q "^$full_path$" "$PROCESSED_FILES" 2>/dev/null; then
                # New file detected!
                upload_file "$full_path"
            fi
        fi
    done
    
    sleep 2
done

# Cleanup on exit
trap 'rm -f "$PROCESSED_FILES"' EXIT
EOF

chmod +x "$APP_DIR/fotoflo-sync.sh"

# Create launcher script
cat > "$APP_DIR/start-sync.sh" << 'EOF'
#!/bin/bash
echo "🚀 Fotoflo Desktop Sync Setup"
echo ""

# Get folder path
echo "📁 Enter the folder path to sync:"
read -p "Folder: " FOLDER_PATH

# Expand tilde
FOLDER_PATH="${FOLDER_PATH/#\~/$HOME}"

# Create folder if it doesn't exist
if [ ! -d "$FOLDER_PATH" ]; then
    echo "💡 Creating folder: $FOLDER_PATH"
    mkdir -p "$FOLDER_PATH"
fi

# Get project ID
echo ""
echo "🆔 Enter your project ID:"
read -p "Project ID: " PROJECT_ID

# Get server URL
echo ""
echo "🌐 Enter server URL:"
read -p "Server URL: " SERVER_URL

echo ""
echo "🚀 Starting sync..."
echo ""

# Start sync
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

echo "✅ Installation complete!"
echo ""
echo "🎉 Fotoflo Desktop Sync is ready!"
echo "🖥️  Desktop shortcut: Start Fotoflo Sync.command"
echo ""
echo "💡 This version uses simple file monitoring that actually works!"
