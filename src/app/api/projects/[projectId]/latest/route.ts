import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleDriveClientFromRefreshToken } from "@/lib/google";

export async function GET(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const { projectId } = params;

	// Load project
	const supabase = createSupabaseServerClient();
	const { data: project, error } = await supabase
		.from("projects")
		.select("google_drive_folder_id, google_drive_refresh_token")
		.eq("id", projectId)
		.single();
	if (error || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
	if (!project.google_drive_refresh_token || !project.google_drive_folder_id) {
		return NextResponse.json({ url: null });
	}

	try {
		const drive = getGoogleDriveClientFromRefreshToken(project.google_drive_refresh_token);
		const { data } = await drive.files.list({
			q: `'${project.google_drive_folder_id}' in parents and trashed = false`,
			orderBy: "createdTime desc",
			pageSize: 1,
			fields: "files(id, name, mimeType)"
		});
		const file = data.files?.[0];
		if (!file) return NextResponse.json({ url: null });

		// Get a webContentLink or generate a view URL via files.get
		const { data: fileMeta } = await drive.files.get({ fileId: file.id!, fields: "id, webViewLink, webContentLink" });
		const url = fileMeta.webContentLink || fileMeta.webViewLink || null;
		return NextResponse.json({ url });
	} catch (e: any) {
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}
