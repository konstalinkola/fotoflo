import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/projects/[projectId]/images/[imageId]
 * 
 * Fetch a specific image with signed URLs for different variants
 * Query params:
 * - variant: 'thumbnail' | 'preview' | 'original' (default: 'thumbnail')
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string; imageId: string }> }
) {
	try {
		const { projectId, imageId } = await params;
		const searchParams = request.nextUrl.searchParams;
		const variant = searchParams.get('variant') as 'thumbnail' | 'preview' | 'original' || 'thumbnail';

		const supabase = await createSupabaseServerClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		// Get project to verify ownership and get storage bucket
		const { data: project, error: projectError } = await supabase
			.from("projects")
			.select("storage_bucket, owner")
			.eq("id", projectId)
			.eq("owner", user.id)
			.single();

		if (projectError || !project) {
			return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
		}

		// Get image metadata
		const { data: image, error: imageError } = await supabase
			.from('images')
			.select('*')
			.eq('id', imageId)
			.eq('project_id', projectId)
			.single();

		if (imageError || !image) {
			return NextResponse.json({ error: "Image not found" }, { status: 404 });
		}

		// Determine which path to use based on variant
		let storagePath: string;
		switch (variant) {
			case 'thumbnail':
				storagePath = image.thumbnail_path || image.storage_path;
				break;
			case 'preview':
				storagePath = image.preview_path || image.storage_path;
				break;
			case 'original':
			default:
				storagePath = image.storage_path;
				break;
		}

		// Generate signed URL
		const admin = createSupabaseServiceClient();
		const { data: signed, error: signError } = await admin.storage
			.from(project.storage_bucket)
			.createSignedUrl(storagePath, 3600);

		if (signError || !signed) {
			return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
		}

		// Return image data with the requested variant URL
		return NextResponse.json({
			image: {
				id: image.id,
				name: image.file_name,
				path: image.storage_path,
				thumbnail_path: image.thumbnail_path,
				preview_path: image.preview_path,
				created_at: image.uploaded_at,
				capture_time: image.capture_time,
				size: image.file_size,
				url: signed.signedUrl,
				variant: variant,
				// Include EXIF data
				camera_make: image.camera_make,
				camera_model: image.camera_model,
				lens_model: image.lens_model,
				focal_length: image.focal_length,
				aperture: image.aperture,
				shutter_speed: image.shutter_speed,
				iso: image.iso,
				flash: image.flash,
				width: image.width,
				height: image.height,
				gps_latitude: image.gps_latitude,
				gps_longitude: image.gps_longitude,
				gps_altitude: image.gps_altitude,
			}
		});
	} catch (error) {
		console.error('Error fetching image:', error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
