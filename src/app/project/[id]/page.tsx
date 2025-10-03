"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import FileUpload from "@/components/FileUpload";
import ImageGallery from "@/components/ImageGallery";
import NewCollection from "@/components/NewCollection";
import Sidebar from "@/components/Sidebar";

// Import ImageData interface
interface ImageData {
	id: string;
	name: string;
	path: string;
	created_at: string;
	capture_time?: string | null;
	size?: number;
	url: string | null;
	source: string;
	camera_make?: string | null;
	camera_model?: string | null;
	lens_model?: string | null;
	focal_length?: number | null;
	aperture?: number | null;
	shutter_speed?: string | null;
	iso?: number | null;
	flash?: boolean | null;
	width?: number | null;
	height?: number | null;
	gps_latitude?: number | null;
	gps_longitude?: number | null;
	gps_altitude?: number | null;
}
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PanelLeft, 
  Settings, 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon,
  Plus
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Project {
  id: string;
  name: string;
  logo_url?: string;
  background_color?: string;
  storage_bucket?: string;
  storage_prefix?: string;
  qr_visibility_duration?: number;
  qr_expires_on_click?: boolean;
  created_at?: string;
  display_mode?: 'single' | 'collection';
}

export default function ProjectPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
  const projectId = params.id;
  
  const [user, setUser] = useState<{id: string; email?: string} | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
	const [uploadMessage, setUploadMessage] = useState("");
	const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [galleryView, setGalleryView] = useState<'grid' | 'list'>('grid');
  const [gallerySelectMode, setGallerySelectMode] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [selectedImagesCount, setSelectedImagesCount] = useState(0);
  const [displayMode, setDisplayMode] = useState<'single' | 'collection'>('single' as 'single' | 'collection');
  const [selectedForCollection, setSelectedForCollection] = useState<Set<string>>(new Set());
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [activeCollection, setActiveCollection] = useState<{id: string; name: string; cover_image_url?: string} | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [deletingCollections, setDeletingCollections] = useState(false);


	useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();
      setSupabaseClient(supabase);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/project/" + projectId);
        return;
      }
      setUser(user);

      // Load projects for sidebar
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, logo_url")
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);

      // Load current project
      if (projectId) {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const projectData = await res.json();
          setProject(projectData);
          setDisplayMode((projectData.display_mode as 'single' | 'collection') || 'single');
        }
      }
      
      setLoading(false);
      
      // Load active image and all images
      if (projectId) {
        fetchActiveImage();
        fetchAllImages();
      }
    }

    loadData();
  }, [projectId, router]);

  // Fetch images when gallery refreshes
  useEffect(() => {
    if (projectId && galleryRefresh > 0) {
      fetchAllImages();
    }
  }, [galleryRefresh, projectId]);

  // Auto-activate the latest collection when collections are loaded
  useEffect(() => {
    if ((displayMode as string) === 'collection' && allImages.length > 0 && !activeCollection) {
      // Fetch collections to find the latest one
      fetchLatestCollection();
    }
  }, [displayMode, allImages.length, activeCollection]);

  const fetchLatestCollection = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/collections`);
      if (response.ok) {
        const collections = await response.json();
        if (collections && collections.length > 0) {
          // Sort by creation date and get the latest
          const latestCollection = collections.sort((a: {created_at: string}, b: {created_at: string}) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          setActiveCollection(latestCollection);
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest collection:', error);
    }
  };



  const handleUploadSuccess = (uploadedData?: { paths: string[], ids: string[] }) => {
    if (uploadedData) {
      // Always save to database and refresh gallery (same for both modes)
      setUploadMessage("Photo uploaded successfully!");
      setGalleryRefresh(prev => prev + 1);
      
      if ((displayMode as string) === 'collection') {
        // Auto-select newly uploaded images for the collection
        setSelectedForCollection(prev => {
          const newSet = new Set(prev);
          uploadedData.ids.forEach(id => newSet.add(id));
          return newSet;
        });
        setUploadMessage(`${uploadedData.paths.length} image(s) uploaded and selected for new collection.`);
      } else {
        // In single mode, also update active image
        fetchActiveImage();
      }
    }
		setTimeout(() => setUploadMessage(""), 3000);
	};

	const handleUploadError = (error: string) => {
		setUploadMessage(`Upload failed: ${error}`);
		setTimeout(() => setUploadMessage(""), 5000);
	};

  const handleSaveCollection = async () => {
    if (!supabaseClient || selectedForCollection.size === 0) return;

    try {
      // Create a new collection
      const response = await fetch(`/api/projects/${projectId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create collection: ${errorData.error || 'Unknown error'}`);
      }

      const collection = await response.json();

      // Add selected images to the collection
      const selectedImageIds = Array.from(selectedForCollection);
      
      const addImagesResponse = await fetch(`/api/projects/${projectId}/collections/${collection.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_ids: selectedImageIds })
      });

      if (!addImagesResponse.ok) {
        const errorData = await addImagesResponse.json();
        throw new Error(`Failed to add images to collection: ${errorData.error || 'Unknown error'}`);
      }

      // Clear the selection
      setSelectedForCollection(new Set());
      setUploadMessage(`Collection #${collection.collection_number} created with ${selectedImageIds.length} images!`);
      setTimeout(() => setUploadMessage(""), 3000);
      
      // Auto-activate the newly created collection
      setActiveCollection(collection);
      
      // Refresh gallery to show the new collection
      setGalleryRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error saving collection:', error);
      setUploadMessage(`Failed to save collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setUploadMessage(""), 5000);
    }
  };

  const handleClearCollection = () => {
    setSelectedForCollection(new Set());
    setUploadMessage("Selection cleared.");
    setTimeout(() => setUploadMessage(""), 2000);
  };

  const handleToggleImageSelection = (imageId: string) => {
    setSelectedForCollection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleCollectionActivation = (collection: {id: string; name: string}) => {
    setActiveCollection(collection);
  };

  const handleToggleCollectionSelection = (collectionId: string) => {
    console.log('🎯 handleToggleCollectionSelection called with:', collectionId);
    setSelectedCollections(prev => {
      const newSet = new Set(prev);
      const hadId = newSet.has(collectionId);
      if (hadId) {
        newSet.delete(collectionId);
        console.log('🗑️ Removed collection from selection');
      } else {
        newSet.add(collectionId);
        console.log('✅ Added collection to selection');
      }
      console.log('📊 New selection set:', Array.from(newSet));
      return newSet;
    });
  };

  const handleDeleteSelectedCollections = async () => {
    if (selectedCollections.size === 0) return;

    setDeletingCollections(true);
    try {
      const deletePromises = Array.from(selectedCollections).map(async (collectionId) => {
        const response = await fetch(`/api/projects/${projectId}/collections/${collectionId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete collection ${collectionId}`);
        }
        
        return collectionId;
      });

      await Promise.all(deletePromises);
      
      // Clear selection and refresh gallery
      setSelectedCollections(new Set());
      setGalleryRefresh(prev => prev + 1);
      
      // Clear active collection if it was deleted
      if (activeCollection && selectedCollections.has(activeCollection.id)) {
        setActiveCollection(null);
      }
      
      setUploadMessage(`${selectedCollections.size} collection(s) deleted successfully!`);
      setTimeout(() => setUploadMessage(""), 3000);
      
    } catch (error) {
      console.error('Error deleting collections:', error);
      setUploadMessage(`Failed to delete collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setUploadMessage(""), 5000);
    } finally {
      setDeletingCollections(false);
    }
  };

  const fetchActiveImage = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/active-image`);
      if (response.ok) {
        const data = await response.json();
        setActiveImageUrl(data.active_image_url || null);
      }
    } catch (error) {
      console.error("Failed to fetch active image:", error);
    }
  };

  const fetchAllImages = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/images`);
      if (response.ok) {
        const data = await response.json();
        setAllImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  const handleActiveImageChange = (imageUrl: string | null) => {
    setActiveImageUrl(imageUrl);
  };


	if (loading) return (
    <div className="h-screen bg-white flex overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        projects={projects}
        supabaseClient={supabaseClient}
      />
      <div className="flex-1 p-8">Loading…</div>
		</div>
	);

	return (
    <div className="h-screen bg-white flex overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        projects={projects}
        supabaseClient={supabaseClient}
      />
      
      <div className="flex-1 flex flex-col">
				{/* Header */}
        <div className="h-16 border-b border-neutral-200 flex items-center px-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-7 h-7 p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-neutral-200" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{project?.name || "Project"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            <div className="h-full flex flex-col p-6">
              {/* Page Header */}
              <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between">
					<div>
                    <h1 className="text-[30px] font-bold leading-[36px] text-neutral-950">
                      {project?.name || "Project"}
                    </h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => window.open(`/public/${projectId}`, '_blank')}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white h-9 px-4"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Public Page
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/project/${projectId}/settings`)}
                      className="h-9 px-4"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Project settings
                    </Button>
                  </div>
					</div>
				</div>

              {/* Content Grid - Takes remaining height */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Upload and Gallery/Collection (50% width) */}
                <div className="flex flex-col gap-6 min-h-0">
                  {/* Upload Images Section - Calculated to fill remaining space after 2x5 grid */}
                  <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: 'calc(50% - 12px)' }}>
                    <h2 className="text-xl font-semibold text-neutral-950 mb-4 flex-shrink-0">Upload images</h2>
                    <Card className="border border-neutral-200 rounded-lg flex-1 min-h-0">
                      <CardContent className="p-6 h-full flex flex-col justify-center">
							<FileUpload 
                          projectId={projectId} 
								onUploadSuccess={handleUploadSuccess}
								onUploadError={handleUploadError}
							/>
							{uploadMessage && (
                          <div className={`mt-4 p-3 rounded-lg text-sm ${
                            uploadMessage.includes("successfully") || uploadMessage.includes("added") || uploadMessage.includes("created")
                              ? "bg-green-50 text-green-700 border border-green-200" 
                              : "bg-red-50 text-red-700 border border-red-200"
								}`}>
									{uploadMessage}
								</div>
							)}
                      </CardContent>
                    </Card>
                  </div>

                  {displayMode === 'single' ? (
                    /* Gallery Section for Single Mode - Fixed height for 2x5 grid */
                    <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: 'calc(50% - 12px)' }}>
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-neutral-950">Gallery</h2>
                        <div className="flex items-center gap-3">
                          {(displayMode as string) === 'collection' ? (
                            // Collection mode: show collection deletion controls
                            <>
                              {selectedCollections.size > 0 && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                                  onClick={handleDeleteSelectedCollections}
                                  disabled={deletingCollections}
                                >
                                  {deletingCollections ? 'Deleting...' : `Delete (${selectedCollections.size})`}
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3"
                                onClick={() => {
                                  console.log('🔥 Select button clicked! Current gallerySelectMode:', gallerySelectMode);
                                  setGallerySelectMode(!gallerySelectMode);
                                  if (gallerySelectMode) {
                                    setSelectedCollections(new Set());
                                  }
                                  console.log('🔥 New gallerySelectMode will be:', !gallerySelectMode);
                                }}
                              >
                                Select
                              </Button>
                            </>
                          ) : (
                            // Single mode: show image deletion controls
                            <>
                          {(displayMode as string) === 'collection' ? (
                            // Collection mode: show collection deletion controls
                            <>
                              {selectedCollections.size > 0 && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                                  onClick={handleDeleteSelectedCollections}
                                  disabled={deletingCollections}
                                >
                                  {deletingCollections ? 'Deleting...' : `Delete (${selectedCollections.size})`}
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3"
                                onClick={() => {
                                  console.log('🔥 Select button clicked! Current gallerySelectMode:', gallerySelectMode);
                                  setGallerySelectMode(!gallerySelectMode);
                                  if (gallerySelectMode) {
                                    setSelectedCollections(new Set());
                                  }
                                  console.log('🔥 New gallerySelectMode will be:', !gallerySelectMode);
                                }}
                              >
                                Select
                              </Button>
                            </>
                          ) : (
                            // Single mode: show image deletion controls
                            <>
                              {selectedImagesCount > 0 && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => {
                                    // Trigger delete from gallery component
                                    const event = new CustomEvent('deleteSelectedImages');
                                    window.dispatchEvent(event);
                                  }}
                                >
                                  Delete ({selectedImagesCount})
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3"
                                onClick={() => {
                                  setGallerySelectMode(!gallerySelectMode);
                                  if (gallerySelectMode) {
                                    setSelectedImagesCount(0);
                                  }
                                }}
                              >
                                Select
                              </Button>
                            </>
                          )}
                            </>
                          )}
                          <div className="flex items-center border border-neutral-200 rounded-lg">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-8 px-2 ${galleryView === 'list' ? 'bg-neutral-100' : ''}`}
                              onClick={() => setGalleryView('list')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-8 px-2 ${galleryView === 'grid' ? 'bg-neutral-100' : ''}`}
                              onClick={() => setGalleryView('grid')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </Button>
                          </div>
							</div>
						</div>
                      <Card className="border border-neutral-200 rounded-lg flex-1 min-h-0">
                        <CardContent className="px-3 py-1 h-full overflow-auto">
						<ImageGallery 
                            projectId={projectId} 
                            displayMode={displayMode}
							key={galleryRefresh}
                            viewMode={galleryView}
                            selectMode={gallerySelectMode}
                            onSelectModeChange={setGallerySelectMode}
                            onActiveImageChange={handleActiveImageChange}
                            onSelectionCountChange={setSelectedImagesCount}
                            selectedForCollection={selectedForCollection}
                            onToggleCollectionSelection={handleToggleImageSelection}
                            onCollectionActivation={handleCollectionActivation}
                            selectedCollections={selectedCollections}
                            onToggleCollectionDeletion={handleToggleCollectionSelection}
                            onDeleteSelectedCollections={handleDeleteSelectedCollections}
                            activeCollectionId={activeCollection?.id}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* New Collection Section for Collection Mode - Fixed height for 2x5 grid */
                    <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: 'calc(50% - 12px)' }}>
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-neutral-950">New collection</h2>
                          {selectedForCollection.size > 0 && (
                            <>
                              <span className="text-sm text-neutral-600">({selectedForCollection.size})</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearCollection}
                                className="h-7 px-2 text-xs"
                              >
                                Clear
                              </Button>
                            </>
                          )}
					</div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => handleSaveCollection()}
                            disabled={selectedForCollection.size === 0}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                          </Button>
                          <div className="flex items-center border border-neutral-200 rounded-lg">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-8 px-2 ${galleryView === 'list' ? 'bg-neutral-100' : ''}`}
                              onClick={() => setGalleryView('list')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-8 px-2 ${galleryView === 'grid' ? 'bg-neutral-100' : ''}`}
                              onClick={() => setGalleryView('grid')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
								</svg>
                            </Button>
                          </div>
                        </div>
										</div>
                      <Card className="border border-neutral-200 rounded-lg flex-1 min-h-0">
                        <CardContent className="px-3 py-1 h-full overflow-auto">
                          <NewCollection
                            selectedImages={allImages.filter(img => selectedForCollection.has(img.id)).map(img => ({
                              id: img.id,
                              path: img.path,
                              url: img.url,
                              name: img.name
                            }))}
                            onSave={handleSaveCollection}
                            onClear={handleClearCollection}
                            onToggleSelection={handleToggleImageSelection}
                          />
                        </CardContent>
                      </Card>
												</div>
											)}
										</div>
										
                {/* Right Column - Active Photo or Gallery (50% width) */}
                {displayMode === 'single' ? (
                  /* Active Photo for Single Mode - Full height to match Upload */
                  <div className="flex flex-col min-h-0">
                    <h2 className="text-xl font-semibold text-neutral-950 mb-4 flex-shrink-0">Active photo</h2>
                    <div className="border border-neutral-200 rounded-lg flex-1 min-h-0 overflow-hidden bg-neutral-100 flex items-center justify-center">
                      {activeImageUrl ? (
                        <Image 
                          src={activeImageUrl} 
                          alt="Active photo"
                          width={600}
                          height={600}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-neutral-400 text-lg">No active photo</div>
                      )}
										</div>
									</div>
                ) : (
                  /* Active Collection + Gallery for Collection Mode */
                  <div className="flex flex-col gap-6 min-h-0">
                    {/* Active Collection Section - Same height as Upload */}
                    <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: 'calc(50% - 12px)' }}>
                      <h2 className="text-xl font-semibold text-neutral-950 mb-4 flex-shrink-0 truncate">Active collection</h2>
                      <div className="border border-neutral-200 rounded-lg flex-1 min-h-0 overflow-hidden bg-neutral-100 flex items-center justify-center">
                        {activeCollection ? (
                          <div className="w-full h-full relative">
                            {activeCollection.cover_image_url ? (
                              <Image
                                src={activeCollection.cover_image_url}
                                alt={`Collection ${activeCollection.name} cover`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <div className="text-center">
                                  <div className="text-lg font-medium">Collection #{activeCollection.collection_number}</div>
                                  <div className="text-sm">{activeCollection.collection_images?.length || 0} images</div>
									</div>
								</div>
							)}
                            {/* Collection info overlay */}
                            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded">
                              #{activeCollection.collection_number}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded">
                              {activeCollection.collection_images?.length || 0} images
                            </div>
                          </div>
                        ) : (
                          <div className="text-neutral-400 text-lg">No active collection</div>
                        )}
                      </div>
						</div>

                    {/* Gallery Section - Same height as New Collection */}
                    <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: 'calc(50% - 12px)' }}>
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-neutral-950">Gallery</h2>
                        <div className="flex items-center gap-3">
                          {(displayMode as string) === 'collection' ? (
                            // Collection mode: show collection deletion controls
                            <>
                              {selectedCollections.size > 0 && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                                  onClick={handleDeleteSelectedCollections}
                                  disabled={deletingCollections}
                                >
                                  {deletingCollections ? 'Deleting...' : `Delete (${selectedCollections.size})`}
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3"
                                onClick={() => {
                                  console.log('🔥 Select button clicked! Current gallerySelectMode:', gallerySelectMode);
                                  setGallerySelectMode(!gallerySelectMode);
                                  if (gallerySelectMode) {
                                    setSelectedCollections(new Set());
                                  }
                                  console.log('🔥 New gallerySelectMode will be:', !gallerySelectMode);
                                }}
                              >
                                Select
                              </Button>
                            </>
                          ) : (
                            // Single mode: show image deletion controls
                            <>
                              {selectedImagesCount > 0 && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => {
                                    // Trigger delete from gallery component
                                    const event = new CustomEvent('deleteSelectedImages');
                                    window.dispatchEvent(event);
                                  }}
                                >
                                  Delete ({selectedImagesCount})
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3"
									onClick={() => {
                                  setGallerySelectMode(!gallerySelectMode);
                                  if (gallerySelectMode) {
                                    setSelectedImagesCount(0);
                                  }
                                }}
                              >
                                Select
                              </Button>
                            </>
                          )}
                        <div className="flex items-center border border-neutral-200 rounded-lg">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-2 ${galleryView === 'list' ? 'bg-neutral-100' : ''}`}
                            onClick={() => setGalleryView('list')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-2 ${galleryView === 'grid' ? 'bg-neutral-100' : ''}`}
                            onClick={() => setGalleryView('grid')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                          </Button>
							</div>
						</div>
                    </div>
                    <Card className="border border-neutral-200 rounded-lg flex-1 min-h-0">
                      <CardContent className="px-3 py-1 h-full overflow-auto">
                          <ImageGallery 
                            projectId={projectId} 
                            displayMode={displayMode}
                            key={galleryRefresh}
                            viewMode={galleryView}
                            selectMode={gallerySelectMode}
                            onSelectModeChange={setGallerySelectMode}
                            onActiveImageChange={handleActiveImageChange}
                            onSelectionCountChange={setSelectedImagesCount}
                            selectedForCollection={selectedForCollection}
                            onToggleCollectionSelection={handleToggleImageSelection}
                            onCollectionActivation={handleCollectionActivation}
                            selectedCollections={selectedCollections}
                            onToggleCollectionDeletion={handleToggleCollectionSelection}
                            onDeleteSelectedCollections={handleDeleteSelectedCollections}
                            activeCollectionId={activeCollection?.id}
                          />
                      </CardContent>
                    </Card>
                  </div>
                </div>
                )}
					</div>
				</div>
          </div>
        </div>

			</div>
		</div>
	);
}