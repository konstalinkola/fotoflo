import { NextResponse } from "next/server";

export async function GET() {
	console.log("🏥 Health check API: Starting...");
	
	try {
		console.log("🏥 Health check API: Returning response...");
		return NextResponse.json({ 
			status: "healthy",
			timestamp: new Date().toISOString(),
			message: "API is working"
		});
	} catch (error) {
		console.error("🏥 Health check API: Error:", error);
		return NextResponse.json({ 
			status: "error",
			error: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
}


