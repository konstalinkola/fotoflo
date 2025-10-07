import { NextResponse, NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRequestSize, checkJSONSize } from "@/lib/request-limits";

export async function POST(request: Request) {
	// Check request size
	const sizeCheck = checkRequestSize(request as NextRequest);
	if (!sizeCheck.allowed) {
		return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
	}

	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();

	// Check JSON payload size
	const jsonCheck = checkJSONSize(body);
	if (!jsonCheck.allowed) {
		return NextResponse.json({ error: jsonCheck.error }, { status: 413 });
	}
	const { name, backgroundColor, logoUrl, storageBucket, storagePrefix } = body;

	// Input validation
	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		return NextResponse.json({ error: "Project name is required" }, { status: 400 });
	}
	if (name.length > 100) {
		return NextResponse.json({ error: "Project name must be less than 100 characters" }, { status: 400 });
	}
	if (backgroundColor && typeof backgroundColor !== 'string') {
		return NextResponse.json({ error: "Invalid background color" }, { status: 400 });
	}
	if (logoUrl && (typeof logoUrl !== 'string' || !logoUrl.startsWith('http'))) {
		return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
	}
	if (!storageBucket || typeof storageBucket !== 'string' || storageBucket.trim().length === 0) {
		return NextResponse.json({ error: "Storage bucket is required" }, { status: 400 });
	}
	if (storagePrefix && typeof storagePrefix !== 'string') {
		return NextResponse.json({ error: "Invalid storage prefix" }, { status: 400 });
	}
	const { data, error } = await supabase
		.from("projects")
		.insert({
			name,
			background_color: backgroundColor,
			logo_url: logoUrl,
			storage_bucket: storageBucket,
			storage_prefix: storagePrefix,
			owner: user.id,
		})
		.select("id")
		.single();

	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ id: data.id });
}
