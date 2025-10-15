import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// Desktop app project management
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

		// Get projects that have desktop sync enabled
		const { data: projects, error: projectsError } = await supabase
			.from('projects')
			.select(`
				id,
				name,
				display_mode,
				desktop_sync_enabled,
				watch_folder_path,
				auto_upload_enabled,
				storage_bucket,
				storage_prefix,
				created_at,
				updated_at
			`)
			.eq('desktop_sync_enabled', true)
			.order('created_at', { ascending: false });

		if (projectsError) {
			console.error("Failed to fetch projects:", projectsError);
			return NextResponse.json(
				{ error: "Failed to fetch projects" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			projects: projects || []
		});

	} catch (error) {
		console.error("Desktop projects error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Update project settings for desktop app
export async function PUT(request: NextRequest) {
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

		const { projectId, settings } = await request.json();

		if (!projectId) {
			return NextResponse.json(
				{ error: "Missing projectId" },
				{ status: 400 }
			);
		}

		// Validate project exists and is enabled for desktop sync
		const { data: project, error: projectError } = await supabase
			.from('projects')
			.select('id, desktop_sync_enabled')
			.eq('id', projectId)
			.single();

		if (projectError || !project) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 404 }
			);
		}

		if (!project.desktop_sync_enabled) {
			return NextResponse.json(
				{ error: "Desktop sync not enabled for this project" },
				{ status: 403 }
			);
		}

		// Update project settings
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString()
		};

		// Only allow updating desktop-specific settings
		if (settings.watchFolderPath !== undefined) {
			updateData.watch_folder_path = settings.watchFolderPath;
		}
		if (settings.autoUploadEnabled !== undefined) {
			updateData.auto_upload_enabled = settings.autoUploadEnabled;
		}

		const { data: updatedProject, error: updateError } = await supabase
			.from('projects')
			.update(updateData)
			.eq('id', projectId)
			.select()
			.single();

		if (updateError) {
			console.error("Failed to update project:", updateError);
			return NextResponse.json(
				{ error: "Failed to update project" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			project: updatedProject
		});

	} catch (error) {
		console.error("Desktop project update error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
