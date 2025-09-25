"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";

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
			setLoading(false);
		})();
	}, [id]);

	async function save() {
		setSaving(true);
		try {
			const res = await fetch(`/api/projects/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, logo_url: logoUrl, background_color: backgroundColor, storage_bucket: storageBucket, storage_prefix: storagePrefix }),
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
	};

	const handleUploadError = (error: string) => {
		setUploadMessage(`Upload failed: ${error}`);
		setTimeout(() => setUploadMessage(""), 5000);
	};

	if (loading) return <div className="p-8">Loading…</div>;

	return (
		<div className="p-8 max-w-4xl mx-auto space-y-8">
			<h1 className="text-2xl font-semibold">Edit Project</h1>
			
			{/* Upload Section */}
			<div className="bg-gray-50 p-6 rounded-lg">
				<h2 className="text-lg font-medium mb-4">Upload Photos</h2>
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
				<div className="mt-4 text-sm text-gray-600">
					<p>• Photos are automatically organized by user and project</p>
					<p>• The QR code will update to show the latest uploaded photo</p>
					<p>• Supported formats: JPEG, PNG, WebP (max 10MB)</p>
				</div>
			</div>

			{/* Project Settings */}
			<div className="bg-white border rounded-lg p-6">
				<h2 className="text-lg font-medium mb-4">Project Settings</h2>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">Name</label>
						<input 
							className="w-full border rounded h-10 px-3" 
							value={name} 
							onChange={e=>setName(e.target.value)} 
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Background color</label>
						<input 
							className="w-full border rounded h-10 px-3" 
							value={backgroundColor} 
							onChange={e=>setBackgroundColor(e.target.value)} 
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Logo URL</label>
						<input 
							className="w-full border rounded h-10 px-3" 
							value={logoUrl} 
							onChange={e=>setLogoUrl(e.target.value)} 
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Storage bucket</label>
						<input 
							className="w-full border rounded h-10 px-3" 
							value={storageBucket} 
							onChange={e=>setStorageBucket(e.target.value)} 
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Storage prefix</label>
						<input 
							className="w-full border rounded h-10 px-3" 
							value={storagePrefix} 
							onChange={e=>setStoragePrefix(e.target.value)} 
						/>
					</div>
				</div>
				<div className="flex items-center gap-3 mt-6">
					<button 
						className="h-10 px-4 rounded bg-black text-white disabled:opacity-50" 
						onClick={save} 
						disabled={saving}
					>
						Save Changes
					</button>
					<button 
						className="h-10 px-4 rounded border hover:bg-gray-50" 
						onClick={handleDelete}
					>
						Delete Project
					</button>
				</div>
			</div>
		</div>
	);
}
