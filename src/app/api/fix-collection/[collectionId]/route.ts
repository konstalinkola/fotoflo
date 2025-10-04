import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/fix-collection/[collectionId] - Manually add all project images to a collection
export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { collectionId } = await params;
  
  try {
    console.log('=== FIXING COLLECTION ===', { collectionId });
    
    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient();
    
    // Get the collection info
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("project_id")
      .eq("id", collectionId)
      .single();

    if (collectionError || !collection) {
      console.error('Collection not found:', collectionError);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    console.log('Found collection for project:', collection.project_id);

    // Get all images for this project
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("id")
      .eq("project_id", collection.project_id);

    if (imagesError || !images) {
      console.error('Error fetching project images:', imagesError);
      return NextResponse.json({ error: "Failed to fetch project images" }, { status: 500 });
    }

    console.log('Found', images.length, 'images in project');

    if (images.length === 0) {
      return NextResponse.json({ message: "No images in project to add" });
    }

    // Add all images to the collection
    const insertData = images.map((image, index) => ({
      collection_id: collectionId,
      image_id: image.id,
      sort_order: index + 1
    }));

    console.log('Inserting', insertData.length, 'collection_images records');

    const { data: inserted, error: insertError } = await supabase
      .from("collection_images")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('Error inserting collection images:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('Successfully added', inserted.length, 'images to collection');

    return NextResponse.json({ 
      success: true, 
      message: `Added ${inserted.length} images to collection`,
      imagesAdded: inserted.length
    });

  } catch (error) {
    console.error('Fix collection API error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}