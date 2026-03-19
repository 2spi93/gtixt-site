#!/bin/bash
# Deploy GPTI XT Site on VPS (PM2 / npm start)

set -e

echo "🚀 Deploying GPTI XT Site on VPS..."

# Install dependencies
if [ -f package.json ]; then
	echo "📦 Installing dependencies..."
	npm install --prefer-offline --no-audit
fi

# Build Next.js
echo "🔨 Building Next.js app..."
npm run build

# Restart Next.js
echo "🔄 Restarting Next.js..."
if command -v pm2 >/dev/null 2>&1; then
	if pm2 describe gpti-site >/dev/null 2>&1; then
		pm2 restart gpti-site --update-env
		echo "✅ PM2 service 'gpti-site' restarted"
	elif pm2 describe next >/dev/null 2>&1; then
		pm2 restart next --update-env
		echo "✅ Legacy PM2 service 'next' restarted"
	else
		pm2 start ecosystem.config.js --only gpti-site --env production || pm2 start npm --name gpti-site -- run start
		echo "✅ PM2 service 'gpti-site' started"
	fi
else
	pkill -f "next start" || true
	nohup npm run start > /tmp/nextjs-prod.log 2>&1 &
	echo "✅ npm start launched (logs: /tmp/nextjs-prod.log)"
fi