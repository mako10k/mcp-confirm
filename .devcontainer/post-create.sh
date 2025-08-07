#!/bin/bash

# Welcome message
echo "🚀 Setting up MCP Confirm development environment..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p .mcp-data

echo "✅ Setup complete! You can now:"
echo "  - Run 'npm run dev' to start development"
echo "  - Run 'npm run build' to build the project"
echo "  - Run 'npm start' to run the built project"
echo "  - Run 'npm run lint' to check code quality"
