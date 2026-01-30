#!/bin/bash
# Deploy GPTI XT Site to GitHub and Netlify

echo "🚀 Deploying GPTI XT Site..."

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote repository configured"
    echo "Please create a repository on GitHub first, then run:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/gtixt-site.git"
    echo "git push -u origin main"
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Site deployed to GitHub!"
echo "🌐 Connect your GitHub repo to Netlify for automatic deployment"
echo "   - Go to https://app.netlify.com/"
echo "   - New site from Git"
echo "   - Select your gtixt-site repository"
echo "   - Build command: npm run build"
echo "   - Publish directory: out"
echo "   - Deploy!"