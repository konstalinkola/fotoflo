"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";
import { Download, X } from "lucide-react";

export default function PublicProjectPage() {
	const params = useParams<{ projectId: string }>();
	const searchParams = useSearchParams();
	const projectId = params.projectId;
	
	// Preview mode parameters
	const isPreview = searchParams.get('preview') === 'true';
	const previewLogoSize = searchParams.get('logoSize');
	const previewLogoPositionY = searchParams.get('logoPositionY');
	const previewBackgroundColor = searchParams.get('backgroundColor');
	const previewTextContent = searchParams.get('textContent');
	const previewFontSize = searchParams.get('fontSize');
	const previewFontColor = searchParams.get('fontColor');
	const previewTextPositionY = searchParams.get('textPositionY');
	const [qrUrl, setQrUrl] = useState<string>("");
	const [logoUrl, setLogoUrl] = useState<string>("");
	const [bgColor, setBgColor] = useState<string>("#f5f5f5");
	const [qrVisible, setQrVisible] = useState<boolean>(true);
	const [qrVisibilityDuration, setQrVisibilityDuration] = useState<number>(0);
	const [qrExpiresOnClick, setQrExpiresOnClick] = useState<boolean>(false);
	const [hasBeenViewed, setHasBeenViewed] = useState<boolean>(false);
	const [customization, setCustomization] = useState<{logoSize?: number; logoPosition?: {x: number; y: number}; backgroundColor?: string; textContent?: string; textPosition?: {x: number; y: number}; textColor?: string; textSize?: number} | null>(null);
	
	// Collection gallery state
	const [isCollectionMode, setIsCollectionMode] = useState<boolean>(false);
	const [collectionImages, setCollectionImages] = useState<{id: string; signed_url: string}[]>([]);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
	const [showGallery, setShowGallery] = useState<boolean>(false);
	
	// Check if gallery should be shown from URL parameter
	const shouldShowGallery = searchParams.get('gallery') === 'true';

	useEffect(() => {
		if (!projectId) return;
		let isMounted = true;
		
		async function fetchCustomization() {
			try {
				// Use preview parameters if in preview mode
				if (isPreview && previewLogoSize && previewLogoPositionY && previewBackgroundColor && previewFontSize && previewFontColor && previewTextPositionY) {
					const previewSettings = {
						logoSize: parseInt(previewLogoSize),
						logoPosition: { x: 0, y: parseInt(previewLogoPositionY) },
						backgroundColor: previewBackgroundColor,
						textContent: previewTextContent || "",
						textPosition: { x: 0, y: parseInt(previewTextPositionY) },
						textColor: previewFontColor,
						textSize: parseInt(previewFontSize)
					};
					if (isMounted) {
						setCustomization(previewSettings);
						setBgColor(previewBackgroundColor);
					}
					return;
				}
				
				// Otherwise fetch from API
				const res = await fetch(`/api/projects/${projectId}/customization`);
				if (res.ok) {
					const data = await res.json();
					if (isMounted && data.settings) {
						setCustomization(data.settings);
					}
				}
			} catch {
				// Ignore customization errors
			}
		}
		
		async function fetchQrUrl() {
			const res = await fetch(`/api/projects/${projectId}/qr-url`);
			if (!res.ok) return;
			const data = await res.json();
			if (!isMounted) return;
			
			// Check if this is a new URL
			const isNewUrl = data.url && data.url !== qrUrl;
			
			setQrUrl(data.url || "");
			
			// Reset visibility when new URL is loaded
			if (isNewUrl) {
				setQrVisible(true);
				setHasBeenViewed(false);
			}
		}

		async function fetchCollection() {
			try {
				const res = await fetch(`/api/public/${projectId}/collection`);
				if (res.ok) {
					const data = await res.json();
					if (isMounted) {
						setIsCollectionMode(true);
						setCollectionImages(data.images || []);
						if (typeof data.project?.logo_url === "string") setLogoUrl(data.project.logo_url);
						if (typeof data.project?.background_color === "string") setBgColor(data.project.background_color);
						if (typeof data.project?.qr_visibility_duration === "number") setQrVisibilityDuration(data.project.qr_visibility_duration);
						if (typeof data.project?.qr_expires_on_click === "boolean") setQrExpiresOnClick(data.project.qr_expires_on_click);
						if (data.settings) {
							setCustomization(data.settings);
						}
					}
				} else {
					// Project is not in collection mode, fetch normally
					setIsCollectionMode(false);
				}
			} catch (error) {
				console.error('Error fetching collection:', error);
				setIsCollectionMode(false);
			}
		}
		
		fetchCustomization();
		fetchCollection(); // Try collection mode first
		fetchQrUrl(); // Always fetch QR URL
		
		// Set up polling for single image mode
		if (!isCollectionMode) {
			const id = setInterval(fetchQrUrl, 5000);
			return () => {
				isMounted = false;
				clearInterval(id);
			};
		}
		return () => {
			isMounted = false;
		};
	}, [projectId, qrUrl, isCollectionMode, isPreview, previewLogoSize, previewLogoPositionY, previewBackgroundColor, previewTextContent, previewFontSize, previewFontColor, previewTextPositionY]);

	// Auto-show gallery if URL parameter is present
	useEffect(() => {
		if (shouldShowGallery && isCollectionMode && collectionImages.length > 0) {
			setShowGallery(true);
		}
	}, [shouldShowGallery, isCollectionMode, collectionImages]);

	// Handle QR visibility timer
	useEffect(() => {
		if (qrVisibilityDuration > 0 && qrUrl) {
			const timer = setTimeout(() => {
				setQrVisible(false);
			}, qrVisibilityDuration * 60 * 1000); // Convert minutes to milliseconds
			
			return () => clearTimeout(timer);
		}
	}, [qrVisibilityDuration, qrUrl]);

	// Handle click to expire
	const handleQrClick = () => {
		if (isCollectionMode && collectionImages.length > 0) {
			setShowGallery(true);
		} else if (qrExpiresOnClick && !hasBeenViewed) {
			setHasBeenViewed(true);
			setQrVisible(false);
		}
	};

	// Gallery functions
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
					a.download = `image-${i + 1}.jpg`;
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

	// Use customization settings if available, otherwise use defaults
	const displayBgColor = customization?.backgroundColor || bgColor;
	const logoSize = customization?.logoSize || 80;
	const logoPosition = customization?.logoPosition || { x: 0, y: -100 };
	const textContent = customization?.textContent || "";
	const textPosition = customization?.textPosition || { x: 0, y: 150 };
	const textColor = customization?.textColor || "#333333";
	const textSize = customization?.textSize || 16;

	// Collection gallery view
	if (showGallery && isCollectionMode) {
		return (
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-white shadow-sm border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center h-16">
							{/* Logo */}
							{logoUrl && (
								<Image 
									src={logoUrl} 
									alt="Logo" 
									width={40} 
									height={40} 
									className="object-contain" 
								/>
							)}
							
							{/* Download all button */}
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

				{/* Grid Gallery */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

	// Regular QR code view (single image mode)
	return (
		<div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: displayBgColor }}>
			<div className="relative flex flex-col items-center gap-6">
				{/* Logo with custom positioning */}
				{logoUrl && (
					<div 
						className="absolute"
						style={{
							transform: `translate(${logoPosition.x}px, ${logoPosition.y}px)`,
							zIndex: 10
						}}
					>
						<Image 
							src={logoUrl} 
							alt="Logo" 
							width={logoSize} 
							height={logoSize} 
							className="object-contain" 
						/>
					</div>
				)}
				
				{/* QR Code */}
				{qrUrl && qrVisible ? (
					<div className="relative">
						<QRCodeCanvas 
							value={qrUrl} 
							size={280} 
							includeMargin 
							onClick={handleQrClick}
							className={qrExpiresOnClick || isCollectionMode ? "cursor-pointer" : ""}
						/>
						{(qrExpiresOnClick || isCollectionMode) && (
							<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 text-center">
								{isCollectionMode ? "Click to view gallery" : "Click to view image"}
							</div>
						)}
					</div>
				) : qrUrl && !qrVisible ? (
					<div className="text-gray-700 text-center">
						<div className="text-lg font-medium mb-2">QR Code Expired</div>
						<div className="text-sm">The QR code is no longer available</div>
					</div>
				) : (
					<div className="text-gray-700">
						{isCollectionMode ? "Waiting for collection…" : "Waiting for latest photo…"}
					</div>
				)}
				
				{/* Custom text element */}
				{textContent && (
					<div 
						className="absolute"
						style={{
							transform: `translate(${textPosition.x}px, ${textPosition.y}px)`,
							color: textColor,
							fontSize: `${textSize}px`,
							zIndex: 10
						}}
					>
						{textContent}
					</div>
				)}
			</div>
		</div>
	);
}