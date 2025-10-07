import { NextRequest, NextResponse } from "next/server";
import { PerformanceBaselineMeasurer } from "@/lib/performance-baseline";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	try {
		// Verify user is authenticated (optional for baseline measurement)
		const supabase = await createSupabaseServerClient();
		const { data: { user } } = await supabase.auth.getUser();
		
		// Get query parameters
		const { searchParams } = new URL(request.url);
		const count = parseInt(searchParams.get('count') || '1');
		const multiple = searchParams.get('multiple') === 'true';

		if (multiple && count > 1) {
			// Run multiple measurements for statistical accuracy
			const results = await PerformanceBaselineMeasurer.runMultipleMeasurements(count);
			
			return NextResponse.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				measurements: count,
				...results,
			});
		} else {
			// Run single measurement
			const baseline = await PerformanceBaselineMeasurer.runBaselineMeasurement();
			
			return NextResponse.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				measurements: 1,
				baseline,
			});
		}
	} catch (error) {
		console.error("Performance baseline measurement error:", error);
		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				error: "Failed to measure performance baseline",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const supabase = await createSupabaseServerClient();
		const { data: { user } } = await supabase.auth.getUser();
		
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { action, count = 5 } = body;

		switch (action) {
			case "run":
				const results = await PerformanceBaselineMeasurer.runMultipleMeasurements(count);
				return NextResponse.json({
					status: "ok",
					timestamp: new Date().toISOString(),
					action: "run",
					...results,
				});

			case "clear":
				PerformanceBaselineMeasurer.clearResults();
				return NextResponse.json({
					status: "ok",
					timestamp: new Date().toISOString(),
					action: "clear",
					message: "Results cleared",
				});

			case "export":
				const exportedResults = PerformanceBaselineMeasurer.exportResults();
				return NextResponse.json({
					status: "ok",
					timestamp: new Date().toISOString(),
					action: "export",
					results: JSON.parse(exportedResults),
				});

			case "get":
				const allResults = PerformanceBaselineMeasurer.getResults();
				return NextResponse.json({
					status: "ok",
					timestamp: new Date().toISOString(),
					action: "get",
					results: allResults,
					count: allResults.length,
				});

			default:
				return NextResponse.json(
					{ error: "Invalid action" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("Performance baseline API error:", error);
		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				error: "Failed to process performance baseline request",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
