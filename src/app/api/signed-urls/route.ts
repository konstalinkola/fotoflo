import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    const { bucket, path } = await request.json();
    
    if (!bucket || !path) {
      return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
    }

    const admin = createSupabaseServiceClient();
    const { data: signed, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (signedError) {
      console.error("Error generating signed URL:", signedError);
      return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signed?.signedUrl });
  } catch (error) {
    console.error("Error in signed URLs API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
