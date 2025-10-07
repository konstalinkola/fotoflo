import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AutoUploadConfig {
	project_id: string;
	auto_organize: boolean;
	duplicate_detection: boolean;
	max_file_size: number;
	allowed_formats: string[];
	webhook_url?: string;
	webhook_secret?: string;
	auto_collection_creation: boolean;
	collection_naming_pattern: string;
	background_processing: boolean;
	created_at?: string;
	updated_at?: string;
}

export async function GET(request: NextRequest) {
	// Get projectId from query params since this route doesn't have dynamic segments
	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get('projectId');
	
	if (!projectId) {
		return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
	}
	const supabase = await createSupabaseServerClient();
	
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Get auto upload config for this project
	const { data: config, error } = await supabase
		.from("auto_upload_config")
		.select("*")
		.eq("project_id", projectId)
		.single();

	if (error && error.code !== 'PGRST116') {
		return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
	}

	// Return default config if none exists
	if (!config) {
		const defaultConfig: AutoUploadConfig = {
			project_id: projectId,
			auto_organize: true,
			duplicate_detection: true,
			max_file_size: 10 * 1024 * 1024, // 10MB
			allowed_formats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
			auto_collection_creation: true,
			collection_naming_pattern: "Auto Upload {date}",
			background_processing: true
		};
		return NextResponse.json({ config: defaultConfig });
	}

	return NextResponse.json({ config });
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

	const configData: Partial<AutoUploadConfig> = await request.json();

	// Validate config data
	if (configData.max_file_size && configData.max_file_size > 50 * 1024 * 1024) {
		return NextResponse.json({ error: "Max file size cannot exceed 50MB" }, { status: 400 });
	}

	if (configData.allowed_formats) {
		const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
		const invalidFormats = configData.allowed_formats.filter(format => !validFormats.includes(format));
		if (invalidFormats.length > 0) {
			return NextResponse.json({ 
				error: `Invalid formats: ${invalidFormats.join(", ")}` 
			}, { status: 400 });
		}
	}

	// Upsert config
	const configToSave = {
		project_id: projectId,
		auto_organize: configData.auto_organize ?? true,
		duplicate_detection: configData.duplicate_detection ?? true,
		max_file_size: configData.max_file_size ?? 10 * 1024 * 1024,
		allowed_formats: configData.allowed_formats ?? ["image/jpeg", "image/jpg", "image/png", "image/webp"],
		webhook_url: configData.webhook_url || null,
		webhook_secret: configData.webhook_secret || null,
		auto_collection_creation: configData.auto_collection_creation ?? true,
		collection_naming_pattern: configData.collection_naming_pattern ?? "Auto Upload {date}",
		background_processing: configData.background_processing ?? true,
		updated_at: new Date().toISOString()
	};

	const { data: savedConfig, error: saveError } = await supabase
		.from("auto_upload_config")
		.upsert(configToSave, { 
			onConflict: "project_id"
		})
		.select()
		.single();

	if (saveError) {
		console.error("Failed to save auto upload config:", saveError);
		return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
	}

	return NextResponse.json({ 
		success: true, 
		config: savedConfig,
		message: "Auto upload configuration saved successfully" 
	});
}

export async function DELETE(request: NextRequest) {
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

	// Delete auto upload config
	const { error: deleteError } = await supabase
		.from("auto_upload_config")
		.delete()
		.eq("project_id", projectId);

	if (deleteError) {
		console.error("Failed to delete auto upload config:", deleteError);
		return NextResponse.json({ error: "Failed to delete config" }, { status: 500 });
	}

	return NextResponse.json({ 
		success: true, 
		message: "Auto upload configuration deleted successfully" 
	});
}
