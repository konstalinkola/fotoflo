import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;
	
	// Verify user owns this project
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	// Parse multipart form data
	const formData = await request.formData();
	const file = formData.get("file") as File;
	
	if (!file) {
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	}

	// Validate file type
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	if (!allowedTypes.includes(file.type)) {
		return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
	}

	// Validate file size (10MB max)
	const maxSize = 10 * 1024 * 1024; // 10MB
	if (file.size > maxSize) {
		return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
	}

	// Create secure file path: user_id/project_id/filename
	const timestamp = Date.now();
	const fileExtension = file.name.split('.').pop();
	const fileName = `${timestamp}.${fileExtension}`;
	const securePath = `${user.id}/${projectId}/${fileName}`;

	// Upload to Supabase Storage using service client
	const admin = createSupabaseServiceClient();
	const { data, error: uploadError } = await admin.storage
		.from(project.storage_bucket)
		.upload(securePath, file, {
			cacheControl: "3600",
			upsert: false
		});

	if (uploadError) {
		// Provide more helpful error messages
		let errorMessage = uploadError.message;
		if (uploadError.message.includes("Bucket not found")) {
			errorMessage = "Storage bucket not found. Please contact support to set up your storage.";
		} else if (uploadError.message.includes("quota")) {
			errorMessage = "Storage quota exceeded. Please delete some old photos or upgrade your plan.";
		} else if (uploadError.message.includes("size")) {
			errorMessage = "File too large. Maximum size is 10MB.";
		}
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}

	return NextResponse.json({ 
		success: true, 
		path: data.path,
		message: "File uploaded successfully" 
	});
}
