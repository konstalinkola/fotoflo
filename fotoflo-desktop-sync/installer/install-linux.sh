#!/bin/bash
# Fotoflo Desktop Sync - Linux Installer

echo "🚀 Installing Fotoflo Desktop Sync..."

# Create installation directory
INSTALL_DIR="/opt/fotoflo-sync"
sudo mkdir -p "$INSTALL_DIR"

# Copy the binary
sudo cp dist/fotoflo-sync-linux "$INSTALL_DIR/fotoflo-sync"
sudo chmod +x "$INSTALL_DIR/fotoflo-sync"

# Create symbolic link for command line access
sudo ln -sf "$INSTALL_DIR/fotoflo-sync" /usr/local/bin/fotoflo-sync

# Create desktop entry
DESKTOP_ENTRY="/usr/share/applications/fotoflo-sync.desktop"
sudo tee "$DESKTOP_ENTRY" > /dev/null << EOF
[Desktop Entry]
Name=Fotoflo Sync
Comment=Sync photos to Fotoflo projects
Exec=fotoflo-sync setup
Icon=applications-graphics
Terminal=true
Type=Application
Categories=Graphics;Photography;
EOF

echo "✅ Installation complete!"
echo ""
echo "🎉 Fotoflo Desktop Sync is now installed!"
echo "📁 Installation: $INSTALL_DIR"
echo "💻 Command line: fotoflo-sync"
echo "🖥️  Desktop: Look for 'Fotoflo Sync' in your applications menu"
echo ""
echo "🚀 Next steps:"
echo "1. Run 'fotoflo-sync setup' to configure your sync folders"
echo "2. Follow the guided setup to add your projects"
echo "3. Start syncing your photos!"
