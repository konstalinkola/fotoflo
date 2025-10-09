import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/projects/[projectId]/collections - List all collections for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  
  // First get the project's storage bucket
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("storage_bucket")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("collections")
    .select(`
      id,
      collection_number,
      is_active,
      created_at,
      collection_images (
        image_id,
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
    .gt("collection_number", 0) // Exclude collection #0 (buffer) from main gallery
    .order("collection_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Generate signed URLs for cover images
  const admin = createSupabaseServiceClient();
  const collectionsWithUrls = await Promise.all(
    (data || []).map(async (collection) => {
      const firstCollectionImage = collection.collection_images?.[0];
      const firstImage = (firstCollectionImage?.images as unknown) as { storage_path: string } | undefined;
      let coverImageUrl: string | null = null;
      
      if (firstImage?.storage_path) {
        const { data: signed, error: signedError } = await admin.storage
          .from(project.storage_bucket)
          .createSignedUrl(firstImage.storage_path, 3600);
        
        if (!signedError) {
          coverImageUrl = signed?.signedUrl || null;
        }
      }

      return {
        ...collection,
        name: collection.collection_number === 1 ? "New Collection" : collection.collection_number.toString(),
        cover_image_url: coverImageUrl,
        image_count: collection.collection_images?.length || 0
      };
    })
  );

  return NextResponse.json(collectionsWithUrls);
}

// POST /api/projects/[projectId]/collections - Create new collection
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Get next collection number
  const { data: nextNumber } = await supabase
    .rpc('get_next_collection_number', { p_project_id: projectId });
  
  const { data, error } = await supabase
    .from("collections")
    .insert({
      project_id: projectId,
      collection_number: nextNumber
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[projectId]/collections - Delete a collection by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Verify user owns this project
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get collection ID from query parameters
    const url = new URL(request.url);
    const collectionId = url.searchParams.get('collectionId');
    
    if (!collectionId) {
      return NextResponse.json({ error: "collectionId parameter is required" }, { status: 400 });
    }
    
    // Verify the collection belongs to the project and user owns it
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select(`
        id,
        collection_number,
        project_id,
        projects!inner(owner)
      `)
      .eq("id", collectionId)
      .eq("project_id", projectId)
      .eq("projects.owner", user.id)
      .single();
    
    if (collectionError || !collection) {
      return NextResponse.json({ error: "Collection not found or access denied" }, { status: 404 });
    }
    
    // Delete collection images first (cascade should handle this, but let's be explicit)
    const { error: deleteImagesError } = await supabase
      .from("collection_images")
      .delete()
      .eq("collection_id", collectionId);
    
    if (deleteImagesError) {
      console.error('Error deleting collection images:', deleteImagesError);
      return NextResponse.json({ error: "Failed to delete collection images" }, { status: 500 });
    }
    
    // Delete the collection
    const { error: deleteCollectionError } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId);
    
    if (deleteCollectionError) {
      console.error('Error deleting collection:', deleteCollectionError);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Collection ${collection.collection_number} deleted successfully`,
      collection_id: collectionId
    });
    
  } catch (error) {
    console.error('Error in collections DELETE endpoint:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
