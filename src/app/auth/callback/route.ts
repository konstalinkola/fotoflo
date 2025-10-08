import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const type = searchParams.get("type");
	const redirect = "/dashboard"; // Always redirect to dashboard for cleaner UX

	if (code) {
		const supabase = await createSupabaseServerClient();
		
		if (type === "recovery") {
			// Handle password recovery
			const { data, error } = await supabase.auth.exchangeCodeForSession(code);
			
			if (data.user && !error) {
				console.log("Password recovery successful for user:", data.user.email);
				// Redirect to a password reset page or dashboard with a message
				const response = NextResponse.redirect(new URL("/dashboard?message=password-reset", origin));
				response.cookies.set("beta-access", "true", {
					path: "/",
					maxAge: 86400, // 24 hours
					httpOnly: false,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax"
				});
				return response;
			} else {
				console.error("Password recovery failed:", error);
				return NextResponse.redirect(new URL("/login?error=recovery-failed", origin));
			}
		} else {
			// Handle regular OAuth login
			const { data, error } = await supabase.auth.exchangeCodeForSession(code);
			
			if (data.user && !error) {
				// User successfully authenticated - grant beta access
				console.log("Auth successful, setting beta access cookie for user:", data.user.email);
				const response = NextResponse.redirect(new URL(redirect, origin));
				response.cookies.set("beta-access", "true", {
					path: "/",
					maxAge: 86400, // 24 hours
					httpOnly: false, // Changed to false so it can be read by middleware
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax"
				});
				return response;
			} else {
				console.error("Auth failed:", error);
			}
		}
	}

	return NextResponse.redirect(new URL("/login", origin));
}
