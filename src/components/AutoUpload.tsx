"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Settings, Activity, Zap, AlertCircle, CheckCircle, Clock, X } from "lucide-react";

interface AutoUploadConfig {
	project_id: string;
	auto_organize: boolean;
	duplicate_detection: boolean;
	max_file_size: number;
	allowed_formats: string[];
	webhook_url?: string;
	webhook_secret?: string;
	auto_collection_creation: boolean;
	collection_naming_pattern: string;
	background_processing: boolean;
}

interface UploadBatch {
	batch_id: string;
	total_files: number;
	successful_uploads: number;
	failed_uploads: number;
	duplicates_skipped: number;
	status: string;
	created_at: string;
	completed_at?: string;
	upload_source: string;
}

interface AutoUploadProps {
	projectId: string;
	onUploadSuccess?: () => void;
}

export default function AutoUpload({ projectId, onUploadSuccess }: AutoUploadProps) {
	const [config, setConfig] = useState<AutoUploadConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadStatus, setUploadStatus] = useState("");
	const [recentBatches, setRecentBatches] = useState<UploadBatch[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load configuration on mount
	useEffect(() => {
		loadConfig();
		loadUploadHistory();
	}, [projectId]);

	const loadConfig = async () => {
		try {
			const response = await fetch(`/api/auto-upload/config?projectId=${projectId}`);
			if (response.ok) {
				const data = await response.json();
				setConfig(data.config);
			}
		} catch (error) {
			console.error("Failed to load config:", error);
			setError("Failed to load auto upload configuration");
		} finally {
			setLoading(false);
		}
	};

	const loadUploadHistory = async () => {
		try {
			const response = await fetch(`/api/auto-upload/batch?projectId=${projectId}`);
			if (response.ok) {
				const data = await response.json();
				setRecentBatches(data.batches || []);
			}
		} catch (error) {
			console.error("Failed to load upload history:", error);
		}
	};

	const saveConfig = async () => {
		setSaving(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch(`/api/auto-upload/config`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...effectiveConfig, project_id: projectId })
			});

			if (response.ok) {
				setSuccess("Auto upload configuration saved successfully");
			} else {
				const errorData = await response.json();
				setError(errorData.error || "Failed to save configuration");
			}
		} catch (error) {
			setError("Failed to save configuration");
		} finally {
			setSaving(false);
		}
	};

	const handleFileUpload = async (files: FileList) => {
		if (!files || files.length === 0) return;

		setUploading(true);
		setUploadProgress(0);
		setError("");
		setSuccess("");

		try {
			const formData = new FormData();
			Array.from(files).forEach(file => {
				formData.append("files", file);
			});

			setUploadStatus(`Uploading ${files.length} files...`);

			const response = await fetch(`/api/auto-upload/batch`, {
				method: "POST",
				body: formData
			});

			const result = await response.json();

			if (response.ok) {
				setSuccess(`Upload completed: ${result.successful_uploads} successful, ${result.failed_uploads} failed`);
				setUploadProgress(100);
				onUploadSuccess?.();
				loadUploadHistory();
			} else {
				setError(result.error || "Upload failed");
			}
		} catch (error) {
			setError("Upload failed");
		} finally {
			setUploading(false);
			setUploadStatus("");
			setTimeout(() => setUploadProgress(0), 2000);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileUpload(files);
		}
	};

	const formatFileSize = (bytes: number) => {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'failed':
				return <X className="h-4 w-4 text-red-500" />;
			case 'processing':
				return <Clock className="h-4 w-4 text-blue-500" />;
			default:
				return <Clock className="h-4 w-4 text-gray-500" />;
		}
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span className="ml-2">Loading auto upload configuration...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	// If no config exists, create a default one
	const defaultConfig: AutoUploadConfig = {
		project_id: projectId,
		auto_organize: true,
		duplicate_detection: true,
		max_file_size: 10 * 1024 * 1024, // 10MB
		allowed_formats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
		auto_collection_creation: true,
		collection_naming_pattern: "Auto Upload {date}",
		background_processing: true
	};

	const effectiveConfig = config || defaultConfig;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5" />
						Auto Upload Configuration
					</CardTitle>
					<CardDescription>
						Configure automatic file upload settings for your project
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					
					{success && (
						<Alert>
							<CheckCircle className="h-4 w-4" />
							<AlertDescription>{success}</AlertDescription>
						</Alert>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="auto-organize">Auto Organize</Label>
								<Switch
									id="auto-organize"
									checked={effectiveConfig.auto_organize}
									onCheckedChange={(checked) => 
										setConfig({ ...effectiveConfig, auto_organize: checked })
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="duplicate-detection">Duplicate Detection</Label>
								<Switch
									id="duplicate-detection"
									checked={effectiveConfig.duplicate_detection}
									onCheckedChange={(checked) => 
										setConfig({ ...effectiveConfig, duplicate_detection: checked })
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="auto-collection">Auto Collection Creation</Label>
								<Switch
									id="auto-collection"
									checked={effectiveConfig.auto_collection_creation}
									onCheckedChange={(checked) => 
										setConfig({ ...effectiveConfig, auto_collection_creation: checked })
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="background-processing">Background Processing</Label>
								<Switch
									id="background-processing"
									checked={effectiveConfig.background_processing}
									onCheckedChange={(checked) => 
										setConfig({ ...effectiveConfig, background_processing: checked })
									}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<Label htmlFor="max-file-size">Max File Size</Label>
								<Select
									value={effectiveConfig.max_file_size.toString()}
									onValueChange={(value) => 
										setConfig({ ...effectiveConfig, max_file_size: parseInt(value) })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="5242880">5 MB</SelectItem>
										<SelectItem value="10485760">10 MB</SelectItem>
										<SelectItem value="20971520">20 MB</SelectItem>
										<SelectItem value="52428800">50 MB</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="collection-pattern">Collection Naming Pattern</Label>
								<Input
									id="collection-pattern"
									value={effectiveConfig.collection_naming_pattern}
									onChange={(e) => 
										setConfig({ ...effectiveConfig, collection_naming_pattern: e.target.value })
									}
									placeholder="Auto Upload {date}"
								/>
								<p className="text-sm text-gray-500 mt-1">
									Use {"{date}"} for current date, {"{time}"} for current time
								</p>
							</div>

							<div>
								<Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
								<Input
									id="webhook-url"
									type="url"
									value={effectiveConfig.webhook_url || ""}
									onChange={(e) => 
										setConfig({ ...effectiveConfig, webhook_url: e.target.value })
									}
									placeholder="https://example.com/webhook"
								/>
							</div>
						</div>
					</div>

					<div>
						<Label>Allowed File Formats</Label>
						<div className="flex flex-wrap gap-2 mt-2">
							{effectiveConfig.allowed_formats.map((format) => (
								<Badge key={format} variant="secondary">
									{format.split('/')[1].toUpperCase()}
								</Badge>
							))}
						</div>
					</div>

					<Button 
						onClick={saveConfig} 
						disabled={saving}
						className="w-full"
					>
						{saving ? "Saving..." : "Save Configuration"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5" />
						Batch Upload
					</CardTitle>
					<CardDescription>
						Upload multiple files at once with progress tracking
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
							uploading 
								? "border-blue-500 bg-blue-50" 
								: "border-gray-300 hover:border-gray-400"
						}`}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							onChange={(e) => {
								if (e.target.files) {
									handleFileUpload(e.target.files);
								}
							}}
							className="hidden"
							disabled={uploading}
						/>

						{uploading ? (
							<div className="space-y-4">
								<div className="text-sm text-gray-600">{uploadStatus}</div>
								<Progress value={uploadProgress} className="w-full" />
							</div>
						) : (
							<div className="space-y-4">
								<Upload className="h-12 w-12 text-gray-400 mx-auto" />
								<div>
									<p className="text-lg font-medium">Drop files here or click to browse</p>
									<p className="text-sm text-gray-500">
										Max file size: {formatFileSize(effectiveConfig.max_file_size)}
									</p>
								</div>
								<Button 
									onClick={() => fileInputRef.current?.click()}
									variant="outline"
								>
									Select Files
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Upload History
					</CardTitle>
					<CardDescription>
						Recent batch upload operations and their status
					</CardDescription>
				</CardHeader>
				<CardContent>
					{recentBatches.length === 0 ? (
						<p className="text-gray-500 text-center py-4">No upload batches yet</p>
					) : (
						<div className="space-y-3">
							{recentBatches.slice(0, 5).map((batch) => (
								<div key={batch.batch_id} className="flex items-center justify-between p-3 border rounded-lg">
									<div className="flex items-center gap-3">
										{getStatusIcon(batch.status)}
										<div>
											<p className="font-medium">Batch {batch.batch_id.slice(-8)}</p>
											<p className="text-sm text-gray-500">
												{new Date(batch.created_at).toLocaleDateString()} at{" "}
												{new Date(batch.created_at).toLocaleTimeString()}
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="flex gap-2">
											<Badge variant="outline">{batch.total_files} files</Badge>
											<Badge variant="secondary">{batch.successful_uploads} success</Badge>
											{batch.failed_uploads > 0 && (
												<Badge variant="destructive">{batch.failed_uploads} failed</Badge>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
