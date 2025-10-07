// Comprehensive monitoring setup for Fotoflo
// Includes Sentry for error tracking, performance monitoring, and custom metrics

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry
export function initMonitoring() {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      profilesSampleRate: 0.1, // 10% of profiles for performance analysis
      beforeSend(event) {
        // Filter out development errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes("Non-Error promise rejection")) {
            return null;
          }
        }
        return event;
      },
    });
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  // Track API response times
  static trackApiCall(endpoint: string, duration: number, status: number) {
    const key = `${endpoint}_${status}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(duration);

    // Send to Sentry for analysis
    Sentry.addBreadcrumb({
      message: `API Call: ${endpoint}`,
      category: "api",
      data: {
        endpoint,
        duration,
        status,
      },
      level: status >= 400 ? "error" : "info",
    });

    // Log slow API calls
    if (duration > 1000) {
      Sentry.captureMessage(`Slow API call: ${endpoint} took ${duration}ms`, "warning");
    }
  }

  // Track database query performance
  static trackDatabaseQuery(query: string, duration: number, table?: string) {
    Sentry.addBreadcrumb({
      message: `Database Query: ${table || "unknown"}`,
      category: "database",
      data: {
        query: query.substring(0, 100), // Truncate long queries
        duration,
        table,
      },
      level: duration > 500 ? "warning" : "info",
    });

    // Alert on slow queries
    if (duration > 1000) {
      Sentry.captureMessage(`Slow database query: ${duration}ms`, "warning");
    }
  }

  // Track file upload performance
  static trackFileUpload(fileSize: number, duration: number, success: boolean) {
    Sentry.addBreadcrumb({
      message: `File Upload: ${success ? "Success" : "Failed"}`,
      category: "upload",
      data: {
        fileSize,
        duration,
        success,
        throughput: fileSize / (duration / 1000), // bytes per second
      },
      level: success ? "info" : "error",
    });

    // Track upload performance metrics
    const throughput = fileSize / (duration / 1000);
    if (throughput < 100000) { // Less than 100KB/s
      Sentry.captureMessage(`Slow upload: ${throughput} bytes/s`, "warning");
    }
  }

  // Track user interactions
  static trackUserAction(action: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({
      message: `User Action: ${action}`,
      category: "user",
      data,
      level: "info",
    });
  }

  // Get performance metrics
  static getMetrics() {
    const result: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    
    for (const [key, values] of this.metrics.entries()) {
      result[key] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
    
    return result;
  }

  // Clear old metrics (call periodically)
  static clearMetrics() {
    this.metrics.clear();
  }
}

// Error tracking utilities
export class ErrorTracker {
  // Track API errors
  static trackApiError(endpoint: string, error: Error, status?: number) {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "api");
      scope.setContext("api", {
        endpoint,
        status,
      });
      Sentry.captureException(error);
    });
  }

  // Track database errors
  static trackDatabaseError(query: string, error: Error, table?: string) {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "database");
      scope.setContext("database", {
        query: query.substring(0, 200),
        table,
      });
      Sentry.captureException(error);
    });
  }

  // Track upload errors
  static trackUploadError(fileName: string, error: Error, projectId?: string) {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "upload");
      scope.setContext("upload", {
        fileName,
        projectId,
      });
      Sentry.captureException(error);
    });
  }

  // Track authentication errors
  static trackAuthError(error: Error, userId?: string) {
    Sentry.withScope((scope) => {
      scope.setTag("error_type", "auth");
      scope.setContext("auth", {
        userId,
      });
      Sentry.captureException(error);
    });
  }
}

// User experience monitoring
export class UXMonitor {
  // Track page load times
  static trackPageLoad(page: string, loadTime: number) {
    Sentry.addBreadcrumb({
      message: `Page Load: ${page}`,
      category: "navigation",
      data: {
        page,
        loadTime,
      },
      level: loadTime > 3000 ? "warning" : "info",
    });

    if (loadTime > 5000) {
      Sentry.captureMessage(`Slow page load: ${page} took ${loadTime}ms`, "warning");
    }
  }

  // Track component render times
  static trackComponentRender(component: string, renderTime: number) {
    if (renderTime > 100) {
      Sentry.addBreadcrumb({
        message: `Slow render: ${component}`,
        category: "performance",
        data: {
          component,
          renderTime,
        },
        level: "warning",
      });
    }
  }

  // Track user session metrics
  static trackSessionMetrics(sessionData: {
    duration: number;
    pageViews: number;
    actions: number;
    errors: number;
  }) {
    Sentry.addBreadcrumb({
      message: "Session Metrics",
      category: "session",
      data: sessionData,
      level: "info",
    });
  }
}

// Business metrics tracking
export class BusinessMetrics {
  // Track project creation
  static trackProjectCreation(userId: string, projectId: string) {
    Sentry.addBreadcrumb({
      message: "Project Created",
      category: "business",
      data: {
        userId,
        projectId,
      },
      level: "info",
    });
  }

  // Track image uploads
  static trackImageUpload(userId: string, projectId: string, fileSize: number) {
    Sentry.addBreadcrumb({
      message: "Image Uploaded",
      category: "business",
      data: {
        userId,
        projectId,
        fileSize,
      },
      level: "info",
    });
  }

  // Track QR code scans
  static trackQRCodeScan(projectId: string, codeType: "single" | "collection") {
    Sentry.addBreadcrumb({
      message: "QR Code Scanned",
      category: "business",
      data: {
        projectId,
        codeType,
      },
      level: "info",
    });
  }

  // Track website mode usage
  static trackWebsiteModeUsage(projectId: string, subdomain: string, action: string) {
    Sentry.addBreadcrumb({
      message: `Website Mode: ${action}`,
      category: "business",
      data: {
        projectId,
        subdomain,
        action,
      },
      level: "info",
    });
  }
}

// Health check utilities
export class HealthMonitor {
  // Check database connectivity
  static async checkDatabaseHealth(): Promise<{ status: "healthy" | "unhealthy"; latency: number }> {
    const start = Date.now();
    try {
      // This would be implemented with your actual database check
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 10));
      const latency = Date.now() - start;
      
      return {
        status: "healthy",
        latency,
      };
    } catch (error) {
      const latency = Date.now() - start;
      Sentry.captureException(error);
      return {
        status: "unhealthy",
        latency,
      };
    }
  }

  // Check storage connectivity
  static async checkStorageHealth(): Promise<{ status: "healthy" | "unhealthy"; latency: number }> {
    const start = Date.now();
    try {
      // This would be implemented with your actual storage check
      await new Promise(resolve => setTimeout(resolve, 15));
      const latency = Date.now() - start;
      
      return {
        status: "healthy",
        latency,
      };
    } catch (error) {
      const latency = Date.now() - start;
      Sentry.captureException(error);
      return {
        status: "unhealthy",
        latency,
      };
    }
  }

  // Comprehensive health check
  static async runHealthCheck() {
    const [dbHealth, storageHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkStorageHealth(),
    ]);

    const overallHealth = dbHealth.status === "healthy" && storageHealth.status === "healthy" 
      ? "healthy" 
      : "unhealthy";

    Sentry.addBreadcrumb({
      message: "Health Check",
      category: "health",
      data: {
        overall: overallHealth,
        database: dbHealth,
        storage: storageHealth,
      },
      level: overallHealth === "healthy" ? "info" : "error",
    });

    return {
      status: overallHealth,
      database: dbHealth,
      storage: storageHealth,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export all monitoring utilities
export {
  Sentry,
};
