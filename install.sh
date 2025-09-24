#!/bin/bash

# Smart Connections Fork Installer
# Installs the Smart Connections fork with MCP integration into Obsidian

set -e

PLUGIN_ID="smart-connections"
PLUGIN_DIR=".obsidian/plugins/$PLUGIN_ID"
REPO_URL="https://api.github.com/repos/alfypops/obsidian-smart-connections"
DOWNLOAD_URL="https://github.com/alfypops/obsidian-smart-connections"

echo "🚀 Installing Smart Connections Fork with MCP Integration..."

# Check if we're in an Obsidian vault
if [ ! -d ".obsidian" ]; then
    echo "❌ Error: This doesn't appear to be an Obsidian vault directory."
    echo "   Please run this script from your Obsidian vault root directory."
    exit 1
fi

# Create plugin directory
echo "📁 Creating plugin directory..."
mkdir -p "$PLUGIN_DIR"

# Get latest release info
echo "🔍 Fetching latest release..."
LATEST_RELEASE=$(curl -s "$REPO_URL/releases/latest")

if echo "$LATEST_RELEASE" | grep -q "Not Found"; then
    echo "⚠️  No releases found, downloading from main branch..."

    # Download files directly from main branch
    echo "📥 Downloading plugin files..."
    curl -fsSL "$DOWNLOAD_URL/raw/main/dist/main.js" -o "$PLUGIN_DIR/main.js"
    curl -fsSL "$DOWNLOAD_URL/raw/main/dist/styles.css" -o "$PLUGIN_DIR/styles.css"
    curl -fsSL "$DOWNLOAD_URL/raw/main/dist/manifest.json" -o "$PLUGIN_DIR/manifest.json"
else
    # Get download URL from latest release
    DOWNLOAD_BASE=$(echo "$LATEST_RELEASE" | grep -o '"browser_download_url": *"[^"]*"' | head -1 | cut -d'"' -f4 | sed 's|/[^/]*$||')

    if [ -z "$DOWNLOAD_BASE" ]; then
        echo "⚠️  Release assets not found, downloading from main branch..."
        curl -fsSL "$DOWNLOAD_URL/raw/main/dist/main.js" -o "$PLUGIN_DIR/main.js"
        curl -fsSL "$DOWNLOAD_URL/raw/main/dist/styles.css" -o "$PLUGIN_DIR/styles.css"
        curl -fsSL "$DOWNLOAD_URL/raw/main/dist/manifest.json" -o "$PLUGIN_DIR/manifest.json"
    else
        echo "📥 Downloading from latest release..."
        curl -fsSL "$DOWNLOAD_BASE/main.js" -o "$PLUGIN_DIR/main.js"
        curl -fsSL "$DOWNLOAD_BASE/styles.css" -o "$PLUGIN_DIR/styles.css"
        curl -fsSL "$DOWNLOAD_BASE/manifest.json" -o "$PLUGIN_DIR/manifest.json"
    fi
fi

# Verify files were downloaded
if [ ! -f "$PLUGIN_DIR/main.js" ] || [ ! -f "$PLUGIN_DIR/manifest.json" ]; then
    echo "❌ Error: Failed to download required plugin files."
    exit 1
fi

echo "✅ Smart Connections Fork installed successfully!"
echo ""
echo "Next steps:"
echo "1. Open Obsidian"
echo "2. Go to Settings → Community Plugins"
echo "3. Make sure 'Safe mode' is turned OFF"
echo "4. Find 'Smart Connections' in your installed plugins list"
echo "5. Enable the plugin"
echo ""
echo "🎉 You now have Smart Connections with MCP integration!"
echo "   The MCP server will be available for Claude Code and other MCP clients."