import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google";

export async function GET(
	request: Request,
	{ params }: { params: { projectId: string } }
) {
	const { projectId } = params;
	const oauth2Client = getGoogleOAuthClient();
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: [
			"https://www.googleapis.com/auth/drive.readonly",
		],
		state: projectId,
	});
	return NextResponse.redirect(authUrl);
}
