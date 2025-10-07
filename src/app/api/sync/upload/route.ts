import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get project ID from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, storage_bucket, storage_prefix, owner")
      .eq("id", projectId)
      .eq("owner", user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only image files are allowed." }, { status: 400 });
    }

    // Validate file size (50MB max for desktop sync)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 50MB." }, { status: 400 });
    }

    // Create file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const securePath = `${projectId}/${fileName}`;

    // Upload to storage
    const admin = createSupabaseServiceClient();
    const { data: uploadData, error: uploadError } = await admin.storage
      .from(project.storage_bucket)
      .upload(securePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    // Extract EXIF data
    let exifData: Record<string, unknown> | null = null;
    try {
      const { parse } = await import('exifr');
      const arrayBuffer = await file.arrayBuffer();
      exifData = await parse(arrayBuffer, {
        pick: [
          'DateTimeOriginal', 'CreateDate', 'ModifyDate',
          'Make', 'Model', 'LensModel', 'FocalLength',
          'FNumber', 'ExposureTime', 'ISO', 'Flash',
          'ImageWidth', 'ImageHeight', 'GPSLatitude',
          'GPSLongitude', 'GPSAltitude'
        ]
      });
    } catch (exifError) {
      console.warn('Failed to extract EXIF data:', exifError);
    }

    // Save to database
    const imageMetadata = {
      project_id: projectId,
      storage_path: uploadData.path,
      file_name: fileName,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      capture_time: exifData?.DateTimeOriginal || exifData?.CreateDate || exifData?.ModifyDate || null,
      camera_make: exifData?.Make || null,
      camera_model: exifData?.Model || null,
      lens_model: exifData?.LensModel || null,
      focal_length: exifData?.FocalLength ? parseFloat(exifData.FocalLength.toString()) : null,
      aperture: exifData?.FNumber ? parseFloat(exifData.FNumber.toString()) : null,
      shutter_speed: exifData?.ExposureTime ? `${exifData.ExposureTime}s` : null,
      iso: exifData?.ISO || null,
      flash: exifData?.Flash ? exifData.Flash !== 0 : null,
      width: exifData?.ImageWidth || null,
      height: exifData?.ImageHeight || null,
      gps_latitude: exifData?.GPSLatitude || null,
      gps_longitude: exifData?.GPSLongitude || null,
      gps_altitude: exifData?.GPSAltitude || null,
      upload_source: 'desktop-sync'
    };

    const { data: insertedImage, error: dbError } = await supabase
      .from('images')
      .insert(imageMetadata)
      .select('id')
      .single();

    if (dbError) {
      console.error('Failed to save image metadata:', dbError);
      // Still return success since file was uploaded to storage
    }

    return NextResponse.json({
      success: true,
      imageId: insertedImage?.id,
      fileName: file.name,
      message: "File uploaded successfully via desktop sync"
    });

  } catch (error) {
    console.error("Desktop sync upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
