# Fotoflo Development Guide

Quick start guide for developers working on the Fotoflo project.

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone and setup
git clone <repository-url>
cd kuvapalvelin
npm install

# 2. Environment setup
cp .env.local.example .env.local
# Fill in your Supabase credentials

# 3. Start development
npm run dev
```

**That's it!** Your development server will be running at `http://localhost:3000`

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ • React Components │ │ • File Upload   │    │ • PostgreSQL    │
│ • Tailwind CSS  │    │ • Authentication│    │ • Row Level     │
│ • shadcn/ui     │    │ • Validation    │    │   Security      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/app/` | Next.js App Router | Pages and API routes |
| `src/components/` | React components | `FileUpload.tsx`, `ImageGallery.tsx` |
| `src/lib/` | Utilities | `validation.ts`, `error-handler.ts` |
| `src/hooks/` | Custom React hooks | `useRealTimeUpdates.ts` |

## 🔧 Common Tasks

### Adding a New API Endpoint
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, '/api/example');
  }
}
```

### Creating a New Component
```typescript
// src/components/NewComponent.tsx
"use client";

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export default function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### Adding Validation
```typescript
// Use existing validation functions
import { validateProjectName, sanitizeFileName } from "@/lib/validation";

const validName = validateProjectName(userInput);
const safeFileName = sanitizeFileName(file.name);
```

## 🛠️ Development Tools

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run sync:start   # Start desktop sync service
```

### Environment Variables
```bash
# Required for development
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional
REDIS_URL=your_redis_url
SENTRY_DSN=your_sentry_dsn
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] **Authentication**: Login/logout works
- [ ] **File Upload**: Drag & drop and click upload
- [ ] **Project Creation**: Can create new projects
- [ ] **Public Pages**: QR codes work correctly
- [ ] **Desktop Sync**: Folder synchronization works

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/api/monitoring/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/projects
```

## 🐛 Common Issues

### "Module not found" errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Supabase connection issues
- Check environment variables in `.env.local`
- Verify Supabase project is active
- Check network connectivity

### TypeScript errors
```bash
# Run type checking
npx tsc --noEmit
```

## 📚 Key Concepts

### Authentication Flow
1. User logs in via Google OAuth
2. Supabase creates session
3. Middleware validates session
4. API routes check authentication

### File Upload Process
1. Client uploads file to `/api/projects/[id]/upload`
2. Server validates file type and size
3. EXIF data is extracted
4. File is stored in Supabase Storage
5. Database record is created

### Real-time Updates
- Uses Server-Sent Events (SSE)
- Client connects to `/api/projects/[id]/events`
- Server broadcasts updates to connected clients

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: XSS and injection prevention
- **File Validation**: Type and size checking
- **Authentication**: Supabase RLS policies
- **CORS**: Configured for allowed origins

## 📊 Performance

### Optimization Features
- **Image Optimization**: Next.js automatic optimization
- **Caching**: Redis for frequently accessed data
- **Database Indexes**: Optimized queries
- **CDN**: Vercel's global edge network

### Monitoring
- **Error Tracking**: Sentry integration
- **Performance**: Built-in Next.js analytics
- **Health Checks**: `/api/monitoring/health`

## 🚀 Deployment

### Development → Production
1. Push to main branch
2. Vercel automatically deploys
3. Environment variables are set in Vercel dashboard
4. Domain is configured

### Rollback Process
1. Revert commit in main branch
2. Vercel automatically redeploys previous version

## 💡 Tips for New Developers

1. **Start Small**: Begin with UI components before API routes
2. **Follow Patterns**: Look at existing code for consistency
3. **Test Locally**: Always test changes before pushing
4. **Use TypeScript**: Leverage type safety for better code
5. **Ask Questions**: Team is here to help!

## 📞 Getting Help

- **Documentation**: Check `CONTRIBUTING.md` and `README.md`
- **Code Examples**: Look at existing components and API routes
- **Team Chat**: [Add your communication channel]
- **Issues**: Create GitHub issue for bugs or questions

---

**Happy coding!** 🎉

*This guide is updated regularly. Last updated: January 2025*
