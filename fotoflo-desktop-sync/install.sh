#!/bin/bash

# Fotoflo Desktop Sync Installer
# This script downloads and installs the Fotoflo Desktop Sync client

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="fotoflo-sync"
DOWNLOAD_URL="https://fotoflo.com/downloads/fotoflo-sync-$(uname -s | tr '[:upper:]' '[:lower:]').zip"

echo -e "${BLUE}🚀 Fotoflo Desktop Sync Installer${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
echo -e "${YELLOW}📋 Detected OS: ${OS}${NC}"

# Check if running as root for system-wide installation
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Running as root - will install system-wide${NC}"
else
    echo -e "${YELLOW}ℹ️  Not running as root - may need sudo for system-wide installation${NC}"
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}📁 Using temporary directory: ${TEMP_DIR}${NC}"

# Download the client
echo -e "${YELLOW}⬇️  Downloading Fotoflo Desktop Sync...${NC}"
cd "$TEMP_DIR"

# Try different download methods
if command -v curl >/dev/null 2>&1; then
    curl -L "$DOWNLOAD_URL" -o "fotoflo-sync.zip"
elif command -v wget >/dev/null 2>&1; then
    wget "$DOWNLOAD_URL" -O "fotoflo-sync.zip"
else
    echo -e "${RED}❌ Neither curl nor wget found. Please install one of them.${NC}"
    exit 1
fi

# Extract the archive
echo -e "${YELLOW}📦 Extracting archive...${NC}"
if command -v unzip >/dev/null 2>&1; then
    unzip -q "fotoflo-sync.zip"
elif command -v 7z >/dev/null 2>&1; then
    7z x "fotoflo-sync.zip"
else
    echo -e "${RED}❌ No archive extractor found. Please install unzip or 7z.${NC}"
    exit 1
fi

# Find the binary
BINARY_PATH=$(find . -name "$BINARY_NAME" -type f -executable | head -n 1)

if [ -z "$BINARY_PATH" ]; then
    echo -e "${RED}❌ Could not find the fotoflo-sync binary in the archive${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found binary: ${BINARY_PATH}${NC}"

# Make binary executable
chmod +x "$BINARY_PATH"

# Install the binary
echo -e "${YELLOW}🔧 Installing to ${INSTALL_DIR}...${NC}"

if [ "$EUID" -eq 0 ]; then
    cp "$BINARY_PATH" "$INSTALL_DIR/"
else
    sudo cp "$BINARY_PATH" "$INSTALL_DIR/"
fi

# Verify installation
if command -v "$BINARY_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Installation successful!${NC}"
    echo -e "${GREEN}🎉 Fotoflo Desktop Sync is now available as '${BINARY_NAME}'${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "${YELLOW}1. Run '${BINARY_NAME} setup' to configure your Fotoflo server${NC}"
    echo -e "${YELLOW}2. Run '${BINARY_NAME} add-project' to add your first project${NC}"
    echo -e "${YELLOW}3. Run '${BINARY_NAME} start' to begin syncing${NC}"
    echo ""
    echo -e "${BLUE}📖 For more information, run '${BINARY_NAME} --help'${NC}"
else
    echo -e "${RED}❌ Installation failed - binary not found in PATH${NC}"
    echo -e "${YELLOW}💡 You may need to add ${INSTALL_DIR} to your PATH${NC}"
    exit 1
fi

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✨ Installation complete!${NC}"
