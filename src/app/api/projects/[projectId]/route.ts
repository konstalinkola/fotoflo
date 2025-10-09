import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		console.log("🔍 API: Starting project GET request...");
		const { projectId } = await params;
		console.log(`🔍 API: Project ID: ${projectId}`);
		
		console.log("🔍 API: Creating Supabase client...");
		const supabase = await createSupabaseServerClient();
		console.log("🔍 API: Supabase client created");
		
		// Verify user is authenticated
		console.log("🔍 API: Checking user authentication...");
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		console.log(`🔍 API: Auth result - user: ${user?.email}, error: ${authError?.message}`);
		
		if (authError || !user) {
			console.log("🔍 API: Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		console.log(`🔍 API: Fetching project ${projectId} for user ${user.email}`);
		
		console.log("🔍 API: Starting database query...");
		const { data, error } = await supabase
			.from("projects")
			.select("id, name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode, owner")
			.eq("id", projectId)
			.eq("owner", user.id) // Only return projects owned by the user
			.single();
			
		console.log(`🔍 API: Database query completed - data: ${!!data}, error: ${error?.message}`);
			
		if (error) {
			console.error(`❌ API: Error fetching project ${projectId}:`, error);
			return NextResponse.json({ error: error.message }, { status: 404 });
		}
		
		if (!data) {
			console.error(`❌ API: Project ${projectId} not found or not owned by user`);
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}
		
		console.log(`✅ API: Successfully fetched project ${projectId}: ${data.name}`);
		return NextResponse.json(data);
	} catch (error) {
		console.error('❌ API: Unexpected error in project GET:', error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;
	const supabase = await createSupabaseServerClient();
	const body = await request.json();
	const { name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode } = body;
	const { data, error } = await supabase
		.from("projects")
		.update({ name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode })
		.eq("id", projectId)
		.select("id")
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ id: data.id });
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;
	const supabase = await createSupabaseServerClient();
	const { error } = await supabase
		.from("projects")
		.delete()
		.eq("id", projectId);
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ ok: true });
}
