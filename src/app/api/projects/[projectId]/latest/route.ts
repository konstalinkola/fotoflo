import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const { projectId } = params;

	const supabase = createSupabaseServerClient();
	const { data: project, error } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix")
		.eq("id", projectId)
		.single();
	if (error || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
	if (!project.storage_bucket) return NextResponse.json({ url: null });

	const bucket = project.storage_bucket as string;
	const prefix = (project.storage_prefix || "") as string;

	try {
		const { data: list, error: listError } = await supabase.storage.from(bucket).list(prefix, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});
		if (listError) throw listError;
		if (!list || list.length === 0) return NextResponse.json({ url: null });

		// Pick the newest file (list is already sorted desc if supported)
		const newest = list[0];
		const fullPath = prefix ? `${prefix.replace(/\/+$/, "")}/${newest.name}` : newest.name;

		// Generate a signed URL (valid for 1 hour)
		const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUrl(fullPath, 3600);
		if (signError) throw signError;
		return NextResponse.json({ url: signed.signedUrl });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
