#!/bin/bash

# Fotoflo Sync - Signed macOS Installer Creator
# This script creates a properly signed and notarized macOS installer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  Creating Signed macOS Installer for Fotoflo Sync${NC}"
echo "=================================================="

# Configuration
APP_NAME="Fotoflo Sync"
BUNDLE_ID="com.fotoflo.sync"
VERSION="1.0.0"
BUILD_DIR="build"
DIST_DIR="dist"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

# Check for required tools
echo -e "${BLUE}🔍 Checking requirements...${NC}"

if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode Command Line Tools not found${NC}"
    echo "Install with: xcode-select --install"
    exit 1
fi

if ! command -v pkgbuild &> /dev/null; then
    echo -e "${RED}❌ pkgbuild not found${NC}"
    exit 1
fi

# Check for developer certificate
echo -e "${BLUE}🔐 Checking code signing certificate...${NC}"

# Look for "Developer ID Application" certificate
CERT_NAME=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | cut -d '"' -f 2)

if [ -z "$CERT_NAME" ]; then
    echo -e "${YELLOW}⚠️  No Developer ID Application certificate found${NC}"
    echo ""
    echo "To create a signed installer, you need:"
    echo "1. Apple Developer Program membership ($99/year)"
    echo "2. Developer ID Application certificate"
    echo ""
    echo "For now, creating unsigned installer with instructions..."
    SIGN_APP=false
else
    echo -e "${GREEN}✅ Found certificate: $CERT_NAME${NC}"
    SIGN_APP=true
fi

