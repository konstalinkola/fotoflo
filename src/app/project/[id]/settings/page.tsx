"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  PanelLeft, 
  Upload,
  Save,
  Trash2
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
  qr_visibility_duration?: number;
  qr_expires_on_click?: boolean;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [user, setUser] = useState<{id: string; email?: string} | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);


  // Form states
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isLogoFromUrl, setIsLogoFromUrl] = useState(true); // Track if logo is from URL or uploaded
  const [logoLoadError, setLogoLoadError] = useState(false); // Track logo loading errors
  const [qrVisibilityDuration, setQrVisibilityDuration] = useState(60);
  const [qrExpiresOnClick, setQrExpiresOnClick] = useState(false);
  const [displayMode, setDisplayMode] = useState<'single' | 'collection'>('single');
  const [isModeLocked, setIsModeLocked] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Customization states
  const [logoSize, setLogoSize] = useState(120);
  const [logoPositionY, setLogoPositionY] = useState(-200);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [qrCodeSize, setQrCodeSize] = useState(150);
  const [textContent, setTextContent] = useState("");
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("var(--font-inter), Inter, system-ui, sans-serif");
  const [fontWeight, setFontWeight] = useState(400);
  const [fontColor, setFontColor] = useState("#000000");
  const [textPositionY, setTextPositionY] = useState(200);



  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();
      setSupabaseClient(supabase);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
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
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("owner", user.id)
        .single();

      if (projectData) {
        setProject(projectData);
        setName(projectData.name || "");
        setLogoUrl(projectData.logo_url || "");
        setQrVisibilityDuration(projectData.qr_visibility_duration || 60);
        setQrExpiresOnClick(projectData.qr_expires_on_click || false);
        setDisplayMode(projectData.display_mode || 'single');
      }
      
      // Check if project has content to determine if mode should be locked
      await checkProjectContent();
      
      setLoading(false);
    }

    loadData();
  }, [projectId]);

  // Close color picker when customize modal closes

  const saveProject = async () => {
    if (!supabaseClient || !project) return;
    
    setSaving(true);
    try {
      const { error } = await supabaseClient
        .from("projects")
        .update({
          name,
          logo_url: logoUrl,
          qr_visibility_duration: qrVisibilityDuration,
          qr_expires_on_click: qrExpiresOnClick,
          display_mode: displayMode
        })
        .eq("id", projectId);

      if (error) throw error;
      
      // Update local state
      setProject(prev => prev ? { ...prev, name, logo_url: logoUrl } : null);
      
      // Show success message briefly
      const button = document.querySelector('[data-save-button]') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Saved!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Failed to save project settings");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!supabaseClient || !project) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const checkProjectContent = async () => {
    if (!supabaseClient || !projectId) return;
    
    try {
      // Check for images
      const { data: images } = await supabaseClient
        .from("images")
        .select("id")
        .eq("project_id", projectId)
        .limit(1);
      
      // Check for collections
      const { data: collections } = await supabaseClient
        .from("collections")
        .select("id")
        .eq("project_id", projectId)
        .limit(1);
      
      const hasImages = images && images.length > 0;
      const hasCollections = collections && collections.length > 0;
      const hasAnyContent = hasImages || hasCollections;
      
      setHasContent(hasAnyContent || false);
      setIsModeLocked(hasAnyContent || false);
    } catch (error) {
      console.error("Error checking project content:", error);
      // If there's an error (e.g., tables don't exist), assume no content
      setHasContent(false);
      setIsModeLocked(false);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a JPG or PNG file.');
      return;
    }
    
    // Create a temporary URL for preview
    const fileUrl = URL.createObjectURL(file);
    setLogoUrl(fileUrl);
    setIsLogoFromUrl(false); // Mark as uploaded file
    setLogoLoadError(false); // Reset error state for uploaded files
    
    // TODO: In a real implementation, you'd upload to storage and get a permanent URL
    // For now, we're just showing a preview with the temporary blob URL
  };
  
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  
  const handleLogoUrlChange = (value: string) => {
    setLogoUrl(value);
    setIsLogoFromUrl(true); // Mark as URL input
    setLogoLoadError(false); // Reset error state when URL changes
  };
  
  const handleDeleteLogo = () => {
    setLogoUrl('');
    setIsLogoFromUrl(true);
    setLogoLoadError(false);
    
    // Clear the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
    <div className="h-screen bg-white flex overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        projects={projects}
        supabaseClient={supabaseClient}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/project/${projectId}`}>
                    {project?.name || "Project"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>Project settings</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Page Title Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-neutral-950">Project settings</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => setCustomizeModalOpen(true)}
            >
              Customize public page
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProject}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
            <Button
              onClick={saveProject}
              disabled={saving}
              data-save-button
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
          <div className="w-full max-w-none space-y-8">
            {/* Project Information */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-950 mb-2">Project information</h3>
                    <p className="text-sm text-neutral-600">View and update your personal details and account information.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-950">Project name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Project name"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-950">Client</label>
                      <Input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Client name"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Mode */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-950 mb-2">Project mode</h3>
                    <p className="text-sm text-neutral-600 mb-4">Choose the mode you want to operate in.</p>
                    {isModeLocked ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                        <p className="text-sm text-amber-800 font-medium mb-1">Mode is locked</p>
                        <p className="text-xs text-amber-700">
                          Mode cannot be changed after uploading images or creating collections. 
                          Delete all content to unlock mode selection.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-600">Currently only QR Code Mode is available. New modes coming soon!</p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* QR Code Mode Card */}
                    <div 
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-all duration-200
                        ${displayMode === 'single' || displayMode === 'collection' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-neutral-200 hover:border-neutral-300'
                        }
                      `}
                      onClick={() => {
                        // For now, we'll keep the current mode or default to single
                        // This card represents the QR Code Mode concept
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neutral-900 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zM3 15h6v6H3v-6zm2 2v2h2v-2H5zM15 3h6v6h-6V3zm2 2v2h2V5h-2zM15 15h2v2h-2v-2zM17 17h2v2h-2v-2zM19 15h2v2h-2v-2zM15 17h2v2h-2v-2zM17 19h2v2h-2v-2zM19 17h2v2h-2v-2z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-950">QR Code Mode</h4>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="project-mode"
                          checked={true} // Always checked since it's the only available mode
                          readOnly
                          className="w-4 h-4 text-blue-600 border-neutral-300"
                        />
                      </div>
                      <p className="text-sm text-neutral-600 mb-4">
                        Your photos are accessed via a QR code on your project&apos;s public page.
                      </p>
                      
                      {/* Sub-options for QR Code Mode */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="single-mode"
                            name="display-mode"
                            value="single"
                            checked={displayMode === 'single'}
                            onChange={(e) => !isModeLocked && setDisplayMode(e.target.value as 'single' | 'collection')}
                            disabled={isModeLocked}
                            className={`w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500 ${
                              isModeLocked ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <div className={isModeLocked ? 'opacity-50' : ''}>
                            <label htmlFor="single-mode" className={`text-sm font-medium text-neutral-950 ${
                              isModeLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}>
                              Single Image Mode
                            </label>
                            <p className="text-xs text-neutral-600">QR code shows one active image at a time</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="collection-mode"
                            name="display-mode"
                            value="collection"
                            checked={displayMode === 'collection'}
                            onChange={(e) => !isModeLocked && setDisplayMode(e.target.value as 'single' | 'collection')}
                            disabled={isModeLocked}
                            className={`w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500 ${
                              isModeLocked ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <div className={isModeLocked ? 'opacity-50' : ''}>
                            <label htmlFor="collection-mode" className={`text-sm font-medium text-neutral-950 ${
                              isModeLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}>
                              Collection Mode
                            </label>
                            <p className="text-xs text-neutral-600">QR code shows a gallery of images from the active collection</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="flex flex-col">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-950 mb-2">Logo</h3>
                      <p className="text-sm text-neutral-600 mb-4">Logo will be displayed on the public page</p>
                    </div>
                    
                    {/* Logo Preview - aligned to bottom */}
                    <div className="flex-1 flex items-end">
                      <div className="w-full border border-neutral-200 rounded-lg p-4 bg-neutral-50 flex items-center justify-center h-32 relative">
                        {logoUrl && !logoLoadError ? (
                          <>
                            <img
                              src={logoUrl}
                              alt="Logo preview"
                              className="max-w-full max-h-full object-contain"
                              onError={() => setLogoLoadError(true)}
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                              onClick={handleDeleteLogo}
                              title="Delete logo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : logoUrl && logoLoadError ? (
                          <>
                            <div className="text-sm text-red-500">Failed to load image</div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0"
                              onClick={handleDeleteLogo}
                              title="Delete logo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="text-sm text-neutral-400">No logo uploaded</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-950">Logo URL</label>
                      <Input
                        value={isLogoFromUrl ? logoUrl : ''}
                        onChange={(e) => handleLogoUrlChange(e.target.value)}
                        placeholder="Enter logo URL or upload a file below"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-950">Upload Logo</label>
                      <div 
                        className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer h-32 flex flex-col items-center justify-center"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-3 text-neutral-400" />
                          <p className="text-sm text-neutral-600">
                            <span className="text-blue-600 hover:text-blue-700">Drag and drop</span> or{" "}
                            <span className="text-blue-600 hover:text-blue-700">choose a file</span>
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">JPG or PNG files only</p>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* QR Code Duration */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-950 mb-2">QR code duration</h3>
                    <p className="text-sm text-neutral-600">How long the QR code stays visible after a new image is uploaded</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-neutral-950">
                        Duration: {qrVisibilityDuration === 0 ? 'Never expires' : `${qrVisibilityDuration} seconds`}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={qrExpiresOnClick}
                          onChange={(e) => setQrExpiresOnClick(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-neutral-600">Code expires after first view</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      value={qrVisibilityDuration}
                      onChange={(e) => setQrVisibilityDuration(Number(e.target.value))}
                      max={300}
                      min={0}
                      step={10}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Never expires</span>
                      <span>5 minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
          </div>
        </div>
      </div>
    </div>

        {/* Customize Public Page Modal */}
        {customizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg w-[90vw] h-[85vh] max-w-[1200px] max-h-[85vh] flex flex-col overflow-hidden">
              <div className="flex-shrink-0 p-6 pb-0 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Customize your public page</h2>
                    <p className="text-sm text-neutral-600">Customize how your public page looks like to visitors.</p>
                  </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={async () => {
                      if (!supabaseClient || !project) return;
                      setSaving(true);
                      try {
                        const { error } = await supabaseClient
                          .from("projects")
                          .update({
                            logo_size: logoSize,
                            logo_position_y: logoPositionY,
                            background_color: backgroundColor,
                            qr_code_size: qrCodeSize,
                            text_content: textContent,
                            font_size: fontSize,
                            font_family: fontFamily,
                            font_weight: fontWeight,
                            font_color: fontColor,
                            text_position_y: textPositionY,
                          })
                          .eq("id", projectId);
                        if (error) {
                          console.error("Error saving customization:", error);
                          alert(`Error saving customization: ${error.message}. Please try again.`);
                        } else {
                          setCustomizeModalOpen(false);
                        }
                      } catch (err) {
                        console.error("Error saving customization:", err);
                        alert("Error saving customization. Please try again.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setCustomizeModalOpen(false)}>Close</Button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-hidden flex">
                {/* Left Side - Customization Controls */}
                <div className="w-1/2 pr-4 overflow-auto">
                  <div className="space-y-6">
                  {/* Logo Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Logo size:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={`${logoSize}px`}
                          readOnly
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                        <input
                          type="range"
                          min="50"
                          max="300"
                          value={logoSize}
                          onChange={(e) => setLogoSize(Number(e.target.value))}
                          className="flex-1 slider"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Logo position Y:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={`${logoPositionY}px`}
                          readOnly
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                        <input
                          type="range"
                          min="-300"
                          max="300"
                          value={logoPositionY}
                          onChange={(e) => setLogoPositionY(Number(e.target.value))}
                          className="flex-1 slider"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Background color:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={backgroundColor}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Text content</label>
                      <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Your text here"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Font size:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={`${fontSize}px`}
                          readOnly
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="flex-1 slider"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Font color:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={fontColor}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Font family:</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times New Roman, serif">Times New Roman</option>
                        <option value="Courier New, monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                        <option value="Comic Sans MS, cursive">Comic Sans MS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Font weight:</label>
                      <select
                        value={fontWeight}
                        onChange={(e) => setFontWeight(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Normal (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi Bold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Text position Y:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={`${textPositionY}px`}
                          readOnly
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                        <input
                          type="range"
                          min="-300"
                          max="300"
                          value={textPositionY}
                          onChange={(e) => setTextPositionY(Number(e.target.value))}
                          className="flex-1 slider"
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR Code Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">QR code size:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={`${qrCodeSize}px`}
                          readOnly
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                        <input
                          type="range"
                          min="100"
                          max="300"
                          value={qrCodeSize}
                          onChange={(e) => setQrCodeSize(Number(e.target.value))}
                          className="flex-1 slider"
                        />
                      </div>
                    </div>
                  </div>

                  </div>
                </div>

                {/* Right Side - Preview Area */}
                <div className="w-1/2 pl-4">
                  <div className="w-full h-full border border-neutral-200 rounded-lg bg-neutral-50 overflow-hidden flex items-center justify-center p-4">
                    <div 
                      className="relative"
                      style={{ 
                        backgroundColor: backgroundColor,
                        aspectRatio: '10/16',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    >
                      {/* Logo */}
                      {logoSize > 0 && (
                        <div 
                          className="absolute left-1/2"
                          style={{ 
                            top: `calc(50% + ${logoPositionY}px)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <div
                            className="bg-white rounded-lg p-4"
                            style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
                          >
                            {logoUrl ? (
                              <img 
                                src={logoUrl} 
                                alt="Logo" 
                                className="w-full h-full object-contain rounded"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500 text-xs">LOGO</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Text Content */}
                      {textContent && (
                        <div 
                          className="absolute text-center"
                          style={{ 
                            top: `calc(50% + ${textPositionY}px)`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: fontColor,
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            fontWeight: fontWeight
                          }}
                        >
                          {textContent}
                        </div>
                      )}

                      {/* Dummy QR Code */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div 
                          className="bg-white rounded-lg"
                          style={{ width: `${qrCodeSize}px`, height: `${qrCodeSize}px` }}
                        >
                          {/* Simple QR Code Pattern */}
                          <div 
                            className="w-full h-full grid gap-px bg-gray-900 rounded-lg p-1"
                            style={{ gridTemplateColumns: 'repeat(21, 1fr)' }}
                          >
                            {Array.from({ length: 441 }, (_, i) => {
                              const row = Math.floor(i / 21);
                              const col = i % 21;
                              
                              // Finder patterns
                              const isFinder = (row < 7 && col < 7) || (row < 7 && col >= 14) || (row >= 14 && col < 7);
                              if (isFinder) {
                                const isOuter = row === 0 || row === 6 || col === 0 || col === 6;
                                const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
                                return (
                                  <div 
                                    key={i}
                                    className={`w-full h-full ${isOuter || isInner ? 'bg-white' : 'bg-gray-900'}`}
                                  />
                                );
                              }
                              
                              // Timing patterns
                              const isTiming = row === 6 || col === 6;
                              if (isTiming) {
                                return (
                                  <div 
                                    key={i}
                                    className={`w-full h-full ${(row + col) % 2 === 0 ? 'bg-gray-900' : 'bg-white'}`}
                                  />
                                );
                              }
                              
                              // Data modules
                              const shouldBeWhite = (i + row + col) % 7 < 3;
                              return (
                                <div 
                                  key={i}
                                  className={`w-full h-full ${shouldBeWhite ? 'bg-white' : 'bg-gray-900'}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Preview Label */}
                      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                        Preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Color Picker Modal */}

    </>
  );
}

