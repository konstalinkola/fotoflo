import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		console.log("🧪 Test API: Starting basic connection test...");
		
		const supabase = await createSupabaseServerClient();
		console.log("🧪 Test API: Supabase client created");
		
		// Test basic auth check
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		console.log("🧪 Test API: Auth check completed", { user: user?.email, error: authError?.message });
		
		if (authError) {
			return NextResponse.json({ 
				success: false, 
				error: "Auth error", 
				details: authError.message 
			}, { status: 401 });
		}
		
		// Test basic database query
		const { data: projects, error: dbError } = await supabase
			.from("projects")
			.select("id, name")
			.limit(1);
			
		console.log("🧪 Test API: Database query completed", { 
			projectCount: projects?.length || 0, 
			error: dbError?.message 
		});
		
		if (dbError) {
			return NextResponse.json({ 
				success: false, 
				error: "Database error", 
				details: dbError.message 
			}, { status: 500 });
		}
		
		return NextResponse.json({ 
			success: true, 
			message: "Connection test passed",
			user: user?.email,
			projectCount: projects?.length || 0
		});
		
	} catch (error) {
		console.error("🧪 Test API: Unexpected error:", error);
		return NextResponse.json({ 
			success: false, 
			error: "Unexpected error", 
			details: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
}
