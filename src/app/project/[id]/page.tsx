"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import ImageGallery from "@/components/ImageGallery";
import Navbar from "@/components/Navbar";

export default function EditProjectPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = params.id;
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [name, setName] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [backgroundColor, setBackgroundColor] = useState("#ffffff");
	const [storageBucket, setStorageBucket] = useState("");
	const [storagePrefix, setStoragePrefix] = useState("");
	const [uploadMessage, setUploadMessage] = useState("");
	const [galleryRefresh, setGalleryRefresh] = useState(0);
	const [qrVisibilityDuration, setQrVisibilityDuration] = useState(0);
	const [qrExpiresOnClick, setQrExpiresOnClick] = useState(false);
	const [settingsExpanded, setSettingsExpanded] = useState(false);

	useEffect(() => {
		if (!id) return;
		(async () => {
			const res = await fetch(`/api/projects/${id}`);
			if (!res.ok) return;
			const data = await res.json();
			setName(data.name || "");
			setLogoUrl(data.logo_url || "");
			setBackgroundColor(data.background_color || "#ffffff");
			setStorageBucket(data.storage_bucket || "");
			setStoragePrefix(data.storage_prefix || "");
			setQrVisibilityDuration(data.qr_visibility_duration || 0);
			setQrExpiresOnClick(data.qr_expires_on_click || false);
			setLoading(false);
		})();
	}, [id]);

	async function save() {
		setSaving(true);
		try {
			const res = await fetch(`/api/projects/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					name, 
					logo_url: logoUrl, 
					background_color: backgroundColor, 
					storage_bucket: storageBucket, 
					storage_prefix: storagePrefix,
					qr_visibility_duration: qrVisibilityDuration,
					qr_expires_on_click: qrExpiresOnClick
				}),
			});
			if (!res.ok) throw new Error("Failed to save");
			router.push("/dashboard");
		} catch (e: unknown) {
			alert(e instanceof Error ? e.message : "An error occurred");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm("Delete this project? This cannot be undone.")) return;
		const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
		if (!res.ok) {
			alert("Failed to delete");
			return;
		}
		router.push("/dashboard");
	}

	const handleUploadSuccess = () => {
		setUploadMessage("Photo uploaded successfully! The QR code will update automatically.");
		setTimeout(() => setUploadMessage(""), 3000);
		// Refresh gallery
		setGalleryRefresh(prev => prev + 1);
	};

	const handleUploadError = (error: string) => {
		setUploadMessage(`Upload failed: ${error}`);
		setTimeout(() => setUploadMessage(""), 5000);
	};

	const downloadLogo = async (url: string) => {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = `logo-${name || 'project'}.${url.split('.').pop() || 'png'}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		} catch {
			alert('Failed to download logo');
		}
	};

	if (loading) return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="p-8">Loading…</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">{name || "Edit Project"}</h1>
							<p className="mt-2 text-gray-600">Manage your project settings, upload photos, and view your gallery</p>
						</div>
						<div className="flex items-center gap-3">
							<a
								href={`/public/${id}`}
								target="_blank"
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								View Public Page
							</a>
							<button
								onClick={() => router.push("/dashboard")}
								className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
							>
								Back to Dashboard
							</button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Upload and Gallery */}
					<div className="lg:col-span-2 space-y-8">
						{/* Upload Section */}
						<div className="bg-white border rounded-lg p-6">
							<h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
							<FileUpload 
								projectId={id} 
								onUploadSuccess={handleUploadSuccess}
								onUploadError={handleUploadError}
							/>
							{uploadMessage && (
								<div className={`mt-4 p-3 rounded text-sm ${
									uploadMessage.includes("successfully") 
										? "bg-green-100 text-green-700" 
										: "bg-red-100 text-red-700"
								}`}>
									{uploadMessage}
								</div>
							)}
							<div className="mt-4 text-sm text-gray-600 space-y-1">
								<p>• Drag and drop photos or click to browse</p>
								<p>• Photos are automatically organized by user and project</p>
								<p>• The QR code will update to show the latest uploaded photo</p>
								<p>• Supported formats: JPEG, PNG, WebP (max 10MB)</p>
							</div>
						</div>

						{/* Gallery Section */}
						<ImageGallery 
							projectId={id} 
							key={galleryRefresh}
						/>
					</div>

					{/* Right Column - Project Settings and Quick Actions */}
					<div className="space-y-6">
						{/* Collapsible Project Settings */}
						<div className="bg-white border rounded-lg">
							<button
								onClick={() => setSettingsExpanded(!settingsExpanded)}
								className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
							>
								<h2 className="text-xl font-semibold">Project Settings</h2>
								<svg
									className={`w-5 h-5 transition-transform ${settingsExpanded ? 'rotate-180' : ''}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							
							{settingsExpanded && (
								<div className="px-6 pb-6 border-t">
									<div className="space-y-4 pt-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
											<input 
												className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
												value={name} 
												onChange={e=>setName(e.target.value)} 
												placeholder="Enter project name"
											/>
										</div>
										
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
											<div className="flex items-center gap-3">
												<input 
													type="color"
													className="w-12 h-10 border border-gray-300 rounded cursor-pointer" 
													value={backgroundColor} 
													onChange={e=>setBackgroundColor(e.target.value)} 
												/>
												<input 
													className="flex-1 border border-gray-300 rounded-lg h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
													value={backgroundColor} 
													onChange={e=>setBackgroundColor(e.target.value)} 
													placeholder="#ffffff"
												/>
											</div>
										</div>
										
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
											<input 
												className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
												value={logoUrl} 
												onChange={e=>setLogoUrl(e.target.value)} 
												placeholder="https://example.com/logo.png"
											/>
											{logoUrl && (
												<div className="mt-2 flex items-center gap-3">
													<img 
														src={logoUrl} 
														alt="Logo preview" 
														className="h-8 w-auto object-contain"
														onError={(e) => {
															e.currentTarget.style.display = 'none';
														}}
													/>
													<button
														onClick={() => downloadLogo(logoUrl)}
														className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
													>
														Download Logo
													</button>
												</div>
											)}
										</div>
										
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Storage Bucket</label>
											<input 
												className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
												value={storageBucket} 
												onChange={e=>setStorageBucket(e.target.value)} 
												placeholder="bucket-name"
											/>
										</div>
										
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Storage Prefix (Optional)</label>
											<input 
												className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
												value={storagePrefix} 
												onChange={e=>setStoragePrefix(e.target.value)} 
												placeholder="folder/subfolder"
											/>
										</div>
										
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">QR Code Visibility Duration</label>
											<select 
												className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												value={qrVisibilityDuration}
												onChange={e => setQrVisibilityDuration(Number(e.target.value))}
											>
												<option value={0}>Forever</option>
												<option value={1}>1 minute</option>
												<option value={2}>2 minutes</option>
												<option value={5}>5 minutes</option>
												<option value={10}>10 minutes</option>
												<option value={30}>30 minutes</option>
												<option value={60}>1 hour</option>
											</select>
											<p className="text-xs text-gray-500 mt-1">How long the QR code stays visible after a new image is uploaded</p>
										</div>
										
										<div className="flex items-center gap-3">
											<input 
												type="checkbox"
												id="qrExpiresOnClick"
												checked={qrExpiresOnClick}
												onChange={e => setQrExpiresOnClick(e.target.checked)}
												className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
											/>
											<label htmlFor="qrExpiresOnClick" className="text-sm font-medium text-gray-700">
												QR code expires after first view
											</label>
										</div>
										<p className="text-xs text-gray-500">When enabled, the QR code disappears after someone opens the link once</p>
									</div>
									
									<div className="flex items-center gap-3 mt-6 pt-6 border-t">
										<button 
											className="flex-1 h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors" 
											onClick={save} 
											disabled={saving}
										>
											{saving ? "Saving..." : "Save Changes"}
										</button>
										<button 
											className="h-10 px-4 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors" 
											onClick={handleDelete}
										>
											Delete
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Quick Actions */}
						<div className="bg-white border rounded-lg p-6">
							<h3 className="text-lg font-medium mb-4">Quick Actions</h3>
							<div className="space-y-3">
								<a
									href={`/public/${id}`}
									target="_blank"
									className="block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									View Public QR Page
								</a>
								<button
									onClick={() => {
										navigator.clipboard.writeText(`${window.location.origin}/public/${id}`);
										alert("Public URL copied to clipboard!");
									}}
									className="block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Copy Public URL
								</button>
								<button
									onClick={() => window.open(`/customize/${id}`, '_blank', 'width=1200,height=800')}
									className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									Customize Public Page
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}