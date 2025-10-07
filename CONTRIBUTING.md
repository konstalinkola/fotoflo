# Contributing to Fotoflo

Welcome to the Fotoflo project! This guide will help you get started with contributing to our codebase.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- A Supabase account (for development)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kuvapalvelin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in the required environment variables (see [Environment Setup](#environment-setup))

4. **Set up the database**
   - Run the SQL in `supabase.sql` in your Supabase project
   - Create a storage bucket in Supabase

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   │   ├── projects/      # Project-related endpoints
│   │   ├── desktop-sync/  # Desktop sync functionality
│   │   └── auth/          # Authentication endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── project/           # Project-specific pages
│   └── public/            # Public sharing pages
├── components/            # Reusable UI components
│   ├── ui/               # Design system components (shadcn/ui)
│   └── [feature].tsx     # Feature-specific components
├── lib/                  # Utilities and services
│   ├── supabase/         # Supabase client configurations
│   ├── validation.ts     # Input validation utilities
│   ├── error-handler.ts  # Error handling utilities
│   └── [service].ts      # Other service utilities
└── hooks/                # Custom React hooks
```

## 🛠️ Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the project's ESLint configuration
- **Naming**: Use descriptive, camelCase names for variables and functions
- **Components**: Use PascalCase for component names

### Component Guidelines

```typescript
/**
 * Example component with proper JSDoc documentation
 * @param props - Component props
 * @param props.title - The title to display
 * @param props.onClick - Callback function for click events
 * @returns JSX element
 */
interface ExampleProps {
  title: string;
  onClick: () => void;
}

export default function Example({ title, onClick }: ExampleProps) {
  return (
    <button onClick={onClick}>
      {title}
    </button>
  );
}
```

### API Route Guidelines

```typescript
/**
 * Example API route with proper error handling
 * @param request - Next.js request object
 * @param params - Route parameters
 * @returns JSON response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Validate request size
    const sizeCheck = checkRequestSize(request);
    if (!sizeCheck.allowed) {
      return NextResponse.json(
        { error: sizeCheck.error },
        { status: 413 }
      );
    }

    // Your logic here
    const result = await processRequest(request);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, '/api/example');
  }
}
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BETA_ACCESS_PASSWORD=your_beta_password

# Optional: Redis (for caching)
REDIS_URL=your_redis_url

# Optional: Sentry (for error tracking)
SENTRY_DSN=your_sentry_dsn
```

### Development vs Production

- **Development**: Uses `.env.local` with local Supabase project
- **Production**: Uses Vercel environment variables

Switch environments:
```bash
npm run dev:setup    # Switch to development
npm run prod:setup   # Switch to production
```

## 🧪 Testing

### Running Tests
```bash
# Lint code
npm run lint

# Test API endpoints
npm run test:health
npm run test:baseline
npm run test:cache
```

### Testing Desktop Sync
```bash
# Start sync service
npm run sync:start

# Start both dev server and sync
npm run sync:dev
```

## 📝 Making Changes

### Branch Naming
- `feature/add-user-management`
- `fix/upload-error-handling`
- `docs/update-readme`

### Commit Messages
Use conventional commits:
- `feat: add user authentication`
- `fix: resolve image upload bug`
- `docs: update API documentation`
- `refactor: improve error handling`

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding guidelines
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🐛 Bug Reports

When reporting bugs, include:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, Node.js version, browser)
- **Screenshots** (if applicable)

## 💡 Feature Requests

For new features:
- **Describe the problem** you're trying to solve
- **Explain your proposed solution**
- **Consider alternatives** you've thought about
- **Provide mockups** or examples if helpful

## 🔒 Security

### Security Guidelines
- **Never commit** API keys or secrets
- **Use environment variables** for sensitive data
- **Validate all inputs** on both client and server
- **Follow the principle of least privilege**

### Reporting Security Issues
- **Email**: [security contact]
- **Don't create public issues** for security vulnerabilities

## 📚 Documentation

### Adding Documentation
- **Update README.md** for setup changes
- **Add JSDoc comments** for complex functions
- **Update API documentation** for new endpoints
- **Create migration guides** for breaking changes

### Code Documentation Standards
```typescript
/**
 * Processes uploaded images and extracts metadata
 * @param files - Array of uploaded files
 * @param projectId - Target project ID
 * @param options - Processing options
 * @returns Promise resolving to processed image data
 * @throws {ValidationError} When files are invalid
 * @example
 * ```typescript
 * const images = await processImages(files, 'project-123', {
 *   extractExif: true,
 *   generateThumbnails: true
 * });
 * ```
 */
async function processImages(
  files: File[],
  projectId: string,
  options: ProcessOptions
): Promise<ProcessedImage[]> {
  // Implementation
}
```

## 🚀 Deployment

### Development Deployment
- **Local**: `npm run dev`
- **Preview**: Push to feature branch (auto-deploys to Vercel)

### Production Deployment
- **Automatic**: Push to main branch
- **Manual**: Deploy from Vercel dashboard

## 🤝 Code Review

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling implemented

### Review Process
1. **Self-review** your changes
2. **Request review** from team members
3. **Address feedback** promptly
4. **Merge** after approval

## 📞 Getting Help

- **Documentation**: Check this file and README.md
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions for questions
- **Team Chat**: [Add your team communication channel]

## 🎯 Roadmap

See [ROADMAP.md](./ROADMAP.md) for current development priorities and future plans.

---

**Thank you for contributing to Fotoflo!** 🎉

*Last updated: January 2025*
