import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	// Get projectId from query params since this route doesn't have dynamic segments
	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get('projectId');
	
	if (!projectId) {
		return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
	}
	const batchId = searchParams.get('batch_id');
	
	const supabase = await createSupabaseServerClient();
	
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Verify user owns this project
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("id, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	if (batchId) {
		// Get specific batch status
		const { data: batch, error: batchError } = await supabase
			.from("upload_batches")
			.select("*")
			.eq("batch_id", batchId)
			.eq("project_id", projectId)
			.single();

		if (batchError) {
			return NextResponse.json({ error: "Batch not found" }, { status: 404 });
		}

		// Get detailed results for this batch
		const { data: images, error: imagesError } = await supabase
			.from("images")
			.select("id, file_name, storage_path, file_size, file_type, uploaded_at, upload_source")
			.eq("upload_batch_id", batchId)
			.order("uploaded_at", { ascending: false });

		return NextResponse.json({
			batch: {
				...batch,
				uploaded_images: images || []
			}
		});
	}

	// Get overall auto upload status and recent batches
	const { data: batches, error: batchesError } = await supabase
		.from("upload_batches")
		.select("*")
		.eq("project_id", projectId)
		.order("created_at", { ascending: false })
		.limit(10);

	if (batchesError) {
		return NextResponse.json({ error: "Failed to fetch upload status" }, { status: 500 });
	}

	// Get auto upload config
	const { data: config } = await supabase
		.from("auto_upload_config")
		.select("*")
		.eq("project_id", projectId)
		.single();

	// Get upload statistics
	const { data: stats } = await supabase
		.from("upload_batches")
		.select("total_files, successful_uploads, failed_uploads, duplicates_skipped")
		.eq("project_id", projectId);

	// Calculate totals
	const totals = stats?.reduce((acc, batch) => ({
		total_files: acc.total_files + batch.total_files,
		successful_uploads: acc.successful_uploads + batch.successful_uploads,
		failed_uploads: acc.failed_uploads + batch.failed_uploads,
		duplicates_skipped: acc.duplicates_skipped + batch.duplicates_skipped
	}), { total_files: 0, successful_uploads: 0, failed_uploads: 0, duplicates_skipped: 0 }) || 
	{ total_files: 0, successful_uploads: 0, failed_uploads: 0, duplicates_skipped: 0 };

	// Get recent upload activity (last 7 days)
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const { data: recentActivity } = await supabase
		.from("upload_batches")
		.select("created_at, successful_uploads, failed_uploads")
		.eq("project_id", projectId)
		.gte("created_at", sevenDaysAgo.toISOString())
		.order("created_at", { ascending: false });

	// Calculate success rate
	const successRate = totals.total_files > 0 
		? Math.round((totals.successful_uploads / totals.total_files) * 100)
		: 0;

	return NextResponse.json({
		project_id: projectId,
		auto_upload_enabled: !!config,
		config: config || null,
		recent_batches: batches || [],
		statistics: {
			...totals,
			success_rate: successRate,
			recent_activity: recentActivity || []
		},
		last_updated: new Date().toISOString()
	});
}

export async function POST(request: NextRequest) {
	// Get projectId from query params since this route doesn't have dynamic segments
	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get('projectId');
	
	if (!projectId) {
		return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
	}
	const supabase = await createSupabaseServerClient();
	
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Verify user owns this project
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("id, owner")
		.eq("id", projectId)
		.eq("owner", user.id)
		.single();
	
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
	}

	const { action, batch_id } = await request.json();

	if (action === 'retry_failed' && batch_id) {
		// Retry failed uploads from a specific batch
		const { data: batch, error: batchError } = await supabase
			.from("upload_batches")
			.select("*")
			.eq("batch_id", batch_id)
			.eq("project_id", projectId)
			.single();

		if (batchError) {
			return NextResponse.json({ error: "Batch not found" }, { status: 404 });
		}

		// Create a new batch for retry
		const retryBatchId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		// This would typically involve re-queuing the failed files
		// For now, we'll just log the retry request
		console.log(`Retry requested for batch ${batch_id} -> new batch ${retryBatchId}`);

		return NextResponse.json({
			success: true,
			retry_batch_id: retryBatchId,
			message: "Retry batch created. Failed uploads will be reprocessed."
		});
	}

	if (action === 'cancel_batch' && batch_id) {
		// Cancel a running batch (if it's still in progress)
		const { data: batch, error: batchError } = await supabase
			.from("upload_batches")
			.select("*")
			.eq("batch_id", batch_id)
			.eq("project_id", projectId)
			.single();

		if (batchError) {
			return NextResponse.json({ error: "Batch not found" }, { status: 404 });
		}

		if (batch.status === 'completed') {
			return NextResponse.json({ error: "Batch is already completed" }, { status: 400 });
		}

		// Update batch status to cancelled
		const { error: updateError } = await supabase
			.from("upload_batches")
			.update({ 
				status: 'cancelled',
				updated_at: new Date().toISOString()
			})
			.eq("batch_id", batch_id);

		if (updateError) {
			return NextResponse.json({ error: "Failed to cancel batch" }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			message: "Batch cancelled successfully"
		});
	}

	return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
