import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
	// Check if user has beta access
	const betaAccess = request.cookies.get("beta-access");
	
	// Allow access to beta-access page, API, auth callbacks, and public pages
	if (request.nextUrl.pathname.startsWith("/beta-access") || 
		request.nextUrl.pathname.startsWith("/api/beta-access") ||
		request.nextUrl.pathname.startsWith("/api/") ||
		request.nextUrl.pathname.startsWith("/auth/") ||
		request.nextUrl.pathname.startsWith("/public/")) {
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
	
	// Check if user is authenticated via Supabase session
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	// If user is authenticated but no beta access cookie, grant it
	if (user) {
		const response = NextResponse.next();
		response.cookies.set("beta-access", "true", {
			path: "/",
			maxAge: 86400, // 24 hours
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax"
		});
		return response;
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
