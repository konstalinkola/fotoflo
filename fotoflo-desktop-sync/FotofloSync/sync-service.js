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
            // This would normally fetch from the API
            // For now, just log that we're checking
            console.log('🔄 Checking for sync folders...');
        } catch (error) {
            console.error('❌ Failed to load sync folders:', error.message);
        }
    }
}

module.exports = FotofloSyncService;
