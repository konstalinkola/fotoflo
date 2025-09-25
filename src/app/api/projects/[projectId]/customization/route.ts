import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;
	const supabase = await createSupabaseServerClient();
	
	const { data: project, error } = await supabase
		.from("projects")
		.select("customization_settings")
		.eq("id", projectId)
		.single();
	
	if (error || !project) {
		return NextResponse.json({ error: "Project not found" }, { status: 404 });
	}
	
	return NextResponse.json({ settings: project.customization_settings });
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;
	const supabase = await createSupabaseServerClient();
	
	// Verify user owns this project
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	const settings = await request.json();
	
	const { error } = await supabase
		.from("projects")
		.update({ customization_settings: settings })
		.eq("id", projectId);
	
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	
	return NextResponse.json({ success: true });
}
