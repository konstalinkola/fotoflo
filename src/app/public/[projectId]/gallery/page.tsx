"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Download, X, ArrowLeft } from "lucide-react";

export default function CollectionGalleryPage() {
	const params = useParams<{ projectId: string }>();
	const projectId = params.projectId;
	
	const [collectionImages, setCollectionImages] = useState<{id: string; signed_url: string; name?: string}[]>([]);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!projectId) return;
		
		async function fetchCollection() {
			try {
				console.log('Fetching collection for project:', projectId);
				
				// First, get the project info to verify it exists and get display mode
				const projectRes = await fetch(`/api/projects/${projectId}`);
				if (!projectRes.ok) {
					setError(`Project not found: ${projectRes.status}`);
					setLoading(false);
					return;
				}
				
				const projectData = await projectRes.json();
				console.log('Project data:', projectData);
				
				if (projectData.display_mode !== 'collection') {
					setError('This project is not in collection mode');
					setLoading(false);
					return;
				}
				
				// Now try to get the active collection using the new gallery API
				const galleryRes = await fetch(`/api/public/${projectId}/gallery`);
				console.log('Gallery API response status:', galleryRes.status);
				
				if (galleryRes.ok) {
					const data = await galleryRes.json();
					console.log('Gallery data:', data);
					setCollectionImages(data.images || []);
				} else {
					const errorData = await galleryRes.json();
					console.error('Gallery API error:', errorData);
					setError(`Collection not found or not available: ${errorData.error || 'Unknown error'}`);
				}
			} catch (error) {
				console.error('Error fetching collection:', error);
				setError("Failed to load collection");
			} finally {
				setLoading(false);
			}
		}
		
		fetchCollection();
	}, [projectId]);

	const openImage = (index: number) => {
		setSelectedImageIndex(index);
	};

	const closeImage = () => {
		setSelectedImageIndex(null);
	};

	const navigateImage = (direction: 'prev' | 'next') => {
		if (selectedImageIndex === null) return;
		const newIndex = direction === 'prev' 
			? selectedImageIndex - 1 
			: selectedImageIndex + 1;
		
		if (newIndex >= 0 && newIndex < collectionImages.length) {
			setSelectedImageIndex(newIndex);
		}
	};

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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading collection...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-600 text-lg font-medium mb-2">Error</div>
					<p className="text-gray-600">{error}</p>
					<button 
						onClick={() => window.location.href = `/public/${projectId}`}
						className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Back to QR Code
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Back button */}
						<button
							onClick={() => window.location.href = `/public/${projectId}`}
							className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to QR Code
						</button>
						
						{/* Collection info and download */}
						<div className="flex items-center gap-4">
							<span className="text-sm text-gray-600">
								{collectionImages.length} {collectionImages.length === 1 ? 'image' : 'images'}
							</span>
							<button
								onClick={downloadAllImages}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<Download className="w-4 h-4" />
								Download All
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Grid Gallery */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{collectionImages.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-500 text-lg">No images in this collection yet.</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
						{collectionImages.map((image, index) => (
							<div
								key={image.id}
								className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
								onClick={() => openImage(index)}
							>
								<Image
									src={image.signed_url}
									alt={image.name || `Image ${index + 1}`}
									width={300}
									height={300}
									className="w-full h-full object-cover"
								/>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Lightbox Modal */}
			{selectedImageIndex !== null && (
				<div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
					<div className="relative max-w-4xl max-h-full p-4">
						{/* Close button */}
						<button
							onClick={closeImage}
							className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
						>
							<X className="w-6 h-6" />
						</button>

						{/* Navigation buttons */}
						{selectedImageIndex > 0 && (
							<button
								onClick={() => navigateImage('prev')}
								className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</button>
						)}
						
						{selectedImageIndex < collectionImages.length - 1 && (
							<button
								onClick={() => navigateImage('next')}
								className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>
						)}

						{/* Image */}
						<Image
							src={collectionImages[selectedImageIndex].signed_url}
							alt={collectionImages[selectedImageIndex].name || `Image ${selectedImageIndex + 1}`}
							width={800}
							height={600}
							className="max-w-full max-h-full object-contain"
						/>

						{/* Image counter */}
						<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
							{selectedImageIndex + 1} / {collectionImages.length}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
