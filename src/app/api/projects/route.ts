import { NextResponse, NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRequestSize, checkJSONSize } from "@/lib/request-limits";
import { handleApiError, ERRORS } from "@/lib/error-handler";
import { validateProjectName, validateStorageBucket, validateUrl, validateColor } from "@/lib/validation";

export async function GET(request: Request) {
	try {
		// Check for Bearer token (for desktop app) or use session (for web app)
		const authHeader = request.headers.get('authorization');
		let supabase;
		let user;
		
		if (authHeader?.startsWith('Bearer ')) {
			// Desktop app authentication with Bearer token
			const token = authHeader.substring(7);
			const { createClient } = await import('@supabase/supabase-js');
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
			const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
			
			supabase = createClient(supabaseUrl, supabaseAnonKey, {
				global: {
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			});
			
			const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !tokenUser) {
				console.error('Bearer token auth failed:', authError);
				throw ERRORS.UNAUTHORIZED();
			}
			user = tokenUser;
		} else {
			// Web app authentication with session cookies
			supabase = await createSupabaseServerClient();
			const { data: { user: sessionUser } } = await supabase.auth.getUser();
			if (!sessionUser) throw ERRORS.UNAUTHORIZED();
			user = sessionUser;
		}
		
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
