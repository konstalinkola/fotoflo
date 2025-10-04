import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/public/[projectId]/gallery - Get active collection images for gallery display
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  
  try {
    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();
    
    // Get project info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("storage_bucket, display_mode")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.display_mode !== 'collection') {
      return NextResponse.json({ error: "Project is not in collection mode" }, { status: 400 });
    }

    // Get the active collection
    const { data: activeCollection, error: collectionError } = await supabase
      .from("collections")
      .select(`
        id,
        collection_number,
        collection_images (
          sort_order,
          images (
            id,
            storage_path,
            file_name,
            width,
            height
          )
        )
      `)
      .eq("project_id", projectId)
      .eq("is_active", true)
      .single();

    if (collectionError || !activeCollection) {
      console.error('No active collection found:', collectionError);
      return NextResponse.json({ 
        error: "No active collection found",
        details: collectionError?.message
      }, { status: 404 });
    }

    // Generate signed URLs for all images in the collection
    const imagesWithUrls = await Promise.all(
      (activeCollection.collection_images || []).map(async (collectionImage: { sort_order: number; images?: { id: string; storage_path: string; file_name: string; width: number; height: number }[] }) => {
        const image = collectionImage.images?.[0];
        if (!image?.storage_path) return null;

        try {
          const { data: signed, error: signedError } = await supabase.storage
            .from(project.storage_bucket)
            .createSignedUrl(image.storage_path, 3600);
          
          if (signedError) {
            console.error('Failed to create signed URL:', signedError);
            return null;
          }

          return {
            id: image.id,
            name: image.file_name,
            signed_url: signed?.signedUrl,
            width: image.width,
            height: image.height,
            sort_order: collectionImage.sort_order
          };
        } catch (error) {
          console.error('Error creating signed URL:', error);
          return null;
        }
      })
    );

    // Filter out null results and sort by sort_order
    const validImages = imagesWithUrls
      .filter(img => img !== null)
      .sort((a, b) => (a?.sort_order || 0) - (b?.sort_order || 0));

    return NextResponse.json({
      collection: {
        id: activeCollection.id,
        collection_number: activeCollection.collection_number,
        image_count: validImages.length
      },
      images: validImages
    });

  } catch (error) {
    console.error('Gallery API error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
