import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	const { projectId } = await params;

	// Verify user owns this project
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("storage_bucket, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	// Get file paths to delete from request body
	const { filePaths } = await request.json();
	
	if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
		return NextResponse.json({ error: "No files specified for deletion" }, { status: 400 });
	}

	// Delete files from Supabase Storage and database
	const admin = createSupabaseServiceClient();
	const bucket = project.storage_bucket as string;
	
	const deleteResults = await Promise.allSettled(
		filePaths.map(async (filePath: string) => {
			// Delete from storage
			const { error: storageError } = await admin.storage
				.from(bucket)
				.remove([filePath]);
			
			if (storageError) {
				throw new Error(`Failed to delete ${filePath} from storage: ${storageError.message}`);
			}

			// Delete from database
			const { error: dbError } = await supabase
				.from('images')
				.delete()
				.eq('project_id', projectId)
				.eq('storage_path', filePath);

			if (dbError) {
				console.warn(`Failed to delete ${filePath} from database:`, dbError);
				// Don't fail the operation if database deletion fails
			}
			
			return filePath;
		})
	);

	// Check results
	const successful = deleteResults
		.filter(result => result.status === 'fulfilled')
		.map(result => (result as PromiseFulfilledResult<string>).value);
	
	const failed = deleteResults
		.filter(result => result.status === 'rejected')
		.map(result => (result as PromiseRejectedResult).reason);

	// If any files failed to delete, return error
	if (failed.length > 0) {
		return NextResponse.json({ 
			error: "Some files could not be deleted",
			details: failed,
			successful: successful.length,
			failed: failed.length
		}, { status: 500 });
	}

	return NextResponse.json({ 
		success: true,
		deleted: successful,
		count: successful.length,
		message: `Successfully deleted ${successful.length} file(s)`
	});
}
