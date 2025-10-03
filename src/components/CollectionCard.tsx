"use client";

import Image from "next/image";

interface CollectionCardProps {
  collectionNumber: number;
  coverImageUrl?: string;
  imageCount: number;
  isActive?: boolean;
  onClick?: () => void;
  // Selection props
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  // Status indicators
  isLatest?: boolean;
  isActivated?: boolean;
}

export default function CollectionCard({
  collectionNumber,
  coverImageUrl,
  imageCount,
  isActive = false,
  onClick,
  selectMode = false,
  isSelected = false,
  onToggleSelection,
  isLatest = false,
  isActivated = false
}: CollectionCardProps) {
  return (
    <div 
      className={`relative cursor-pointer transition-all duration-200 w-[120px] h-[120px] ${
        isActive 
          ? 'transform scale-105' 
          : 'hover:transform hover:scale-102'
      }`}
      onClick={selectMode ? () => {
        console.log('💥 Collection card clicked in select mode!');
        onToggleSelection?.();
      } : onClick}
    >
      {/* Stack of 3 layers */}
      {/* Back layer */}
      <div 
        className={`absolute inset-0 rounded-lg border-2 transform translate-x-1 translate-y-1 ${
          isActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-white'
        }`}
      />
      
      {/* Middle layer */}
      <div 
        className={`absolute inset-0 rounded-lg border-2 transform translate-x-0.5 translate-y-0.5 ${
          isActive 
            ? 'border-green-500 bg-green-100' 
            : 'border-gray-300 bg-white'
        }`}
      />
      
      {/* Top layer (with content) */}
      <div 
        className={`relative rounded-lg border-2 overflow-hidden w-full h-full ${
          selectMode && isSelected
            ? 'border-blue-500 ring-2 ring-blue-200'
            : isActive 
              ? 'border-green-500 ring-2 ring-green-200' 
              : 'border-gray-200 hover:border-blue-400'
        }`}
      >
        <div className="w-full h-full bg-gray-100">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={`Collection ${collectionNumber} cover`}
              fill
              className="object-cover"
              sizes="120px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Selection checkbox */}
        {selectMode && (
          <div className="absolute top-1 left-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        )}
        
        {/* Collection number badge */}
        {!selectMode && (
          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium">
            #{collectionNumber}
          </div>
        )}
        
        {/* Image count badge */}
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium">
          {imageCount}
        </div>
        
        {/* Status indicators */}
        {!selectMode && (
          <>
            {/* Latest indicator */}
            {isLatest && (
              <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded text-[10px] font-medium">
                Latest
              </div>
            )}
            {/* Activated indicator */}
            {isActivated && (
              <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium">
                Activated
              </div>
            )}
            {/* Legacy Active indicator (for backwards compatibility) */}
            {isActive && !isActivated && (
              <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium">
                Active
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}