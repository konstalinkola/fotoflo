#!/usr/bin/env node

// Fotoflo Sync - Standalone Launcher
// This is the main entry point for the standalone executable

const path = require('path');
const fs = require('fs');

console.log('🚀 Fotoflo Sync - Standalone Version');
console.log('===================================');

// Import the sync service
let FotofloSyncService;
try {
    // Try to load the sync service from the same directory
    const syncServicePath = path.join(__dirname, 'sync-service.js');
    if (fs.existsSync(syncServicePath)) {
        FotofloSyncService = require(syncServicePath);
    } else {
        throw new Error('Sync service not found');
    }
} catch (error) {
    console.error('❌ Failed to load sync service:', error.message);
    console.log('💡 Make sure sync-service.js is in the same directory');
    process.exit(1);
}

// Create and start the sync service
const syncService = new FotofloSyncService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Fotoflo Sync...');
    try {
        await syncService.stop();
        console.log('✅ Fotoflo Sync stopped gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    try {
        await syncService.stop();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
});

// Start the service
syncService.start().catch((error) => {
    console.error('❌ Failed to start Fotoflo Sync:', error.message);
    process.exit(1);
});

// Keep the process alive
setInterval(() => {
    // Heartbeat - just keep the process running
}, 60000); // Every minute
