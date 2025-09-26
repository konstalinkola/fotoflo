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

	// Get images from project folder (user bucket is already isolated)
	const projectPrefix = project.storage_prefix || projectId;
	const { data: projectImages, error: projectError } = await admin.storage
		.from(bucket)
		.list(projectPrefix, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});

	// Combine and deduplicate images
	interface ImageWithSource {
		path: string;
		source: string;
		name: string;
		created_at: string;
		url?: string | null;
		size?: number;
		metadata?: {
			size?: number;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	}
	const allImages: ImageWithSource[] = [];
	
	if (projectImages && !projectError) {
		allImages.push(...projectImages.map(img => ({
			...img,
			path: `${projectPrefix}/${img.name}`,
			source: 'project'
		})));
	}

	// Sort by created_at
	const sortedImages = allImages
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	// Generate signed URLs for each image
	const imagesWithUrls = await Promise.all(
		sortedImages.map(async (img) => {
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
