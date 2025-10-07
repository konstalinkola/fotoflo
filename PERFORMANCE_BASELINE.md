# Performance Baseline Measurement Guide

This guide explains how to measure and establish performance baselines for Kuvapalvelin to track optimization improvements.

## 1. What is Performance Baseline?

Performance baseline is a set of metrics that represent your application's current performance before implementing optimizations. It serves as a reference point to measure the impact of performance improvements.

## 2. Baseline Metrics

The performance baseline measures:

### Database Performance
- **Connection Time**: Time to establish database connection
- **Query Time**: Time for simple database queries
- **Complex Query Time**: Time for complex queries (dashboard-like)

### Storage Performance
- **List Time**: Time to list storage buckets/files
- **Signed URL Time**: Time to generate signed URLs

### API Performance
- **Project List Time**: Time to fetch project list
- **Image List Time**: Time to fetch image list
- **Dashboard Load Time**: Time to load dashboard data

### System Performance
- **Memory Usage**: Current memory consumption
- **CPU Usage**: Current CPU utilization

## 3. Running Baseline Measurements

### Single Measurement
```bash
# Run a single baseline measurement
curl -X GET "http://localhost:3000/api/performance/baseline"
```

### Multiple Measurements (Recommended)
```bash
# Run 5 measurements for statistical accuracy
curl -X GET "http://localhost:3000/api/performance/baseline?multiple=true&count=5"
```

### Using the API
```typescript
// Run multiple measurements
const response = await fetch('/api/performance/baseline?multiple=true&count=5');
const data = await response.json();

console.log('Average performance:', data.average);
console.log('Statistics:', data.statistics);
```

## 4. API Endpoints

### GET /api/performance/baseline
Run baseline measurements.

**Query Parameters:**
- `count` (number): Number of measurements to run (default: 1)
- `multiple` (boolean): Run multiple measurements for statistics (default: false)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "measurements": 5,
  "average": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": {
      "connectionTime": 45,
      "queryTime": 120,
      "complexQueryTime": 350
    },
    "storage": {
      "listTime": 80,
      "signedUrlTime": 25
    },
    "api": {
      "projectListTime": 150,
      "imageListTime": 200,
      "dashboardLoadTime": 400
    },
    "system": {
      "memoryUsage": 128.5,
      "cpuUsage": 0.15
    }
  },
  "statistics": {
    "database": {
      "connectionTime": { "avg": 45, "min": 40, "max": 50 },
      "queryTime": { "avg": 120, "min": 110, "max": 130 },
      "complexQueryTime": { "avg": 350, "min": 320, "max": 380 }
    }
  }
}
```

### POST /api/performance/baseline
Manage baseline measurements.

**Actions:**
- `run`: Run multiple measurements
- `clear`: Clear stored results
- `export`: Export results as JSON
- `get`: Get all stored results

**Request:**
```json
{
  "action": "run",
  "count": 5
}
```

## 5. Using the Performance Baseline Tool

### Import the Tool
```typescript
import { PerformanceBaselineMeasurer } from '@/lib/performance-baseline';
```

### Run Single Measurement
```typescript
const baseline = await PerformanceBaselineMeasurer.runBaselineMeasurement();
console.log('Baseline:', baseline);
```

### Run Multiple Measurements
```typescript
const results = await PerformanceBaselineMeasurer.runMultipleMeasurements(5);
console.log('Average:', results.average);
console.log('Statistics:', results.statistics);
```

### Compare Baselines
```typescript
const baseline1 = await PerformanceBaselineMeasurer.runBaselineMeasurement();
// ... implement optimizations ...
const baseline2 = await PerformanceBaselineMeasurer.runBaselineMeasurement();

const comparison = PerformanceBaselineMeasurer.compareBaselines(baseline1, baseline2);
console.log('Improvement:', comparison);
```

## 6. Baseline Measurement Process

### Step 1: Establish Initial Baseline
1. Run multiple measurements (5-10) to get statistical accuracy
2. Record the average performance metrics
3. Save the results for future comparison

### Step 2: Implement Optimizations
1. Apply performance optimizations (caching, indexing, etc.)
2. Deploy changes to production
3. Wait for system to stabilize

### Step 3: Measure Post-Optimization
1. Run the same number of measurements
2. Compare with initial baseline
3. Calculate improvement percentages

### Step 4: Document Results
1. Record improvement metrics
2. Identify areas that need further optimization
3. Update performance targets

## 7. Performance Targets

Based on the baseline measurements, set performance targets:

### Database Performance
- **Connection Time**: < 50ms
- **Simple Query Time**: < 100ms
- **Complex Query Time**: < 500ms

### Storage Performance
- **List Time**: < 100ms
- **Signed URL Time**: < 50ms

### API Performance
- **Project List Time**: < 200ms
- **Image List Time**: < 300ms
- **Dashboard Load Time**: < 500ms

### System Performance
- **Memory Usage**: < 200MB
- **CPU Usage**: < 1.0

## 8. Monitoring Performance Over Time

### Regular Measurements
- Run baseline measurements weekly
- Track performance trends
- Identify performance degradation

### Automated Monitoring
- Set up alerts for performance degradation
- Monitor key metrics continuously
- Track optimization impact

### Performance Regression Testing
- Include performance tests in CI/CD
- Fail builds if performance degrades
- Maintain performance standards

## 9. Best Practices

### Measurement Conditions
- Run measurements under consistent conditions
- Use the same environment (dev/staging/prod)
- Measure at similar times of day
- Ensure consistent system load

### Statistical Accuracy
- Run multiple measurements (5-10)
- Calculate averages and statistics
- Consider outliers and anomalies
- Use confidence intervals

### Documentation
- Document all baseline measurements
- Record optimization changes
- Track improvement over time
- Share results with team

## 10. Troubleshooting

### Common Issues
1. **Inconsistent results**: Run more measurements, check system load
2. **Slow measurements**: Check database and storage performance
3. **Memory leaks**: Monitor memory usage over time
4. **Network issues**: Check connectivity and latency

### Debugging
```typescript
// Enable detailed logging
console.log('Starting baseline measurement...');
const baseline = await PerformanceBaselineMeasurer.runBaselineMeasurement();
console.log('Baseline completed:', baseline);
```

## 11. Integration with Monitoring

### Sentry Integration
```typescript
import { PerformanceMonitor } from '@/lib/monitoring';

// Track baseline measurements
PerformanceMonitor.trackApiCall('/api/performance/baseline', duration, 200);
```

### Cache Integration
```typescript
import { CacheManager } from '@/lib/redis';

// Cache baseline results
await CacheManager.set('performance-baseline', baseline, 3600);
```

## 12. Next Steps

After establishing baseline:
1. Run initial baseline measurements
2. Document current performance
3. Implement optimizations
4. Measure post-optimization performance
5. Compare and document improvements
6. Set up continuous monitoring
7. Track performance over time

## 13. Example Workflow

```bash
# 1. Establish initial baseline
curl -X GET "http://localhost:3000/api/performance/baseline?multiple=true&count=5" > initial-baseline.json

# 2. Implement optimizations (database indexes, caching, etc.)
# ... optimization work ...

# 3. Measure post-optimization performance
curl -X GET "http://localhost:3000/api/performance/baseline?multiple=true&count=5" > optimized-baseline.json

# 4. Compare results
# Use the comparison tool to analyze improvements
```

This baseline measurement system will help you track the impact of your performance optimizations and ensure that your application continues to perform well as it grows.
