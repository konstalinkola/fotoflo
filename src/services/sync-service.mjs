import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import fetch properly for Node.js - try multiple approaches
let fetch;

// Try built-in fetch first (Node.js 18+)
if (globalThis.fetch) {
  fetch = globalThis.fetch;
  console.log('✅ Using built-in fetch');
} else {
  // Try node-fetch
  try {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
    globalThis.fetch = fetch;
    console.log('✅ Using node-fetch');
  } catch (error) {
    console.error('❌ Failed to load node-fetch:', error.message);
    
    // Try undici fetch
    try {
      const undici = await import('undici');
      const undiciFetch = undici.fetch;
      fetch = undiciFetch;
      globalThis.fetch = fetch;
      console.log('✅ Using undici fetch');
    } catch (undiciError) {
      console.error('❌ Failed to load undici:', undiciError.message);
      
      // Last resort: create a simple HTTP client using Node.js built-ins
      console.log('⚠️  Creating fallback HTTP client');
      fetch = createFallbackFetch();
      globalThis.fetch = fetch;
    }
  }
}

// Fallback HTTP client using Node.js built-ins
function createFallbackFetch() {
  const http = await import('http');
  const https = await import('https');
  const { URL } = await import('url');
  
  return async function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Fotoflo-Sync-Client/1.0.14',
          ...options.headers
        }
      };
      
      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new Map(Object.entries(res.headers)),
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

class FotofloSyncService {
  constructor() {
    this.watchers = new Map(); // projectId -> watcher instance
    this.processedFiles = new Map(); // projectId -> Set of processed file paths
    this.serverUrl = null; // Will be set in start() method
    this.isRunning = false;
  }

  async detectServerUrl() {
    // Priority order for server URL detection - prioritize localhost for development
    const candidates = [
      'http://localhost:3000',  // Your main server is on port 3000
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.SERVER_URL,
      'https://fotoflo.com'
    ];

    // Test each URL to see which one is actually running
    for (const url of candidates) {
      if (url && url.trim()) {
        try {
          console.log(`🔍 Testing server connection to: ${url}`);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(`${url}/api/sync-folders/active`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Fotoflo-Sync-Client/1.0.12'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 404) { // 404 is ok, means server is running
            console.log(`✅ Server is running at: ${url}`);
            return url;
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log(`⏰ Server timeout at: ${url}`);
          } else {
            console.log(`❌ Server not available at: ${url} (${error.message})`);
          }
          continue;
        }
      }
    }

    // Fallback - try localhost:3000 anyway since that's where the server usually runs
    const fallback = 'http://localhost:3000';
    console.log(`⚠️  No servers responded, using fallback: ${fallback}`);
    console.log(`💡 Make sure your Fotoflo server is running on ${fallback}`);
    return fallback;
  }

  async start() {
    if (this.isRunning) {
      console.log('🔄 Sync service is already running');
      return;
    }

    console.log('🚀 Starting Fotoflo Sync Service...');
    
    // Auto-detect server URL
    this.serverUrl = await this.detectServerUrl();
    console.log(`🌐 Server URL: ${this.serverUrl}`);
    
    this.isRunning = true;

    // Load all active sync folders and start monitoring
    await this.loadAndStartSyncFolders();
    
    // Set up periodic refresh of sync folders
    setInterval(() => {
      this.loadAndStartSyncFolders();
    }, 30000); // Refresh every 30 seconds

    console.log('✅ Fotoflo Sync Service started successfully');
  }

  async stop() {
    console.log('🛑 Stopping Fotoflo Sync Service...');
    this.isRunning = false;
    
    // Stop all watchers
    for (const [projectId, watcher] of this.watchers) {
      console.log(`📁 Stopping watcher for project ${projectId}`);
      await watcher.close();
    }
    
    this.watchers.clear();
    this.processedFiles.clear();
    
    console.log('✅ Fotoflo Sync Service stopped');
  }

