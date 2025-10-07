import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// Beta access password from environment variable
const BETA_PASSWORD = process.env.BETA_ACCESS_PASSWORD || "taika";

export async function POST(request: NextRequest) {
	// Rate limiting - 5 attempts per minute per IP
	const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
	const rateLimitResult = rateLimit(`beta-access:${ip}`, 5, 60000);

	if (!rateLimitResult.allowed) {
		return NextResponse.json(
			{ error: "Too many attempts. Please try again later." }, 
			{ 
				status: 429,
				headers: getRateLimitHeaders(rateLimitResult)
			}
		);
	}

	try {
		const { password } = await request.json();
		
		if (password === BETA_PASSWORD) {
			return NextResponse.json({ success: true });
		} else {
			return NextResponse.json({ error: "Invalid password" }, { status: 401 });
		}
	} catch {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
