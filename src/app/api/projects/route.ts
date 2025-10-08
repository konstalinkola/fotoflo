import { NextResponse, NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRequestSize, checkJSONSize } from "@/lib/request-limits";
import { handleApiError, ERRORS } from "@/lib/error-handler";
import { validateProjectName, validateStorageBucket, validateUrl, validateColor } from "@/lib/validation";

export async function GET(request: Request) {
	try {
		const supabase = await createSupabaseServerClient();
		
		// This will work with both session cookies AND Bearer tokens
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		if (userError || !user) throw ERRORS.UNAUTHORIZED();
		
		const { data: projects, error } = await supabase
			.from("projects")
			.select("id, name, display_mode, storage_bucket, storage_prefix, created_at")
			.eq("owner", user.id)
			.order("created_at", { ascending: false });
		
		if (error) {
			console.error('Error fetching projects:', error);
			throw ERRORS.VALIDATION_ERROR(`Failed to fetch projects: ${error.message}`);
		}
		
		return NextResponse.json(projects);
	} catch (error) {
		return handleApiError(error, '/api/projects');
	}
}

export async function POST(request: Request) {
	try {
		// Check request size
		const sizeCheck = checkRequestSize(request as NextRequest);
		if (!sizeCheck.allowed) {
			return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
		}

		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError || !user) throw ERRORS.UNAUTHORIZED();

		const body = await request.json();

		// Check JSON payload size
		const jsonCheck = checkJSONSize(body);
		if (!jsonCheck.allowed) {
			return NextResponse.json({ error: jsonCheck.error }, { status: 413 });
		}

		const { name, backgroundColor, logoUrl, storageBucket, storagePrefix } = body;

		// Enhanced input validation
		const validatedName = validateProjectName(name);
		const validatedStorageBucket = validateStorageBucket(storageBucket);
		const validatedBackgroundColor = validateColor(backgroundColor, 'Background color');
		const validatedLogoUrl = validateUrl(logoUrl, 'Logo URL');

		// Validate storage prefix if provided
		if (storagePrefix && typeof storagePrefix !== 'string') {
			throw ERRORS.VALIDATION_ERROR('Storage prefix must be a string');
		}
		const { data, error } = await supabase
			.from("projects")
			.insert({
				name: validatedName,
				background_color: validatedBackgroundColor,
				logo_url: validatedLogoUrl,
				storage_bucket: validatedStorageBucket,
				storage_prefix: storagePrefix || null,
				owner: user.id,
			})
			.select("id")
			.single();

		if (error) {
			console.error('Database error creating project:', error);
			throw ERRORS.VALIDATION_ERROR(`Failed to create project: ${error.message}`);
		}

		return NextResponse.json({ id: data.id });
	} catch (error) {
		return handleApiError(error, '/api/projects');
	}
}
