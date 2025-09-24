# Kuvapalvelin (MVP)

Next.js + Supabase. Shows a QR code that always points to the latest image in a Supabase Storage bucket path.

## Stack
- Next.js (App Router, Tailwind)
- Supabase (DB + Auth + Storage)
- qrcode.react

## Setup
1. Env:
```
cp .env.local.example .env.local
```
Fill:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL (e.g. http://localhost:3000)

2. Database (projects table):
Run the SQL in `supabase.sql` in your Supabase project (SQL Editor).

3. Create a bucket
- In Supabase Storage, create a bucket (e.g., `photos`). Public or private both work; private uses signed URLs.

4. Install deps and run:
```
npm install
npm run dev
```

## Auth
- Sign in at /login (Supabase Auth with Google)
- Protected pages under /dashboard

## Projects
- Create at `/project/new` with:
  - Name, branding
  - Storage bucket (e.g. `photos`)
  - Storage prefix (e.g. `project_123/`)
- Upload photos into that bucket path. The newest file becomes the QR target.

## Public QR
- Public page at `/public/<projectId>` polls `/api/projects/<projectId>/latest` and returns a signed URL (1h) for the newest file in the configured bucket/prefix.

## Notes
- If your bucket is public, you can serve public URLs instead of signed URLs.
- For automated uploads, you can use tools like `rclone` to sync a local folder to your Supabase bucket path.
