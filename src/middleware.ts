import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// Check if user has beta access
	const betaAccess = request.cookies.get("beta-access");
	
	// Allow access to beta-access page and API
	if (request.nextUrl.pathname.startsWith("/beta-access") || 
		request.nextUrl.pathname.startsWith("/api/beta-access")) {
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
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
