import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/public/[projectId]/collection/[collectionId]/images - Get images for a specific collection
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  const { projectId, collectionId } = await params;
  
  try {
    console.log('=== FETCHING COLLECTION IMAGES ===', { projectId, collectionId });
    
    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();
    
    // Get project info including customization
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("storage_bucket, display_mode, name, logo_url, background_color")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.display_mode !== 'collection') {
      return NextResponse.json({ error: "Project is not in collection mode" }, { status: 400 });
    }

    // Get all images in this collection using a proper join
    const { data: collectionImages, error: imagesError } = await supabase
      .from("collection_images")
      .select(`
        sort_order,
        image_id,
        images!inner (
          id,
          storage_path,
          file_name,
          width,
          height
        )
      `)
      .eq("collection_id", collectionId)
      .order("sort_order");

    console.log('Collection images query result:', { collectionImages, imagesError });

    if (imagesError) {
      console.error('Error fetching collection images:', imagesError);
      return NextResponse.json({ 
        error: "Failed to fetch collection images",
        details: imagesError.message
      }, { status: 500 });
    }

    if (!collectionImages || collectionImages.length === 0) {
      console.log('No images found in collection');
      return NextResponse.json({ images: [] });
    }

    console.log('Found collection images:', collectionImages.length);
    console.log('First collection image:', collectionImages[0]);

    // Generate signed URLs for all images
    const imagesWithUrls = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collectionImages.map(async (collectionImage: any) => {
        const image = collectionImage.images;
        console.log('Processing collection image:', collectionImage);
        console.log('Image data:', image);
        
        if (!image?.storage_path) {
          console.log('No storage path found for image:', image);
          return null;
        }

        try {
          console.log('Processing image:', {
            imageId: image.id,
            storagePath: image.storage_path,
            bucket: project.storage_bucket
          });
          
          // Create signed URL for both display and download (since public URLs aren't working)
          const { data: signed, error: signedError } = await supabase.storage
            .from(project.storage_bucket)
            .createSignedUrl(image.storage_path, 3600);
          
          if (signedError) {
            console.error('Failed to create signed URL:', signedError);
            return null;
          }
          
          const imageUrl = signed.signedUrl;
          
          console.log('Using signed URL for display:', imageUrl);

          console.log('Final image URL:', imageUrl);

          return {
            id: image.id,
            name: image.file_name,
            signed_url: imageUrl, // Using signed URL for display
            width: image.width,
            height: image.height,
            sort_order: collectionImage.sort_order
          };
        } catch (error) {
          console.error('Error processing image:', error);
          return null;
        }
      })
    );

    // Filter out null results and sort by sort_order
    const validImages = imagesWithUrls
      .filter(img => img !== null)
      .sort((a, b) => (a?.sort_order || 0) - (b?.sort_order || 0));

    console.log('Successfully fetched collection with', validImages.length, 'images');

    return NextResponse.json({ images: validImages });

  } catch (error) {
    console.error('Collection images API error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
