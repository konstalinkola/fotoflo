import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state"); // projectId
	const error = url.searchParams.get("error");
	if (error) return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(error)}`, url.origin));
	if (!code || !state) return NextResponse.redirect(new URL("/dashboard?error=missing_code", url.origin));

	const oauth2Client = getGoogleOAuthClient();
	const { tokens } = await oauth2Client.getToken(code);
	const refreshToken = tokens.refresh_token;
	if (!refreshToken) {
		return NextResponse.redirect(new URL(`/dashboard?error=no_refresh_token`, url.origin));
	}

	const supabase = createSupabaseServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return NextResponse.redirect(new URL("/login", url.origin));

	const projectId = state;
	const { error: updateError } = await supabase
		.from("projects")
		.update({ google_drive_refresh_token: refreshToken })
		.eq("id", projectId)
		.eq("owner", user.id);
	if (updateError) return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(updateError.message)}`, url.origin));

	return NextResponse.redirect(new URL(`/dashboard?connected=${projectId}`, url.origin));
}
