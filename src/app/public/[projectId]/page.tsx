"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

	useEffect(() => {
		if (!projectId) return;
		let isMounted = true;
		async function fetchLatest() {
			const res = await fetch(`/api/projects/${projectId}/latest`);
			if (!res.ok) return;
			const data = await res.json();
			if (!isMounted) return;
			setLatestUrl(data.url || "");
			if (typeof data.logo_url === "string") setLogoUrl(data.logo_url);
			if (typeof data.background_color === "string") setBgColor(data.background_color);
		}
		fetchLatest();
		const id = setInterval(fetchLatest, 5000);
		return () => {
			isMounted = false;
			clearInterval(id);
		};
	}, [projectId]);

	return (
		<div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: bgColor }}>
			<div className="flex flex-col items-center gap-6">
				{logoUrl ? (
					<Image src={logoUrl} alt="Logo" width={80} height={80} className="max-h-20 object-contain" />
				) : null}
				{latestUrl ? (
					<QRCodeCanvas value={latestUrl} size={280} includeMargin />
				) : (
					<div className="text-gray-700">Waiting for latest photo…</div>
				)}
			</div>
		</div>
	);
}
