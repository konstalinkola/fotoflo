import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// Check if user has beta access
	const betaAccess = request.cookies.get("beta-access");
	
	console.log(`Middleware: ${request.nextUrl.pathname}, betaAccess: ${betaAccess?.value}`);
	
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
		console.log(`Middleware: Allowing access to ${request.nextUrl.pathname} - beta access cookie found`);
		return NextResponse.next();
	}
	
	// If no beta access, redirect to beta access page
	console.log(`Middleware: Redirecting ${request.nextUrl.pathname} to beta-access - no beta cookie`);
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
