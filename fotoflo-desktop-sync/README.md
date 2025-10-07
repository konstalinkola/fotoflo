# Fotoflo Desktop Sync Client

Automatically sync your photos to Fotoflo projects by simply dropping them into designated folders on your computer. Works just like Dropbox or Google Drive!

## Features

- 🚀 **One-click setup** - Easy configuration for any Fotoflo project
- 📁 **Project-specific folders** - Each project has its own sync folder
- 🔄 **Real-time sync** - Photos upload automatically when dropped
- 📊 **Full EXIF support** - Preserves all camera metadata
- 🛡️ **Duplicate prevention** - Never upload the same file twice
- 🎯 **Collection mode support** - Works with both single and collection projects
- 💻 **Cross-platform** - Works on Windows, macOS, and Linux

## Quick Start

### 1. Download and Install

Download the latest version from [fotoflo.com/desktop-sync](https://fotoflo.com/desktop-sync)

**macOS:**
```bash
# Download and install
curl -L https://fotoflo.com/downloads/fotoflo-sync-macos.zip -o fotoflo-sync.zip
unzip fotoflo-sync.zip
sudo cp fotoflo-sync /usr/local/bin/
```

**Windows:**
```powershell
# Download and extract to Program Files
Invoke-WebRequest -Uri "https://fotoflo.com/downloads/fotoflo-sync-windows.zip" -OutFile "fotoflo-sync.zip"
Expand-Archive -Path "fotoflo-sync.zip" -DestinationPath "C:\Program Files\Fotoflo Sync\"
```

**Linux:**
```bash
# Download and install
wget https://fotoflo.com/downloads/fotoflo-sync-linux.zip
unzip fotoflo-sync-linux.zip
sudo cp fotoflo-sync /usr/local/bin/
```

### 2. Initial Setup

```bash
# Set up Fotoflo Desktop Sync
fotoflo-sync setup

# Follow the prompts to:
# - Enter your Fotoflo server URL (usually https://fotoflo.com)
# - Optionally add an API token
```

### 3. Add Your First Project

```bash
# Add a project to sync
fotoflo-sync add-project

# You'll need:
# - Your Fotoflo project ID (from the project settings)
# - A friendly name for the project
# - A folder path to sync (e.g., ~/Desktop/MyWeddingPhotos)
```

### 4. Start Syncing

```bash
# Start syncing all active projects
fotoflo-sync start

# Or sync a specific project
fotoflo-sync start --project YOUR_PROJECT_ID
```

## Usage

### Commands

- `fotoflo-sync setup` - Initial setup and configuration
- `fotoflo-sync add-project` - Add a new project to sync
- `fotoflo-sync start` - Start syncing all active projects
- `fotoflo-sync list` - List all configured projects
- `fotoflo-sync status` - Show sync status and statistics
- `fotoflo-sync remove-project` - Remove a project from sync

### How It Works

1. **Configure projects** - Each Fotoflo project gets its own sync folder
2. **Drop photos** - Simply drag and drop photos into the folder
3. **Automatic upload** - Photos are uploaded to the correct project instantly
4. **Smart handling** - Works with both single-mode and collection-mode projects

### Project Types

**Single Mode Projects:**
- Photos appear directly in the project gallery
- Latest photo becomes the active/displayed photo

**Collection Mode Projects:**
- Photos appear in the "New Collection" area
- Build collections by adding multiple photos
- Save collections when ready

## Configuration

### Configuration File

Settings are stored in `~/.fotoflo-desktop-sync.json`:

```json
{
  "serverUrl": "https://fotoflo.com",
  "apiToken": "your-api-token",
  "projects": [
    {
      "id": "project-id-123",
      "name": "Wedding Photos",
      "folderPath": "/Users/john/Desktop/WeddingPhotos",
      "active": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "settings": {
    "autoStart": false,
    "watchInterval": 1000,
    "maxRetries": 3,
    "supportedFormats": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".tiff", ".bmp"]
  }
}
```

### Environment Variables

You can also set these environment variables:

- `FOTOFLO_SERVER_URL` - Default server URL
- `FOTOFLO_API_TOKEN` - Default API token
- `FOTOFLO_CONFIG_PATH` - Custom config file path

## Troubleshooting

### Common Issues

**"Authentication required" error:**
- Make sure you're logged into the Fotoflo web app
- The desktop sync uses the same session as your browser

**"Project not found" error:**
- Verify your project ID is correct
- Make sure the project exists and you have access to it

**Photos not appearing:**
- Check that the folder path exists and is accessible
- Verify the file format is supported (jpg, png, gif, etc.)
- Check the sync status with `fotoflo-sync status`

**Sync not starting:**
- Run `fotoflo-sync setup` to ensure proper configuration
- Check that at least one project is configured and active

### Getting Help

- 📧 **Email:** support@fotoflo.com
- 💬 **Discord:** [Join our community](https://discord.gg/fotoflo)
- 📖 **Docs:** [docs.fotoflo.com](https://docs.fotoflo.com)
- 🐛 **Issues:** [GitHub Issues](https://github.com/fotoflo/desktop-sync/issues)

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/fotoflo/desktop-sync.git
cd desktop-sync

# Install dependencies
npm install

# Build for distribution
npm run build

# Test locally
npm start
```

### Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Multi-project support
- Real-time file watching
- EXIF data preservation
- Cross-platform support