import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Desktop app sync operations
export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json(
				{ error: "Missing or invalid authorization header" },
				{ status: 401 }
			);
		}

		const token = authHeader.split(' ')[1];
		const [deviceId] = Buffer.from(token, 'base64').toString().split(':');

		const supabase = createSupabaseServiceClient();
		
		// Verify session
		const { data: session, error: sessionError } = await supabase
			.from('desktop_sessions')
			.select('*')
			.eq('device_id', deviceId)
			.eq('is_active', true)
			.single();

		if (sessionError || !session) {
			return NextResponse.json(
				{ error: "Invalid session" },
				{ status: 401 }
			);
		}

		const { action, projectId, filePath, fileData } = await request.json();

		// Log sync operation
		const logEntry = {
			desktop_session_id: session.id,
			project_id: projectId,
			action,
			file_path: filePath,
			status: 'pending',
			created_at: new Date().toISOString()
		};

		const { data: log, error: logError } = await supabase
			.from('sync_logs')
			.insert(logEntry)
			.select()
			.single();

		if (logError) {
			console.error("Failed to log sync operation:", logError);
		}

		try {
			switch (action) {
				case 'upload':
					await handleUpload(supabase, projectId, filePath, fileData, log?.id);
					break;
				case 'delete':
					await handleDelete(supabase, projectId, filePath, log?.id);
					break;
				case 'update':
					await handleUpdate(supabase, projectId, filePath, fileData, log?.id);
					break;
				default:
					throw new Error(`Unknown action: ${action}`);
			}

			// Update log as successful
			if (log?.id) {
				await supabase
					.from('sync_logs')
					.update({ 
						status: 'success',
						error_message: null
					})
					.eq('id', log.id);
			}

			return NextResponse.json({ success: true });

		} catch (error) {
			// Update log as failed
			if (log?.id) {
				await supabase
					.from('sync_logs')
					.update({ 
						status: 'failed',
						error_message: error instanceof Error ? error.message : 'Unknown error'
					})
					.eq('id', log.id);
			}

			throw error;
		}

	} catch (error) {
		console.error("Desktop sync error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal server error" },
			{ status: 500 }
		);
	}
}

// Get sync status for a project
export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json(
				{ error: "Missing or invalid authorization header" },
				{ status: 401 }
			);
		}

		const token = authHeader.split(' ')[1];
		const [deviceId] = Buffer.from(token, 'base64').toString().split(':');

		const supabase = createSupabaseServiceClient();
		
		// Verify session
		const { data: session, error: sessionError } = await supabase
			.from('desktop_sessions')
			.select('*')
			.eq('device_id', deviceId)
			.eq('is_active', true)
			.single();

		if (sessionError || !session) {
			return NextResponse.json(
				{ error: "Invalid session" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get('projectId');

		if (!projectId) {
			return NextResponse.json(
				{ error: "Missing projectId parameter" },
				{ status: 400 }
			);
		}

		// Get recent sync logs for this project
		const { data: syncLogs, error: logsError } = await supabase
			.from('sync_logs')
			.select('*')
			.eq('project_id', projectId)
			.order('created_at', { ascending: false })
			.limit(50);

		if (logsError) {
			console.error("Failed to fetch sync logs:", logsError);
			return NextResponse.json(
				{ error: "Failed to fetch sync status" },
				{ status: 500 }
			);
		}

		// Get project sync settings
		const { data: project, error: projectError } = await supabase
			.from('projects')
			.select('desktop_sync_enabled, watch_folder_path, auto_upload_enabled')
			.eq('id', projectId)
			.single();

		if (projectError) {
			console.error("Failed to fetch project:", projectError);
		}

		return NextResponse.json({
			success: true,
			project: {
				desktopSyncEnabled: project?.desktop_sync_enabled || false,
				watchFolderPath: project?.watch_folder_path,
				autoUploadEnabled: project?.auto_upload_enabled || true
			},
			recentSyncs: syncLogs || []
		});

	} catch (error) {
		console.error("Desktop sync status error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Helper functions for sync operations
async function handleUpload(supabase: any, projectId: string, filePath: string, fileData: any, logId?: string) {
	// This would integrate with the existing upload logic
	// For now, we'll just validate the project exists and is enabled for desktop sync
	const { data: project, error } = await supabase
		.from('projects')
		.select('desktop_sync_enabled')
		.eq('id', projectId)
		.single();

	if (error || !project) {
		throw new Error("Project not found");
	}

	if (!project.desktop_sync_enabled) {
		throw new Error("Desktop sync not enabled for this project");
	}

	// TODO: Implement actual file upload logic
	// This would involve:
	// 1. Processing the file data
	// 2. Generating image variants
	// 3. Uploading to Supabase Storage
	// 4. Creating database records
}

async function handleDelete(supabase: any, projectId: string, filePath: string, logId?: string) {
	// Find and delete the image record
	const { data: image, error: findError } = await supabase
		.from('images')
		.select('*')
		.eq('project_id', projectId)
		.eq('local_file_path', filePath)
		.single();

	if (findError || !image) {
		throw new Error("Image not found");
	}

	// Delete from storage (all variants)
	const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'photos';
	
	const pathsToDelete = [
		image.storage_path,
		image.micro_path,
		image.thumbnail_path,
		image.preview_path
	].filter(Boolean);

	for (const path of pathsToDelete) {
		const { error: deleteError } = await supabase.storage
			.from(bucket)
			.remove([path]);
		
		if (deleteError) {
			console.warn(`Failed to delete ${path}:`, deleteError);
		}
	}

	// Delete from database
	const { error: dbError } = await supabase
		.from('images')
		.delete()
		.eq('id', image.id);

	if (dbError) {
		throw new Error(`Failed to delete image record: ${dbError.message}`);
	}
}

async function handleUpdate(supabase: any, projectId: string, filePath: string, fileData: any, logId?: string) {
	// For updates, we'll treat it as a delete + upload
	await handleDelete(supabase, projectId, filePath, logId);
	await handleUpload(supabase, projectId, filePath, fileData, logId);
}
