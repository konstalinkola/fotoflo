import { NextRequest, NextResponse } from "next/server";

// Beta access password - in production, use environment variable
const BETA_PASSWORD = "kuvapalvelin2024";

export async function POST(request: NextRequest) {
	try {
		const { password } = await request.json();
		
		if (password === BETA_PASSWORD) {
			return NextResponse.json({ success: true });
		} else {
			return NextResponse.json({ error: "Invalid password" }, { status: 401 });
		}
	} catch (error) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
}
