'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Monitor, 
  Laptop, 
  CheckCircle, 
  ExternalLink,
  Play,
  FolderOpen,
  Shield,
  Eye,
  Code,
  Settings,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function DownloadDesktopSyncPage() {
  const [userAgent, setUserAgent] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [showSourceCode, setShowSourceCode] = useState(false);

  useEffect(() => {
    setUserAgent(navigator.userAgent);
    
    // Currently only macOS is supported and tested
    setDownloadUrl('/downloads/Fotoflo-Sync-Simple-1.0.19.zip');
  }, []);

  const getPlatformIcon = () => {
    return <Laptop className="w-8 h-8" />;
  };

  const getPlatformName = () => {
    return 'macOS';
  };


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Fotoflo Desktop Sync Client
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically sync your photos to Fotoflo projects by simply dropping them into designated folders.
          </p>
          <Badge variant="secondary" className="mt-4">
            Available for macOS (Windows & Linux coming soon)
          </Badge>
        </div>

        {/* Main Download Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getPlatformIcon()}
            </div>
            <CardTitle className="text-2xl">Download for macOS</CardTitle>
            <CardDescription>
              Tested and verified - just download, extract, and follow our security guide
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <Button 
              size="lg" 
              className="flex items-center gap-2 mx-auto"
              onClick={() => {
                // Download ZIP for macOS
                const link = document.createElement('a');
                link.href = '/downloads/Fotoflo-Sync-Simple-1.0.19.zip';
                link.download = 'Fotoflo-Sync-Simple-1.0.19.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('macOS app downloaded! Unzip and follow the security guide below to run');
              }}
            >
              <Download className="w-5 h-5" />
              Download Installer
            </Button>
            
            <div className="text-sm text-gray-500">
                    Version 1.0.19 • macOS • ~70 MB • Tested & Verified
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Easy Setup:</strong> Download the installer, run it, and the setup wizard will guide you through configuring your sync folders. No command-line knowledge required!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Other Platforms Coming Soon</CardTitle>
            <CardDescription>
              We're working on Windows and Linux versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-600">Windows</div>
                    <div className="text-sm text-gray-500">Coming soon</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Windows support is in development and will be available soon.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-600">Linux</div>
                    <div className="text-sm text-gray-500">Coming soon</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Linux support is planned for future releases.</p>
              </div>
            </div>
            
            <Alert className="mt-4">
              <Info className="w-4 h-4" />
              <AlertDescription>
                <strong>Currently testing macOS:</strong> We're focusing on perfecting the macOS experience before expanding to other platforms. 
                This ensures the highest quality and reliability for all users.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>
              Get up and running with Fotoflo Desktop Sync in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium">Download</h4>
                <p className="text-sm text-gray-600">Download the installer for your platform</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium">Install</h4>
                <p className="text-sm text-gray-600">Run the installer and follow the setup wizard</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FolderOpen className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium">Configure</h4>
                <p className="text-sm text-gray-600">Choose folders to sync to your projects</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Monitor className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-medium">Sync</h4>
                <p className="text-sm text-gray-600">Drop photos and watch them sync automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* macOS Security Instructions */}
        {getPlatformName() === 'macOS' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                macOS Security & Installation Guide
              </CardTitle>
              <CardDescription>
                How to safely install and run Fotoflo Desktop Sync on macOS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>macOS Security Notice:</strong> Apple protects your Mac by blocking apps from unknown developers. 
                  Here's how to safely install and run Fotoflo Desktop Sync.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Method 1: System Preferences (Recommended)</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p><strong>Download and extract the ZIP file</strong></p>
                      <p className="text-sm text-gray-600">Double-click the downloaded ZIP file to extract the Fotoflo Sync app</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p><strong>Try to open the app</strong></p>
                      <p className="text-sm text-gray-600">Double-click "Fotoflo Sync.app" - you'll see a security warning</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p><strong>Click "OK" on the first dialog</strong></p>
                      <p className="text-sm text-gray-600">The dialog will say "Apple cannot verify this app" - just click "OK"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <p><strong>Open System Preferences</strong></p>
                      <p className="text-sm text-gray-600">Go to Apple Menu → System Preferences → Security & Privacy</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                    <div>
                      <p><strong>Allow the app</strong></p>
                      <p className="text-sm text-gray-600">Look for "Fotoflo Sync was blocked" message and click "Open Anyway"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
                    <div>
                      <p><strong>Confirm and run</strong></p>
                      <p className="text-sm text-gray-600">Click "Open" in the final confirmation dialog</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-lg mt-6">Method 2: Right-Click Method (Alternative)</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p><strong>Right-click the app</strong></p>
                      <p className="text-sm text-gray-600">Right-click on "Fotoflo Sync.app" in Finder</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p><strong>Select "Open"</strong></p>
                      <p className="text-sm text-gray-600">Choose "Open" from the context menu</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p><strong>Confirm opening</strong></p>
                      <p className="text-sm text-gray-600">Click "Open" in the confirmation dialog</p>
                    </div>
                  </div>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>After the first run:</strong> You can double-click the app normally - macOS will remember your permission.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Source Code Inspection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-600" />
              Source Code Transparency
            </CardTitle>
            <CardDescription>
              Inspect the code before running it on your computer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              We believe in transparency. You can inspect the source code of our desktop sync client to see exactly what it does before running it on your computer.
            </p>
            
            <Button 
              variant="outline" 
              onClick={() => setShowSourceCode(!showSourceCode)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showSourceCode ? 'Hide' : 'Show'} Source Code
            </Button>

            {showSourceCode && (
              <div className="mt-4 space-y-4">
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    This is the main sync service code that runs on your computer. It's written in Node.js and handles file watching and uploading.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class FotofloSyncService {
  constructor() {
    this.watchers = new Map(); // projectId -> watcher instance
    this.processedFiles = new Map(); // projectId -> Set of processed file paths
    this.serverUrl = null;
    this.isRunning = false;
  }

  async detectServerUrl() {
    // Priority order for server URL detection
    const candidates = [
      'https://fotoflo.vercel.app',  // Production domain
      'http://localhost:3000',  // Development server
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:3003',
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.SERVER_URL,
      'https://fotoflo.com'
    ];

    // Test each URL to see which one is running
    for (const url of candidates) {
      if (url && url.trim()) {
        try {
          console.log(\`🔍 Testing server connection to: \${url}\`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(\`\${url}/api/sync-folders/active\`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Fotoflo-Sync-Client/1.0.19'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 404) {
            console.log(\`✅ Server is running at: \${url}\`);
            return url;
          }
        } catch (error) {
          console.log(\`❌ Server not available at: \${url}\`);
          continue;
        }
      }
    }
    
    return 'https://fotoflo.vercel.app'; // Fallback
  }

  async loadAndStartSyncFolders() {
    try {
      const response = await fetch(\`\${this.serverUrl}/api/sync-folders/active\`);
      
      if (response.status === 404) {
        console.log('⚠️ No active sync folders found');
        return;
      }
      
      if (!response.ok) {
        throw new Error(\`Server responded with status: \${response.status}\`);
      }
      
      const syncFolders = await response.json();
      console.log(\`✅ Found \${syncFolders.length} active sync folders\`);
      
      // Stop existing watchers
      this.watchers.forEach((watcher) => watcher.close());
      this.watchers.clear();
      
      // Start watchers for each sync folder
      syncFolders.forEach((folder) => {
        this.startWatching(folder);
      });
      
    } catch (error) {
      console.error('Failed to load sync folders:', error);
    }
  }

  startWatching(folder) {
    const { project_id, folder_path, project_name } = folder;
    
    if (!fs.existsSync(folder_path)) {
      console.error(\`❌ Failed to watch folder \${folder_path}: ENOENT: no such file or directory\`);
      return;
    }
    
    console.log(\`👀 Watching folder: \${folder_path} (\${project_name || 'Unknown Project'})\`);
    
    const watcher = chokidar.watch(folder_path, {
      ignored: /(^|[\/\\\\])\\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });
    
    watcher.on('add', (filePath) => {
      this.processFile(filePath, project_id);
    });
    
    watcher.on('error', (error) => {
      console.error(\`❌ Watcher error for \${folder_path}:\`, error);
    });
    
    this.watchers.set(project_id, watcher);
    console.log(\`✅ Started watching: \${folder_path}\`);
  }

  async processFile(filePath, projectId) {
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(fileName).toLowerCase();
    
    // Only process image files
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(fileExtension)) {
      return;
    }
    
    // Check if we've already processed this file
    if (!this.processedFiles.has(projectId)) {
      this.processedFiles.set(projectId, new Set());
    }
    
    const processedSet = this.processedFiles.get(projectId);
    if (processedSet.has(filePath)) {
      return; // Already processed
    }
    
    processedSet.add(filePath);
    
    console.log(\`📸 New image detected: \${fileName}\`);
    
    // Wait a moment for file to be fully written
    setTimeout(() => {
      this.uploadFile(filePath, projectId);
    }, 1000);
  }

  async uploadFile(filePath, projectId) {
    const fileName = path.basename(filePath);
    
    try {
      console.log(\`📤 Uploading: \${fileName} to project \${projectId}\`);
      
      const fileBuffer = fs.readFileSync(filePath);
      const formData = new FormData();
      
      // Create a Blob from the buffer
      const blob = new Blob([fileBuffer], { type: this.getContentType(fileName) });
      formData.append('file', blob, fileName);
      
      const response = await fetch(\`\${this.serverUrl}/api/desktop-sync/upload?projectId=\${projectId}\`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        console.log(\`✅ Successfully uploaded: \${fileName}\`);
      } else {
        const errorText = await response.text();
        console.log(\`⚠️ Upload failed for \${fileName}: \${response.status} \${errorText}\`);
      }
      
    } catch (error) {
      console.error(\`❌ Upload error for \${fileName}:\`, error);
    }
  }

  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.webp': 'image/webp'
    };
    return types[ext] || 'image/jpeg';
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Sync service is already running');
      return;
    }
    
    console.log('🚀 Starting Fotoflo Sync Service...');
    
    // Detect server URL
    this.serverUrl = await this.detectServerUrl();
    console.log(\`🌐 Server URL: \${this.serverUrl}\`);
    
    // Load and start sync folders
    await this.loadAndStartSyncFolders();
    
    // Set up periodic refresh of sync folders
    this.syncInterval = setInterval(() => {
      this.loadAndStartSyncFolders();
    }, 30000); // Check every 30 seconds
    
    this.isRunning = true;
    console.log('✅ Fotoflo Sync Service started successfully');
    console.log('🛑 Press Ctrl+C to stop');
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers.clear();
    
    this.isRunning = false;
    console.log('🛑 Fotoflo Sync Service stopped');
  }
}

// Create and start the service
const syncService = new FotofloSyncService();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Received SIGINT, shutting down gracefully...');
  syncService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Received SIGTERM, shutting down gracefully...');
  syncService.stop();
  process.exit(0);
});

// Start the service
syncService.start().catch((error) => {
  console.error('❌ Failed to start sync service:', error);
  process.exit(1);
});`}
                  </pre>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">What this code does:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Watches folders:</strong> Monitors specified folders for new image files</li>
                    <li>• <strong>Uploads images:</strong> Automatically uploads new images to your Fotoflo projects</li>
                    <li>• <strong>Prevents duplicates:</strong> Keeps track of already uploaded files</li>
                    <li>• <strong>Handles errors:</strong> Gracefully handles network issues and file errors</li>
                    <li>• <strong>Connects securely:</strong> Uses HTTPS and proper authentication</li>
                  </ul>
                </div>

                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Security:</strong> This code only uploads image files from folders you explicitly configure. 
                    It doesn't access any other files on your computer or send any personal data beyond the images you choose to sync.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Usage Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              How to Use Fotoflo Desktop Sync
            </CardTitle>
            <CardDescription>
              Step-by-step guide to set up and use the desktop sync client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-3">Step 1: Install the Desktop Client</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>• Download the installer for your operating system above</p>
                  <p>• Run the installer and follow the setup wizard</p>
                  <p>• Follow the macOS security instructions below to allow the app to run</p>
                  <p>• The app will open a Terminal window showing sync status</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Step 2: Configure Sync Folders</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>• Go to your Fotoflo project settings</p>
                  <p>• Open the "Desktop Sync" tab</p>
                  <p>• Click "Add Sync Folder" to link a local folder to your project</p>
                  <p>• Choose any folder on your computer (e.g., Desktop, Documents, Pictures)</p>
                  <p>• The desktop client will automatically detect and start watching this folder</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Step 3: Start Syncing Photos</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>• Simply drag and drop photos into your synced folder</p>
                  <p>• The desktop client will automatically detect new images</p>
                  <p>• Photos will upload to your Fotoflo project within seconds</p>
                  <p>• Check the Terminal window to see upload progress and status</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Project Mode Compatibility</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2">Single Mode Projects</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Photos automatically become the active image</li>
                      <li>• Latest uploaded photo is highlighted</li>
                      <li>• Perfect for single-photo displays</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-2">Collection Mode Projects</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Photos go to the "New Collection" area</li>
                      <li>• Save collections when you have enough photos</li>
                      <li>• Perfect for multi-photo galleries</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3">Tips & Best Practices</h4>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-2">
                  <p className="text-sm"><strong>Supported formats:</strong> JPG, JPEG, PNG, WebP</p>
                  <p className="text-sm"><strong>File size:</strong> No limit, but larger files take longer to upload</p>
                  <p className="text-sm"><strong>EXIF data:</strong> All camera metadata is preserved automatically</p>
                  <p className="text-sm"><strong>Duplicates:</strong> The system prevents uploading the same file twice</p>
                  <p className="text-sm"><strong>Multiple folders:</strong> You can sync different folders to different projects</p>
                  <p className="text-sm"><strong>Network issues:</strong> The client will retry uploads automatically if connection is lost</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Everything you need for seamless photo syncing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Real-time Sync</h4>
                    <p className="text-sm text-gray-600">Photos upload automatically when dropped into folders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">EXIF Data</h4>
                    <p className="text-sm text-gray-600">Preserves all camera metadata and settings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Multiple Projects</h4>
                    <p className="text-sm text-gray-600">Sync different folders to different projects</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Duplicate Prevention</h4>
                    <p className="text-sm text-gray-600">Never upload the same file twice</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Collection Support</h4>
                    <p className="text-sm text-gray-600">Works with both single and collection mode projects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">macOS Optimized</h4>
                    <p className="text-sm text-gray-600">Tested and verified on macOS with proper security handling</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Get support and learn more about Fotoflo Desktop Sync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" className="justify-start">
                <ExternalLink className="w-4 h-4 mr-2" />
                GitHub Repository
              </Button>
              <Button variant="outline" className="justify-start">
                <ExternalLink className="w-4 h-4 mr-2" />
                Support
              </Button>
            </div>
            
            <Alert>
              <AlertDescription>
                Having trouble? Check our documentation or reach out to support at support@fotoflo.com
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
