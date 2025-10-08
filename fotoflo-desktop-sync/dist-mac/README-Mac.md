# Fotoflo Desktop Sync for macOS

Automatically sync your photos to Fotoflo projects by simply dropping them into designated folders on your Mac.

## Quick Installation

### For Apple Silicon Macs (M1/M2/M3)
```bash
# Download and install
curl -L https://fotoflo.co/downloads/fotoflo-sync-macos-arm64.zip -o fotoflo-sync.zip
unzip fotoflo-sync.zip
sudo cp fotoflo-sync-macos-arm64 /usr/local/bin/fotoflo-sync
chmod +x /usr/local/bin/fotoflo-sync
```

### For Intel Macs
```bash
# Download and install
curl -L https://fotoflo.co/downloads/fotoflo-sync-macos-x64.zip -o fotoflo-sync.zip
unzip fotoflo-sync.zip
sudo cp fotoflo-sync-macos-x64 /usr/local/bin/fotoflo-sync
chmod +x /usr/local/bin/fotoflo-sync
```

## Usage

```bash
# Set up Fotoflo Desktop Sync
fotoflo-sync setup

# Add a project to sync
fotoflo-sync add-project

# Start syncing
fotoflo-sync start
```

## Features

- 🚀 **One-click setup** - Easy configuration for any Fotoflo project
- 📁 **Project-specific folders** - Each project has its own sync folder
- 🔄 **Real-time sync** - Photos upload automatically when dropped
- 📊 **Full EXIF support** - Preserves all camera metadata
- 🛡️ **Duplicate prevention** - Never upload the same file twice
- 🎯 **Collection mode support** - Works with both single and collection projects
- 💻 **macOS Optimized** - Native support for both Apple Silicon and Intel Macs

## Support

- 📧 **Email:** support@fotoflo.co
- 📖 **Docs:** [docs.fotoflo.co](https://docs.fotoflo.co)
