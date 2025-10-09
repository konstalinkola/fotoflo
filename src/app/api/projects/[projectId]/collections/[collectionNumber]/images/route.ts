import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string; collectionNumber: string }> }
) {
	try {
		const { projectId, collectionNumber } = await params;
		const supabase = await createSupabaseServerClient();
		
		// Verify user owns this project
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		const { data: project, error: projectError } = await supabase
			.from("projects")
			.select("id, owner, display_mode, storage_bucket")
			.eq("id", projectId)
			.eq("owner", user.id)
			.single();
		
		if (projectError || !project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}
		
		if (project.display_mode !== 'collection') {
			return NextResponse.json({ error: "Project is not in collection mode" }, { status: 400 });
		}
		
		const collectionNum = parseInt(collectionNumber);
		if (isNaN(collectionNum)) {
			return NextResponse.json({ error: "Invalid collection number" }, { status: 400 });
		}
		
		// Find the collection
		const { data: collection, error: collectionError } = await supabase
			.from("collections")
			.select("id, collection_number")
			.eq("project_id", projectId)
			.eq("collection_number", collectionNum)
			.single();
		
		if (collectionError || !collection) {
			// Collection doesn't exist, return empty array
			return NextResponse.json({ images: [] });
		}
		
	// Get images from this collection
	const { data: collectionImages, error: imagesError } = await supabase
		.from("collection_images")
		.select(`
			image_id,
			images (
				id,
				storage_path,
				file_name,
				file_size,
				file_type,
				capture_time,
				uploaded_at,
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
		`)
		.eq("collection_id", collection.id)
		.order("sort_order", { ascending: true });
	
	if (imagesError) {
		console.error('Error fetching collection images:', imagesError);
		return NextResponse.json({ error: "Failed to fetch collection images" }, { status: 500 });
	}
	
	// Define the type for the collection image item
	interface CollectionImageItem {
		image_id: string;
		images: {
			id: string;
			storage_path: string;
			file_name: string;
			file_size: number;
			file_type: string;
			capture_time: string | null;
			uploaded_at: string;
			camera_make: string | null;
			camera_model: string | null;
			lens_model: string | null;
			focal_length: number | null;
			aperture: number | null;
			shutter_speed: string | null;
			iso: number | null;
			flash: boolean | null;
			width: number | null;
			height: number | null;
			gps_latitude: number | null;
			gps_longitude: number | null;
			gps_altitude: number | null;
		} | null;
	}
	
	// Process images and generate signed URLs
	const admin = createSupabaseServiceClient();
	const bucket = project.storage_bucket as string;
	
	const processedImages = await Promise.all(
		((collectionImages as unknown) as CollectionImageItem[] || []).map(async (item) => {
			const image = item.images;
			if (!image) return null;
				
			// Generate signed URL
			let url: string | null = null;
			try {
				const { data: signedData, error: urlError } = await admin.storage
					.from(bucket)
					.createSignedUrl(image.storage_path, 3600);
				
				if (!urlError && signedData) {
					url = signedData.signedUrl;
				}
			} catch (error) {
				console.error('Error generating signed URL:', error);
			}
				
				return {
					id: image.id,
					name: image.file_name,
					path: image.storage_path,
					created_at: image.uploaded_at,
					capture_time: image.capture_time,
					size: image.file_size,
					url: url,
					source: 'collection',
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
					gps_altitude: image.gps_altitude
				};
			})
		);
		
		// Filter out null values
		const validImages = processedImages.filter(img => img !== null);
		
		return NextResponse.json({ 
			images: validImages,
			collection: {
				id: collection.id,
				collection_number: collection.collection_number
			}
		});
		
	} catch (error) {
		console.error('Error in collection images endpoint:', error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ projectId: string; collectionNumber: string }> }
) {
	try {
		const { projectId, collectionNumber } = await params;
		const supabase = await createSupabaseServerClient();
		
		// Verify user owns this project
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		const { data: project, error: projectError } = await supabase
			.from("projects")
			.select("id, name, storage_bucket, storage_prefix, owner")
			.eq("id", projectId)
			.eq("owner", user.id)
			.single();
		
		if (projectError || !project) {
			return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
		}
		
		// Parse request body
		const body = await request.json();
		const { image_ids } = body;
		
		if (!image_ids || !Array.isArray(image_ids)) {
			return NextResponse.json({ error: "image_ids array is required" }, { status: 400 });
		}
		
		// Find the collection by collection_number
		const { data: collection, error: collectionError } = await supabase
			.from("collections")
			.select("id, collection_number")
			.eq("project_id", projectId)
			.eq("collection_number", parseInt(collectionNumber))
			.single();
		
		if (collectionError || !collection) {
			return NextResponse.json({ error: "Collection not found" }, { status: 404 });
		}
		
		// Add images to the collection
		const collectionImages = image_ids.map((imageId: string, index: number) => ({
			collection_id: collection.id,
			image_id: imageId,
			sort_order: index
		}));
		
		const { error: insertError } = await supabase
			.from("collection_images")
			.insert(collectionImages);
		
		if (insertError) {
			console.error('Error adding images to collection:', insertError);
			return NextResponse.json({ error: "Failed to add images to collection" }, { status: 500 });
		}
		
		// Remove the same images from collection #0 (New Collection buffer)
		// This prevents the images from appearing in both the buffer and the saved collection
		const { data: bufferCollection, error: bufferError } = await supabase
			.from("collections")
			.select("id")
			.eq("project_id", projectId)
			.eq("collection_number", 0)
			.single();
		
		if (!bufferError && bufferCollection) {
			const { error: removeError } = await supabase
				.from("collection_images")
				.delete()
				.eq("collection_id", bufferCollection.id)
				.in("image_id", image_ids);
			
			if (removeError) {
				console.error('Error removing images from buffer collection:', removeError);
				// Don't fail the entire operation, just log the error
			} else {
				console.log(`✅ Removed ${image_ids.length} images from New Collection buffer`);
				
				// Check if collection #1 is now empty, and if so, delete it
				// This prevents empty "New Collection" placeholders from appearing in the gallery
				const { data: remainingImages, error: countError } = await supabase
					.from("collection_images")
					.select("id")
					.eq("collection_id", bufferCollection.id)
					.limit(1);
				
				if (!countError && (!remainingImages || remainingImages.length === 0)) {
					console.log('🗑️ Collection #0 is now empty, deleting it to prevent placeholder in gallery');
					const { error: deleteError } = await supabase
						.from("collections")
						.delete()
						.eq("id", bufferCollection.id);
					
					if (deleteError) {
						console.error('Error deleting empty collection #0:', deleteError);
					} else {
						console.log('✅ Deleted empty collection #0');
					}
				}
			}
		}
		
		return NextResponse.json({ 
			success: true, 
			message: `Added ${image_ids.length} images to collection ${collectionNumber}`,
			collection_id: collection.id
		});
		
	} catch (error) {
		console.error('Error in collection images POST endpoint:', error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

