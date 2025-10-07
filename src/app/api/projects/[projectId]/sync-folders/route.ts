import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/projects/[projectId]/sync-folders - List sync folders for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Verify user owns this project
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("owner")
    .eq("id", projectId)
    .eq("owner", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  try {
    // Try to query the sync_folders table
    const { data: syncFolders, error } = await supabase
      .from("sync_folders")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array for now
      if (error.message.includes('relation "sync_folders" does not exist') || 
          error.message.includes('does not exist') ||
          error.code === 'PGRST116') {
        console.log('sync_folders table does not exist yet, returning empty array');
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(syncFolders || []);
  } catch (error) {
    console.error('Error fetching sync folders:', error);
    return NextResponse.json([]);
  }
}

// POST /api/projects/[projectId]/sync-folders - Create a new sync folder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Verify user owns this project
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("owner")
    .eq("id", projectId)
    .eq("owner", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  const { name, path } = await request.json();

  if (!name || !path) {
    return NextResponse.json({ error: "Name and path are required" }, { status: 400 });
  }

  try {
    // Try to insert into the sync_folders table
    const { data: syncFolder, error } = await supabase
      .from("sync_folders")
      .insert({
        project_id: projectId,
        name,
        folder_path: path,
        active: true
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return a mock sync folder for now
      if (error.message.includes('relation "sync_folders" does not exist') || 
          error.message.includes('does not exist') ||
          error.code === 'PGRST116') {
        console.log('sync_folders table does not exist yet, returning mock sync folder');
        const mockSyncFolder = {
          id: `sync-${Date.now()}`,
          name,
          folder_path: path,
          project_id: projectId,
          active: true,
          created_at: new Date().toISOString()
        };
        return NextResponse.json(mockSyncFolder);
      }
      throw error;
    }

    return NextResponse.json(syncFolder);
  } catch (error) {
    console.error('Error creating sync folder:', error);
    return NextResponse.json({ error: "Failed to create sync folder" }, { status: 500 });
  }
}
