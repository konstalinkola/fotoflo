const { app, BrowserWindow, dialog, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

class FotofloInstaller {
    constructor() {
        this.mainWindow = null;
        this.installPath = '';
        this.selectedProjects = [];
        this.selectedFolders = {};
    }

    createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 600,
            height: 700,
            resizable: false,
            maximizable: false,
            minimizable: false,
            show: false,
            frame: false,
            titleBarStyle: 'hiddenInset',
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            icon: this.createAppIcon()
        });

        // Load the installer HTML
        this.mainWindow.loadFile(path.join(__dirname, 'visual-installer.html'));

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Setup IPC handlers
        this.setupIpcHandlers();
    }

    createAppIcon() {
        // Create a simple icon for the app
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple "F" logo
        ctx.fillStyle = '#667eea';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('F', 32, 42);
        
        return nativeImage.createFromDataURL(canvas.toDataURL());
    }

    setupIpcHandlers() {
        // Handle authentication
        ipcMain.handle('authenticate', async (event, credentials) => {
            try {
                // Make API call to authenticate user
                const response = await fetch(`${credentials.serverUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, token: data.token };
                } else {
                    return { success: false, error: 'Invalid credentials' };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Handle project loading
        ipcMain.handle('loadProjects', async (event, serverUrl) => {
            try {
                const response = await fetch(`${serverUrl}/api/projects`, {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                });

                if (response.ok) {
                    const projects = await response.json();
                    return { success: true, projects };
                } else {
                    return { success: false, error: 'Failed to load projects' };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Handle folder selection
        ipcMain.handle('selectFolder', async (event, projectId) => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'],
                title: `Select folder for project: ${projectId}`
            });

            if (!result.canceled && result.filePaths.length > 0) {
                return { success: true, folderPath: result.filePaths[0] };
            } else {
                return { success: false, error: 'No folder selected' };
            }
        });

        // Handle installation
        ipcMain.handle('installApp', async (event, config) => {
            try {
                return await this.performInstallation(config);
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Handle app quit
        ipcMain.handle('quitApp', () => {
            app.quit();
        });
    }

    async performInstallation(config) {
        const installSteps = [
            {
                name: 'Creating installation directory',
                action: () => this.createInstallDirectory()
            },
            {
                name: 'Installing Fotoflo Sync',
                action: () => this.installSyncApp()
            },
            {
                name: 'Configuring sync settings',
                action: () => this.configureSyncSettings(config)
            },
            {
                name: 'Setting up system integration',
                action: () => this.setupSystemIntegration()
            },
            {
                name: 'Starting background service',
                action: () => this.startBackgroundService()
            }
        ];

        for (const step of installSteps) {
            try {
                await step.action();
                // Send progress update to renderer
                this.mainWindow.webContents.send('installProgress', {
                    step: step.name,
                    completed: true
                });
            } catch (error) {
                throw new Error(`Failed at step "${step.name}": ${error.message}`);
            }
        }

        return { success: true };
    }

    createInstallDirectory() {
        const installDir = path.join(process.env.APPDATA || process.env.HOME, 'Fotoflo Sync');
        
        if (!fs.existsSync(installDir)) {
            fs.mkdirSync(installDir, { recursive: true });
        }
        
        this.installPath = installDir;
    }

    installSyncApp() {
        // Copy the sync app files to installation directory
        const sourcePath = path.join(__dirname, '..', 'dist');
        const destPath = path.join(this.installPath, 'app');
        
        if (fs.existsSync(sourcePath)) {
            this.copyDirectory(sourcePath, destPath);
        } else {
            throw new Error('Sync app files not found');
        }
    }

    configureSyncSettings(config) {
        const configPath = path.join(this.installPath, 'config.json');
        const syncConfig = {
            serverUrl: config.serverUrl,
            authToken: config.authToken,
            projects: config.selectedProjects.map(projectId => ({
                id: projectId,
                folderPath: config.selectedFolders[projectId],
                active: true
            })),
            settings: {
                autoStart: true,
                minimizeToTray: true,
                notifications: true
            }
        };

        fs.writeFileSync(configPath, JSON.stringify(syncConfig, null, 2));
    }

    setupSystemIntegration() {
        // Create desktop shortcut
        this.createDesktopShortcut();
        
        // Setup auto-start (platform specific)
        this.setupAutoStart();
    }

    createDesktopShortcut() {
        const shortcutPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'Fotoflo Sync.lnk');
        const targetPath = path.join(this.installPath, 'app', 'fotoflo-sync.exe');
        
        // Create shortcut (Windows specific - would need different approach for macOS/Linux)
        if (process.platform === 'win32') {
            const shell = require('shell');
            shell.writeShortcutLinkSync(shortcutPath, {
                target: targetPath,
                description: 'Fotoflo Desktop Sync',
                icon: targetPath,
                iconIndex: 0
            });
        }
    }

    setupAutoStart() {
        // Platform-specific auto-start setup
        if (process.platform === 'win32') {
            // Windows registry or startup folder
            const startupPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
            const shortcutPath = path.join(startupPath, 'Fotoflo Sync.lnk');
            this.createDesktopShortcut(); // Reuse shortcut creation
        } else if (process.platform === 'darwin') {
            // macOS LaunchAgent
            const launchAgentPath = path.join(process.env.HOME, 'Library', 'LaunchAgents', 'com.fotoflo.sync.plist');
            const plistContent = this.createMacOSLaunchAgent();
            fs.writeFileSync(launchAgentPath, plistContent);
        } else {
            // Linux systemd user service or autostart
            const autostartPath = path.join(process.env.HOME, '.config', 'autostart', 'fotoflo-sync.desktop');
            const desktopContent = this.createLinuxDesktopFile();
            fs.writeFileSync(autostartPath, desktopContent);
        }
    }

    createMacOSLaunchAgent() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.fotoflo.sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>${path.join(this.installPath, 'app', 'fotoflo-sync')}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>`;
    }

    createLinuxDesktopFile() {
        return `[Desktop Entry]
Type=Application
Name=Fotoflo Sync
Comment=Automatic photo synchronization
Exec=${path.join(this.installPath, 'app', 'fotoflo-sync')}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true`;
    }

    startBackgroundService() {
        const syncAppPath = path.join(this.installPath, 'app', 'fotoflo-sync');
        
        if (fs.existsSync(syncAppPath)) {
            // Start the sync service
            exec(`"${syncAppPath}" start`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Failed to start sync service:', error);
                }
            });
        }
    }

    copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }

        const files = fs.readdirSync(source);
        
        for (const file of files) {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        }
    }
}

// App event handlers
app.whenReady().then(() => {
    const installer = new FotofloInstaller();
    installer.createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            installer.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

module.exports = FotofloInstaller;



