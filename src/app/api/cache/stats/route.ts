import { NextResponse } from "next/server";
import { CacheManager } from "@/lib/redis";

export async function GET() {
	try {
		const stats = await CacheManager.getStats();
		
		return NextResponse.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			cache: stats,
		});
	} catch (error) {
		console.error("Cache stats error:", error);
		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				error: "Failed to get cache stats",
			},
			{ status: 500 }
		);
	}
}
