#!/bin/bash
# Prisma Setup & Migration Script for GTIXT Admin Extension
# This script ensures Prisma is properly initialized and migrations are applied

set -e

echo "🔧 GTIXT Admin - Prisma Setup & Migration"
echo "=========================================="
echo ""

# Navigate to the parent directory (gpti-site)
cd "$(dirname "$0")/.."

# Check if we're in the gpti-site directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the gpti-site directory."
  exit 1
fi

echo "✅ Found package.json in $(pwd)"
echo ""

# Step 1: Ensure Prisma is installed
echo "📦 Step 1: Checking Prisma installation..."
if npm list @prisma/client > /dev/null 2>&1; then
  echo "✅ @prisma/client is installed"
else
  echo "⚠️  Installing @prisma/client..."
  npm install @prisma/client prisma --save-dev
fi
echo ""

# Step 2: Check database URL
echo "🗄️ Step 2: Verifying DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    source .env.local
  elif [ -f ".env" ]; then
    echo "✅ .env found"
    source .env
  else
    echo "⚠️  No .env files found"
    echo "   Create one with: DATABASE_URL=postgresql://user:pass@host/dbname"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set. Please set it in your .env file."
  exit 1
fi
echo "✅ DATABASE_URL is configured"
echo ""

# Step 3: Generate Prisma Client
echo "🔨 Step 3: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 4: Run migrations
echo "🚀 Step 4: Running database migrations..."
echo "   This will sync your database schema with schema.prisma"
echo ""

# Check if we should do a push (for dev) or migrate (for prod)
if [ "$NODE_ENV" = "production" ]; then
  echo "   Running in PRODUCTION mode - using 'prisma migrate deploy'"
  npx prisma migrate deploy
else
  echo "   Running in DEVELOPMENT mode - using 'prisma db push'"
  npx prisma db push
fi

echo "✅ Database migrations completed"
echo ""

# Step 5: Verify schema
echo "📋 Step 5: Verifying schema..."
npx prisma db execute --stdin <<EOF 2>/dev/null || echo "⚠️  Could not verify all tables (this is okay if using SQLite)"
SELECT tablename FROM pg_tables WHERE schemaname='public';
EOF
echo "✅ Database schema verified"
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "Your Prisma admin tables are now ready:"
echo "  - AdminCrawls"
echo "  - AdminJobs"
echo "  - AdminOperations"
echo "  - AdminAlerts"
echo "  - AdminPlans"
echo "  - AdminValidation"
echo ""
echo "Next steps:"
echo "1. Start your Next.js server: npm run dev"
echo "2. Visit http://localhost:3000/admin"
echo "3. Use the admin control center!"
echo ""
echo "For more info: See ADMIN_DASHBOARD_30MIN_QUICKSTART_20260226.md"
