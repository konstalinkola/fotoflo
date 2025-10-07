# 🛡️ macOS Security Warning - How to Fix

## The Warning Message
> "Apple ei voinut vahvistaa, että Fotoflo-Sync-macOS (1) ei sisällä haittaohjelmia, jotka voivat vahingoittaa Maciasi tai vaarantaa tietosuojasi."
> 
> Translation: "Apple could not verify that Fotoflo-Sync-macOS (1) does not contain malware that could harm your Mac or compromise your privacy."

## Why This Happens
This warning appears because:
- The Fotoflo Sync app is not signed with an Apple Developer certificate
- macOS Gatekeeper blocks unsigned applications by default
- This is a security feature to protect users from malware

## ✅ How to Fix It (3 Easy Methods)

### Method 1: Right-Click and Open (Recommended)
1. **Right-click** on the `Fotoflo-Sync-macOS` file
2. Select **"Open"** from the context menu
3. Click **"Open"** when the warning appears
4. The app will be added to your allowed applications

### Method 2: System Preferences Override
1. Go to **System Preferences** (or **System Settings** on macOS 13+)
2. Click **"Security & Privacy"**
3. Go to the **"General"** tab
4. Look for a message about Fotoflo-Sync
5. Click **"Open Anyway"**
6. Confirm by clicking **"Open"**

### Method 3: Terminal Command (Advanced)
1. Open **Terminal** (Applications → Utilities → Terminal)
2. Type this command (replace with your actual path):
   ```bash
   sudo xattr -rd com.apple.quarantine /path/to/Fotoflo-Sync-macOS
   ```
3. Press Enter and enter your password when prompted

## 🔐 Future Solution: Code Signing

To eliminate this warning completely, we need to:
1. **Apple Developer Program** membership ($99/year)
2. **Developer ID Application** certificate
3. **Code signing** the application
4. **Notarization** for macOS 10.15+ compatibility

### Current Status
- ✅ **App is safe** - No malware, just unsigned
- ✅ **Functionality works** - All features work normally after allowing
- ⚠️ **Security warning** - Will appear until code-signed
- 🔄 **In progress** - Working on proper signing solution

## 🚀 Alternative: Use the Web Version

If you prefer to avoid the security warning:
1. Go to your Fotoflo project settings
2. Use the **"Desktop Sync"** tab in the web interface
3. Configure sync folders directly in the browser
4. No desktop app installation required

## 📞 Need Help?

If you continue having issues:
- **Email**: support@fotoflo.com
- **Documentation**: https://fotoflo.com/help/desktop-sync
- **Community**: https://fotoflo.com/community

## 🔒 Security Note

Fotoflo Sync is completely safe:
- ✅ **Open source** - Code is publicly available
- ✅ **No malware** - Thoroughly scanned and tested
- ✅ **Privacy focused** - Only syncs your photos to your projects
- ✅ **Secure connection** - All data encrypted in transit

The security warning is just macOS being cautious with unsigned applications.



