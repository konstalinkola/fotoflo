"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";

export default function PublicProjectPage() {
	const params = useParams<{ projectId: string }>();
	const projectId = params.projectId;
	const [latestUrl, setLatestUrl] = useState<string>("");
	const [logoUrl, setLogoUrl] = useState<string>("");
	const [bgColor, setBgColor] = useState<string>("#f5f5f5");
	const [qrVisible, setQrVisible] = useState<boolean>(true);
	const [qrVisibilityDuration, setQrVisibilityDuration] = useState<number>(0);
	const [qrExpiresOnClick, setQrExpiresOnClick] = useState<boolean>(false);
	const [hasBeenViewed, setHasBeenViewed] = useState<boolean>(false);
	const [customization, setCustomization] = useState<any>(null);

	useEffect(() => {
		if (!projectId) return;
		let isMounted = true;
		
		async function fetchCustomization() {
			try {
				const res = await fetch(`/api/projects/${projectId}/customization`);
				if (res.ok) {
					const data = await res.json();
					if (isMounted && data.settings) {
						setCustomization(data.settings);
					}
				}
			} catch (error) {
				// Ignore customization errors
			}
		}
		
		async function fetchLatest() {
			const res = await fetch(`/api/projects/${projectId}/latest`);
			if (!res.ok) return;
			const data = await res.json();
			if (!isMounted) return;
			
			// Check if this is a new image (URL changed)
			const isNewImage = data.url && data.url !== latestUrl;
			
			setLatestUrl(data.url || "");
			if (typeof data.logo_url === "string") setLogoUrl(data.logo_url);
			if (typeof data.background_color === "string") setBgColor(data.background_color);
			if (typeof data.qr_visibility_duration === "number") setQrVisibilityDuration(data.qr_visibility_duration);
			if (typeof data.qr_expires_on_click === "boolean") setQrExpiresOnClick(data.qr_expires_on_click);
			
			// Reset visibility when new image is loaded
			if (isNewImage) {
				setQrVisible(true);
				setHasBeenViewed(false);
			}
		}
		
		fetchCustomization();
		fetchLatest();
		const id = setInterval(fetchLatest, 5000);
		return () => {
			isMounted = false;
			clearInterval(id);
		};
	}, [projectId, latestUrl]);

	// Handle QR visibility timer
	useEffect(() => {
		if (qrVisibilityDuration > 0 && latestUrl) {
			const timer = setTimeout(() => {
				setQrVisible(false);
			}, qrVisibilityDuration * 60 * 1000); // Convert minutes to milliseconds
			
			return () => clearTimeout(timer);
		}
	}, [qrVisibilityDuration, latestUrl]);

	// Handle click to expire
	const handleQrClick = () => {
		if (qrExpiresOnClick && !hasBeenViewed) {
			setHasBeenViewed(true);
			setQrVisible(false);
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
				{latestUrl && qrVisible ? (
					<div className="relative">
						<QRCodeCanvas 
							value={latestUrl} 
							size={280} 
							includeMargin 
							onClick={handleQrClick}
							className={qrExpiresOnClick ? "cursor-pointer" : ""}
						/>
						{qrExpiresOnClick && (
							<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 text-center">
								Click to view
							</div>
						)}
					</div>
				) : latestUrl && !qrVisible ? (
					<div className="text-gray-700 text-center">
						<div className="text-lg font-medium mb-2">QR Code Expired</div>
						<div className="text-sm">The QR code is no longer available</div>
					</div>
				) : (
					<div className="text-gray-700">Waiting for latest photo…</div>
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