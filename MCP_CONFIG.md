# MCP Configuration Examples

## VS Code Configuration

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "mcp-confirm": {
      "type": "stdio",
      "command": "npx",
      "args": ["@mako10k/mcp-confirm"]
    }
  }
}
```

## Claude Desktop Configuration

Add to your Claude Desktop `config.json`:

### Windows
Location: `%APPDATA%\Claude\config.json`

### macOS  
Location: `~/Library/Application Support/Claude/config.json`

### Linux
Location: `~/.config/claude/config.json`

```json
{
  "mcp": {
    "servers": {
      "mcp-confirm": {
        "command": "npx",
        "args": ["@mako10k/mcp-confirm"]
      }
    }
  }
}
```

## Local Installation

If you prefer to install locally instead of using npx:

```bash
npm install -g @mako10k/mcp-confirm
```

Then use:

```json
{
  "mcp": {
    "servers": {
      "mcp-confirm": {
        "command": "@mako10k/mcp-confirm"
      }
    }
  }
}
```

## Development Configuration

For development with local repository:

```json
{
  "mcp": {
    "servers": {
      "mcp-confirm": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "/path/to/mcp-confirm"
      }
    }
  }
}
```
