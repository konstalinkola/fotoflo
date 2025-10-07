#!/bin/bash

# Fotoflo Auto Upload Environment Setup Script
# This script helps you set up the required environment variables

echo "🚀 Setting up Fotoflo Auto Upload Environment"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local template
cat > .env.local << 'EOF'
# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Example:
# NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

echo "✅ Created .env.local template"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local and add your Supabase credentials:"
echo "   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key"
echo ""
echo "2. Run the database migration:"
echo "   node setup_auto_upload.js --migrate"
echo ""
echo "3. Start your development server:"
echo "   npm run dev"
echo ""
echo "4. Navigate to a project settings page to test Auto Upload"
echo ""
echo "🔗 Get your Supabase credentials from: https://supabase.com/dashboard"
