import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { data: project, error } = await supabase
		.from("projects")
		.select("storage_bucket, storage_prefix, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (error || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	const bucket = project.storage_bucket as string;
	const admin = createSupabaseServiceClient();

	// Get images from user/project folder
	const userProjectPrefix = `${user.id}/${projectId}`;
	const { data: userImages, error: userError } = await admin.storage
		.from(bucket)
		.list(userProjectPrefix, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});

	console.log("User images:", userImages, "Error:", userError);

	// Get images from original prefix (fallback)
	const originalPrefix = project.storage_prefix || "";
	const { data: originalImages, error: originalError } = await admin.storage
		.from(bucket)
		.list(originalPrefix, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});

	console.log("Original images:", originalImages, "Error:", originalError);

	// Combine and deduplicate images
	const allImages = [];
	
	if (userImages && !userError) {
		allImages.push(...userImages.map(img => ({
			...img,
			path: `${userProjectPrefix}/${img.name}`,
			source: 'user'
		})));
	}
	
	if (originalImages && !originalError) {
		allImages.push(...originalImages.map(img => ({
			...img,
			path: originalPrefix ? `${originalPrefix.replace(/\/+$/, "")}/${img.name}` : img.name,
			source: 'original'
		})));
	}

	// Remove duplicates and sort by created_at
	const uniqueImages = allImages
		.filter((img, index, self) => 
			index === self.findIndex(i => i.name === img.name)
		)
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	// Generate signed URLs for each image
	const imagesWithUrls = await Promise.all(
		uniqueImages.map(async (img) => {
			const { data: signed } = await admin.storage
				.from(bucket)
				.createSignedUrl(img.path, 3600);
			
			return {
				name: img.name,
				path: img.path,
				created_at: img.created_at,
				size: img.metadata?.size,
				url: signed?.signedUrl || null,
				source: img.source
			};
		})
	);

	return NextResponse.json({ images: imagesWithUrls });
}
