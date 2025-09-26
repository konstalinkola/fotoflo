import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Create a blank project with default values
	const { data, error } = await supabase
		.from("projects")
		.insert({
			owner: user.id,
			name: "Untitled Project",
			background_color: "#ffffff",
			logo_url: "",
			storage_bucket: "photos", // Default bucket name
			storage_prefix: "",
			qr_visibility_duration: 0,
			qr_expires_on_click: false,
			customization_settings: null
		})
		.select("id")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ 
		success: true, 
		projectId: data.id,
		message: "Blank project created successfully"
	});
}
