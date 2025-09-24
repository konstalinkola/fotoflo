import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const { projectId } = params;
	// TODO: Look up project by ID, use stored Google Drive folder + tokens
	// For MVP placeholder, return a fixed image url to verify QR flow
	const demoUrl = `https://picsum.photos/seed/${encodeURIComponent(projectId)}/1600/900`;
	return NextResponse.json({ url: demoUrl });
}
