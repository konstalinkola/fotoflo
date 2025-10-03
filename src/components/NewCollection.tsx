"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface NewCollectionProps {
  selectedImages: {id: string; storage_path: string; signed_url?: string}[]; // Array of selected image objects from gallery
  onSave: () => void;
  onClear: () => void;
  onToggleSelection: (imageId: string) => void;
}

export default function NewCollection({
  selectedImages,
  onSave,
  onClear,
  onToggleSelection
}: NewCollectionProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (selectedImages.length === 0) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Error saving collection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedImages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <Plus className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">New collection</p>
          <p className="text-xs">Upload images to start building a collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="grid gap-3 px-1 pt-0 pb-1 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 120px))' }}>
        {selectedImages.map((image, index) => (
          <div 
            key={image.path || image.id} 
            className="relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 w-[120px] h-[120px] border-gray-200 hover:border-blue-400"
          >
            <div className="w-full h-full bg-gray-100">
              {image.url ? (
                <Image
                  src={image.url}
                  alt={`Collection image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-xs">Loading...</div>
                </div>
              )}
            </div>
            
            {/* Remove Button */}
            <button
              onClick={() => onToggleSelection(image.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-3 h-3" />
            </button>
            
            {/* First Image Indicator */}
            {index === 0 && (
              <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium">
                Cover
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
