#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class FotofloSyncService {
    constructor() {
        this.serverUrl = this.detectServerUrl();
        this.isRunning = false;
        this.watchers = new Map();
        this.processedFiles = new Map();
        this.syncInterval = null;
    }

    detectServerUrl() {
        const candidates = [
            process.env.NEXT_PUBLIC_SITE_URL,
            process.env.SERVER_URL,
            'http://localhost:3000',  // Prioritize 3000 (current server)
            'http://localhost:3001', 
            'http://localhost:3002',
            'http://localhost:3003',
            'https://fotoflo.co'
        ];

        for (const url of candidates) {
            if (url && url.trim()) {
                console.log(`🌐 Using server URL: ${url}`);
                return url;
            }
        }

        const fallback = 'http://localhost:3003';
        console.log(`⚠️  Using fallback server URL: ${fallback}`);
        return fallback;
    }

    // Simple HTTP request function using built-in modules
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const reqOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };

            const req = client.request(reqOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
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
    }

    // Get active sync folders from the server
    async getActiveSyncFolders() {
        try {
            console.log('📁 Fetching active sync folders...');
            const response = await this.makeRequest(`${this.serverUrl}/api/sync-folders/active`);
            
            if (response.status === 200) {
                const folders = JSON.parse(response.body);
                console.log(`✅ Found ${folders.length} active sync folders`);
                return folders;
            } else if (response.status === 301 || response.status === 302) {
                console.log(`⚠️  Server redirect (${response.status}) - trying different URL`);
                return [];
            } else {
                console.log(`⚠️  Server responded with status: ${response.status}`);
                return [];
            }
        } catch (error) {
            console.log(`❌ Failed to fetch sync folders: ${error.message}`);
            return [];
        }
    }

    // Simple file watching using fs.watch
    watchFolder(folderPath, projectId, projectName) {
        console.log(`👀 Watching folder: ${folderPath} (${projectName})`);
        
        try {
            const watcher = fs.watch(folderPath, { recursive: false }, (eventType, filename) => {
                if (filename && this.isImageFile(filename)) {
                    const filePath = path.join(folderPath, filename);
                    console.log(`📸 New image detected: ${filename}`);
                    
                    // Debounce file processing
                    const key = `${projectId}:${filePath}`;
                    if (this.processedFiles.has(key)) {
                        return; // Already processing this file
                    }
                    
                    this.processedFiles.set(key, true);
                    
                    // Process the file after a short delay to ensure it's fully written
                    setTimeout(async () => {
                        try {
                            await this.processImageFile(filePath, projectId, projectName);
                        } catch (error) {
                            console.error(`❌ Error processing ${filename}:`, error.message);
                        } finally {
                            this.processedFiles.delete(key);
                        }
                    }, 1000);
                }
            });
            
            this.watchers.set(folderPath, watcher);
            console.log(`✅ Started watching: ${folderPath}`);
            
        } catch (error) {
            console.error(`❌ Failed to watch folder ${folderPath}:`, error.message);
        }
    }

    // Check if file is an image
    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.heic', '.heif'];
        const ext = path.extname(filename).toLowerCase();
        return imageExtensions.includes(ext);
    }

    // Get content type for file
    getContentType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
            '.webp': 'image/webp',
            '.heic': 'image/heic',
            '.heif': 'image/heif'
        };
        return contentTypes[ext] || 'image/jpeg';
    }

    // Process and upload image file
    async processImageFile(filePath, projectId, projectName) {
        try {
            console.log(`📤 Uploading: ${path.basename(filePath)} to ${projectName}`);
            
            // Read file
            const fileBuffer = fs.readFileSync(filePath);
            const filename = path.basename(filePath);
            
            // Create proper multipart form data
            const boundary = '----formdata-' + Math.random().toString(16);
            const formData = [];
            
            // Add the file field
            formData.push(`--${boundary}`);
            formData.push(`Content-Disposition: form-data; name="file"; filename="${filename}"`);
            formData.push(`Content-Type: ${this.getContentType(filename)}`);
            formData.push('');
            formData.push(fileBuffer);
            formData.push(`--${boundary}--`);
            
            // Convert to proper multipart format
            const body = Buffer.concat(formData.map(part => {
                if (typeof part === 'string') {
                    return Buffer.from(part + '\r\n');
                } else {
                    return Buffer.concat([part, Buffer.from('\r\n')]);
                }
            }));
            
            // Upload to server
            const response = await this.makeRequest(`${this.serverUrl}/api/desktop-sync/upload?projectId=${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length.toString()
                },
                body: body
            });
            
            if (response.status === 200) {
                console.log(`✅ Successfully uploaded: ${filename}`);
            } else {
                console.log(`⚠️  Upload failed for ${filename}: ${response.status}`);
            }
            
        } catch (error) {
            console.error(`❌ Error uploading ${path.basename(filePath)}:`, error.message);
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('🔄 Sync service is already running');
            return;
        }

        console.log('🚀 Starting Fotoflo Sync Service...');
        this.isRunning = true;

        // Test server connection
        await this.testConnection();

        // Get and watch sync folders
        const syncFolders = await this.getActiveSyncFolders();
        
        if (syncFolders.length === 0) {
            console.log('📝 No sync folders configured yet.');
            console.log('💡 To configure sync folders:');
            console.log('   1. Go to your Fotoflo project settings');
            console.log('   2. Open the "Desktop Sync" tab');
            console.log('   3. Add folders to sync');
            console.log('');
            console.log('🔄 Will check for new sync folders every 30 seconds...');
        } else {
            // Start watching configured folders
            this.updateWatchers(syncFolders);
            console.log(`✅ Started watching ${syncFolders.length} sync folder(s)`);
        }
        
        // Set up a single interval to check for new sync folders periodically
        this.syncInterval = setInterval(async () => {
            if (this.isRunning) {
                const newFolders = await this.getActiveSyncFolders();
                this.updateWatchers(newFolders);
            }
        }, 30000);

        console.log('✅ Fotoflo Sync Service started successfully');
        console.log('🌐 Server URL:', this.serverUrl);
        console.log('🛑 Press Ctrl+C to stop');
        console.log('');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('🛑 Stopping Fotoflo Sync Service...');
        this.isRunning = false;
        
        // Clear the sync interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        // Stop all watchers
        for (const [path, watcher] of this.watchers) {
            watcher.close();
            console.log(`🔌 Stopped watching: ${path}`);
        }
        this.watchers.clear();
        
        console.log('✅ Fotoflo Sync Service stopped');
    }

    updateWatchers(syncFolders) {
        const currentPaths = new Set(this.watchers.keys());
        const newPaths = new Set(syncFolders.map(f => f.folder_path));
        
        // Stop watching removed folders
        for (const path of currentPaths) {
            if (!newPaths.has(path)) {
                const watcher = this.watchers.get(path);
                if (watcher) {
                    watcher.close();
                    this.watchers.delete(path);
                    console.log(`🛑 Stopped watching: ${path}`);
                }
            }
        }
        
        // Start watching new folders
        for (const folder of syncFolders) {
            if (!currentPaths.has(folder.folder_path)) {
                this.watchFolder(folder.folder_path, folder.project_id, folder.project_name || 'Unknown Project');
            }
        }
    }

    async stop() {
        console.log('🛑 Stopping Fotoflo Sync Service...');
        this.isRunning = false;
        
        // Close all watchers
        for (const [path, watcher] of this.watchers) {
            watcher.close();
            console.log(`🛑 Stopped watching: ${path}`);
        }
        this.watchers.clear();
        
        console.log('✅ Fotoflo Sync stopped');
    }

    // Test server connection
    async testConnection() {
        try {
            console.log('🔍 Testing server connection...');
            const response = await this.makeRequest(`${this.serverUrl}/api/health`);
            
            if (response.status === 200) {
                console.log('✅ Server connection successful');
                return true;
            } else {
                console.log(`⚠️  Server responded with status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Server connection failed: ${error.message}`);
            console.log('💡 Make sure your Fotoflo server is running');
            return false;
        }
    }
}

// Create and start the sync service
const syncService = new FotofloSyncService();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Fotoflo Sync...');
    try {
        syncService.stop();
        console.log('✅ Fotoflo Sync stopped gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    try {
        syncService.stop();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
});

// Start the service
syncService.start().catch((error) => {
    console.error('❌ Failed to start Fotoflo Sync:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   • Make sure Node.js is installed');
    console.log('   • Check your internet connection');
    console.log('   • Verify the server URL is correct');
    process.exit(1);
});