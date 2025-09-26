import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	const { data: project, error } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, logo_url, background_color, active_image_path, qr_visibility_duration, qr_expires_on_click")
		.eq("id", projectId)
		.single();
	if (error || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
	if (!project.storage_bucket) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, reason: "no_bucket" });

	const bucket = project.storage_bucket as string;
	const admin = createSupabaseServiceClient();
	
	// Check if there's an active image set
	let targetImagePath = project.active_image_path;
	
	// If no active image, find the latest image
	if (!targetImagePath) {
		// Use project folder (user bucket is already isolated)
		const projectPrefix = project.storage_prefix || projectId;
		const { data: list, error: listError } = await admin.storage.from(bucket).list(projectPrefix, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});
		
		if (listError) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, error: listError.message });
		if (!list || list.length === 0) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, reason: "empty", bucket, prefix: projectPrefix });
		
		const newest = list[0];
		targetImagePath = `${projectPrefix}/${newest.name}`;
	}
	
	// Generate signed URL for the target image
	const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(targetImagePath, 3600);
	if (signError) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, error: signError.message, bucket, fullPath: targetImagePath });
	
	return NextResponse.json({ 
		url: signed.signedUrl, 
		logo_url: project.logo_url, 
		background_color: project.background_color,
		qr_visibility_duration: project.qr_visibility_duration,
		qr_expires_on_click: project.qr_expires_on_click
	});
}
