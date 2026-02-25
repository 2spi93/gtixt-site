#!/usr/bin/env bash
set -e

# Kill any existing Next.js processes
echo "Stopping any existing Next.js processes..."
pkill -9 -f next-server || true
pkill -9 npm || true
fuser -k 3000/tcp || true
sleep 3

# Set environment variables
export SNAPSHOT_LATEST_URL="http://localhost:9002/gpti-snapshots/universe_v0.1_public/_public/latest.json"
export MINIO_INTERNAL_ROOT="http://localhost:9002/gpti-snapshots/"
export MINIO_INTERNAL_ENDPOINT="http://localhost:9002"
export NEXT_PUBLIC_FIRM_CACHE_TTL_MS=60000
export NEXT_PUBLIC_DISABLE_EVIDENCE_EXTRACT=0

echo "Starting Next.js with environment variables..."
echo "  SNAPSHOT_LATEST_URL=$SNAPSHOT_LATEST_URL"
echo "  MINIO_INTERNAL_ROOT=$MINIO_INTERNAL_ROOT"

cd /opt/gpti/gpti-site
npm run start
