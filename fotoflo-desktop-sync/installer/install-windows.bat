@echo off
REM Fotoflo Desktop Sync - Windows Installer

echo 🚀 Installing Fotoflo Desktop Sync...

REM Create installation directory
set INSTALL_DIR="C:\Program Files\Fotoflo Sync"
mkdir %INSTALL_DIR%

REM Copy the binary
copy "dist\fotoflo-sync-windows.exe" %INSTALL_DIR%\fotoflo-sync.exe

REM Add to PATH
setx PATH "%PATH%;%INSTALL_DIR%" /M

REM Create desktop shortcut
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Fotoflo Sync.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\fotoflo-sync.exe'; $Shortcut.Arguments = 'setup'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Fotoflo Desktop Sync'; $Shortcut.Save()"

REM Create start menu shortcut
set START_MENU="%APPDATA%\Microsoft\Windows\Start Menu\Programs"
mkdir "%START_MENU%\Fotoflo Sync"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU%\Fotoflo Sync\Fotoflo Sync.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\fotoflo-sync.exe'; $Shortcut.Arguments = 'setup'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Fotoflo Desktop Sync'; $Shortcut.Save()"

echo ✅ Installation complete!
echo.
echo 🎉 Fotoflo Desktop Sync is now installed!
echo 📁 Installation: %INSTALL_DIR%
echo 💻 Command line: fotoflo-sync
echo.
echo 🚀 Next steps:
echo 1. Look for "Fotoflo Sync" in your Start Menu
echo 2. Or run "fotoflo-sync setup" in Command Prompt
echo 3. Follow the guided setup to add your projects
echo.
pause
