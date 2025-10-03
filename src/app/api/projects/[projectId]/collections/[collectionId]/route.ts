import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/projects/[projectId]/collections/[collectionId] - Get specific collection with images
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  const { collectionId } = await params;
  const supabase = await createSupabaseServerClient();
  
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
          height,
          capture_time,
          uploaded_at
        )
      )
    `)
    .eq("id", collectionId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/projects/[projectId]/collections/[collectionId] - Update collection (e.g., set active)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  const { collectionId } = await params;
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  
  if (body.is_active) {
    // Use the function to ensure only one active collection per project
    const { error } = await supabase.rpc('set_active_collection', { 
      p_collection_id: collectionId 
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    // Just update normally for other fields
    const { data, error } = await supabase
      .from("collections")
      .update(body)
      .eq("id", collectionId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/projects/[projectId]/collections/[collectionId] - Delete collection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  const { collectionId } = await params;
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
