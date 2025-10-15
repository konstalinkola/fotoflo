import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicImageUrl, getOptimizedImageUrls } from "@/lib/image-processor";

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
						thumbnail_path,
						preview_path,
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
			.gt('collection_number', 0) // Only saved collections (not buffer #0)
			.order('collection_number', { ascending: false });

		if (collectionsError) {
			console.error('Error fetching collections:', collectionsError);
			return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
		}

		console.log('📋 Found collections:', collections?.length || 0);
		console.log('📋 Query used: .gt("collection_number", 0) - should exclude collection #0');
		
		if (collections && collections.length > 0) {
			collections.forEach((col: Record<string, unknown>) => {
				const collectionNumber = col.collection_number as number;
				const collectionImages = col.collection_images as unknown[] | undefined;
				console.log(`📋 Collection #${collectionNumber}: ${collectionImages?.length || 0} images`);
				if (collectionNumber === 0) {
					console.log('⚠️ WARNING: Collection #0 found in main gallery - this should be excluded!');
					console.log('⚠️ This indicates the query .gt("collection_number", 0) is not working properly');
				}
			});
		} else {
			console.log('📋 No collections found (this is normal if no collections have been saved yet)');
		}

		// Process collections and get the first image from each as the cover
		const collectionsWithCovers = await Promise.all(
			(collections || []).map(async (collection: Record<string, unknown>) => {
				const firstCollectionImage = collection.collection_images?.[0];
				const firstImage = firstCollectionImage?.images;
				if (!firstImage) return null;

				// Generate public URL for the cover image thumbnail (zero egress cost)
				// Prefer thumbnail for collection covers, fall back to original if not available
				const coverImagePath = firstImage.thumbnail_path || firstImage.storage_path;
				const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
				const publicUrl = supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, coverImagePath) : null;

				return {
					id: collection.id,
					name: `Collection ${collection.collection_number}`,
					collection_number: collection.collection_number,
					created_at: collection.created_at,
					cover_image: {
						id: firstImage.id,
						name: firstImage.file_name,
						path: firstImage.storage_path,
						thumbnail_path: firstImage.thumbnail_path,
						preview_path: firstImage.preview_path,
						url: publicUrl, // This is now the thumbnail URL (public)
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

		return NextResponse.json(
			{ images: collectionsWithCovers.filter(Boolean) },
			{
				headers: {
					'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', // 5 min cache, 1 hour stale
					'CDN-Cache-Control': 'public, max-age=3600', // 1 hour CDN cache
				}
			}
		);
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

				const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
				const imagesWithUrls = allImages.map((img) => {
					const publicUrl = supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, img.path) : null;
					
					return {
						id: img.path, // Use path as ID for storage-only images
						name: img.name,
						path: img.path,
						created_at: img.created_at,
						capture_time: null, // No EXIF data available
						size: img.metadata?.size,
						url: publicUrl,
						source: img.source
					};
				});

				return NextResponse.json(
					{ images: imagesWithUrls },
					{
						headers: {
							'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', // 5 min cache, 1 hour stale
							'CDN-Cache-Control': 'public, max-age=3600', // 1 hour CDN cache
						}
					}
				);
			}
			
			return NextResponse.json({ error: "Failed to fetch images", details: dbError.message }, { status: 500 });
		}

		// Generate public URLs for all image variants (zero egress cost)
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const imagesWithUrls = (dbImages || []).map((img) => {
			// Extract timestamp from storage path for URL generation
			const timestamp = img.storage_path.split('/').pop()?.split('.')[0];
			
			// Generate optimized URLs for all variants
			const optimizedUrls = timestamp && supabaseUrl 
				? getOptimizedImageUrls(supabaseUrl, bucket, projectId, parseInt(timestamp))
				: null;
			
			return {
				id: img.id, // Add the image ID
				name: img.file_name,
				path: img.storage_path, // Keep original path for reference
				micro_path: img.micro_path,
				thumbnail_path: img.thumbnail_path,
				preview_path: img.preview_path,
				created_at: img.uploaded_at,
				capture_time: img.capture_time,
				size: img.file_size,
				// Use micro thumbnail for gallery display (smallest file size)
				url: optimizedUrls?.micro || (img.micro_path && supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, img.micro_path) : null),
				// Include all variant URLs for different use cases
				micro_url: optimizedUrls?.micro || (img.micro_path && supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, img.micro_path) : null),
				thumbnail_url: optimizedUrls?.thumbnail || (img.thumbnail_path && supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, img.thumbnail_path) : null),
				preview_url: optimizedUrls?.preview || (img.preview_path && supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, img.preview_path) : null),
				original_url: optimizedUrls?.original || (supabaseUrl ? getPublicImageUrl(supabaseUrl, bucket, img.storage_path) : null),
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
		});

		return NextResponse.json(
			{ images: imagesWithUrls },
			{
				headers: {
					'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', // 5 min cache, 1 hour stale
					'CDN-Cache-Control': 'public, max-age=3600', // 1 hour CDN cache
				}
			}
		);
	}
}
