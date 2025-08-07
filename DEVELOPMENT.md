# Development Setup

This project is optimized for development with GitHub Codespaces.

## Quick Start

1. Open this repository in GitHub Codespaces
2. Setup will run automatically
3. After setup is complete, the following commands are available:

## Available Commands

```bash
# Development mode (TypeScript compile + run)
npm run dev

# Build project
npm run build

# Run built project
npm start

# Code quality check
npm run lint
npm run format:check

# Auto-fix code
npm run lint:fix
npm run format

# All quality checks
npm run quality
```

## Development Environment

### Container Configuration

- **Base Image**: `mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye`
- **Node.js**: v20
- **Included Features**: Git, GitHub CLI

### VS Code Extensions

Automatically installed extensions:
- Prettier - Code formatter
- ESLint - Linter
- TypeScript extensions
- Markdown extensions
- Path IntelliSense
- Auto Rename Tag

### Environment Variables

The following environment variables are set in the development environment:
- `NODE_ENV=development`

## Project Structure

```
.
├── .devcontainer/          # Dev Container configuration
│   ├── devcontainer.json  # Main configuration
│   └── post-create.sh     # Setup script
├── .vscode/               # VS Code configuration
│   ├── settings.json      # Editor settings
│   ├── tasks.json        # Task definitions
│   ├── launch.json       # Debug configuration
│   └── mcp.json          # MCP configuration
├── src/                  # Source code
├── dist/                 # Build output
└── .mcp-data/           # Log data
```

## Debugging

Debug configuration is included:
1. Press F5 or select "Debug MCP Elicitation Server" from the "Run and Debug" panel
2. Set breakpoints and run

## Testing the MCP Server

To test the MCP server locally:

```bash
# Start server
npm start

# Or development mode
npm run dev
```

## Troubleshooting

### If setup fails

```bash
# Manually run setup script
./.devcontainer/post-create.sh
```

### Dependency issues

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build errors

```bash
# Clear TypeScript cache
rm -rf dist/
npx tsc --build --clean
npm run build
```
