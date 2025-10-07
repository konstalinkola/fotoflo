import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
	try {
		console.log('🔍 Simple upload endpoint called');
		
		// Get project ID from query params
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get('projectId');
		
		console.log('Project ID:', projectId);
		
		if (!projectId) {
			return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
		}

		// Parse multipart form data
		console.log('Parsing form data...');
		const formData = await request.formData();
		const file = formData.get("file") as File;
		
		console.log('File received:', file ? file.name : 'No file');
		
		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json({ error: "Invalid file type. Only image files are allowed." }, { status: 400 });
		}

		console.log('File validation passed');

		// Get project details
		console.log('Getting project details...');
		const admin = createSupabaseServiceClient();
		const { data: project, error: projectError } = await admin
			.from("projects")
			.select("id, name, storage_bucket, storage_prefix")
			.eq("id", projectId)
			.single();
		
		if (projectError || !project) {
			console.log('Project error:', projectError);
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		console.log('Project found:', project.name);

		// Create file path
		const timestamp = Date.now();
		const fileExtension = file.name.split('.').pop();
		const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
		const securePath = `${projectId}/${fileName}`;

		console.log('Uploading to storage:', securePath);

		// Upload to storage
		const { data: uploadData, error: uploadError } = await admin.storage
			.from(project.storage_bucket)
			.upload(securePath, file, {
				cacheControl: "3600",
				upsert: false
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
		}

		console.log('File uploaded to storage successfully');

		// Save to database (simplified)
		const imageMetadata = {
			project_id: projectId,
			storage_path: uploadData.path,
			file_name: fileName,
			original_name: file.name,
			file_size: file.size,
			file_type: file.type,
			upload_source: 'desktop-sync'
		};

		console.log('Saving to database...');
		
		const { data: insertedImage, error: dbError } = await admin
			.from('images')
			.insert(imageMetadata)
			.select('id')
			.single();

		if (dbError) {
			console.error('Failed to save image metadata:', dbError);
			return NextResponse.json({ 
				error: "Failed to save to database", 
				details: dbError.message 
			}, { status: 500 });
		}

		console.log('Successfully saved to database with ID:', insertedImage?.id);

		return NextResponse.json({
			success: true,
			imageId: insertedImage?.id,
			fileName: file.name,
			message: "File uploaded successfully via desktop sync (simple version)"
		});

	} catch (error) {
		console.error("Simple upload error:", error);
		return NextResponse.json({ 
			error: "Internal server error", 
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
