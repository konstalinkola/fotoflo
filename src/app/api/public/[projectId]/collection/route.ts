import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/public/[projectId]/collection - Get active collection images for public view
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Get project info including display mode and customization
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("storage_bucket, display_mode, logo_url, background_color, logo_size, logo_position_y, text_content, text_position_y, text_color, text_size, qr_visibility_duration, qr_expires_on_click")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Only proceed if project is in collection mode
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
    console.error('Collection API Error:', {
      projectId,
      collectionError: collectionError?.message,
      hasActiveCollection: !!activeCollection
    });
    return NextResponse.json({ 
      error: "No active collection found",
      project: {
        logo_url: project.logo_url,
        background_color: project.background_color
      }
    }, { status: 404 });
  }

  // Generate signed URLs for all images in the collection
  const admin = createSupabaseServiceClient();
  const imagesWithUrls = await Promise.all(
    (activeCollection.collection_images || []).map(async (collectionImage: { sort_order: number; images?: { id: string; storage_path: string; file_name: string; width: number; height: number }[] }) => {
      const image = collectionImage.images?.[0];
      if (!image?.storage_path) return null;

      const { data: signed, error: signedError } = await admin.storage
        .from(project.storage_bucket)
        .createSignedUrl(image.storage_path, 3600);
      
      if (signedError) return null;

      return {
        id: image.id,
        name: image.file_name,
        signed_url: signed?.signedUrl,
        url: signed?.signedUrl, // Keep both for compatibility
        width: image.width,
        height: image.height,
        sort_order: collectionImage.sort_order
      };
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
    images: validImages,
    project: {
      logo_url: project.logo_url,
      background_color: project.background_color,
      qr_visibility_duration: project.qr_visibility_duration,
      qr_expires_on_click: project.qr_expires_on_click
    },
    settings: {
      logoSize: project.logo_size,
      logoPosition: { x: 0, y: project.logo_position_y || -100 },
      backgroundColor: project.background_color,
      textContent: project.text_content,
      textPosition: { x: 0, y: project.text_position_y || 150 },
      textColor: project.text_color || "#333333",
      textSize: project.text_size || 16
    }
  });
}
