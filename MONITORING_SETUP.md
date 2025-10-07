# Monitoring Setup Guide

This guide will help you set up comprehensive monitoring for Kuvapalvelin using Sentry and Vercel Analytics.

## 1. Sentry Setup

### Step 1: Create Sentry Account
1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for "Kuvapalvelin"
3. Choose "Next.js" as the platform
4. Copy your DSN (Data Source Name)

### Step 2: Environment Variables
Add these environment variables to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Step 3: Install Dependencies
Run the following command to install Sentry:

```bash
npm install @sentry/nextjs
```

### Step 4: Initialize Sentry
The Sentry configuration files have been created:
- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration

### Step 5: Update Next.js Configuration
Add Sentry to your `next.config.ts`:

```typescript
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  // Your existing configuration
};

export default withSentryConfig(nextConfig, {
  // Sentry configuration options
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
```

## 2. Vercel Analytics Setup

### Step 1: Enable Vercel Analytics
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to the "Analytics" tab
4. Enable "Web Analytics"

### Step 2: Install Vercel Analytics
```bash
npm install @vercel/analytics
```

### Step 3: Add Analytics to Your App
Update your `src/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 3. Monitoring Features

### Performance Monitoring
The monitoring system tracks:
- API response times
- Database query performance
- File upload performance
- Page load times
- Component render times

### Error Tracking
Automatic error tracking for:
- API errors
- Database errors
- Upload errors
- Authentication errors
- Client-side JavaScript errors

### Business Metrics
Track important business metrics:
- Project creation
- Image uploads
- QR code scans
- Website mode usage
- User sessions

### Health Monitoring
Comprehensive health checks:
- Database connectivity
- Storage connectivity
- API endpoint health
- Overall system status

## 4. Usage Examples

### Track API Performance
```typescript
import { PerformanceMonitor } from '@/lib/monitoring';

// In your API route
const start = Date.now();
// ... your API logic
const duration = Date.now() - start;
PerformanceMonitor.trackApiCall('/api/projects', duration, 200);
```

### Track Errors
```typescript
import { ErrorTracker } from '@/lib/monitoring';

try {
  // Your code
} catch (error) {
  ErrorTracker.trackApiError('/api/upload', error, 500);
  throw error;
}
```

### Track Business Metrics
```typescript
import { BusinessMetrics } from '@/lib/monitoring';

// When a project is created
BusinessMetrics.trackProjectCreation(userId, projectId);

// When an image is uploaded
BusinessMetrics.trackImageUpload(userId, projectId, fileSize);

// When a QR code is scanned
BusinessMetrics.trackQRCodeScan(projectId, 'single');
```

## 5. Monitoring Dashboard

### Health Check Endpoint
Access your health check at: `/api/monitoring/health`

This endpoint returns:
- Overall system health
- Database connectivity
- Storage connectivity
- Performance metrics
- Timestamp

### Sentry Dashboard
1. Go to your Sentry project dashboard
2. View errors, performance, and user feedback
3. Set up alerts for critical issues
4. Monitor release health

### Vercel Analytics
1. Go to your Vercel dashboard
2. Navigate to the Analytics tab
3. View page views, unique visitors, and performance metrics
4. Monitor Core Web Vitals

## 6. Alerts and Notifications

### Sentry Alerts
Set up alerts for:
- New errors
- Performance degradation
- High error rates
- Slow API responses

### Health Check Alerts
Monitor the health check endpoint:
- Set up uptime monitoring
- Alert on health check failures
- Monitor response times

## 7. Best Practices

### Performance Monitoring
- Track all API endpoints
- Monitor database query performance
- Set up alerts for slow responses
- Regularly review performance metrics

### Error Tracking
- Categorize errors by type
- Set up alerts for critical errors
- Regularly review error trends
- Fix high-frequency errors first

### Business Metrics
- Track key user actions
- Monitor conversion rates
- Analyze user behavior
- Use metrics to guide product decisions

## 8. Maintenance

### Regular Tasks
- Review error reports weekly
- Analyze performance trends monthly
- Update monitoring configuration as needed
- Clean up old metrics and logs

### Optimization
- Use monitoring data to identify bottlenecks
- Optimize slow queries and API endpoints
- Improve user experience based on metrics
- Scale infrastructure based on usage patterns

## 9. Troubleshooting

### Common Issues
1. **Sentry not capturing errors**: Check DSN configuration
2. **Performance metrics missing**: Verify monitoring integration
3. **Health check failing**: Check database and storage connectivity
4. **High error rates**: Review recent deployments and changes

### Support
- Sentry documentation: https://docs.sentry.io
- Vercel Analytics docs: https://vercel.com/docs/analytics
- Monitoring library documentation in `/src/lib/monitoring.ts`

## 10. Next Steps

After setting up monitoring:
1. Run the database migration: `performance_optimization_migration.sql`
2. Install dependencies: `npm install`
3. Set up environment variables
4. Deploy and test monitoring
5. Set up alerts and notifications
6. Start tracking performance and errors
