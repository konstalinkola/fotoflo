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
		.select("storage_bucket, storage_prefix, owner, display_mode")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (error || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	const bucket = project.storage_bucket as string;
	const admin = createSupabaseServiceClient();

	// Handle different project types
	if (project.display_mode === 'collection') {
		// For collection projects, return finalized collections (not individual images)
		console.log('📋 Collection project detected, fetching finalized collections...');
		
		const { data: collections, error: collectionsError } = await supabase
			.from('collections')
			.select(`
				id,
				collection_number,
				created_at,
				collection_images (
					image_id,
					images (
						id,
						storage_path,
						file_name,
						uploaded_at,
						capture_time,
						file_size,
						camera_make,
						camera_model,
						lens_model,
						focal_length,
						aperture,
						shutter_speed,
						iso,
						flash,
						width,
						height,
						gps_latitude,
						gps_longitude,
						gps_altitude
					)
				)
			`)
			.eq('project_id', projectId)
			.gt('collection_number', 1) // Only finalized collections (not "New Collection" #1)
			.order('collection_number', { ascending: false });

		if (collectionsError) {
			console.error('Error fetching collections:', collectionsError);
			return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
		}

		console.log('📋 Found collections:', collections?.length || 0);
		if (collections && collections.length > 0) {
			collections.forEach((col: any) => {
				console.log(`📋 Collection #${col.collection_number}: ${col.collection_images?.length || 0} images`);
			});
		}

		// Process collections and get the first image from each as the cover
		const collectionsWithCovers = await Promise.all(
			(collections || []).map(async (collection: Record<string, unknown>) => {
				const firstCollectionImage = collection.collection_images?.[0];
				const firstImage = firstCollectionImage?.images;
				if (!firstImage) return null;

				// Generate signed URL for the cover image
				const { data: signed } = await admin.storage
					.from(bucket)
					.createSignedUrl(firstImage.storage_path, 3600);

				return {
					id: collection.id,
					name: `Collection ${collection.collection_number}`,
					collection_number: collection.collection_number,
					created_at: collection.created_at,
					cover_image: {
						id: firstImage.id,
						name: firstImage.file_name,
						path: firstImage.storage_path,
						url: signed?.signedUrl || null,
						capture_time: firstImage.capture_time,
						size: firstImage.file_size,
						camera_make: firstImage.camera_make,
						camera_model: firstImage.camera_model,
						lens_model: firstImage.lens_model,
						focal_length: firstImage.focal_length,
						aperture: firstImage.aperture,
						shutter_speed: firstImage.shutter_speed,
						iso: firstImage.iso,
						flash: firstImage.flash,
						width: firstImage.width,
						height: firstImage.height,
						gps_latitude: firstImage.gps_latitude,
						gps_longitude: firstImage.gps_longitude,
						gps_altitude: firstImage.gps_altitude
					},
					source: 'collection'
				};
			})
		);

		return NextResponse.json({ images: collectionsWithCovers.filter(Boolean) });
	} else {
		// For single mode projects, return individual images
		console.log('📋 Single mode project detected, fetching individual images...');
		
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
}
