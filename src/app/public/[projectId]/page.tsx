"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode.react";

export default function PublicProjectPage({ params }: { params: { projectId: string } }) {
	const { projectId } = params;
	const [latestUrl, setLatestUrl] = useState<string>("");

	useEffect(() => {
		let isMounted = true;
		async function fetchLatest() {
			const res = await fetch(`/api/projects/${projectId}/latest`);
			if (!res.ok) return;
			const data = await res.json();
			if (isMounted) setLatestUrl(data.url || "");
		}
		fetchLatest();
		const id = setInterval(fetchLatest, 5000);
		return () => {
			isMounted = false;
			clearInterval(id);
		};
	}, [projectId]);

	return (
		<div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: "#f5f5f5" }}>
			<div className="flex flex-col items-center gap-6">
				{latestUrl ? (
					<QRCode value={latestUrl} size={280} includeMargin />
				) : (
					<div className="text-gray-500">Waiting for latest photo…</div>
				)}
				{latestUrl ? <a href={latestUrl} target="_blank" className="underline">Open image</a> : null}
			</div>
		</div>
	);
}
