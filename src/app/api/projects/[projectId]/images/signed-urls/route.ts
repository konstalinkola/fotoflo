import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// POST /api/projects/[projectId]/images/signed-urls - Generate signed URLs for image paths
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  
  try {
    const body = await request.json();
    const { paths } = body;
    
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: "No paths provided" }, { status: 400 });
    }

    // Verify user has access to this project
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("storage_bucket, owner")
      .eq("id", projectId)
      .eq("owner", user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Generate signed URLs using service client
    const admin = createSupabaseServiceClient();
    const urls: {[key: string]: string} = {};
    
    console.log('Generating signed URLs for bucket:', project.storage_bucket);
    console.log('Paths to generate URLs for:', paths);
    
    for (const path of paths) {
      console.log('Generating signed URL for path:', path);
      
      // First check if the file exists
      const { data: fileExists, error: listError } = await admin.storage
        .from(project.storage_bucket)
        .list(path.substring(0, path.lastIndexOf('/')), {
          search: path.substring(path.lastIndexOf('/') + 1)
        });
      
      if (listError) {
        console.error('Error checking if file exists for path', path, ':', listError);
        continue;
      }
      
      if (!fileExists || fileExists.length === 0) {
        console.error('File does not exist in storage:', path);
        continue;
      }
      
      console.log('File exists, generating signed URL...');
      const { data: signed, error: signedUrlError } = await admin.storage
        .from(project.storage_bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (signedUrlError) {
        console.error('Error creating signed URL for path', path, ':', signedUrlError);
      } else if (signed?.signedUrl) {
        console.log('Successfully generated signed URL for', path, ':', signed.signedUrl);
        urls[path] = signed.signedUrl;
      } else {
        console.error('No signed URL returned for path:', path);
      }
    }

    console.log('Final URLs object:', urls);
    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error generating signed URLs:', error);
    return NextResponse.json({ error: "Failed to generate signed URLs" }, { status: 500 });
  }
}
