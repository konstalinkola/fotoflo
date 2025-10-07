import { NextResponse } from "next/server";
import { HealthMonitor, PerformanceMonitor } from "@/lib/monitoring";

export async function GET() {
	try {
		// Run comprehensive health check
		const healthCheck = await HealthMonitor.runHealthCheck();
		
		// Get performance metrics
		const performanceMetrics = PerformanceMonitor.getMetrics();
		
		return NextResponse.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			health: healthCheck,
			performance: performanceMetrics,
		});
	} catch (error) {
		console.error("Health check failed:", error);
		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				error: "Health check failed",
			},
			{ status: 500 }
		);
	}
}
