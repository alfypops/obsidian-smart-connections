#!/bin/bash

# Smart Connections Fork Release Creator
# Creates a git tag and triggers GitHub Actions to build and publish a release

set -e

# Get version from manifest.json
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ Error: dist/manifest.json not found. Please build the project first."
    echo "   Run: npm run build"
    exit 1
fi

VERSION=$(cat dist/manifest.json | grep '"version"' | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
    echo "❌ Error: Could not extract version from manifest.json"
    exit 1
fi

echo "📦 Creating release for Smart Connections Fork v$VERSION"

# Check if tag already exists
if git tag --list | grep -q "^v$VERSION$"; then
    echo "❌ Error: Tag v$VERSION already exists"
    echo "   Update the version in dist/manifest.json or delete the existing tag"
    exit 1
fi

# Make sure we're on the right branch and have latest changes
echo "🔄 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Create and push tag
echo "🏷️  Creating tag v$VERSION..."
git tag -a "v$VERSION" -m "Release Smart Connections Fork v$VERSION"

echo "📤 Pushing tag to GitHub..."
git push origin "v$VERSION"

echo "✅ Release tag created and pushed!"
echo ""
echo "🚀 GitHub Actions will now build and publish the release."
echo "   Check the Actions tab at: https://github.com/alfypops/obsidian-smart-connections/actions"
echo ""
echo "📦 The release will be available at:"
echo "   https://github.com/alfypops/obsidian-smart-connections/releases/tag/v$VERSION"