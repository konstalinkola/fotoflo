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
		
		// Check for authentication from either Authorization header (desktop app) or cookies (web app)
		const authHeader = request.headers.get('authorization');
		let supabase;
		let user;
		
		if (authHeader?.startsWith('Bearer ')) {
			// Desktop app authentication with Bearer token
			console.log("🔍 API: Using Bearer token authentication");
			const { createClient } = await import('@supabase/supabase-js');
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
			const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
			supabase = createClient(supabaseUrl, supabaseKey);
			
			const token = authHeader.substring(7);
			const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !tokenUser) {
				console.log("❌ Bearer token auth failed:", authError);
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			user = tokenUser;
		} else {
			// Web app authentication with session cookies
			console.log("🔍 API: Using session cookie authentication");
			supabase = await createSupabaseServerClient();
			const { data: { user: sessionUser } } = await supabase.auth.getUser();
			if (!sessionUser) {
				console.log("❌ No authenticated user found");
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
			user = sessionUser;
		}
		
		console.log(`✅ Authenticated user: ${user.email}`);
		
		console.log("🔍 API: Starting database query...");
		const { data, error } = await supabase
			.from("projects")
			.select("id, name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode, owner")
			.eq("id", projectId)
			.eq("owner", user.id)
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
	try {
		const { projectId } = await params;
		const supabase = await createSupabaseServerClient();
		
		// Verify user is authenticated
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		const body = await request.json();
		const { name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode } = body;
		const { data, error } = await supabase
			.from("projects")
			.update({ name, logo_url, background_color, storage_bucket, storage_prefix, qr_visibility_duration, qr_expires_on_click, display_mode })
			.eq("id", projectId)
			.eq("owner", user.id)
			.select("id")
			.single();
		if (error) return NextResponse.json({ error: error.message }, { status: 400 });
		return NextResponse.json({ id: data.id });
	} catch (error) {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		const { projectId } = await params;
		const supabase = await createSupabaseServerClient();
		
		// Verify user is authenticated
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		const { error } = await supabase
			.from("projects")
			.delete()
			.eq("id", projectId)
			.eq("owner", user.id);
		if (error) return NextResponse.json({ error: error.message }, { status: 400 });
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
