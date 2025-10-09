import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ projectId: string; collectionId: string }> }
) {
	try {
		const { projectId, collectionId } = await params;
		const supabase = await createSupabaseServerClient();
		
		// Verify user owns this project
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		// Verify the collection belongs to the project and user owns it
		const { data: collection, error: collectionError } = await supabase
			.from("collections")
			.select(`
				id,
				collection_number,
				project_id,
				projects!inner(owner)
			`)
			.eq("id", collectionId)
			.eq("project_id", projectId)
			.eq("projects.owner", user.id)
			.single();
		
		if (collectionError || !collection) {
			return NextResponse.json({ error: "Collection not found or access denied" }, { status: 404 });
		}
		
		// Delete collection images first (cascade should handle this, but let's be explicit)
		const { error: deleteImagesError } = await supabase
			.from("collection_images")
			.delete()
			.eq("collection_id", collectionId);
		
		if (deleteImagesError) {
			console.error('Error deleting collection images:', deleteImagesError);
			return NextResponse.json({ error: "Failed to delete collection images" }, { status: 500 });
		}
		
		// Delete the collection
		const { error: deleteCollectionError } = await supabase
			.from("collections")
			.delete()
			.eq("id", collectionId);
		
		if (deleteCollectionError) {
			console.error('Error deleting collection:', deleteCollectionError);
			return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
		}
		
		return NextResponse.json({ 
			success: true, 
			message: `Collection ${collection.collection_number} deleted successfully`,
			collection_id: collectionId
		});
		
	} catch (error) {
		console.error('Error in collection DELETE endpoint:', error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
