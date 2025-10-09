"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";

interface NewCollectionProps {
  selectedImages: {id: string; path: string; url: string | null; name?: string}[]; // Array of selected image objects from gallery
  onSave: () => void;
  onClear: () => void;
  onToggleSelection: (imageId: string) => void;
  selectMode?: boolean;
  onSelectModeChange?: (selectMode: boolean) => void;
  onDeleteSelected?: (imageIds: string[]) => void;
}

export default function NewCollection({
  selectedImages,
  onSave,
  onClear,
  onToggleSelection,
  selectMode = false,
  onSelectModeChange,
  onDeleteSelected
}: NewCollectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());

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

  const handleToggleImageSelection = (imageId: string) => {
    if (selectMode) {
      const newSelection = new Set(selectedForDeletion);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      setSelectedForDeletion(newSelection);
    }
  };

  const handleDeleteSelected = () => {
    if (onDeleteSelected && selectedForDeletion.size > 0) {
      onDeleteSelected(Array.from(selectedForDeletion));
      setSelectedForDeletion(new Set());
      if (onSelectModeChange) {
        onSelectModeChange(false);
      }
    }
  };

  const handleToggleSelectMode = () => {
    if (onSelectModeChange) {
      onSelectModeChange(!selectMode);
      if (selectMode) {
        // Exiting select mode, clear selection
        setSelectedForDeletion(new Set());
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedForDeletion.size === selectedImages.length) {
      // All selected, deselect all
      setSelectedForDeletion(new Set());
    } else {
      // Select all
      const allImageIds = new Set(selectedImages.map(img => img.id));
      setSelectedForDeletion(allImageIds);
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
      {/* Header with Save and Select Controls */}
      {selectedImages.length > 0 && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-neutral-950">New collection</h2>
            {selectedImages.length > 0 && (
              <>
                <span className="text-sm text-neutral-600">({selectedImages.length})</span>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Collection'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={onClear}
                >
                  Clear
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectMode && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={handleSelectAll}
                >
                  {selectedForDeletion.size === selectedImages.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedForDeletion.size > 0 && (
                  <Button
                    size="sm"
                    className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteSelected}
                  >
                    Delete ({selectedForDeletion.size})
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              variant={selectMode ? "default" : "outline"}
              className="h-8 px-3"
              onClick={handleToggleSelectMode}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid gap-3 px-1 pt-0 pb-1 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 120px))' }}>
        {selectedImages.map((image, index) => (
          <div 
            key={image.path || image.id} 
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 w-[120px] h-[120px] ${
              selectedForDeletion.has(image.id) 
                ? 'border-blue-500 ring-2 ring-blue-300' 
                : 'border-gray-200 hover:border-blue-400'
            }`}
            onClick={() => handleToggleImageSelection(image.id)}
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
            
            {/* Selection Checkbox (in select mode) */}
            {selectMode && (
              <div className="absolute top-2 right-2 z-10">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedForDeletion.has(image.id)
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}>
                  {selectedForDeletion.has(image.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            )}
            
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