  async loadAndStartSyncFolders() {
    try {
      // Get all active sync folders from the API
      const response = await fetch(`${this.serverUrl}/api/sync-folders/active`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ Sync folders endpoint not found (404) - server may be restarting, keeping current watchers active');
          return; // Don't restart watchers on 404
        }
        console.error('❌ Failed to fetch sync folders:', response.status);
        return;
      }

      const syncFolders = await response.json();
      console.log(`📋 Found ${syncFolders.length} active sync folders`);

      // Start monitoring for each folder
      for (const folder of syncFolders) {
        await this.startMonitoringFolder(folder);
      }

      // Stop monitoring for folders that are no longer active
      await this.stopInactiveFolders(syncFolders);

    } catch (error) {
      console.error('❌ Error loading sync folders:', error);
      // Don't restart watchers on network errors - keep them running
    }
  }

  async startMonitoringFolder(folder) {
    const { project_id, folder_path, name, id } = folder;
    
    // Skip if already monitoring this folder
    if (this.watchers.has(project_id)) {
      return;
    }

    // Check if folder exists
    if (!fs.existsSync(folder_path)) {
      console.warn(`⚠️ Folder does not exist: ${folder_path}`);
      return;
    }

    console.log(`📁 Starting to monitor: ${name} (${folder_path}) for project ${project_id}`);

    // Initialize processed files set for this project
    if (!this.processedFiles.has(project_id)) {
      this.processedFiles.set(project_id, new Set());
    }

    // Create file watcher
    const watcher = chokidar.watch(folder_path, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false, // Process existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    // Handle new files
    watcher.on('add', (filePath) => {
      this.handleNewFile(filePath, project_id);
    });

    // Handle errors
    watcher.on('error', (error) => {
      console.error(`❌ Watcher error for ${folder_path}:`, error);
    });

    // Store watcher
    this.watchers.set(project_id, watcher);

    // Process existing files in the folder
    await this.processExistingFiles(folder_path, project_id);
  }

  async stopInactiveFolders(activeFolders) {
    const activeProjectIds = activeFolders.map(f => f.project_id);
    
    for (const [projectId, watcher] of this.watchers) {
      if (!activeProjectIds.includes(projectId)) {
        console.log(`📁 Stopping inactive watcher for project ${projectId}`);
        await watcher.close();
        this.watchers.delete(projectId);
        this.processedFiles.delete(projectId);
      }
    }
  }

  async processExistingFiles(folderPath, projectId) {
    try {
      const files = fs.readdirSync(folderPath);
      const imageFiles = files.filter(file => this.isImageFile(file));
      
      console.log(`📸 Found ${imageFiles.length} existing images in ${folderPath}`);
      
      for (const file of imageFiles) {
        const filePath = path.join(folderPath, file);
        await this.handleNewFile(filePath, projectId);
      }
    } catch (error) {
      console.error(`❌ Error processing existing files in ${folderPath}:`, error);
    }
  }

  async handleNewFile(filePath, projectId) {
    try {
      // Check if it's an image file
      if (!this.isImageFile(filePath)) {
        return;
      }

      // Check if already processed
      const processedFiles = this.processedFiles.get(projectId);
      if (processedFiles && processedFiles.has(filePath)) {
        return;
      }

      // Wait a bit to ensure file is fully written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if file still exists and is readable
      if (!fs.existsSync(filePath)) {
        return;
      }

      console.log(`📸 Uploading new file: ${path.basename(filePath)} to project ${projectId}`);

      // Upload file
      const success = await this.uploadFile(filePath, projectId);
      
      if (success) {
        // Mark as processed
        if (!processedFiles) {
          this.processedFiles.set(projectId, new Set());
        }
        this.processedFiles.get(projectId).add(filePath);
        console.log(`✅ Successfully uploaded: ${path.basename(filePath)}`);
      } else {
        console.error(`❌ Failed to upload: ${path.basename(filePath)}`);
      }

    } catch (error) {
      console.error(`❌ Error handling new file ${filePath}:`, error);
    }
  }

  async uploadFile(filePath, projectId) {
    try {
      const fileName = path.basename(filePath);
      
      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Create a Blob from the buffer
      const fileBlob = new Blob([fileBuffer], { type: this.getContentType(fileName) });
      
      // Use native FormData that works with fetch
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);

      // Debug: Log what we're sending
      console.log(`📤 Uploading: ${fileName} to project ${projectId}`);
      console.log(`📤 File size: ${fileBuffer.length} bytes`);
      console.log(`📤 Content type: ${this.getContentType(fileName)}`);

      // Upload to API - don't set Content-Type header, let FormData handle it
      const response = await fetch(`${this.serverUrl}/api/desktop-sync/upload?projectId=${projectId}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Upload failed (${response.status}):`, errorText);
        return false;
      }

      const result = await response.json();
      console.log(`✅ Successfully uploaded: ${fileName}`);
      return result.success;

    } catch (error) {
      console.error(`❌ Failed to upload: ${path.basename(filePath)}`);
      console.error('❌ Upload error:', error);
      return false;
    }
  }

  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    return types[ext] || 'application/octet-stream';
  }

  isImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeWatchers: this.watchers.size,
      projects: Array.from(this.watchers.keys())
    };
  }
}

// Create and export singleton instance
const syncService = new FotofloSyncService();

// Start the sync service
syncService.start().catch(error => {
  console.error('❌ Failed to start sync service:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await syncService.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await syncService.stop();
  process.exit(0);
});

module.exports = syncService;
