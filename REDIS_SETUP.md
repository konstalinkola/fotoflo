# Redis Caching Setup Guide

This guide will help you set up Redis caching for Kuvapalvelin to improve performance and reduce database load.

## 1. Redis Setup Options

### Option A: Redis Cloud (Recommended for Production)
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free account
3. Create a new database
4. Copy the connection URL

### Option B: Local Redis (Development)
1. Install Redis locally:
   ```bash
   # macOS
   brew install redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # Windows
   # Use WSL or Docker
   ```

2. Start Redis:
   ```bash
   redis-server
   ```

### Option C: Docker Redis (Development)
1. Run Redis in Docker:
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

## 2. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# Or for Redis Cloud:
# REDIS_URL=redis://username:password@host:port
```

## 3. Install Dependencies

Run the following command to install Redis:

```bash
npm install redis
```

## 4. Cache Configuration

The Redis caching system is configured with the following cache types:

### Cache Types and TTL
- **Project Settings**: 1 hour (frequently accessed)
- **Access Codes**: 30 minutes (public, high traffic)
- **Sync Status**: 5 minutes (real-time updates)
- **Website Settings**: 2 hours (public, longer TTL)
- **Dashboard Stats**: 10 minutes (expensive queries)
- **Image Metadata**: 30 minutes (frequently accessed)
- **Collection Data**: 30 minutes (frequently accessed)
- **User Session**: 24 hours (longer TTL)
- **QR Code URLs**: 5 minutes (real-time updates)
- **Signed URLs**: 30 minutes (security)

## 5. Usage Examples

### Basic Caching
```typescript
import { CacheManager } from '@/lib/redis';

// Get cached value
const cachedData = await CacheManager.get('my-key');

// Set cached value
await CacheManager.set('my-key', data, 3600); // 1 hour TTL
```

### Cache Keys
```typescript
import { CacheKeys } from '@/lib/redis';

// Generate cache keys
const projectKey = CacheKeys.projectSettings(projectId);
const accessCodeKey = CacheKeys.accessCode(code);
const syncStatusKey = CacheKeys.syncStatus(projectId);
```

### Cache Invalidation
```typescript
import { CacheInvalidation } from '@/lib/redis';

// Invalidate project-related cache
await CacheInvalidation.invalidateProject(projectId);

// Invalidate user-related cache
await CacheInvalidation.invalidateUser(userId);
```

### Cache Decorator
```typescript
import { cached } from '@/lib/redis';

class MyService {
  @cached('user:{0}:data', 3600)
  async getUserData(userId: string) {
    // Expensive operation
    return await fetchUserData(userId);
  }
}
```

## 6. API Integration

### Cache Stats Endpoint
Get cache statistics at: `/api/cache/stats`

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "cache": {
    "connected": true,
    "memory": {
      "used_memory": "1048576",
      "used_memory_human": "1.00M"
    },
    "keys": 42
  }
}
```

### Cache Invalidation Endpoint
Invalidate cache at: `/api/cache/invalidate`

Request:
```json
{
  "type": "project",
  "id": "project-id"
}
```

Supported types:
- `project` - Invalidate project-related cache
- `user` - Invalidate user-related cache
- `image` - Invalidate image-related cache
- `collection` - Invalidate collection-related cache
- `website` - Invalidate website-related cache
- `all` - Clear all cache (use with caution)

## 7. Integration with Existing APIs

### Project Settings API
```typescript
// In your API route
import { CacheManager, CacheKeys } from '@/lib/redis';

export async function GET(request: Request, { params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const cacheKey = CacheKeys.projectSettings(projectId);
  
  // Try to get from cache
  const cached = await CacheManager.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // Fetch from database
  const data = await fetchProjectSettings(projectId);
  
  // Cache the result
  await CacheManager.set(cacheKey, data, 3600);
  
  return NextResponse.json(data);
}
```

### Image Upload API
```typescript
// In your upload API route
import { CacheInvalidation } from '@/lib/redis';

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  // ... upload logic ...
  
  // Invalidate project cache after upload
  await CacheInvalidation.invalidateProject(projectId);
  
  return NextResponse.json({ success: true });
}
```

## 8. Performance Monitoring

### Cache Hit Rate
Monitor cache hit rates to ensure effective caching:

```typescript
import { CacheManager } from '@/lib/redis';

// Track cache hits and misses
let cacheHits = 0;
let cacheMisses = 0;

const cached = await CacheManager.get(key);
if (cached) {
  cacheHits++;
} else {
  cacheMisses++;
}

const hitRate = cacheHits / (cacheHits + cacheMisses);
```

### Cache Performance
Monitor cache performance:

```typescript
// Measure cache operation time
const start = Date.now();
await CacheManager.get(key);
const duration = Date.now() - start;
```

## 9. Best Practices

### Cache Keys
- Use consistent naming conventions
- Include relevant identifiers
- Avoid collisions between different data types

### TTL Strategy
- Short TTL for frequently changing data
- Longer TTL for stable data
- Consider data freshness requirements

### Cache Invalidation
- Invalidate cache when data changes
- Use batch invalidation for related data
- Consider cache warming for critical data

### Error Handling
- Always handle cache failures gracefully
- Fall back to database when cache is unavailable
- Log cache errors for monitoring

## 10. Troubleshooting

### Common Issues
1. **Redis connection failed**: Check REDIS_URL and Redis server status
2. **Cache not working**: Verify cache keys and TTL settings
3. **Memory usage high**: Monitor cache size and implement eviction policies
4. **Slow cache operations**: Check Redis server performance

### Debugging
```typescript
// Enable Redis debug logging
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Redis reconnect attempt ${retries}`);
      return Math.min(retries * 50, 500);
    },
  },
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connected'));
```

## 11. Production Considerations

### Redis Cloud Setup
1. Choose appropriate Redis Cloud plan
2. Configure backup and persistence
3. Set up monitoring and alerts
4. Configure security settings

### Performance Optimization
1. Use Redis pipelines for batch operations
2. Implement cache warming for critical data
3. Monitor memory usage and implement eviction policies
4. Use Redis clustering for high availability

### Security
1. Use Redis AUTH for authentication
2. Configure firewall rules
3. Use TLS for encrypted connections
4. Regularly update Redis version

## 12. Next Steps

After setting up Redis:
1. Run the database migration: `performance_optimization_migration.sql`
2. Install dependencies: `npm install`
3. Set up environment variables
4. Test cache functionality
5. Monitor cache performance
6. Optimize cache strategies based on usage patterns
