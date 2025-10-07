import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET /api/sync-folders/active - Get all active sync folders (service endpoint)
export async function GET() {
  try {
    const admin = createSupabaseServiceClient();
    
    // Get all active sync folders from all projects
    const { data: syncFolders, error } = await admin
      .from("sync_folders")
      .select(`
        id,
        project_id,
        name,
        folder_path,
        active,
        created_at,
        projects!inner(name)
      `)
      .eq("active", true);

    if (error) {
      // If table doesn't exist, return empty array
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
    console.error('Error fetching active sync folders:', error);
    return NextResponse.json([]);
  }
}
