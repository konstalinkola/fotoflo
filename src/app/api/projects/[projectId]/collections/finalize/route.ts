import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Finalizes the current "New Collection" (collection_number: 1) and starts a new one
 * This is used when the user wants to start a new batch of uploads
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ projectId: string }> }
) {
	try {
		const { projectId } = await params;
		const supabase = await createSupabaseServerClient();
		
		// Verify user owns this project
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		const { data: project, error: projectError } = await supabase
			.from("projects")
			.select("id, owner, display_mode")
			.eq("id", projectId)
			.eq("owner", user.id)
			.single();
		
		if (projectError || !project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}
		
		if (project.display_mode !== 'collection') {
			return NextResponse.json({ error: "Project is not in collection mode" }, { status: 400 });
		}
		
		// Find the current "New Collection" (collection_number: 1)
		const { data: currentCollection, error: currentError } = await supabase
			.from("collections")
			.select("id, collection_number")
			.eq("project_id", projectId)
			.eq("collection_number", 1)
			.single();
		
		if (currentError || !currentCollection) {
			// No current collection, nothing to finalize
			return NextResponse.json({ 
				success: true, 
				message: "No current collection to finalize",
				newCollectionNumber: 2
			});
		}
		
		// Get the highest collection number for this project
		const { data: maxCollection, error: maxError } = await supabase
			.from("collections")
			.select("collection_number")
			.eq("project_id", projectId)
			.order("collection_number", { ascending: false })
			.limit(1);
		
		const nextCollectionNumber = maxCollection && maxCollection.length > 0 
			? maxCollection[0].collection_number + 1 
			: 2;
		
		// Update the current collection to have a proper number (finalize it)
		const { error: updateError } = await supabase
			.from("collections")
			.update({ collection_number: nextCollectionNumber })
			.eq("id", currentCollection.id);
		
		if (updateError) {
			console.error('Failed to finalize collection:', updateError);
			return NextResponse.json({ error: "Failed to finalize collection" }, { status: 500 });
		}
		
		// Create a new "New Collection" (collection_number: 1)
		const { data: newCollection, error: createError } = await supabase
			.from("collections")
			.insert({
				project_id: projectId,
				collection_number: 1
			})
			.select("id")
			.single();
		
		if (createError) {
			console.error('Failed to create new collection:', createError);
			return NextResponse.json({ error: "Failed to create new collection" }, { status: 500 });
		}
		
		console.log(`✅ Finalized collection ${currentCollection.id} as number ${nextCollectionNumber}, created new collection ${newCollection.id}`);
		
		return NextResponse.json({ 
			success: true, 
			message: `Finalized collection as #${nextCollectionNumber}, started new collection`,
			finalizedCollectionNumber: nextCollectionNumber,
			newCollectionId: newCollection.id
		});
		
	} catch (error) {
		console.error('Error in finalize collection:', error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
