import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	const supabase = await createSupabaseServerClient();
	const { data: project, error } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, logo_url, background_color")
		.eq("id", projectId)
		.single();
	if (error || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
	if (!project.storage_bucket) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, reason: "no_bucket" });

	const bucket = project.storage_bucket as string;
	const prefix = (project.storage_prefix || "") as string;

	const admin = createSupabaseServiceClient();
	const { data: list, error: listError } = await admin.storage.from(bucket).list(prefix, {
		limit: 100,
		sortBy: { column: "created_at", order: "desc" },
	});
	if (listError) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, error: listError.message });
	if (!list || list.length === 0) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, reason: "empty", bucket, prefix });

	const newest = list[0];
	const fullPath = prefix ? `${prefix.replace(/\/+$/, "")}/${newest.name}` : newest.name;
	const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(fullPath, 3600);
	if (signError) return NextResponse.json({ url: null, logo_url: project.logo_url, background_color: project.background_color, error: signError.message, bucket, fullPath });
	return NextResponse.json({ url: signed.signedUrl, logo_url: project.logo_url, background_color: project.background_color });
}
