# Desktop Sync Versioning Guide

## Current Version: 1.0.1

### How to Update Version

1. **Update package.json:**
   ```json
   {
     "version": "1.0.2"
   }
   ```

2. **Rebuild with versioned filenames:**
   ```bash
   ./build-mac-only.sh
   ```

3. **Files will be created as:**
   - `fotoflo-sync-macos-arm64-1.0.2.zip`
   - `fotoflo-sync-macos-x64-1.0.2.zip`
   - `fotoflo-sync-macos-universal-1.0.2.zip`

### Version History

- **1.0.1** - Fixed API integration and file watching functionality
- **1.0.0** - Initial standalone executable release

### Security Considerations

For production distribution, consider:
- Code signing with Apple Developer certificate
- Notarization by Apple
- This will eliminate Chrome security warnings

### Future Improvements

- Add automatic version detection in the sync client
- Implement update notifications
- Add changelog tracking
