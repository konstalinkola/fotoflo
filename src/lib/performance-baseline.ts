// Performance baseline measurement tool for Fotoflo
// Measures current performance metrics to establish baseline for optimization

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export interface PerformanceBaseline {
  timestamp: string;
  database: {
    connectionTime: number;
    queryTime: number;
    complexQueryTime: number;
  };
  storage: {
    listTime: number;
    signedUrlTime: number;
  };
  api: {
    projectListTime: number;
    imageListTime: number;
    dashboardLoadTime: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class PerformanceBaselineMeasurer {
  private static results: PerformanceBaseline[] = [];

  // Measure database performance
  static async measureDatabasePerformance(): Promise<{
    connectionTime: number;
    queryTime: number;
    complexQueryTime: number;
  }> {
    const supabase = await createSupabaseServerClient();
    
    // Measure connection time
    const connectionStart = Date.now();
    const { data: connectionTest } = await supabase.from('projects').select('id').limit(1);
    const connectionTime = Date.now() - connectionStart;

    // Measure simple query time
    const queryStart = Date.now();
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .limit(10);
    const queryTime = Date.now() - queryStart;

    // Measure complex query time (dashboard-like query)
    const complexQueryStart = Date.now();
    const { data: complexData } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        created_at,
        images (
          id,
          uploaded_at,
          capture_time
        ),
        collections (
          id,
          created_at,
          is_active
        )
      `)
      .limit(5);
    const complexQueryTime = Date.now() - complexQueryStart;

    return {
      connectionTime,
      queryTime,
      complexQueryTime,
    };
  }

  // Measure storage performance
  static async measureStoragePerformance(): Promise<{
    listTime: number;
    signedUrlTime: number;
  }> {
    const admin = createSupabaseServiceClient();
    
    // Measure list operation time
    const listStart = Date.now();
    const { data: buckets } = await admin.storage.listBuckets();
    const listTime = Date.now() - listStart;

    // Measure signed URL generation time
    let signedUrlTime = 0;
    if (buckets && buckets.length > 0) {
      const signedUrlStart = Date.now();
      try {
        const { data: signedUrl } = await admin.storage
          .from(buckets[0].name)
          .createSignedUrl('test-path', 3600);
        signedUrlTime = Date.now() - signedUrlStart;
      } catch (error) {
        // If test path doesn't exist, that's okay
        signedUrlTime = Date.now() - signedUrlStart;
      }
    }

    return {
      listTime,
      signedUrlTime,
    };
  }

  // Measure API performance
  static async measureAPIPerformance(): Promise<{
    projectListTime: number;
    imageListTime: number;
    dashboardLoadTime: number;
  }> {
    const supabase = await createSupabaseServerClient();
    
    // Measure project list time
    const projectListStart = Date.now();
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, created_at, display_mode')
      .order('created_at', { ascending: false })
      .limit(20);
    const projectListTime = Date.now() - projectListStart;

    // Measure image list time
    let imageListTime = 0;
    if (projects && projects.length > 0) {
      const imageListStart = Date.now();
      const { data: images } = await supabase
        .from('images')
        .select('id, file_name, uploaded_at, capture_time')
        .eq('project_id', projects[0].id)
        .order('uploaded_at', { ascending: false })
        .limit(50);
      imageListTime = Date.now() - imageListStart;
    }

    // Measure dashboard load time (simulate dashboard query)
    const dashboardStart = Date.now();
    const { data: dashboardData } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        created_at,
        display_mode,
        images (
          id,
          uploaded_at,
          capture_time,
          file_name
        ),
        collections (
          id,
          created_at,
          is_active,
          collection_number
        )
      `)
      .limit(10);
    const dashboardLoadTime = Date.now() - dashboardStart;

    return {
      projectListTime,
      imageListTime,
      dashboardLoadTime,
    };
  }

  // Measure system performance
  static async measureSystemPerformance(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
  }> {
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Get CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    return {
      memoryUsage: memoryUsageMB,
      cpuUsage: cpuUsagePercent,
    };
  }

  // Run comprehensive performance baseline
  static async runBaselineMeasurement(): Promise<PerformanceBaseline> {
    console.log('Starting performance baseline measurement...');

    const [
      databasePerformance,
      storagePerformance,
      apiPerformance,
      systemPerformance,
    ] = await Promise.all([
      this.measureDatabasePerformance(),
      this.measureStoragePerformance(),
      this.measureAPIPerformance(),
      this.measureSystemPerformance(),
    ]);

    const baseline: PerformanceBaseline = {
      timestamp: new Date().toISOString(),
      database: databasePerformance,
      storage: storagePerformance,
      api: apiPerformance,
      system: systemPerformance,
    };

    this.results.push(baseline);
    console.log('Performance baseline measurement completed:', baseline);

    return baseline;
  }

  // Run multiple measurements for statistical accuracy
  static async runMultipleMeasurements(count: number = 5): Promise<{
    average: PerformanceBaseline;
    results: PerformanceBaseline[];
    statistics: {
      database: {
        connectionTime: { avg: number; min: number; max: number };
        queryTime: { avg: number; min: number; max: number };
        complexQueryTime: { avg: number; min: number; max: number };
      };
      storage: {
        listTime: { avg: number; min: number; max: number };
        signedUrlTime: { avg: number; min: number; max: number };
      };
      api: {
        projectListTime: { avg: number; min: number; max: number };
        imageListTime: { avg: number; min: number; max: number };
        dashboardLoadTime: { avg: number; min: number; max: number };
      };
      system: {
        memoryUsage: { avg: number; min: number; max: number };
        cpuUsage: { avg: number; min: number; max: number };
      };
    };
  }> {
    console.log(`Running ${count} performance measurements...`);

    const results: PerformanceBaseline[] = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`Measurement ${i + 1}/${count}...`);
      const result = await this.runBaselineMeasurement();
      results.push(result);
      
      // Wait between measurements
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(results);
    
    // Calculate average
    const average = this.calculateAverage(results);

    console.log('Multiple measurements completed:', { average, statistics });

    return {
      average,
      results,
      statistics,
    };
  }

  // Calculate statistics from results
  private static calculateStatistics(results: PerformanceBaseline[]) {
    const database = {
      connectionTime: this.calculateMinMaxAvg(results.map(r => r.database.connectionTime)),
      queryTime: this.calculateMinMaxAvg(results.map(r => r.database.queryTime)),
      complexQueryTime: this.calculateMinMaxAvg(results.map(r => r.database.complexQueryTime)),
    };

    const storage = {
      listTime: this.calculateMinMaxAvg(results.map(r => r.storage.listTime)),
      signedUrlTime: this.calculateMinMaxAvg(results.map(r => r.storage.signedUrlTime)),
    };

    const api = {
      projectListTime: this.calculateMinMaxAvg(results.map(r => r.api.projectListTime)),
      imageListTime: this.calculateMinMaxAvg(results.map(r => r.api.imageListTime)),
      dashboardLoadTime: this.calculateMinMaxAvg(results.map(r => r.api.dashboardLoadTime)),
    };

    const system = {
      memoryUsage: this.calculateMinMaxAvg(results.map(r => r.system.memoryUsage)),
      cpuUsage: this.calculateMinMaxAvg(results.map(r => r.system.cpuUsage)),
    };

    return {
      database,
      storage,
      api,
      system,
    };
  }

  // Calculate min, max, and average
  private static calculateMinMaxAvg(values: number[]) {
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  // Calculate average baseline
  private static calculateAverage(results: PerformanceBaseline[]): PerformanceBaseline {
    return {
      timestamp: new Date().toISOString(),
      database: {
        connectionTime: results.reduce((sum, r) => sum + r.database.connectionTime, 0) / results.length,
        queryTime: results.reduce((sum, r) => sum + r.database.queryTime, 0) / results.length,
        complexQueryTime: results.reduce((sum, r) => sum + r.database.complexQueryTime, 0) / results.length,
      },
      storage: {
        listTime: results.reduce((sum, r) => sum + r.storage.listTime, 0) / results.length,
        signedUrlTime: results.reduce((sum, r) => sum + r.storage.signedUrlTime, 0) / results.length,
      },
      api: {
        projectListTime: results.reduce((sum, r) => sum + r.api.projectListTime, 0) / results.length,
        imageListTime: results.reduce((sum, r) => sum + r.api.imageListTime, 0) / results.length,
        dashboardLoadTime: results.reduce((sum, r) => sum + r.api.dashboardLoadTime, 0) / results.length,
      },
      system: {
        memoryUsage: results.reduce((sum, r) => sum + r.system.memoryUsage, 0) / results.length,
        cpuUsage: results.reduce((sum, r) => sum + r.system.cpuUsage, 0) / results.length,
      },
    };
  }

  // Get all results
  static getResults(): PerformanceBaseline[] {
    return this.results;
  }

  // Clear results
  static clearResults(): void {
    this.results = [];
  }

  // Export results to JSON
  static exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  // Compare two baselines
  static compareBaselines(baseline1: PerformanceBaseline, baseline2: PerformanceBaseline) {
    return {
      database: {
        connectionTime: this.calculateImprovement(baseline1.database.connectionTime, baseline2.database.connectionTime),
        queryTime: this.calculateImprovement(baseline1.database.queryTime, baseline2.database.queryTime),
        complexQueryTime: this.calculateImprovement(baseline1.database.complexQueryTime, baseline2.database.complexQueryTime),
      },
      storage: {
        listTime: this.calculateImprovement(baseline1.storage.listTime, baseline2.storage.listTime),
        signedUrlTime: this.calculateImprovement(baseline1.storage.signedUrlTime, baseline2.storage.signedUrlTime),
      },
      api: {
        projectListTime: this.calculateImprovement(baseline1.api.projectListTime, baseline2.api.projectListTime),
        imageListTime: this.calculateImprovement(baseline1.api.imageListTime, baseline2.api.imageListTime),
        dashboardLoadTime: this.calculateImprovement(baseline1.api.dashboardLoadTime, baseline2.api.dashboardLoadTime),
      },
      system: {
        memoryUsage: this.calculateImprovement(baseline1.system.memoryUsage, baseline2.system.memoryUsage),
        cpuUsage: this.calculateImprovement(baseline1.system.cpuUsage, baseline2.system.cpuUsage),
      },
    };
  }

  // Calculate improvement percentage
  private static calculateImprovement(before: number, after: number) {
    const improvement = ((before - after) / before) * 100;
    return {
      before,
      after,
      improvement: Math.round(improvement * 100) / 100,
      isImproved: improvement > 0,
    };
  }
}

// Export the class
export default PerformanceBaselineMeasurer;
