import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	const supabase = await createSupabaseServerClient();
	
	// Get project info including display mode
	const { data: project, error } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, display_mode, active_image_path")
		.eq("id", projectId)
		.single();
	
	if (error || !project) {
		return NextResponse.json({ error: "Project not found" }, { status: 404 });
	}

	// For collection projects, return the active collection's specific URL
	if (project.display_mode === 'collection') {
		// Get the active collection
		const admin = createSupabaseServiceClient();
		const { data: activeCollection, error: collectionError } = await admin
			.from("collections")
			.select("id")
			.eq("project_id", projectId)
			.eq("is_active", true)
			.single();

		if (collectionError || !activeCollection) {
			return NextResponse.json({ 
				error: "No active collection found",
				reason: "no_active_collection"
			}, { status: 404 });
		}

		// Get the base URL from the request headers
		const host = request.headers.get('host');
		const protocol = request.headers.get('x-forwarded-proto') || 'http';
		const baseUrl = `${protocol}://${host}`;
		
		return NextResponse.json({ 
			url: `${baseUrl}/public/${projectId}/collection/${activeCollection.id}`,
			type: 'collection'
		});
	}

	// For single image projects, return the latest/active image URL
	const bucket = project.storage_bucket as string;
	const admin = createSupabaseServiceClient();
	
	// Check if there's an active image set
	let targetImagePath = project.active_image_path;
	
	// If no active image, find the latest image
	if (!targetImagePath) {
		const projectPrefix = project.storage_prefix || projectId;
		const { data: list, error: listError } = await admin.storage.from(bucket).list(projectPrefix, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});
		
		if (listError) {
			return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
		}
		if (!list || list.length === 0) {
			return NextResponse.json({ error: "No images found" }, { status: 404 });
		}
		
		const newest = list[0];
		targetImagePath = `${projectPrefix}/${newest.name}`;
	}
	
	// Generate signed URL for the target image
	const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(targetImagePath, 3600);
	if (signError) {
		return NextResponse.json({ error: "Failed to generate image URL" }, { status: 500 });
	}
	
	return NextResponse.json({ 
		url: signed.signedUrl, 
		type: 'single'
	});
}
