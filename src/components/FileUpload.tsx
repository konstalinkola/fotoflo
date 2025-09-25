"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
	projectId: string;
	onUploadSuccess?: () => void;
	onUploadError?: (error: string) => void;
}

export default function FileUpload({ projectId, onUploadSuccess, onUploadError }: FileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			uploadFile(files[0]);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			uploadFile(files[0]);
		}
	};

	const uploadFile = async (file: File) => {
		setIsUploading(true);
		setUploadProgress(0);

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch(`/api/projects/${projectId}/upload`, {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Upload failed");
			}

			setUploadProgress(100);
			onUploadSuccess?.();
			
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Upload failed";
			onUploadError?.(errorMessage);
		} finally {
			setIsUploading(false);
			setTimeout(() => setUploadProgress(0), 1000);
		}
	};

	return (
		<div className="w-full max-w-md mx-auto">
			<div
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
					isDragging
						? "border-blue-500 bg-blue-50"
						: "border-gray-300 hover:border-gray-400"
				} ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
				/>
				
				{isUploading ? (
					<div className="space-y-4">
						<div className="text-sm text-gray-600">Uploading...</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${uploadProgress}%` }}
							></div>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="text-gray-500">
							<svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
								<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<div>
							<button
								onClick={() => fileInputRef.current?.click()}
								className="text-blue-600 hover:text-blue-500 font-medium"
							>
								Click to upload
							</button>
							<span className="text-gray-500"> or drag and drop</span>
						</div>
						<div className="text-xs text-gray-400">
							PNG, JPG, WebP up to 10MB
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
