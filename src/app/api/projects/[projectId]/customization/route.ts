import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;
	console.log("GET customization for project:", projectId);
	
	const supabase = await createSupabaseServerClient();
	
	const { data: project, error } = await supabase
		.from("projects")
		.select("customization_settings")
		.eq("id", projectId)
		.single();
	
	console.log("GET project data:", project, "error:", error);
	
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
	console.log("PUT customization for project:", projectId);
	
	const supabase = await createSupabaseServerClient();
	
	// Verify user owns this project
	const { data: { user } } = await supabase.auth.getUser();
	console.log("User:", user?.id);
	
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	console.log("Project ownership check:", project, "error:", projectError);
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	const settings = await request.json();
	console.log("Settings to save:", settings);
	
	const { error } = await supabase
		.from("projects")
		.update({ customization_settings: settings })
		.eq("id", projectId);
	
	console.log("Update result:", error);
	
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	
	return NextResponse.json({ success: true });
}
