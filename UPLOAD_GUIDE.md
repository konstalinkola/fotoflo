# Upload Guide for Fotoflo Desktop Sync Downloads

## 🚀 Quick Upload (Recommended for Vercel)

Since you're using Vercel for deployment, the easiest way is to commit and push the files:

```bash
# Add the new download files to git
git add public/downloads/fotoflo-sync-macos-arm64.zip
git add public/downloads/fotoflo-sync-macos-x64.zip

# Commit the changes
git commit -m "Add Mac desktop sync standalone executables

- Added Apple Silicon (M1/M2/M3) version: fotoflo-sync-macos-arm64.zip
- Added Intel Mac version: fotoflo-sync-macos-x64.zip
- Updated Desktop Sync page to use new standalone executables
- No Node.js installation required for end users"

# Push to trigger Vercel deployment
git push origin main
```

After pushing, Vercel will automatically deploy the files and they'll be available at:
- `https://fotoflo.co/downloads/fotoflo-sync-macos-arm64.zip`
- `https://fotoflo.co/downloads/fotoflo-sync-macos-x64.zip`

## 📋 Alternative Upload Methods

### Method 1: Direct Server Upload (if you have server access)

```bash
# Upload to your server's public directory
scp public/downloads/fotoflo-sync-macos-arm64.zip user@your-server:/path/to/public/downloads/
scp public/downloads/fotoflo-sync-macos-x64.zip user@your-server:/path/to/public/downloads/
```

### Method 2: CDN/Static Hosting

If you're using a CDN or static file hosting service:

1. Upload both `.zip` files to your static hosting
2. Ensure they're accessible at the expected URLs
3. Test the downloads from your Desktop Sync page

### Method 3: Manual File Management

If you have a file manager or admin panel:

1. Navigate to your server's public directory
2. Upload the two `.zip` files to the `downloads/` folder
3. Verify the files are accessible via web browser

## ✅ Verification Steps

After uploading, verify everything works:

1. **Test Direct Downloads:**
   ```bash
   curl -I https://fotoflo.co/downloads/fotoflo-sync-macos-arm64.zip
   curl -I https://fotoflo.co/downloads/fotoflo-sync-macos-x64.zip
   ```
   Both should return `200 OK` status.

2. **Test Desktop Sync Page:**
   - Visit `https://fotoflo.co/settings/desktop-sync`
   - Click both download buttons
   - Verify files download correctly

3. **Test Downloaded Files:**
   - Unzip the downloaded files
   - Run the executables to ensure they work
   - Verify they connect to `https://fotoflo.co`

## 📁 File Details

| File | Size | Target | Description |
|------|------|--------|-------------|
| `fotoflo-sync-macos-arm64.zip` | ~18MB | Apple Silicon Macs (M1/M2/M3) | Standalone executable, no Node.js required |
| `fotoflo-sync-macos-x64.zip` | ~20MB | Intel Macs | Standalone executable, no Node.js required |

## 🎯 What's Updated

- ✅ Desktop Sync page now shows two download buttons
- ✅ Files are ready in `public/downloads/`
- ✅ Source code examples updated to use `fotoflo.co`
- ✅ Installation instructions updated for standalone executables
- ✅ No more Node.js requirement for end users

## 🚨 Important Notes

- The files are already in the correct location (`public/downloads/`)
- The Desktop Sync page is already updated to use these files
- Users will now get standalone executables that work without Node.js
- Both files are updated to use the `fotoflo.co` domain

## 🆘 Troubleshooting

If downloads don't work after upload:

1. **Check file permissions:** Ensure files are readable by web server
2. **Verify URLs:** Test direct access to the download URLs
3. **Check server logs:** Look for any 404 or permission errors
4. **Clear cache:** Clear browser cache and try again

## 📞 Support

If you need help with the upload process:
- Check your deployment platform's documentation
- Verify your server's public directory structure
- Test with a simple text file first to confirm the upload process works
