import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// Desktop app authentication endpoint
export async function POST(request: NextRequest) {
	// Rate limiting - 10 attempts per minute per IP
	const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
	const rateLimitResult = rateLimit(`desktop-auth:${ip}`, 10, 60000);

	if (!rateLimitResult.allowed) {
		return NextResponse.json(
			{ error: "Too many authentication attempts" },
			{ 
				status: 429,
				headers: getRateLimitHeaders(rateLimitResult)
			}
		);
	}

	try {
		const { apiKey, deviceId, deviceName, appVersion } = await request.json();

		// Validate required fields
		if (!apiKey || !deviceId || !deviceName) {
			return NextResponse.json(
				{ error: "Missing required fields: apiKey, deviceId, deviceName" },
				{ status: 400 }
			);
		}

		// Verify desktop API key
		const expectedApiKey = process.env.DESKTOP_API_KEY;
		if (!expectedApiKey) {
			console.error("DESKTOP_API_KEY not configured");
			return NextResponse.json(
				{ error: "Desktop API not configured" },
				{ status: 500 }
			);
		}

		if (apiKey !== expectedApiKey) {
			return NextResponse.json(
				{ error: "Invalid API key" },
				{ status: 401 }
			);
		}

		// For now, we'll use a service account approach
		// In the future, this could be enhanced with proper user authentication
		const supabase = createSupabaseServiceClient();

		// Create or update desktop session
		const { data: session, error: sessionError } = await supabase
			.from('desktop_sessions')
			.upsert({
				device_id: deviceId,
				device_name: deviceName,
				app_version: appVersion,
				user_id: null, // Will be set when user logs in through desktop app
				last_seen_at: new Date().toISOString(),
				is_active: true
			}, {
				onConflict: 'device_id'
			})
			.select()
			.single();

		if (sessionError) {
			console.error("Failed to create desktop session:", sessionError);
			return NextResponse.json(
				{ error: "Failed to create session" },
				{ status: 500 }
			);
		}

		// Generate a session token (simple approach for now)
		const sessionToken = Buffer.from(`${deviceId}:${Date.now()}`).toString('base64');

		return NextResponse.json({
			success: true,
			session: {
				id: session.id,
				token: sessionToken,
				deviceId: deviceId,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
			}
		});

	} catch (error) {
		console.error("Desktop auth error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Desktop session validation
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
		const [deviceId, timestamp] = Buffer.from(token, 'base64').toString().split(':');
		
		// Check if token is expired (24 hours)
		const tokenAge = Date.now() - parseInt(timestamp);
		if (tokenAge > 24 * 60 * 60 * 1000) {
			return NextResponse.json(
				{ error: "Session expired" },
				{ status: 401 }
			);
		}

		const supabase = createSupabaseServiceClient();
		
		// Verify session exists and is active
		const { data: session, error } = await supabase
			.from('desktop_sessions')
			.select('*')
			.eq('device_id', deviceId)
			.eq('is_active', true)
			.single();

		if (error || !session) {
			return NextResponse.json(
				{ error: "Invalid session" },
				{ status: 401 }
			);
		}

		// Update last seen
		await supabase
			.from('desktop_sessions')
			.update({ last_seen_at: new Date().toISOString() })
			.eq('id', session.id);

		return NextResponse.json({
			success: true,
			session: {
				id: session.id,
				deviceId: session.device_id,
				deviceName: session.device_name,
				appVersion: session.app_version
			}
		});

	} catch (error) {
		console.error("Desktop session validation error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

