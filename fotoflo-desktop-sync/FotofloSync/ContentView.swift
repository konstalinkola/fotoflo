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
