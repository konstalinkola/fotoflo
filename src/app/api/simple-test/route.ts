import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
	try {
		console.log("🧪 Simple Test API: Starting...");
		
		// Use direct Supabase client without server-side cookies
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
		
		console.log("🧪 Simple Test API: Creating direct Supabase client...");
		const supabase = createClient(supabaseUrl, supabaseKey);
		console.log("🧪 Simple Test API: Direct Supabase client created");
		
		// Test basic database query without auth
		console.log("🧪 Simple Test API: Testing basic query...");
		const { data: projects, error } = await supabase
			.from("projects")
			.select("id, name")
			.limit(1);
			
		console.log("🧪 Simple Test API: Query completed", { 
			projectCount: projects?.length || 0, 
			error: error?.message 
		});
		
		if (error) {
			return NextResponse.json({ 
				success: false, 
				error: "Database error", 
				details: error.message 
			}, { status: 500 });
		}
		
		return NextResponse.json({ 
			success: true, 
			message: "Simple test passed",
			projectCount: projects?.length || 0,
			projects: projects
		});
		
	} catch (error) {
		console.error("🧪 Simple Test API: Unexpected error:", error);
		return NextResponse.json({ 
			success: false, 
			error: "Unexpected error", 
			details: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
}
