#!/usr/bin/env node

const FotofloSyncService = require('./src/services/sync-service');

async function main() {
  console.log('🚀 Starting Fotoflo Background Sync Service...');
  
  try {
    // The sync service is already a singleton instance, just start it
    await FotofloSyncService.start();
    
    // Keep the process running
    console.log('✅ Sync service is running. Press Ctrl+C to stop.');
    
    // Log status every 5 minutes
    setInterval(() => {
      const status = FotofloSyncService.getStatus();
      console.log(`📊 Sync Service Status: ${status.activeWatchers} active watchers for ${status.projects.length} projects`);
    }, 300000);
    
  } catch (error) {
    console.error('❌ Failed to start sync service:', error);
    process.exit(1);
  }
}

main();
