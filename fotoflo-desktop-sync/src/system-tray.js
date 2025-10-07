const { app, Tray, Menu, nativeImage, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class FotofloSystemTray {
    constructor() {
        this.tray = null;
        this.mainWindow = null;
        this.settingsWindow = null;
        this.isVisible = false;
        this.syncStatus = 'active'; // active, inactive, error
        this.syncStats = {
            totalFiles: 0,
            syncedFiles: 0,
            lastSync: null
        };
    }

    createTray() {
        // Create tray icon
        const iconPath = this.createTrayIcon();
        this.tray = new Tray(iconPath);

        // Set tooltip
        this.tray.setToolTip('Fotoflo Sync - Automatic Photo Synchronization');

        // Create context menu
        this.updateContextMenu();

        // Handle tray click
        this.tray.on('click', () => {
            this.toggleMainWindow();
        });

        // Handle right-click for context menu
        this.tray.on('right-click', () => {
            this.tray.popUpContextMenu();
        });
    }

    
    createTrayIcon() {
        // Create a dynamic icon based on sync status with new logo
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Background circle with status color
        ctx.fillStyle = this.getStatusColor();
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw simplified S-shape logo
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Top curve
        ctx.beginPath();
        ctx.moveTo(4, 6);
        ctx.quadraticCurveTo(8, 4, 12, 6);
        ctx.stroke();
        
        // Middle curve  
        ctx.beginPath();
        ctx.moveTo(5, 8);
        ctx.quadraticCurveTo(8, 10, 11, 8);
        ctx.stroke();
        
        // Bottom curve
        ctx.beginPath();
        ctx.moveTo(4, 10);
        ctx.quadraticCurveTo(8, 12, 12, 10);
        ctx.stroke();
        
        return nativeImage.createFromDataURL(canvas.toDataURL());
    }

    getStatusColor() {
        switch (this.syncStatus) {
            case 'active':
                return '#28a745'; // Green
            case 'inactive':
                return '#6c757d'; // Gray
            case 'error':
                return '#dc3545'; // Red
            default:
                return '#667eea'; // Blue
        }
    }

    updateContextMenu() {
        const template = [
            {
                label: 'Fotoflo Sync',
                enabled: false,
                icon: this.createTrayIcon()
            },
            { type: 'separator' },
            {
                label: this.syncStatus === 'active' ? '🟢 Sync Active' : '🔴 Sync Inactive',
                enabled: false
            },
            {
                label: `Files synced: ${this.syncStats.syncedFiles}/${this.syncStats.totalFiles}`,
                enabled: false
            },
            {
                label: this.syncStats.lastSync ? 
                    `Last sync: ${this.formatLastSync()}` : 
                    'No recent syncs',
                enabled: false
            },
            { type: 'separator' },
            {
                label: 'Show Dashboard',
                click: () => this.showMainWindow()
            },
            {
                label: 'Settings',
                click: () => this.showSettings()
            },
            { type: 'separator' },
            {
                label: this.syncStatus === 'active' ? 'Pause Sync' : 'Resume Sync',
                click: () => this.toggleSync()
            },
            {
                label: 'Sync Now',
                click: () => this.forceSync(),
                enabled: this.syncStatus === 'active'
            },
            { type: 'separator' },
            {
                label: 'View Logs',
                click: () => this.showLogs()
            },
            {
                label: 'Help & Support',
                click: () => this.openHelp()
            },
            { type: 'separator' },
            {
                label: 'Quit Fotoflo Sync',
                click: () => this.quitApp()
            }
        ];

        const contextMenu = Menu.buildFromTemplate(template);
        this.tray.setContextMenu(contextMenu);
    }

    toggleMainWindow() {
        if (this.mainWindow) {
            if (this.mainWindow.isVisible()) {
                this.mainWindow.hide();
            } else {
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        } else {
            this.showMainWindow();
        }
    }

    showMainWindow() {
        if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
            return;
        }

        this.mainWindow = new BrowserWindow({
            width: 400,
            height: 600,
            show: false,
            resizable: true,
            minimizable: true,
            maximizable: false,
            skipTaskbar: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            icon: this.createTrayIcon()
        });

        // Load the dashboard HTML
        this.mainWindow.loadFile(path.join(__dirname, 'dashboard.html'));

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        this.mainWindow.on('close', (event) => {
            event.preventDefault();
            this.mainWindow.hide();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    showSettings() {
        if (this.settingsWindow) {
            this.settingsWindow.show();
            this.settingsWindow.focus();
            return;
        }

        this.settingsWindow = new BrowserWindow({
            width: 500,
            height: 400,
            show: false,
            resizable: true,
            parent: this.mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        this.settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

        this.settingsWindow.once('ready-to-show', () => {
            this.settingsWindow.show();
        });

        this.settingsWindow.on('closed', () => {
            this.settingsWindow = null;
        });
    }

    toggleSync() {
        // Toggle sync status
        this.syncStatus = this.syncStatus === 'active' ? 'inactive' : 'active';
        
        // Update tray icon and menu
        this.updateTrayIcon();
        this.updateContextMenu();
        
        // Notify user
        this.showNotification(
            this.syncStatus === 'active' ? 'Sync Resumed' : 'Sync Paused',
            this.syncStatus === 'active' ? 
                'Fotoflo Sync is now active' : 
                'Fotoflo Sync has been paused'
        );

        // Actually start/stop sync service
        this.updateSyncService();
    }

    forceSync() {
        this.showNotification('Manual Sync', 'Starting manual sync of all folders...');
        
        // Trigger manual sync
        // This would call the sync service to perform an immediate sync
        console.log('Manual sync triggered');
    }

    showLogs() {
        // Open logs in external application
        const logsPath = path.join(process.env.APPDATA || process.env.HOME, 'Fotoflo Sync', 'logs');
        
        if (fs.existsSync(logsPath)) {
            const { shell } = require('electron');
            shell.openPath(logsPath);
        } else {
            dialog.showErrorBox('No Logs Found', 'No log files found. Logs will be created when sync operations occur.');
        }
    }

    openHelp() {
        const { shell } = require('electron');
        shell.openExternal('https://fotoflo.com/help/desktop-sync');
    }

    quitApp() {
        // Confirm quit
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Quit', 'Cancel'],
            defaultId: 1,
            title: 'Quit Fotoflo Sync',
            message: 'Are you sure you want to quit Fotoflo Sync?',
            detail: 'Photos will no longer sync automatically until you restart the application.'
        }).then((result) => {
            if (result.response === 0) {
                app.quit();
            }
        });
    }

    updateSyncStats(stats) {
        this.syncStats = { ...this.syncStats, ...stats };
        this.updateContextMenu();
    }

    updateSyncStatus(status) {
        this.syncStatus = status;
        this.updateTrayIcon();
        this.updateContextMenu();
    }

    updateTrayIcon() {
        const newIcon = this.createTrayIcon();
        this.tray.setImage(newIcon);
    }

    formatLastSync() {
        if (!this.syncStats.lastSync) return 'Never';
        
        const now = new Date();
        const lastSync = new Date(this.syncStats.lastSync);
        const diffMs = now - lastSync;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    }

    showNotification(title, body) {
        // Show native notification
        if (process.platform === 'win32') {
            // Windows notification
            const { Notification } = require('electron');
            new Notification({
                title,
                body,
                icon: this.createTrayIcon()
            }).show();
        } else if (process.platform === 'darwin') {
            // macOS notification
            const { Notification } = require('electron');
            new Notification({
                title,
                body,
                icon: this.createTrayIcon()
            }).show();
        } else {
            // Linux notification
            const { Notification } = require('electron');
            new Notification({
                title,
                body,
                icon: this.createTrayIcon()
            }).show();
        }
    }

    updateSyncService() {
        // This would communicate with the actual sync service
        // to start/stop the file watching and uploading
        console.log(`Sync service ${this.syncStatus}`);
        
        // In a real implementation, this would:
        // 1. Send IPC message to sync service
        // 2. Start/stop file watchers
        // 3. Update sync statistics
        // 4. Handle errors and retries
    }
}

module.exports = FotofloSystemTray;




