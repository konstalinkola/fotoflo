import { NextRequest, NextResponse } from "next/server";
import { CacheInvalidation, CacheManager } from "@/lib/redis";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const supabase = await createSupabaseServerClient();
		const { data: { user } } = await supabase.auth.getUser();
		
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { type, id } = body;

		if (!type || !id) {
			return NextResponse.json(
				{ error: "Missing type or id" },
				{ status: 400 }
			);
		}

		// Invalidate cache based on type
		switch (type) {
			case "project":
				await CacheInvalidation.invalidateProject(id);
				break;
			case "user":
				await CacheInvalidation.invalidateUser(id);
				break;
			case "image":
				await CacheInvalidation.invalidateImage(id);
				break;
			case "collection":
				await CacheInvalidation.invalidateCollection(id);
				break;
			case "website":
				await CacheInvalidation.invalidateWebsite(id);
				break;
			case "all":
				await CacheManager.flushAll();
				break;
			default:
				return NextResponse.json(
					{ error: "Invalid cache type" },
					{ status: 400 }
				);
		}

		return NextResponse.json({
			status: "ok",
			message: `Cache invalidated for ${type}: ${id}`,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Cache invalidation error:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Failed to invalidate cache",
			},
			{ status: 500 }
		);
	}
}
