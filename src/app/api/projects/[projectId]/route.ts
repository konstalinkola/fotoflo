import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const supabase = createSupabaseServerClient();
	const { data, error } = await supabase
		.from("projects")
		.select("id, name, logo_url, background_color, storage_bucket, storage_prefix")
		.eq("id", params.projectId)
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 404 });
	return NextResponse.json(data);
}

export async function PUT(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const supabase = createSupabaseServerClient();
	const body = await request.json();
	const { name, logo_url, background_color, storage_bucket, storage_prefix } = body;
	const { data, error } = await supabase
		.from("projects")
		.update({ name, logo_url, background_color, storage_bucket, storage_prefix })
		.eq("id", params.projectId)
		.select("id")
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ id: data.id });
}

export async function DELETE(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const supabase = createSupabaseServerClient();
	const { error } = await supabase
		.from("projects")
		.delete()
		.eq("id", params.projectId);
	if (error) return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ ok: true });
}
