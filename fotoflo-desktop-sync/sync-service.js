const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const FormData = require('form-data');
const fetch = require('node-fetch');

class FotofloSyncService {
    constructor() {
        this.watchers = new Map();
        this.processedFiles = new Map();
        this.serverUrl = this.detectServerUrl();
        this.isRunning = false;
    }

    detectServerUrl() {
        const candidates = [
            process.env.NEXT_PUBLIC_SITE_URL,
            process.env.SERVER_URL,
            'https://fotoflo.co',
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://localhost:3002',
            'http://localhost:3003'
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

    async start() {
        if (this.isRunning) {
            console.log('🔄 Sync service is already running');
            return;
        }

        console.log('🚀 Starting Fotoflo Sync Service...');
        this.isRunning = true;

        // Load and start sync folders
        await this.loadAndStartSyncFolders();
        
        // Set up periodic refresh
        setInterval(() => {
            this.loadAndStartSyncFolders();
        }, 30000);

        console.log('✅ Fotoflo Sync Service started successfully');
        console.log('📁 Monitoring folders for new photos...');
        console.log('🛑 Press Ctrl+C to stop');
    }

    async stop() {
        console.log('🛑 Stopping Fotoflo Sync Service...');
        this.isRunning = false;
        
        for (const [projectId, watcher] of this.watchers) {
            console.log(`📁 Stopping watcher for project ${projectId}`);
            await watcher.close();
        }
        
        this.watchers.clear();
        console.log('✅ All watchers stopped');
    }

    async loadAndStartSyncFolders() {
        try {
            console.log('🔄 Checking for sync folders...');
            
            const response = await fetch(`${this.serverUrl}/api/sync-folders/active`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Fotoflo-Sync-Client/1.0.0'
                }
            });
            
            if (response.status === 404) {
                console.log('⚠️ No active sync folders found');
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const syncFolders = await response.json();
            console.log(`✅ Found ${syncFolders.length} active sync folders`);
            
            // Stop existing watchers
            for (const [projectId, watcher] of this.watchers) {
                console.log(`📁 Stopping watcher for project ${projectId}`);
                await watcher.close();
            }
            this.watchers.clear();
            
            // Start watchers for each sync folder
            for (const folder of syncFolders) {
                this.startWatching(folder);
            }
            
        } catch (error) {
            console.error('❌ Failed to load sync folders:', error.message);
        }
    }

    startWatching(folder) {
        const { project_id, folder_path, projects } = folder;
        const projectName = projects?.name || 'Unknown Project';
        
        if (!fs.existsSync(folder_path)) {
            console.error(`❌ Failed to watch folder ${folder_path}: ENOENT: no such file or directory`);
            return;
        }
        
        console.log(`👀 Watching folder: ${folder_path} (${projectName})`);
        
        const watcher = chokidar.watch(folder_path, {
            ignored: /(^|[\/\\\\])\\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true
        });
        
        watcher.on('add', (filePath) => {
            this.processFile(filePath, project_id);
        });
        
        watcher.on('error', (error) => {
            console.error(`❌ Watcher error for ${folder_path}:`, error);
        });
        
        this.watchers.set(project_id, watcher);
        console.log(`✅ Started watching: ${folder_path}`);
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
        
        console.log(`📸 New image detected: ${fileName}`);
        
        // Wait a moment for file to be fully written
        setTimeout(() => {
            this.uploadFile(filePath, projectId);
        }, 1000);
    }

    async uploadFile(filePath, projectId) {
        const fileName = path.basename(filePath);
        
        try {
            console.log(`📤 Uploading: ${fileName} to project ${projectId}`);
            
            const fileBuffer = fs.readFileSync(filePath);
            const formData = new FormData();
            
            // Create a Blob from the buffer
            const blob = new Blob([fileBuffer], { type: this.getContentType(fileName) });
            formData.append('file', blob, fileName);
            
            const response = await fetch(`${this.serverUrl}/api/desktop-sync/upload?projectId=${projectId}`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log(`✅ Successfully uploaded: ${fileName}`);
            } else {
                const errorText = await response.text();
                console.log(`⚠️ Upload failed for ${fileName}: ${response.status} ${errorText}`);
            }
            
        } catch (error) {
            console.error(`❌ Upload error for ${fileName}:`, error);
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
}

module.exports = FotofloSyncService;
