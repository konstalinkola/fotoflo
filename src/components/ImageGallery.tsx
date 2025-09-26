"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface ImageData {
	name: string;
	path: string;
	created_at: string;
	size?: number;
	url: string | null;
	source: string;
}

interface ImageGalleryProps {
	projectId: string;
	// onRefresh?: () => void;
}

export default function ImageGallery({ projectId }: ImageGalleryProps) {
	const [images, setImages] = useState<ImageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeImagePath, setActiveImagePath] = useState<string | null>(null);
	const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

	const fetchImages = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`/api/projects/${projectId}/images`);
			if (!response.ok) {
				throw new Error("Failed to fetch images");
			}
			const data = await response.json();
			setImages(data.images || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load images");
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	const fetchActiveImage = useCallback(async () => {
		try {
			const response = await fetch(`/api/projects/${projectId}/active-image`);
			if (response.ok) {
				const data = await response.json();
				setActiveImagePath(data.active_image_path);
				
				// Find the URL for the active image
				if (data.active_image_path) {
					const activeImage = images.find(img => img.path === data.active_image_path);
					setActiveImageUrl(activeImage?.url || null);
				} else {
					// If no active image, use the latest (first in array)
					setActiveImageUrl(images.length > 0 ? images[0].url : null);
				}
			}
		} catch {
			// Ignore errors for active image fetch
		}
	}, [projectId, images]);

	const handleImageClick = async (imagePath: string) => {
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
				setActiveImageUrl(clickedImage?.url || null);
			}
		} catch {
			// Silently handle errors
		}
	};

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
			<div className="bg-white border rounded-lg p-6">
				<h2 className="text-lg font-medium mb-4">Photo Gallery</h2>
				<div className="flex items-center justify-center py-8">
					<div className="text-gray-500">Loading images...</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white border rounded-lg p-6">
				<h2 className="text-lg font-medium mb-4">Photo Gallery</h2>
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
		<div className="bg-white border rounded-lg p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-lg font-medium">Photo Gallery</h2>
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-500">{images.length} photos</span>
					<button 
						onClick={fetchImages}
						className="text-sm text-blue-600 hover:text-blue-700"
					>
						Refresh
					</button>
				</div>
			</div>

			{images.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<p>No photos uploaded yet</p>
					<p className="text-sm">Upload your first photo using the upload section above</p>
				</div>
			) : (
				<div className="space-y-6">
					{/* Currently Showing Image */}
					<div className="text-center">
						<h3 className="text-md font-medium text-gray-700 mb-3">Currently showing</h3>
						<div className="relative inline-block">
							<div className="w-64 h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg">
								{activeImageUrl ? (
									<Image
										src={activeImageUrl}
										alt="Currently active image"
										fill
										className="object-cover"
										sizes="256px"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Gallery Grid */}
					<div>
						<h4 className="text-sm font-medium text-gray-600 mb-3">Click any image below to activate it</h4>
						<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
							{images.map((image, index) => (
								<div 
									key={image.path} 
									className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
										image.path === activeImagePath 
											? 'border-green-500 ring-2 ring-green-200' 
											: 'border-gray-200 hover:border-blue-400'
									}`}
									onClick={() => handleImageClick(image.path)}
								>
									<div className="aspect-square bg-gray-100">
										{image.url ? (
											<Image
												src={image.url}
												alt={image.name}
												fill
												className="object-cover"
												sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-gray-400">
												<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										)}
									</div>
									{/* Active indicator */}
									{image.path === activeImagePath && (
										<div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
											Active
										</div>
									)}
									{/* Latest badge */}
									{index === 0 && image.path !== activeImagePath && (
										<div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-medium">
											Latest
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}