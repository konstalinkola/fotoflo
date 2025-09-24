import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	// Protect dashboard
	if (pathname.startsWith("/dashboard")) {
		const hasSession = request.cookies.get("sb-access-token") || request.cookies.get("sb:token");
		if (!hasSession) {
			const loginUrl = new URL("/login", request.url);
			loginUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(loginUrl);
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
