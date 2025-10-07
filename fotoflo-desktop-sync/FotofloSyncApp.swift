import SwiftUI
import Combine

@main
struct FotofloSyncApp: App {
    @StateObject private var syncManager = SyncManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(syncManager)
                .frame(minWidth: 400, minHeight: 300)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }
}

class SyncManager: ObservableObject {
    @Published var isRunning = false
    @Published var statusMessage = "Ready to sync"
    @Published var serverUrl = "Auto-detecting..."
    @Published var hasError = false
    @Published var errorMessage = ""
    
    private var process: Process?
    private var cancellables = Set<AnyCancellable>()
    
    func startSync() {
        guard !isRunning else { return }
        
        isRunning = true
        statusMessage = "Starting Fotoflo Sync..."
        hasError = false
        errorMessage = ""
        
        // Check if Node.js is available
        guard checkNodeJS() else {
            handleError("Node.js not found. Please install Node.js from https://nodejs.org")
            return
        }
        
        // Start the sync service
        startSyncProcess()
    }
    
    func stopSync() {
        guard isRunning else { return }
        
        process?.terminate()
        process = nil
        isRunning = false
        statusMessage = "Stopped"
    }
    
    private func checkNodeJS() -> Bool {
        let task = Process()
        task.launchPath = "/usr/bin/which"
        task.arguments = ["node"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = pipe
        
        task.launch()
        task.waitUntilExit()
        
        return task.terminationStatus == 0
    }
    
    private func startSyncProcess() {
        process = Process()
        process?.launchPath = "/usr/bin/node"
        
        // Get the path to the sync service
        guard let bundlePath = Bundle.main.resourcePath else {
            handleError("Could not find app bundle")
            return
        }
        
        let syncScriptPath = "\(bundlePath)/sync-service.js"
        process?.arguments = [syncScriptPath]
        
        // Set up output handling
        let pipe = Pipe()
        process?.standardOutput = pipe
        process?.standardError = pipe
        
        // Handle process output
        pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if !data.isEmpty {
                if let output = String(data: data, encoding: .utf8) {
                    DispatchQueue.main.async {
                        self?.processOutput(output)
                    }
                }
            }
        }
        
        // Handle process termination
        process?.terminationHandler = { [weak self] process in
            DispatchQueue.main.async {
                self?.isRunning = false
                if process.terminationStatus != 0 {
                    self?.handleError("Sync service stopped unexpectedly")
                } else {
                    self?.statusMessage = "Stopped"
                }
            }
        }
        
        do {
            try process?.run()
            statusMessage = "Fotoflo Sync is running..."
            serverUrl = "Auto-detecting server..."
        } catch {
            handleError("Failed to start sync service: \(error.localizedDescription)")
        }
    }
    
    private func processOutput(_ output: String) {
        let lines = output.components(separatedBy: .newlines)
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmedLine.isEmpty { continue }
            
            if trimmedLine.contains("Using server URL:") {
                if let url = extractURL(from: trimmedLine) {
                    serverUrl = url
                }
            } else if trimmedLine.contains("✅") {
                statusMessage = trimmedLine
            } else if trimmedLine.contains("❌") || trimmedLine.contains("Error") {
                handleError(trimmedLine)
            }
        }
    }
    
    private func extractURL(from line: String) -> String? {
        // Extract URL from lines like "🌐 Using server URL: http://localhost:3003"
        let components = line.components(separatedBy: " ")
        if let urlIndex = components.firstIndex(of: "URL:") {
            let nextIndex = urlIndex + 1
            if nextIndex < components.count {
                return components[nextIndex]
            }
        }
        return nil
    }
    
    private func handleError(_ message: String) {
        hasError = true
        errorMessage = message
        isRunning = false
        statusMessage = "Error occurred"
    }
}

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

