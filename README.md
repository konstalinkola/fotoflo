# Kuvapalvelin (MVP)

Next.js + Supabase + Google Drive. Shows a QR code that always points to the latest image in a connected Drive folder.

## Stack
- Next.js (App Router, Tailwind)
- Supabase (DB + Auth)
- Google Drive API
- qrcode.react

## Setup
1. Copy env:
```
cp .env.local.example .env.local
```
Fill:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL (e.g. http://localhost:3000)
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI (http://localhost:3000/api/google/callback)

2. Database (projects table):
Run the SQL in `supabase.sql` in your Supabase project (SQL Editor).

3. Install deps and run:
```
npm install
npm run dev
```

## Auth
- Sign in at /login (Supabase Auth with Google)
- Protected pages under /dashboard

## Projects
- Create at `/project/new` (name, branding, Drive folder ID)
- Connect Google Drive: open `/api/projects/<projectId>/google/connect` to grant Drive read-only access. This stores a refresh token on the project.

## Public QR
- Public page at `/public/<projectId>` polls `/api/projects/<projectId>/latest` for the latest image URL.

## Notes
- Replace demo placeholder image by connecting Google Drive and providing a valid folder ID. The API route will use the refresh token to list files and return the newest image link.
