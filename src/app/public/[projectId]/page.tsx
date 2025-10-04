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
	const [customization, setCustomization] = useState<{logoSize?: number; logoPosition?: {x: number; y: number}; backgroundColor?: string; textContent?: string; textPosition?: {x: number; y: number}; textColor?: string; textSize?: number; fontFamily?: string; fontWeight?: string} | null>(null);
	
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
				
				// Fetch customization settings from API (now uses individual columns)
				const res = await fetch(`/api/projects/${projectId}/customization`);
				if (res.ok) {
					const data = await res.json();
					console.log("Customization data loaded:", data);
					if (isMounted && data.settings) {
						setCustomization(data.settings);
						// Immediately update background color from settings to prevent flashing
						if (data.settings.backgroundColor) {
							console.log("Setting background color to:", data.settings.backgroundColor);
							setBgColor(data.settings.backgroundColor);
						}
					}
				}
			} catch (error) {
				console.log("No customization settings found:", error);
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

		async function fetchProjectInfo() {
			try {
				// First, get project info to determine display mode
				const projectRes = await fetch(`/api/projects/${projectId}`);
				if (!projectRes.ok) return;
				
				const projectData = await projectRes.json();
				if (!isMounted) return;
				
				// Set basic project info (logo and background color) for all projects
				if (typeof projectData.logo_url === "string") setLogoUrl(projectData.logo_url);
				// Only set background color if no customization settings exist yet
				if (typeof projectData.background_color === "string" && !customization) {
					setBgColor(projectData.background_color);
				}
				if (typeof projectData.qr_visibility_duration === "number") setQrVisibilityDuration(projectData.qr_visibility_duration);
				if (typeof projectData.qr_expires_on_click === "boolean") setQrExpiresOnClick(projectData.qr_expires_on_click);
				
				// Set display mode based on project data
				const isCollectionProject = projectData.display_mode === 'collection';
				setIsCollectionMode(isCollectionProject);
				
				// If it's a collection project, we'll handle it when the QR code is clicked
				// No need to fetch collection data here as it causes 404 errors
			} catch (error) {
				console.error('Error fetching project info:', error);
				setIsCollectionMode(false);
			}
		}
		
		fetchCustomization(); // Load customization settings first
		fetchQrUrl(); // Always fetch QR URL
		fetchProjectInfo(); // Determine project mode (but don't override customization settings)
		
		// Set up polling for both single image and collection modes
		// This ensures QR codes stay updated when content changes
		const id = setInterval(fetchQrUrl, 5000);
		return () => {
			isMounted = false;
			clearInterval(id);
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
		// For collection mode, let the QR code work naturally by navigating to the URL
		if (isCollectionMode && qrUrl) {
			window.open(qrUrl, '_blank');
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
	// Priority: customization settings > project background color > default
	const displayBgColor = customization?.backgroundColor || bgColor || "#f5f5f5";
	const logoSize = customization?.logoSize || 80;
	const logoPosition = customization?.logoPosition || { x: 0, y: -100 };
	const textContent = customization?.textContent || "";
	const textPosition = customization?.textPosition || { x: 0, y: 150 };
	const textColor = customization?.textColor || "#333333";
	const textSize = customization?.textSize || 16;
	const fontFamily = customization?.fontFamily || "Inter";
	const fontWeight = customization?.fontWeight || "400";
	
	// Debug logging
	console.log("Final display background color:", displayBgColor);
	console.log("Customization settings:", customization);
	console.log("bgColor state:", bgColor);

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
									alt={`Image ${index + 1}`}
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
								alt={`Image ${selectedImageIndex + 1}`}
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

	// Mobile-first QR code view with 10:16 aspect ratio
	return (
		<div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: displayBgColor }}>
			{/* Mobile-optimized container with 10:16 aspect ratio */}
			<div className="w-full max-w-sm mx-auto">
				<div 
					className="relative w-full bg-white rounded-2xl shadow-lg overflow-hidden"
					style={{ 
						aspectRatio: '10/16',
						backgroundColor: displayBgColor 
					}}
				>
					{/* Logo with custom positioning */}
					{logoUrl && (
						<div 
							className="absolute"
							style={{
								left: '50%',
								top: `${50 + logoPosition.y / 5}%`,
								transform: `translate(-50%, -50%) translate(${logoPosition.x}px, 0px)`,
								zIndex: 10
							}}
						>
							<Image 
								src={logoUrl} 
								alt="Logo" 
								width={logoSize} 
								height={logoSize} 
								className="object-contain"
								style={{ width: 'auto', height: 'auto' }}
							/>
						</div>
					)}
					
					{/* QR Code - centered */}
					<div className="absolute inset-0 flex items-center justify-center">
						{qrUrl && qrVisible ? (
							<div className="relative">
								<QRCodeCanvas 
									value={qrUrl} 
									size={200} 
									includeMargin 
									onClick={handleQrClick}
									className={qrExpiresOnClick ? "cursor-pointer" : ""}
								/>
							</div>
						) : qrUrl && !qrVisible ? (
							<div className="text-gray-700 text-center">
								<div className="text-lg font-medium mb-2">QR Code Expired</div>
								<div className="text-sm">The QR code is no longer available</div>
							</div>
						) : (
							<div className="text-gray-700 text-center">
								{isCollectionMode ? "Waiting for collection…" : "Waiting for latest photo…"}
							</div>
						)}
					</div>
					
					{/* Custom text element */}
					{textContent && (
						<div 
							className="absolute"
							style={{
								left: '50%',
								top: `${50 + textPosition.y / 5}%`,
								transform: `translate(-50%, -50%) translate(${textPosition.x}px, 0px)`,
								color: textColor,
								fontSize: `${textSize}px`,
								fontFamily: fontFamily,
								fontWeight: fontWeight,
								zIndex: 10,
								textAlign: 'center',
								whiteSpace: 'nowrap'
							}}
						>
							{textContent}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}