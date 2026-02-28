#!/bin/bash
# Quick Prisma commands for GTIXT Admin

# Make this file executable: chmod +x prisma-commands.sh

case "$1" in
  "migrate")
    echo "Running Prisma migration..."
    npx prisma db push
    ;;
  "generate")
    echo "Generating Prisma client..."
    npx prisma generate
    ;;
  "studio")
    echo "Opening Prisma Studio..."
    npx prisma studio
    ;;
  "reset")
    echo "⚠️  Resetting database (all data will be lost)..."
    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npx prisma migrate reset
    fi
    ;;
  "seed")
    echo "Seeding database with sample data..."
    npx prisma db seed
    ;;
  *)
    echo "GTIXT Prisma Admin Commands"
    echo "Usage: ./prisma-commands.sh [command]"
    echo ""
    echo "Commands:"
    echo "  migrate   - Run database migrations"
    echo "  generate  - Generate Prisma client"
    echo "  studio    - Open Prisma Studio UI"
    echo "  reset     - Reset database (destructive)"
    echo "  seed      - Seed with sample data"
    ;;
esac
