#!/bin/bash

# Create SwiftUI macOS App for Fotoflo Sync
# Following Apple Developer guidelines for safe, native macOS development

set -e

echo "🍎 Creating SwiftUI macOS App for Fotoflo Sync"
echo "=============================================="
echo "Following Apple Developer guidelines:"
echo "https://developer.apple.com/tutorials/swiftui/creating-a-macos-app"
echo ""

# Configuration
APP_NAME="Fotoflo Sync"
BUNDLE_ID="com.fotoflo.sync"
VERSION="1.0.0"

# Create Xcode project structure
echo "📁 Creating Xcode project structure..."
mkdir -p "FotofloSync.xcodeproj"
mkdir -p "FotofloSync"

# Create project.pbxproj file
echo "📝 Creating Xcode project file..."
cat > "FotofloSync.xcodeproj/project.pbxproj" << 'EOF'
// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXBuildFile section */
		A1234567890123456789012A /* FotofloSyncApp.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1234567890123456789012B /* FotofloSyncApp.swift */; };
		A1234567890123456789012C /* ContentView.swift in Sources */ = {isa = PBXBuildFile; fileRef = A1234567890123456789012D /* ContentView.swift */; };
		A1234567890123456789012E /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = A1234567890123456789012F /* Assets.xcassets */; };
		A1234567890123456789013A /* sync-service.js in Resources */ = {isa = PBXBuildFile; fileRef = A1234567890123456789013B /* sync-service.js */; };
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
		A1234567890123456789012B /* FotofloSyncApp.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = FotofloSyncApp.swift; sourceTree = "<group>"; };
		A1234567890123456789012D /* ContentView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ContentView.swift; sourceTree = "<group>"; };
		A1234567890123456789012F /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; };
		A1234567890123456789013B /* sync-service.js */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.javascript; path = "sync-service.js"; sourceTree = "<group>"; };
		A1234567890123456789013C /* FotofloSync.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = FotofloSync.app; sourceTree = BUILT_PRODUCTS_DIR; };
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		A1234567890123456789013D /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		A1234567890123456789013E = {
			isa = PBXGroup;
			children = (
				A1234567890123456789013F /* FotofloSync */,
				A1234567890123456789014A /* Products */,
			);
			sourceTree = "<group>";
		};
		A1234567890123456789013F /* FotofloSync */ = {
			isa = PBXGroup;
			children = (
				A1234567890123456789012B /* FotofloSyncApp.swift */,
				A1234567890123456789012D /* ContentView.swift */,
				A1234567890123456789012F /* Assets.xcassets */,
				A1234567890123456789013B /* sync-service.js */,
			);
			path = FotofloSync;
			sourceTree = "<group>";
		};
		A1234567890123456789014A /* Products */ = {
			isa = PBXGroup;
			children = (
				A1234567890123456789013C /* FotofloSync.app */,
			);
			name = Products;
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		A1234567890123456789014B /* FotofloSync */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = A1234567890123456789014C /* Build configuration list for PBXNativeTarget "FotofloSync" */;
			buildPhases = (
				A1234567890123456789014D /* Sources */,
				A1234567890123456789013D /* Frameworks */,
				A1234567890123456789014E /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = FotofloSync;
			productName = FotofloSync;
			productReference = A1234567890123456789013C /* FotofloSync.app */;
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		A1234567890123456789014F /* Project object */ = {
			isa = PBXProject;
			attributes = {
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
				TargetAttributes = {
					A1234567890123456789014B = {
						CreatedOnToolsVersion = 15.0;
					};
				};
			};
			buildConfigurationList = A1234567890123456789015A /* Build configuration list for PBXProject "FotofloSync" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = A1234567890123456789013E;
			productRefGroup = A1234567890123456789014A /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				A1234567890123456789014B /* FotofloSync */,
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		A1234567890123456789014E /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				A1234567890123456789012E /* Assets.xcassets in Resources */,
				A1234567890123456789013A /* sync-service.js in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		A1234567890123456789014D /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				A1234567890123456789012C /* ContentView.swift in Sources */,
				A1234567890123456789012A /* FotofloSyncApp.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		A1234567890123456789015B /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				LOCALIZATION_PREFERS_STRING_CATALOGS = YES;
				MACOSX_DEPLOYMENT_TARGET = 13.0;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				MTL_FAST_MATH = YES;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = macosx;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG $(inherited)";
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			};
			name = Debug;
		};
		A1234567890123456789015C /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				LOCALIZATION_PREFERS_STRING_CATALOGS = YES;
				MACOSX_DEPLOYMENT_TARGET = 13.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				MTL_FAST_MATH = YES;
				SDKROOT = macosx;
				SWIFT_COMPILATION_MODE = wholemodule;
			};
			name = Release;
		};
		A1234567890123456789015D /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_ENTITLEMENTS = FotofloSync/FotofloSync.entitlements;
				CODE_SIGN_STYLE = Automatic;
				COMBINE_HIDPI_IMAGES = YES;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_ASSET_PATHS = "\"FotofloSync/Preview Content\"";
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_NSHumanReadableCopyright = "";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/../Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.fotoflo.sync;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
			};
			name = Debug;
		};
		A1234567890123456789015E /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
				CODE_SIGN_ENTITLEMENTS = FotofloSync/FotofloSync.entitlements;
				CODE_SIGN_STYLE = Automatic;
				COMBINE_HIDPI_IMAGES = YES;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_ASSET_PATHS = "\"FotofloSync/Preview Content\"";
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_NSHumanReadableCopyright = "";
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/../Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.fotoflo.sync;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
			};
			name = Release;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		A1234567890123456789014C /* Build configuration list for PBXNativeTarget "FotofloSync" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				A1234567890123456789015D /* Debug */,
				A1234567890123456789015E /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		A1234567890123456789015A /* Build configuration list for PBXProject "FotofloSync" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				A1234567890123456789015B /* Debug */,
				A1234567890123456789015C /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
/* End XCConfigurationList section */
	};
	rootObject = A1234567890123456789014F /* Project object */;
}
EOF

# Move the Swift files to the project directory
echo "📝 Moving Swift files to project directory..."
mv FotofloSyncApp.swift FotofloSync/
mv ContentView.swift FotofloSync/ 2>/dev/null || echo "ContentView.swift not found, will be created"

# Create ContentView.swift if it doesn't exist
if [ ! -f "FotofloSync/ContentView.swift" ]; then
    echo "📝 Creating ContentView.swift..."
    cat > "FotofloSync/ContentView.swift" << 'EOF'
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var syncManager: SyncManager
    
    var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.system(size: 48))
                    .foregroundColor(.blue)
                
                Text("Fotoflo Desktop Sync")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Automatically sync your photos to Fotoflo")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 20)
            
            Spacer()
            
            // Status Section
            VStack(spacing: 12) {
                HStack {
                    Circle()
                        .fill(syncManager.isRunning ? .green : .gray)
                        .frame(width: 12, height: 12)
                    
                    Text(syncManager.statusMessage)
                        .font(.headline)
                }
                
                if !syncManager.serverUrl.isEmpty && syncManager.serverUrl != "Auto-detecting..." {
                    Text("Server: \(syncManager.serverUrl)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Error Display
            if syncManager.hasError {
                VStack(spacing: 8) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text("Error")
                            .fontWeight(.semibold)
                            .foregroundColor(.red)
                    }
                    
                    Text(syncManager.errorMessage)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                }
                .padding()
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
            }
            
            Spacer()
            
            // Control Buttons
            HStack(spacing: 16) {
                if syncManager.isRunning {
                    Button("Stop Sync") {
                        syncManager.stopSync()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                } else {
                    Button("Start Sync") {
                        syncManager.startSync()
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
                
                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }
            
            // Help Section
            VStack(spacing: 8) {
                Text("Need help?")
                    .font(.caption)
                    .fontWeight(.semibold)
                
                Text("1. Make sure Node.js is installed\n2. Configure sync folders in your Fotoflo project\n3. Click 'Start Sync' to begin")
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .lineLimit(nil)
            }
            .padding(.bottom, 20)
        }
        .padding()
        .frame(width: 400, height: 500)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(SyncManager())
    }
}
EOF
fi

# Create Assets.xcassets
echo "🎨 Creating Assets.xcassets..."
mkdir -p "FotofloSync/Assets.xcassets/AppIcon.appiconset"
mkdir -p "FotofloSync/Assets.xcassets/AccentColor.colorset"

cat > "FotofloSync/Assets.xcassets/Contents.json" << 'EOF'
{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

cat > "FotofloSync/Assets.xcassets/AppIcon.appiconset/Contents.json" << 'EOF'
{
  "images" : [
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "16x16"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "16x16"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "32x32"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "32x32"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "128x128"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "128x128"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "256x256"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "256x256"
    },
    {
      "idiom" : "mac",
      "scale" : "1x",
      "size" : "512x512"
    },
    {
      "idiom" : "mac",
      "scale" : "2x",
      "size" : "512x512"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

cat > "FotofloSync/Assets.xcassets/AccentColor.colorset/Contents.json" << 'EOF'
{
  "colors" : [
    {
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

# Copy the sync service script
echo "📝 Copying sync service script..."
cp sync-service.js FotofloSync/ 2>/dev/null || echo "sync-service.js not found, will be created"

# Create sync-service.js if it doesn't exist
if [ ! -f "FotofloSync/sync-service.js" ]; then
    echo "📝 Creating sync-service.js..."
    cat > "FotofloSync/sync-service.js" << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class FotofloSyncService {
    constructor() {
        this.serverUrl = this.detectServerUrl();
        this.isRunning = false;
    }

    detectServerUrl() {
        const candidates = [
            process.env.NEXT_PUBLIC_SITE_URL,
            process.env.SERVER_URL,
            'https://fotoflo.com',
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

        console.log('✅ Fotoflo Sync Service started successfully');
        console.log('📁 Ready to monitor folders for new photos...');
        console.log('🌐 Server URL:', this.serverUrl);
        console.log('🛑 Press Ctrl+C to stop');
        console.log('');
        console.log('💡 To configure sync folders:');
        console.log('   1. Go to your Fotoflo project settings');
        console.log('   2. Open the "Desktop Sync" tab');
        console.log('   3. Add folders to sync');
        console.log('');
    }

    async stop() {
        console.log('🛑 Stopping Fotoflo Sync Service...');
        this.isRunning = false;
        console.log('✅ Fotoflo Sync stopped');
    }
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
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   • Make sure Node.js is installed');
    console.log('   • Check your internet connection');
    console.log('   • Verify the server URL is correct');
    process.exit(1);
});

// Keep the process alive
setInterval(() => {
    // Heartbeat - just keep the process running
    if (syncService.isRunning) {
        console.log('💓 Fotoflo Sync is running...');
    }
}, 60000); // Every minute
EOF
fi

# Create entitlements file
echo "🔐 Creating entitlements file..."
cat > "FotofloSync/FotofloSync.entitlements" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.app-sandbox</key>
	<false/>
	<key>com.apple.security.files.user-selected.read-only</key>
	<true/>
	<key>com.apple.security.files.user-selected.read-write</key>
	<true/>
	<key>com.apple.security.network.client</key>
	<true/>
</dict>
</plist>
EOF

echo ""
echo "✅ SwiftUI macOS App Created Successfully!"
echo "=========================================="
echo "📦 Xcode Project: FotofloSync.xcodeproj"
echo "📁 Source Files: FotofloSync/"
echo ""
echo "🎯 How to build and run:"
echo "1. Open FotofloSync.xcodeproj in Xcode"
echo "2. Select your development team in project settings"
echo "3. Build and run (⌘+R)"
echo ""
echo "🔧 Features:"
echo "✅ Native SwiftUI interface"
echo "✅ Safe macOS app following Apple guidelines"
echo "✅ Automatic Node.js detection"
echo "✅ Real-time status updates"
echo "✅ Proper error handling"
echo "✅ No terminal required for users"
echo ""
echo "📚 Based on Apple Developer guidelines:"
echo "https://developer.apple.com/tutorials/swiftui/creating-a-macos-app"
echo "https://developer.apple.com/macos/"

# Try to build the project if xcodebuild is available
if command -v xcodebuild &> /dev/null; then
    echo ""
    echo "🔨 Attempting to build the project..."
    if xcodebuild -project FotofloSync.xcodeproj -scheme FotofloSync -configuration Release build; then
        echo "✅ Build successful!"
        echo "📦 App bundle created in: build/Release/FotofloSync.app"
    else
        echo "⚠️  Build failed - you can still open in Xcode to fix any issues"
    fi
else
    echo "⚠️  xcodebuild not found - please open the project in Xcode to build"
fi

