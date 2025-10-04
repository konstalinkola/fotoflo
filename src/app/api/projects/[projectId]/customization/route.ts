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
		.select("font_color, logo_size, logo_position_y, text_content, font_size, text_position_y, font_family, font_weight, background_color")
		.eq("id", projectId)
		.single();
	
	console.log("GET project data:", project, "error:", error);
	
	if (error || !project) {
		return NextResponse.json({ error: "Project not found" }, { status: 404 });
	}
	
	// Convert individual columns to the expected settings format
	const settings = {
		logoSize: project.logo_size || 80,
		logoPosition: { x: 0, y: project.logo_position_y || -100 },
		backgroundColor: project.background_color || "#f5f5f5", // Use project's background color
		textContent: project.text_content || "",
		textPosition: { x: 0, y: project.text_position_y || 150 },
		textColor: project.font_color || "#333333",
		textSize: project.font_size || 16,
		fontFamily: project.font_family || "Inter",
		fontWeight: project.font_weight || "400"
	};
	
	return NextResponse.json({ settings });
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
	
	// Convert settings to individual column format
	const updateData = {
		font_color: settings.textColor,
		logo_size: settings.logoSize,
		logo_position_y: settings.logoPosition?.y,
		text_content: settings.textContent,
		font_size: settings.textSize,
		text_position_y: settings.textPosition?.y,
		font_family: settings.fontFamily,
		font_weight: settings.fontWeight,
		background_color: settings.backgroundColor
	};
	
	console.log("Update data:", updateData);
	
	const { error } = await supabase
		.from("projects")
		.update(updateData)
		.eq("id", projectId);
	
	console.log("Update result:", error);
	
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	
	return NextResponse.json({ success: true });
}
