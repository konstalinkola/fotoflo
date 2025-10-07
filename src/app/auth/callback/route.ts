import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const redirect = searchParams.get("redirect") || "/dashboard";

	if (code) {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);
		
		if (data.user && !error) {
			// User successfully authenticated - grant beta access
			const response = NextResponse.redirect(new URL(redirect, origin));
			response.cookies.set("beta-access", "true", {
				path: "/",
				maxAge: 86400, // 24 hours
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax"
			});
			return response;
		}
	}

	return NextResponse.redirect(new URL("/login", origin));
}
