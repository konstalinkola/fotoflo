import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Ensure the user has their own bucket
	const bucketName = `user-${user.id.replace(/-/g, '')}`;
	const admin = createSupabaseServiceClient();
	
	// Check if bucket exists, create if it doesn't
	const { data: buckets } = await admin.storage.listBuckets();
	const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
	
	if (!bucketExists) {
		const { error: bucketError } = await admin.storage.createBucket(bucketName, {
			public: false, // Private bucket for security
			fileSizeLimit: 10485760, // 10MB limit
			allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		});
		
		if (bucketError) {
			return NextResponse.json({ 
				error: `Failed to create user storage bucket: ${bucketError.message}` 
			}, { status: 500 });
		}
	}

	// Create a blank project with default values
	const { data, error } = await supabase
		.from("projects")
		.insert({
			owner: user.id,
			name: "Untitled Project",
			background_color: "#ffffff",
			logo_url: "",
			storage_bucket: bucketName, // User's personal bucket
			storage_prefix: "", // Will be set to project ID after creation
			qr_visibility_duration: 0,
			qr_expires_on_click: false,
			display_mode: "single",
			desktop_sync_enabled: false,
			auto_upload_enabled: true
		})
		.select("id")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Update the project with the storage prefix set to the project ID
	const { error: updateError } = await supabase
		.from("projects")
		.update({ storage_prefix: data.id })
		.eq("id", data.id);

	if (updateError) {
		return NextResponse.json({ error: updateError.message }, { status: 500 });
	}

	return NextResponse.json({ 
		success: true, 
		projectId: data.id,
		message: "Blank project created successfully"
	});
}
