import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/projects/[projectId]/collections/[collectionId]/images - Add images to collection
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  const { collectionId } = await params;
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  const { image_ids } = body; // Array of image IDs to add
  
  if (!Array.isArray(image_ids)) {
    return NextResponse.json({ error: "image_ids must be an array" }, { status: 400 });
  }

  // Get current max sort_order for this collection
  const { data: maxOrder } = await supabase
    .from("collection_images")
    .select("sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  let nextOrder = (maxOrder?.sort_order || 0) + 1;

  // Prepare insert data
  const insertData = image_ids.map((imageId: string) => ({
    collection_id: collectionId,
    image_id: imageId,
    sort_order: nextOrder++
  }));

  const { data, error } = await supabase
    .from("collection_images")
    .insert(insertData)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[projectId]/collections/[collectionId]/images - Remove images from collection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
  const { collectionId } = await params;
  const supabase = await createSupabaseServerClient();
  const body = await request.json();
  const { image_ids } = body; // Array of image IDs to remove
  
  if (!Array.isArray(image_ids)) {
    return NextResponse.json({ error: "image_ids must be an array" }, { status: 400 });
  }

  const { error } = await supabase
    .from("collection_images")
    .delete()
    .eq("collection_id", collectionId)
    .in("image_id", image_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
