import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Create bucket name based on user ID (sanitized)
	const bucketName = `user-${user.id.replace(/-/g, '')}`;
	const admin = createSupabaseServiceClient();
	
	// Check if bucket exists, create if it doesn't
	const { data: buckets } = await admin.storage.listBuckets();
	const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
	
	if (!bucketExists) {
		const { error: bucketError } = await admin.storage.createBucket(bucketName, {
			public: false, // Private bucket for security
			fileSizeLimit: 10485760, // 10MB limit
			allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		});
		
		if (bucketError) {
			return NextResponse.json({ 
				error: `Failed to create user storage bucket: ${bucketError.message}` 
			}, { status: 500 });
		}
	}

	return NextResponse.json({ 
		success: true, 
		bucketName: bucketName,
		message: "User bucket ensured"
	});
}
