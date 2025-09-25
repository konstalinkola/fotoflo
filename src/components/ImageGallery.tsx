"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ImageData {
	name: string;
	path: string;
	created_at: string;
	size?: number;
	url: string | null;
	source: string;
}

interface ImageGalleryProps {
	projectId: string;
	onRefresh?: () => void;
}

export default function ImageGallery({ projectId, onRefresh }: ImageGalleryProps) {
	const [images, setImages] = useState<ImageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchImages = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`/api/projects/${projectId}/images`);
			if (!response.ok) {
				throw new Error("Failed to fetch images");
			}
			const data = await response.json();
			console.log("Gallery API response:", data); // Debug log
			setImages(data.images || []);
		} catch (err) {
			console.error("Gallery fetch error:", err); // Debug log
			setError(err instanceof Error ? err.message : "Failed to load images");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchImages();
	}, [projectId]);

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "Unknown size";
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	if (loading) {
		return (
			<div className="bg-white border rounded-lg p-6">
				<h2 className="text-lg font-medium mb-4">Photo Gallery</h2>
				<div className="flex items-center justify-center py-8">
					<div className="text-gray-500">Loading images...</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white border rounded-lg p-6">
				<h2 className="text-lg font-medium mb-4">Photo Gallery</h2>
				<div className="text-red-600 mb-4">{error}</div>
				<button 
					onClick={fetchImages}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white border rounded-lg p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-medium">Photo Gallery</h2>
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-500">{images.length} photos</span>
					<button 
						onClick={fetchImages}
						className="text-sm text-blue-600 hover:text-blue-700"
					>
						Refresh
					</button>
				</div>
			</div>

			{images.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<p>No photos uploaded yet</p>
					<p className="text-sm">Upload your first photo using the upload section above</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{images.map((image, index) => (
						<div key={image.path} className="relative group">
							<div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
								{image.url ? (
									<Image
										src={image.url}
										alt={image.name}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-200"
										sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								)}
							</div>
							<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg" />
							<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<div className="text-white text-xs">
									<div className="font-medium truncate">{image.name}</div>
									<div className="text-gray-300">
										{formatDate(image.created_at)} • {formatFileSize(image.size)}
									</div>
									{index === 0 && (
										<div className="text-yellow-300 text-xs font-medium">Latest</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
