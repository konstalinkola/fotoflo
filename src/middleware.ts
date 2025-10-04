import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// Check if user has beta access
	const betaAccess = request.cookies.get("beta-access");
	
	// Allow access to beta-access page, API, and public pages
	if (request.nextUrl.pathname.startsWith("/beta-access") || 
		request.nextUrl.pathname.startsWith("/api/beta-access") ||
		request.nextUrl.pathname.startsWith("/api/") ||
		request.nextUrl.pathname.startsWith("/public/")) {
		return NextResponse.next();
	}
	
	// Allow access to static assets and Next.js internals
	if (request.nextUrl.pathname.startsWith("/_next") ||
		request.nextUrl.pathname.startsWith("/favicon") ||
		request.nextUrl.pathname.includes(".")) {
		return NextResponse.next();
	}
	
	// If no beta access, redirect to beta access page
	if (!betaAccess) {
		return NextResponse.redirect(new URL("/beta-access", request.url));
	}
	
	return NextResponse.next();
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
