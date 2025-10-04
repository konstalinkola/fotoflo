"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import CollectionCard from "./CollectionCard";

interface ImageData {
	id: string; // Add the ID field
	name: string;
	path: string;
	created_at: string;
	capture_time?: string | null;
	size?: number;
	url: string | null;
	source: string;
	// Additional EXIF data
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

interface ImageGalleryProps {
	projectId: string;
	displayMode?: 'single' | 'collection';
	viewMode?: 'grid' | 'list';
	selectMode?: boolean;
	onSelectModeChange?: (mode: boolean) => void;
	onActiveImageChange?: (imageUrl: string | null) => void;
	onSelectionCountChange?: (count: number) => void;
	// New props for collection selection (for building new collections)
	selectedForCollection?: Set<string>;
	onToggleCollectionSelection?: (imageId: string) => void;
	// New prop for collection activation
	onCollectionActivation?: (collection: {id: string; name: string}) => void;
	// New props for collection deletion
	selectedCollections?: Set<string>;
	onToggleCollectionDeletion?: (collectionId: string) => void;
	onDeleteSelectedCollections?: () => void;
	// Active collection prop
	activeCollectionId?: string | null;
}

export default function ImageGallery({ projectId, displayMode = 'single', viewMode = 'grid', selectMode = false, onSelectModeChange, onActiveImageChange, onSelectionCountChange, selectedForCollection, onToggleCollectionSelection, onCollectionActivation, selectedCollections, onToggleCollectionDeletion, onDeleteSelectedCollections, activeCollectionId }: ImageGalleryProps) {
	const [images, setImages] = useState<ImageData[]>([]);
  const [collections, setCollections] = useState<{id: string; name: string; cover_image_url?: string; is_active?: boolean; created_at: string; image_count?: number}[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeImagePath, setActiveImagePath] = useState<string | null>(null);
	const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
	const [deleting, setDeleting] = useState(false);

	const fetchImages = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			if (displayMode === 'collection') {
				// Fetch both collections and individual images in collection mode
				const [collectionsResponse, imagesResponse] = await Promise.all([
					fetch(`/api/projects/${projectId}/collections`),
					fetch(`/api/projects/${projectId}/images`)
				]);
				
				if (!collectionsResponse.ok) {
					throw new Error("Failed to fetch collections");
				}
				if (!imagesResponse.ok) {
					throw new Error("Failed to fetch images");
				}
				
				const collectionsData = await collectionsResponse.json();
				const imagesData = await imagesResponse.json();
				
				setCollections(collectionsData || []);
				setImages(imagesData.images || []);
			} else {
				// Fetch individual images only in single mode
				const response = await fetch(`/api/projects/${projectId}/images`);
				if (!response.ok) {
					throw new Error("Failed to fetch images");
				}
				const data = await response.json();
				setImages(data.images || []);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load content");
		} finally {
			setLoading(false);
		}
	}, [projectId, displayMode]);

	const fetchActiveImage = useCallback(async () => {
		try {
			const response = await fetch(`/api/projects/${projectId}/active-image`);
			if (response.ok) {
				const data = await response.json();
				setActiveImagePath(data.active_image_path);
				
				// Find the URL for the active image
				let imageUrl: string | null = null;
				if (data.active_image_path) {
					const activeImage = images.find(img => img.path === data.active_image_path);
					imageUrl = activeImage?.url || null;
				} else {
					// If no active image, use the latest (first in array)
					imageUrl = images.length > 0 ? images[0].url : null;
				}
				
				// Notify parent component
				if (onActiveImageChange) {
					onActiveImageChange(imageUrl);
				}
			}
		} catch {
			// Ignore errors for active image fetch
		}
	}, [projectId, images, onActiveImageChange]);

	const handleImageClick = async (imagePath: string) => {
		// In collection mode, clicking images toggles selection for new collection
		if (displayMode === 'collection' && onToggleCollectionSelection) {
			const clickedImage = images.find(img => img.path === imagePath);
			if (clickedImage?.id) {
				onToggleCollectionSelection(clickedImage.id);
			}
			return;
		}

		// In single mode, clicking sets active image
		try {
			const response = await fetch(`/api/projects/${projectId}/active-image`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image_path: imagePath }),
			});
			
			if (response.ok) {
				setActiveImagePath(imagePath);
				// Find and set the URL for the clicked image
				const clickedImage = images.find(img => img.path === imagePath);
				const imageUrl = clickedImage?.url || null;
				
				// Notify parent component
				if (onActiveImageChange) {
					onActiveImageChange(imageUrl);
				}
			}
		} catch {
			// Silently handle errors
		}
	};

	const toggleSelection = (imagePath: string) => {
		const newSelected = new Set(selectedImages);
		if (newSelected.has(imagePath)) {
			newSelected.delete(imagePath);
		} else {
			newSelected.add(imagePath);
		}
		setSelectedImages(newSelected);
		
		// Notify parent of selection count change
		if (onSelectionCountChange) {
			onSelectionCountChange(newSelected.size);
		}
	};

	const selectAll = () => {
		setSelectedImages(new Set(images.map(img => img.path)));
	};

	const selectNone = () => {
		setSelectedImages(new Set());
	};

	const deleteSelected = async () => {
		if (selectedImages.size === 0) return;
		
		if (!confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) {
			return;
		}
		
		setDeleting(true);
		try {
			const response = await fetch(`/api/projects/${projectId}/images/delete`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filePaths: Array.from(selectedImages) }),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Delete failed");
			}

			// Refresh the gallery
			await fetchImages();
			// Clear selection
			setSelectedImages(new Set());
			if (onSelectModeChange) {
				onSelectModeChange(false);
			}
			if (onSelectionCountChange) {
				onSelectionCountChange(0);
			}
			
		} catch (error) {
			alert(error instanceof Error ? error.message : "Failed to delete images");
		} finally {
			setDeleting(false);
		}
	};

	const exitSelectionMode = () => {
		if (onSelectModeChange) {
			onSelectModeChange(false);
		}
		setSelectedImages(new Set());
		if (onSelectionCountChange) {
			onSelectionCountChange(0);
		}
	};

	// Listen for delete event from parent
	useEffect(() => {
		const handleDelete = () => {
			deleteSelected();
		};
		
		window.addEventListener('deleteSelectedImages', handleDelete);
		return () => {
			window.removeEventListener('deleteSelectedImages', handleDelete);
		};
	}, [selectedImages]);

	useEffect(() => {
		fetchImages();
	}, [fetchImages]);

	useEffect(() => {
		if (images.length > 0) {
			fetchActiveImage();
		}
	}, [fetchActiveImage, images.length]);

	// Removed unused formatFileSize and formatDate functions

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-gray-500">Loading {displayMode === 'collection' ? 'collections' : 'images'}...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<div className="text-red-600 mb-4">{error}</div>
				<button 
					onClick={fetchImages}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="h-full">
			{displayMode === 'collection' ? (
				collections.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
						<p>No collections created yet</p>
						<p className="text-sm">Create your first collection using the &quot;New Collection&quot; section above</p>
					</div>
				) : null
			) : (
				images.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p>No photos uploaded yet</p>
						<p className="text-sm">Upload your first photo using the upload section above</p>
					</div>
				) : null
			)}
			
			{((displayMode === 'collection' && collections.length > 0) || (displayMode === 'single' && images.length > 0)) && (
			viewMode === 'list' ? (
				/* List View */
				<div className="h-full flex flex-col">
					{/* Table Header - Fixed */}
					<div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b flex-shrink-0">
						{selectMode && <div className="col-span-1"></div>}
						{displayMode === 'collection' ? (
							<>
								<div className={selectMode ? "col-span-2" : "col-span-3"}>#</div>
								<div className={selectMode ? "col-span-4" : "col-span-5"}>Collection ID</div>
								<div className={selectMode ? "col-span-3" : "col-span-2"}>Photos</div>
								<div className={selectMode ? "col-span-2" : "col-span-2"}>Creation time</div>
							</>
						) : (
							<>
								<div className={selectMode ? "col-span-2" : "col-span-3"}>#</div>
								<div className={selectMode ? "col-span-5" : "col-span-6"}>File name</div>
								<div className={selectMode ? "col-span-4" : "col-span-3"}>Capture time</div>
							</>
						)}
					</div>
					
					{/* Table Rows - Scrollable */}
					<div className="flex-1 overflow-auto space-y-2">
						{displayMode === 'collection' ? (
							/* Collections Table */
							collections.map((collection, index) => {
								const collectionNumber = collections.length - index;
								const creationTime = new Date(collection.created_at).toLocaleTimeString('en-GB', { 
									hour: '2-digit', 
									minute: '2-digit',
									hour12: false
								});
								
								return (
									<div 
										key={collection.id}
										className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm border-b hover:bg-gray-50 cursor-pointer ${
											selectMode && selectedCollections?.has(collection.id) 
												? 'bg-blue-50' 
												: activeCollectionId === collection.id
													? 'bg-green-50'
													: ''
										}`}
										onClick={() => selectMode ? onToggleCollectionDeletion?.(collection.id) : onCollectionActivation?.(collection)}
									>
										{selectMode && (
											<div className="col-span-1 flex items-center">
												<input
													type="checkbox"
													checked={selectedCollections?.has(collection.id) || false}
													onChange={() => onToggleCollectionDeletion?.(collection.id)}
													className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
													onClick={(e) => e.stopPropagation()}
												/>
											</div>
										)}
										<div className={`${selectMode ? "col-span-2" : "col-span-3"} font-mono text-gray-700`}>
											#{collectionNumber}
										</div>
										<div className={`${selectMode ? "col-span-4" : "col-span-5"} font-mono text-xs break-all`}>
											{collection.id}
											{activeCollectionId === collection.id && (
												<span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ACTIVE</span>
											)}
										</div>
										<div className={`${selectMode ? "col-span-3" : "col-span-2"} text-gray-600`}>
											{collection.image_count || 0}
										</div>
										<div className={`${selectMode ? "col-span-2" : "col-span-2"} text-gray-600`}>
											{creationTime}
										</div>
									</div>
								);
							})
						) : (
							/* Images Table */
							images.map((image, index) => {
								const imageNumber = images.length - index;
								// Use capture time from EXIF if available, otherwise use upload time
								const timeToUse = image.capture_time || image.created_at;
								const captureTime = new Date(timeToUse).toLocaleTimeString('en-GB', { 
									hour: '2-digit', 
									minute: '2-digit',
									hour12: false
								});
								
								return (
									<div 
										key={image.path}
									className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm border-b hover:bg-gray-50 cursor-pointer ${
										selectMode && selectedImages.has(image.path) 
											? 'bg-blue-50' 
											: selectedForCollection?.has(image.id)
												? 'bg-green-50'
												: ''
									}`}
										onClick={() => selectMode ? toggleSelection(image.path) : handleImageClick(image.path)}
									>
										{selectMode && (
											<div className="col-span-1 flex items-center">
												<input
													type="checkbox"
													checked={selectedImages.has(image.path)}
													onChange={() => toggleSelection(image.path)}
													className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
													onClick={(e) => e.stopPropagation()}
												/>
											</div>
										)}
										<div className={`${selectMode ? "col-span-2" : "col-span-3"} font-mono text-gray-700`}>
											#{imageNumber}
										</div>
										<div className={`${selectMode ? "col-span-5" : "col-span-6"} truncate`}>
											{image.name}
										</div>
										<div className={`${selectMode ? "col-span-4" : "col-span-3"} text-gray-600`}>
											{captureTime}
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			) : (
				/* Grid View */
				<div className="h-full overflow-auto">
					<div className="grid gap-3 px-1 pt-0 pb-1 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 120px))' }}>
					{displayMode === 'collection' ? (
						/* Collection Mode - Show Collections */
						collections.map((collection, index) => {
							const isSelected = selectedCollections?.has(collection.id) || false;
							// Determine if this is the latest collection (most recently created)
							const isLatest = index === 0; // Collections are ordered by creation date, so first one is latest
							// Determine if this collection is activated (matches activeCollectionId)
							const isActivated = activeCollectionId === collection.id;
							
							
							return (
								<CollectionCard
									key={collection.id}
									collectionNumber={collection.name}
									coverImageUrl={collection.cover_image_url}
									imageCount={collection.image_count || 0}
									isActive={collection.is_active}
									selectMode={selectMode}
									isSelected={isSelected}
									isLatest={isLatest}
									isActivated={isActivated}
									onClick={() => {
										if (onCollectionActivation) {
											onCollectionActivation(collection);
										}
									}}
									onToggleSelection={() => {
										if (onToggleCollectionDeletion) {
											onToggleCollectionDeletion(collection.id);
										}
									}}
								/>
							);
						})
					) : (
						/* Single Mode - Show Individual Images */
						images.map((image, index) => (
						<div 
							key={image.path} 
							className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 w-[120px] h-[120px] ${
								selectMode 
									? selectedImages.has(image.path)
										? 'border-blue-500 ring-2 ring-blue-200'
										: 'border-gray-200 hover:border-blue-400'
									: (displayMode as string) === 'collection' && selectedForCollection?.has(image.id)
										? 'border-green-500 ring-2 ring-green-200'
									: image.path === activeImagePath 
										? 'border-green-500 ring-2 ring-green-200' 
										: 'border-gray-200 hover:border-blue-400'
							}`}
							onClick={() => selectMode ? toggleSelection(image.path) : handleImageClick(image.path)}
						>
							<div className="w-full h-full bg-gray-100">
								{image.url ? (
									<Image
										src={image.url}
										alt={image.name}
										fill
										className="object-cover"
										sizes="120px"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								)}
							</div>
							
							{/* Selection checkbox */}
							{selectMode && (
								<div className="absolute top-1 left-1">
									<input
										type="checkbox"
										checked={selectedImages.has(image.path)}
										onChange={() => toggleSelection(image.path)}
										className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
										onClick={(e) => e.stopPropagation()}
									/>
								</div>
							)}
							
							{/* Active indicator */}
							{!selectMode && image.path === activeImagePath && (
								<div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
									Active
								</div>
							)}
							{/* Latest badge */}
							{!selectMode && index === 0 && image.path !== activeImagePath && (
								<div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-medium">
									Latest
								</div>
							)}
						</div>
					))
					)}
					</div>
				</div>
			)
			)}
		</div>
	);
}