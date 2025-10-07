import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// POST /api/add-collection-id-column - Add collection_id column to images table
export async function POST() {
  try {
    const admin = createSupabaseServiceClient();
    
    // Add the collection_id column to images table
    const { error } = await admin.rpc('exec_sql', {
      sql: 'ALTER TABLE images ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;'
    });

    if (error) {
      console.error('Error adding collection_id column:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'collection_id column added to images table' 
    });

  } catch (error) {
    console.error('Error adding collection_id column:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
