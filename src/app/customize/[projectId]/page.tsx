"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";

interface CustomizationSettings {
	logoSize: number;
	logoPosition: { x: number; y: number };
	backgroundColor: string;
	textContent: string;
	textPosition: { x: number; y: number };
	textColor: string;
	textSize: number;
}

export default function CustomizePage() {
	const params = useParams<{ projectId: string }>();
	const projectId = params.projectId;
	
	const [latestUrl, setLatestUrl] = useState<string>("");
	const [logoUrl, setLogoUrl] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	
	const [settings, setSettings] = useState<CustomizationSettings>({
		logoSize: 80,
		logoPosition: { x: 0, y: -100 },
		backgroundColor: "#f5f5f5",
		textContent: "",
		textPosition: { x: 0, y: 150 },
		textColor: "#333333",
		textSize: 16
	});

	useEffect(() => {
		if (!projectId) return;
		
		async function loadProject() {
			try {
				console.log("Loading project:", projectId);
				const res = await fetch(`/api/projects/${projectId}`);
				if (!res.ok) {
					console.error("Failed to load project:", res.status);
					return;
				}
				const data = await res.json();
				console.log("Project data:", data);
				
				setLogoUrl(data.logo_url || "");
				setSettings(prev => ({
					...prev,
					backgroundColor: data.background_color || "#f5f5f5"
				}));
				
				// Load customization settings
				try {
					const customRes = await fetch(`/api/projects/${projectId}/customization`);
					if (customRes.ok) {
						const customData = await customRes.json();
						console.log("Customization data:", customData);
						if (customData.settings) {
							setSettings(prev => ({ ...prev, ...customData.settings }));
						}
					}
				} catch (error) {
					console.log("No customization settings found:", error);
				}
				
				// Load latest image
				const latestRes = await fetch(`/api/projects/${projectId}/latest`);
				if (latestRes.ok) {
					const latestData = await latestRes.json();
					setLatestUrl(latestData.url || "");
				}
			} catch (error) {
				console.error("Failed to load project:", error);
			} finally {
				setLoading(false);
			}
		}
		
		loadProject();
	}, [projectId]);

	const updateSetting = (key: keyof CustomizationSettings, value: unknown) => {
		setSettings(prev => ({ ...prev, [key]: value }));
	};

	const saveSettings = async () => {
		setSaving(true);
		try {
			console.log("Saving settings:", settings);
			const res = await fetch(`/api/projects/${projectId}/customization`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			
			const result = await res.json();
			console.log("Save response:", result, "Status:", res.status);
			
			if (res.ok) {
				alert("Customization settings saved!");
			} else {
				alert(`Failed to save settings: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error("Save error:", error);
			alert("Error saving settings");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="p-8">Loading...</div>;
	}

	return (
		<div className="h-screen flex bg-gray-100">
			{/* Preview Panel - Matches Public Page Layout */}
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="w-full max-w-md">
					{/* Preview matches the exact public page structure */}
					<div 
						className="min-h-screen flex items-center justify-center p-8"
						style={{ backgroundColor: settings.backgroundColor }}
					>
						<div className="relative flex flex-col items-center gap-6">
							{/* Logo with custom positioning - matches public page */}
							{logoUrl && (
								<div 
									className="absolute"
									style={{
										transform: `translate(${settings.logoPosition.x}px, ${settings.logoPosition.y}px)`,
										zIndex: 10
									}}
								>
									<Image 
										src={logoUrl} 
										alt="Logo" 
										width={settings.logoSize} 
										height={settings.logoSize} 
										className="object-contain" 
									/>
								</div>
							)}
							
							{/* QR Code - matches public page */}
							{latestUrl ? (
								<div className="relative">
									<QRCodeCanvas 
										value={latestUrl} 
										size={280} 
										includeMargin 
									/>
								</div>
							) : (
								<div className="text-gray-700">Waiting for latest photo…</div>
							)}
							
							{/* Custom text element - matches public page */}
							{settings.textContent && (
								<div 
									className="absolute"
									style={{
										transform: `translate(${settings.textPosition.x}px, ${settings.textPosition.y}px)`,
										color: settings.textColor,
										fontSize: `${settings.textSize}px`,
										zIndex: 10
									}}
								>
									{settings.textContent}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Controls Panel */}
			<div className="w-80 bg-white border-l p-6 overflow-y-auto">
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold">Customize Public Page</h2>
						<button
							onClick={saveSettings}
							disabled={saving}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? "Saving..." : "Save"}
						</button>
					</div>

					{/* Logo Settings */}
					<div className="space-y-4">
						<h3 className="font-medium">Logo Settings</h3>
						
						<div>
							<label className="block text-sm font-medium mb-2">Logo Size</label>
							<input
								type="range"
								min="40"
								max="200"
								value={settings.logoSize}
								onChange={(e) => updateSetting('logoSize', Number(e.target.value))}
								className="w-full"
							/>
							<div className="text-xs text-gray-500">{settings.logoSize}px</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Logo Position X</label>
							<input
								type="range"
								min="-200"
								max="200"
								value={settings.logoPosition.x}
								onChange={(e) => updateSetting('logoPosition', { ...settings.logoPosition, x: Number(e.target.value) })}
								className="w-full"
							/>
							<div className="text-xs text-gray-500">{settings.logoPosition.x}px</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Logo Position Y</label>
							<input
								type="range"
								min="-300"
								max="300"
								value={settings.logoPosition.y}
								onChange={(e) => updateSetting('logoPosition', { ...settings.logoPosition, y: Number(e.target.value) })}
								className="w-full"
							/>
							<div className="text-xs text-gray-500">{settings.logoPosition.y}px</div>
						</div>
					</div>

					{/* Background Settings */}
					<div className="space-y-4">
						<h3 className="font-medium">Background</h3>
						
						<div>
							<label className="block text-sm font-medium mb-2">Background Color</label>
							<div className="flex items-center gap-3">
								<input
									type="color"
									value={settings.backgroundColor}
									onChange={(e) => updateSetting('backgroundColor', e.target.value)}
									className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
								/>
								<input
									type="text"
									value={settings.backgroundColor}
									onChange={(e) => updateSetting('backgroundColor', e.target.value)}
									className="flex-1 border border-gray-300 rounded h-10 px-3"
								/>
							</div>
						</div>
					</div>

					{/* Text Settings */}
					<div className="space-y-4">
						<h3 className="font-medium">Text Element</h3>
						
						<div>
							<label className="block text-sm font-medium mb-2">Text Content</label>
							<input
								type="text"
								value={settings.textContent}
								onChange={(e) => updateSetting('textContent', e.target.value)}
								placeholder="Enter text to display"
								className="w-full border border-gray-300 rounded h-10 px-3"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Text Size</label>
							<input
								type="range"
								min="12"
								max="48"
								value={settings.textSize}
								onChange={(e) => updateSetting('textSize', Number(e.target.value))}
								className="w-full"
							/>
							<div className="text-xs text-gray-500">{settings.textSize}px</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Text Color</label>
							<div className="flex items-center gap-3">
								<input
									type="color"
									value={settings.textColor}
									onChange={(e) => updateSetting('textColor', e.target.value)}
									className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
								/>
								<input
									type="text"
									value={settings.textColor}
									onChange={(e) => updateSetting('textColor', e.target.value)}
									className="flex-1 border border-gray-300 rounded h-10 px-3"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Text Position X</label>
							<input
								type="range"
								min="-200"
								max="200"
								value={settings.textPosition.x}
								onChange={(e) => updateSetting('textPosition', { ...settings.textPosition, x: Number(e.target.value) })}
								className="w-full"
							/>
							<div className="text-xs text-gray-500">{settings.textPosition.x}px</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">Text Position Y</label>
							<input
								type="range"
								min="-300"
								max="300"
								value={settings.textPosition.y}
								onChange={(e) => updateSetting('textPosition', { ...settings.textPosition, y: Number(e.target.value) })}
								className="w-full"
							/>
							<div className="text-xs text-gray-500">{settings.textPosition.y}px</div>
						</div>
					</div>

					{/* Preview Info */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="font-medium text-blue-900 mb-2">Preview Info</h4>
						<p className="text-sm text-blue-700">
							This preview shows how your public page will look on mobile devices (iPad/iPhone). 
							The layout matches exactly what visitors will see.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}