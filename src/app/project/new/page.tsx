"use client";

import { useState } from "react";

export default function NewProjectPage() {
	const [name, setName] = useState("");
	const [backgroundColor, setBackgroundColor] = useState("#ffffff");
	const [logoUrl, setLogoUrl] = useState("");
	const [storageBucket, setStorageBucket] = useState("");
	const [storagePrefix, setStoragePrefix] = useState("");
	const [saving, setSaving] = useState(false);
	const [createdId, setCreatedId] = useState<string | null>(null);

	async function createProject() {
		setSaving(true);
		try {
			const res = await fetch("/api/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, backgroundColor, logoUrl, storageBucket, storagePrefix }),
			});
			if (!res.ok) throw new Error("Failed to create project");
			const data = await res.json();
			setCreatedId(data.id);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="p-8 max-w-xl mx-auto space-y-6">
			<h1 className="text-2xl font-semibold">New Project</h1>
			<div className="space-y-3">
				<label className="block">Name</label>
				<input className="w-full border rounded h-10 px-3" value={name} onChange={e=>setName(e.target.value)} />
				<label className="block">Background color</label>
				<input className="w-full border rounded h-10 px-3" value={backgroundColor} onChange={e=>setBackgroundColor(e.target.value)} />
				<label className="block">Logo URL</label>
				<input className="w-full border rounded h-10 px-3" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} />
				<label className="block">Storage bucket name (e.g. photos)</label>
				<input className="w-full border rounded h-10 px-3" value={storageBucket} onChange={e=>setStorageBucket(e.target.value)} placeholder="photos" />
				<label className="block">Storage folder/prefix (e.g. project_123/)</label>
				<input className="w-full border rounded h-10 px-3" value={storagePrefix} onChange={e=>setStoragePrefix(e.target.value)} placeholder="project_123/" />
			</div>
			<button className="h-10 px-4 rounded bg-black text-white" onClick={createProject} disabled={saving}>Create</button>
			{createdId && (
				<div className="text-green-700">Created! Public page: <a className="underline" href={`/public/${createdId}`} target="_blank">/public/{createdId}</a></div>
			)}
		</div>
	);
}
