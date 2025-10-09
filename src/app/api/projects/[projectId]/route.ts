import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		console.log("🔍 API: Starting project GET request...");
		const { projectId } = await params;
		console.log(`🔍 API: Project ID: ${projectId}`);
		
		console.log("🔍 API: Creating direct Supabase client...");
		// Use direct Supabase client to avoid cookies() hanging
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
		const supabase = createClient(supabaseUrl, supabaseKey);
		console.log("🔍 API: Direct Supabase client created");
		
		// Verify user is authenticated
		console.log("🔍 API: Checking user authentication...");
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		console.log(`🔍 API: Auth result - user: ${user?.email}, error: ${authError?.message}`);
		
		// TEMPORARY: Skip auth check to test if that's the issue
		if (false && (authError || !user)) {
			console.log("🔍 API: Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		// TEMPORARY: Use a dummy user ID for testing
		const testUserId = "test-user-id";
		console.log(`🔍 API: Using test user ID: ${testUserId}`);
		
		console.log(`🔍 API: Fetching project ${projectId} for user ${user?.email || 'test-user'}`);
		
		console.log("🔍 API: Starting database query...");
		const { data, error } = await supabase
			.from("projects")
			.select("id, name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode, owner")
			.eq("id", projectId)
			.eq("owner", testUserId) // TEMPORARY: Use test user ID
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
	// Use direct Supabase client
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	const supabase = createClient(supabaseUrl, supabaseKey);
	
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
	// Use direct Supabase client
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	const supabase = createClient(supabaseUrl, supabaseKey);
	
	const { error } = await supabase
		.from("projects")
		.delete()
		.eq("id", projectId);
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ ok: true });
}
