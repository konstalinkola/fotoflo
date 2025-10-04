"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Download, ArrowLeft } from "lucide-react";

interface CollectionImage {
  id: string;
  name: string;
  signed_url: string;
  width: number;
  height: number;
  sort_order: number;
}

interface ProjectData {
  logo_url?: string;
  background_color?: string;
  name?: string;
}

export default function CollectionGalleryPage() {
  const params = useParams<{ projectId: string; collectionId: string }>();
  const { projectId, collectionId } = params;
  
  const [collectionImages, setCollectionImages] = useState<CollectionImage[]>([]);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !collectionId) return;
    
    async function fetchCollectionData() {
      try {
        console.log('Fetching collection data for:', { projectId, collectionId });
        
        // Fetch collection images using the simpler API
        const collectionRes = await fetch(`/api/public/${projectId}/collection/${collectionId}/images`);
        console.log('Collection images API response status:', collectionRes.status);
        
        if (collectionRes.ok) {
          const data = await collectionRes.json();
          console.log('Collection images data:', data);
          console.log('Images count:', data.images?.length || 0);
          console.log('Images array:', data.images);
          console.log('First image:', data.images?.[0]);
          if (data.images?.[0]) {
            console.log('First image signed_url:', data.images[0].signed_url);
            console.log('First image name:', data.images[0].name);
          }
          console.log('Setting collection images state...');
          setCollectionImages(data.images || []);
          console.log('Collection images state set to:', data.images || []);
          
          // Use project data from API response
          setProjectData(data.project || {
            name: "Project",
            logo_url: undefined,
            background_color: undefined
          });
        } else {
          const errorData = await collectionRes.json();
          console.error('Collection images API error:', errorData);
          setError(`Collection images not found: ${errorData.error || 'Unknown error'}. Details: ${errorData.details || 'No details'}`);
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
        setError("Failed to load collection");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCollectionData();
  }, [projectId, collectionId]);

  const downloadAllImages = async () => {
    for (let i = 0; i < collectionImages.length; i++) {
      const image = collectionImages[i];
      if (image.signed_url) {
        try {
          const response = await fetch(image.signed_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = image.name || `image-${i + 1}.jpg`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (error) {
          console.error('Error downloading image:', error);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.href = `/public/${projectId}`}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to QR Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div 
        className="w-full px-4 py-6 bg-gradient-to-r from-gray-100 to-white border-b border-gray-200"
        style={{ 
          background: projectData?.background_color || 'linear-gradient(to right, #f3f4f6, #ffffff)'
        }}
      >
        <div className="max-w-sm mx-auto">
          {projectData?.logo_url ? (
            <div className="flex justify-center">
              <Image
                src={projectData.logo_url}
                alt={projectData.name || "Project Logo"}
                width={120}
                height={60}
                className="object-contain max-h-16"
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold text-black uppercase tracking-wider">
                {projectData?.name || "LOGO"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-sm mx-auto px-4 py-6">
        {collectionImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-400 rounded"></div>
            </div>
            <p className="text-gray-500">No images in this collection yet.</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Debug info:</p>
              <p>Project ID: {projectId}</p>
              <p>Collection ID: {collectionId}</p>
              <p>Check browser console for API response details.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Download All Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={downloadAllImages}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>

            {/* Dynamic Grid - only shows actual images */}
            <div className="grid gap-3" style={{ 
              gridTemplateColumns: `repeat(${Math.min(2, collectionImages.length)}, 1fr)` 
            }}>
              {collectionImages.map((image, index) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group cursor-pointer"
                  onClick={() => {
                    // Open image in new tab
                    window.open(image.signed_url, '_blank');
                  }}
                >
                  <img
                    src={image.signed_url}
                    alt={image.name || `Image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    crossOrigin="anonymous"
                    loading="lazy"
                    onLoad={() => console.log('Image loaded successfully:', image.name)}
                    onError={(e) => {
                      console.error('Image failed to load:', image.name, image.signed_url);
                      console.error('Error details:', e);
                    }}
                  />
                  
                  {/* Simple hover effect without overlay */}
                  <div className="absolute inset-0 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