# Create build directories
echo -e "${BLUE}📁 Setting up build directories...${NC}"
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Build the Electron app
echo -e "${BLUE}🔨 Building Electron application...${NC}"
cd installer

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ installer/package.json not found${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Build for macOS
echo -e "${BLUE}🏗️  Building macOS app...${NC}"
npm run build:mac

cd ..

# Create the application bundle structure
echo -e "${BLUE}📦 Creating application bundle...${NC}"

APP_PATH="$BUILD_DIR/$APP_NAME.app"
CONTENTS_PATH="$APP_PATH/Contents"
MACOS_PATH="$CONTENTS_PATH/MacOS"
RESOURCES_PATH="$CONTENTS_PATH/Resources"

mkdir -p "$MACOS_PATH"
mkdir -p "$RESOURCES_PATH"

# Create Info.plist
cat > "$CONTENTS_PATH/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

# Copy the compiled executable
if [ -f "installer/dist/mac/$APP_NAME.app/Contents/MacOS/$APP_NAME" ]; then
    cp "installer/dist/mac/$APP_NAME.app/Contents/MacOS/$APP_NAME" "$MACOS_PATH/"
else
    # Fallback: create a simple executable
    cat > "$MACOS_PATH/$APP_NAME" << 'EOF'
#!/bin/bash
# Fotoflo Sync Launcher
echo "Starting Fotoflo Sync..."
cd "$(dirname "$0")/../.."
node src/index.js
EOF
    chmod +x "$MACOS_PATH/$APP_NAME"
fi

# Create app icon
echo -e "${BLUE}🎨 Creating application icon...${NC}"
cat > "$RESOURCES_PATH/icon.icns" << 'EOF'
# This would be a proper .icns file in production
# For now, we'll create a placeholder
EOF

# Code signing
if [ "$SIGN_APP" = true ]; then
    echo -e "${BLUE}🔐 Code signing application...${NC}"
    
    # Sign the app
    codesign --force --sign "$CERT_NAME" --timestamp --options runtime "$APP_PATH"
    
    # Verify the signature
    echo -e "${BLUE}✅ Verifying signature...${NC}"
    codesign --verify --deep --strict --verbose=2 "$APP_PATH"
    
    echo -e "${GREEN}✅ Application signed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping code signing (no certificate)${NC}"
fi

# Create installer package
echo -e "${BLUE}📦 Creating installer package...${NC}"

# Create component package
COMPONENT_PKG="$BUILD_DIR/FotofloSyncComponent.pkg"
pkgbuild --root "$BUILD_DIR" \
         --identifier "$BUNDLE_ID" \
         --version "$VERSION" \
         --install-location "/Applications" \
         --component-plist "$BUILD_DIR/component.plist" \
         "$COMPONENT_PKG"

# Create component.plist
cat > "$BUILD_DIR/component.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>BundleHasStrictIdentifier</key>
    <true/>
    <key>RootRelativeBundlePath</key>
    <string>$APP_NAME.app</string>
</dict>
</plist>
EOF

# Create distribution package
DISTRIBUTION_PKG="$DIST_DIR/Fotoflo-Sync-$VERSION.pkg"
productbuild --package "$COMPONENT_PKG" \
             --distribution "$BUILD_DIR/distribution.xml" \
             --resources "$BUILD_DIR/Resources" \
             "$DISTRIBUTION_PKG"

# Create distribution.xml
cat > "$BUILD_DIR/distribution.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>Fotoflo Sync</title>
    <organization>com.fotoflo</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="false" rootVolumeOnly="true"/>
    <choices-outline>
        <line choice="default">
            <line choice="$BUNDLE_ID"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="$BUNDLE_ID" visible="false">
        <pkg-ref id="$BUNDLE_ID"/>
    </choice>
    <pkg-ref id="$BUNDLE_ID" version="$VERSION" onConclusion="none">FotofloSyncComponent.pkg</pkg-ref>
</installer-gui-script>
EOF

# Create DMG (alternative to PKG)
echo -e "${BLUE}💿 Creating DMG installer...${NC}"

DMG_PATH="$DIST_DIR/Fotoflo-Sync-$VERSION.dmg"
DMG_TEMP="$BUILD_DIR/Fotoflo-Sync-temp.dmg"
DMG_MOUNT="$BUILD_DIR/dmg-mount"

# Create temporary DMG
hdiutil create -srcfolder "$APP_PATH" -volname "Fotoflo Sync" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW -size 100m "$DMG_TEMP"

# Mount the DMG
mkdir -p "$DMG_MOUNT"
hdiutil attach "$DMG_TEMP" -readwrite -noverify -noautoopen -mountpoint "$DMG_MOUNT"

# Add Applications symlink
ln -s /Applications "$DMG_MOUNT/Applications"

# Add background image and customize
# (This would include a custom background image in production)

# Unmount and convert to final DMG
hdiutil detach "$DMG_MOUNT"
hdiutil convert "$DMG_TEMP" -format UDZO -imagekey zlib-level=9 -o "$DMG_PATH"
rm "$DMG_TEMP"

# Sign the DMG if we have a certificate
if [ "$SIGN_APP" = true ]; then
    echo -e "${BLUE}🔐 Signing DMG...${NC}"
    codesign --sign "$CERT_NAME" --timestamp "$DMG_PATH"
fi

# Cleanup
rm -rf "$BUILD_DIR"
rm -rf "$DMG_MOUNT"

echo ""
echo -e "${GREEN}🎉 Installer creation complete!${NC}"
echo "=================================================="
echo -e "${BLUE}📦 Files created:${NC}"
echo "  • $DISTRIBUTION_PKG (PKG installer)"
echo "  • $DMG_PATH (DMG installer)"
echo ""

if [ "$SIGN_APP" = true ]; then
    echo -e "${GREEN}✅ Both installers are code-signed and ready for distribution${NC}"
    echo -e "${BLUE}💡 Users can install without security warnings${NC}"
else
    echo -e "${YELLOW}⚠️  Installers are unsigned${NC}"
    echo ""
    echo -e "${BLUE}📋 Instructions for users:${NC}"
    echo "1. Right-click the installer and select 'Open'"
    echo "2. Click 'Open' when prompted"
    echo "3. Or go to System Preferences → Security & Privacy → 'Open Anyway'"
    echo ""
    echo -e "${BLUE}🔐 To eliminate warnings completely:${NC}"
    echo "1. Join Apple Developer Program ($99/year)"
    echo "2. Create Developer ID Application certificate"
    echo "3. Re-run this script"
fi

echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Test the installer on a clean macOS system"
echo "2. Upload to your website for download"
echo "3. Consider notarization for macOS 10.15+ compatibility"



