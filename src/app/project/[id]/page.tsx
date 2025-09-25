"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

	if (loading) return <div className="p-8">Loading…</div>;

	return (
		<div className="p-8 max-w-xl mx-auto space-y-6">
			<h1 className="text-2xl font-semibold">Edit Project</h1>
			<div className="space-y-3">
				<label className="block">Name</label>
				<input className="w-full border rounded h-10 px-3" value={name} onChange={e=>setName(e.target.value)} />
				<label className="block">Background color</label>
				<input className="w-full border rounded h-10 px-3" value={backgroundColor} onChange={e=>setBackgroundColor(e.target.value)} />
				<label className="block">Logo URL</label>
				<input className="w-full border rounded h-10 px-3" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} />
				<label className="block">Storage bucket</label>
				<input className="w-full border rounded h-10 px-3" value={storageBucket} onChange={e=>setStorageBucket(e.target.value)} />
				<label className="block">Storage prefix</label>
				<input className="w-full border rounded h-10 px-3" value={storagePrefix} onChange={e=>setStoragePrefix(e.target.value)} />
			</div>
			<div className="flex items-center gap-3">
				<button className="h-10 px-4 rounded bg-black text-white disabled:opacity-50" onClick={save} disabled={saving}>Save</button>
				<button className="h-10 px-4 rounded border" onClick={handleDelete}>Delete</button>
			</div>
		</div>
	);
}