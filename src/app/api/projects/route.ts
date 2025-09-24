import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
	const supabase = createSupabaseServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { name, backgroundColor, logoUrl, driveFolderId } = body;
	const { data, error } = await supabase
		.from("projects")
		.insert({
			name,
			background_color: backgroundColor,
			logo_url: logoUrl,
			google_drive_folder_id: driveFolderId,
			owner: user.id,
		})
		.select("id")
		.single();

	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ id: data.id });
}
