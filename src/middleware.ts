import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./lib/app-init"; // Initialize app on startup

export async function middleware(request: NextRequest) {
	// Check if user has beta access
	const betaAccess = request.cookies.get("beta-access");
	
	// Dynamically get Supabase auth token cookie name from environment
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0] || 'default';
	const supabaseAccessToken = request.cookies.get(`sb-${projectRef}-auth-token`);
	
	// Allow access to beta-access page, API, auth callbacks, public pages, privacy policy, reset password, and profile
	if (request.nextUrl.pathname.startsWith("/beta-access") || 
		request.nextUrl.pathname.startsWith("/api/beta-access") ||
		request.nextUrl.pathname.startsWith("/api/") ||
		request.nextUrl.pathname.startsWith("/auth/") ||
		request.nextUrl.pathname.startsWith("/public/") ||
		request.nextUrl.pathname.startsWith("/privacy") ||
		request.nextUrl.pathname.startsWith("/reset-password") ||
		request.nextUrl.pathname.startsWith("/profile")) {
		return NextResponse.next();
	}
	
	// Allow access to static assets and Next.js internals
	if (request.nextUrl.pathname.startsWith("/_next") ||
		request.nextUrl.pathname.startsWith("/favicon") ||
		request.nextUrl.pathname.includes(".")) {
		return NextResponse.next();
	}
	
	// If user has beta access cookie, allow through
	if (betaAccess) {
		return NextResponse.next();
	}
	
	// Check if user is authenticated via Supabase
	if (supabaseAccessToken) {
		try {
			const supabase = await createSupabaseServerClient();
			const { data: { user } } = await supabase.auth.getUser();
			
			if (user) {
				const response = NextResponse.next();
				response.cookies.set("beta-access", "true", {
					path: "/",
					maxAge: 86400, // 24 hours
					httpOnly: false,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax"
				});
				return response;
			}
		} catch (error) {
			// Silently fail - user will be redirected to beta access
		}
	}
	
	// If no beta access and not authenticated, redirect to beta access page
	return NextResponse.redirect(new URL("/beta-access", request.url));
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
	],
};
