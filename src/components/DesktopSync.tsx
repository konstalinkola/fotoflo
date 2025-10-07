'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FolderOpen, Play, Square, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SyncFolder {
  id: string;
  name: string;
  path: string;
  active: boolean;
  createdAt: string;
}

interface DesktopSyncProps {
  projectId: string;
  projectName: string;
}

export default function DesktopSync({ projectId, projectName }: DesktopSyncProps) {
  const [syncFolders, setSyncFolders] = useState<SyncFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPath, setNewFolderPath] = useState('');
  const [syncStatus, setSyncStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');

  useEffect(() => {
    fetchSyncFolders();
  }, [projectId]);

  const fetchSyncFolders = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sync-folders`);
      if (response.ok) {
        const folders = await response.json();
        setSyncFolders(folders);
      }
    } catch (error) {
      console.error('Failed to fetch sync folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSyncFolder = async () => {
    if (!newFolderName.trim() || !newFolderPath.trim()) {
      toast.error('Please provide both folder name and path');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/sync-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          path: newFolderPath
        })
      });

      if (response.ok) {
        const newFolder = await response.json();
        setSyncFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setNewFolderPath('');
        setAddingFolder(false);
        toast.success('Sync folder added successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add sync folder');
      }
    } catch (error) {
      toast.error('Failed to add sync folder');
    }
  };

  const toggleSyncFolder = async (folderId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sync-folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        setSyncFolders(prev => 
          prev.map(folder => 
            folder.id === folderId ? { ...folder, active } : folder
          )
        );
        toast.success(`Sync folder ${active ? 'activated' : 'deactivated'}`);
      } else {
        toast.error('Failed to update sync folder');
      }
    } catch (error) {
      toast.error('Failed to update sync folder');
    }
  };

  const deleteSyncFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this sync folder?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/sync-folders/${folderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSyncFolders(prev => prev.filter(folder => folder.id !== folderId));
        toast.success('Sync folder deleted');
      } else {
        toast.error('Failed to delete sync folder');
      }
    } catch (error) {
      toast.error('Failed to delete sync folder');
    }
  };

  const generateSyncCommand = () => {
    const serverUrl = window.location.origin;
    return `fotoflo-sync add-project --project-id ${projectId} --project-name "${projectName}" --server-url ${serverUrl}`;
  };

  const downloadDesktopClient = () => {
    // This would typically redirect to a download page
    window.open('/download-desktop-sync', '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading sync settings...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Desktop Sync Client
          </CardTitle>
          <CardDescription>
            Download the Fotoflo Desktop Sync Client to automatically upload photos to this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={downloadDesktopClient} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Desktop Client
            </Button>
            <Badge variant="secondary">Available for Windows, macOS, Linux</Badge>
          </div>
          
          <Alert>
            <AlertDescription>
              The desktop client allows you to sync photos by simply dropping them into designated folders on your computer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>


      {/* Sync Folders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Sync Folders
              </CardTitle>
              <CardDescription>
                Configure folders that will automatically sync to this project
              </CardDescription>
            </div>
            <Button 
              onClick={() => setAddingFolder(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Folder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncFolders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sync folders configured</p>
              <p className="text-sm">Add a folder to start syncing photos automatically</p>
            </div>
          ) : (
            <div className="space-y-3">
              {syncFolders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{folder.name}</p>
                        <Badge variant={folder.active ? "default" : "secondary"}>
                          {folder.active ? "Active" : "Inactive"}
                        </Badge>
                        {folder.active && (
                          <div className="flex items-center gap-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs">Monitoring</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{folder.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSyncFolder(folder.id, !folder.active)}
                    >
                      {folder.active ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSyncFolder(folder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {addingFolder && (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Add New Sync Folder</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Wedding Photos"
                  />
                </div>
                <div>
                  <Label htmlFor="folderPath">Folder Path</Label>
                  <div className="flex gap-2">
                    <Input
                      id="folderPath"
                      value={newFolderPath}
                      onChange={(e) => setNewFolderPath(e.target.value)}
                      placeholder="Select a folder or enter path manually"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          // Use the File System Access API for folder selection
                          if ('showDirectoryPicker' in window) {
                            const directoryHandle = await (window as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
                            setNewFolderPath(directoryHandle.name);
                            setNewFolderName(newFolderName || directoryHandle.name);
                          } else {
                            // Fallback for browsers that don't support the API
                            alert('Your browser doesn\'t support folder selection. Please enter the folder path manually.');
                          }
                        } catch (error) {
                          // User cancelled or error occurred
                          console.log('Folder selection cancelled or failed:', error);
                        }
                      }}
                      className="whitespace-nowrap"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Browse" to select a folder, or enter the path manually
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addSyncFolder}>Add Folder</Button>
                <Button variant="outline" onClick={() => setAddingFolder(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Desktop Sync Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium">1. Download</h4>
              <p className="text-sm text-gray-600">Download and install the desktop client</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FolderOpen className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium">2. Configure</h4>
              <p className="text-sm text-gray-600">Set up sync folders for your projects</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium">3. Sync</h4>
              <p className="text-sm text-gray-600">Drop photos and watch them sync automatically</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Supported Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time file watching and upload</li>
              <li>• Full EXIF data preservation</li>
              <li>• Duplicate prevention</li>
              <li>• Works with both single and collection mode projects</li>
              <li>• Cross-platform support (Windows, macOS, Linux)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
