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
        name: collection.collection_number.toString(),
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
