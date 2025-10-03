import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { data: project, error } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (error || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	const bucket = project.storage_bucket as string;
	const admin = createSupabaseServiceClient();

	// Get images from database with metadata
	const { data: dbImages, error: dbError } = await supabase
		.from('images')
		.select('*')
		.eq('project_id', projectId)
		.order('capture_time', { ascending: false, nullsFirst: false })
		.order('uploaded_at', { ascending: false });

	if (dbError) {
		console.error('Database error:', dbError);
		// If table doesn't exist, fall back to storage-only approach
		if (dbError.message.includes('relation "images" does not exist') || 
			dbError.message.includes('does not exist') ||
			dbError.code === 'PGRST116') {
			
			console.log('Images table does not exist, falling back to storage-only approach');
			
			// Fall back to the old storage-only approach
			const projectPrefix = project.storage_prefix || projectId;
			const { data: projectImages, error: projectError } = await admin.storage
				.from(bucket)
				.list(projectPrefix, {
					limit: 100,
					sortBy: { column: "created_at", order: "desc" },
				});

			if (projectError) {
				return NextResponse.json({ error: "Failed to fetch images from storage" }, { status: 500 });
			}

			const allImages = projectImages ? projectImages.map(img => ({
				...img,
				path: `${projectPrefix}/${img.name}`,
				source: 'project'
			})) : [];

			const imagesWithUrls = await Promise.all(
				allImages.map(async (img) => {
					const { data: signed } = await admin.storage
						.from(bucket)
						.createSignedUrl(img.path, 3600);
					
					return {
						id: img.path, // Use path as ID for storage-only images
						name: img.name,
						path: img.path,
						created_at: img.created_at,
						capture_time: null, // No EXIF data available
						size: img.metadata?.size,
						url: signed?.signedUrl || null,
						source: img.source
					};
				})
			);

			return NextResponse.json({ images: imagesWithUrls });
		}
		
		return NextResponse.json({ error: "Failed to fetch images", details: dbError.message }, { status: 500 });
	}

	// Generate signed URLs for each image and combine with metadata
	const imagesWithUrls = await Promise.all(
		(dbImages || []).map(async (img) => {
			const { data: signed } = await admin.storage
				.from(bucket)
				.createSignedUrl(img.storage_path, 3600);
			
			return {
				id: img.id, // Add the image ID
				name: img.file_name,
				path: img.storage_path,
				created_at: img.uploaded_at,
				capture_time: img.capture_time,
				size: img.file_size,
				url: signed?.signedUrl || null,
				source: 'project',
				// Include additional EXIF data if needed
				camera_make: img.camera_make,
				camera_model: img.camera_model,
				lens_model: img.lens_model,
				focal_length: img.focal_length,
				aperture: img.aperture,
				shutter_speed: img.shutter_speed,
				iso: img.iso,
				flash: img.flash,
				width: img.width,
				height: img.height,
				gps_latitude: img.gps_latitude,
				gps_longitude: img.gps_longitude,
				gps_altitude: img.gps_altitude
			};
		})
	);

	return NextResponse.json({ images: imagesWithUrls });
}
