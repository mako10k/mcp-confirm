# @mako10k/mcp-confirm

An MCP server that implements confirmation protocols between AI and users. It provides tools for LLMs to request user confirmation when they need clarification or verification.

<a href="https://glama.ai/mcp/servers/@mako10k/mcp-confirm">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@mako10k/mcp-confirm/badge" alt="MCP-Confirm MCP server" />
</a>

# @mako10k/mcp-confirm

A Model Context Protocol (MCP) server for AI-user confirmation and clarification. This server provides tools for AI assistants (LLMs) to ask users for confirmation when they need clarification or verification.

## Overview

This MCP server implements the [Model Context Protocol Elicitation specification](https://modelcontextprotocol.io/specification/draft/client/elicitation) to enable confirmation and clarification protocols between AI assistants and users.

AI assistants can use this in situations such as:
- Confirming actions before execution
- Clarifying ambiguous requests
- Verifying understanding is correct
- Asking yes/no questions
- Collecting user satisfaction ratings

## Features

### Available Tools

1. **ask_yes_no**
   - Ask yes/no confirmation questions
   - Used when AI needs clarification or verification

2. **confirm_action**
   - Confirm actions before execution
   - Includes impact and details in confirmation dialog

3. **clarify_intent**
   - Clarify ambiguous requests
   - Present multiple interpretation options

4. **verify_understanding**
   - Verify AI's understanding is correct
   - Confirm next steps before proceeding

5. **collect_rating**
   - Collect user satisfaction ratings
   - Evaluate AI response quality

6. **elicit_custom**
   - Custom confirmation dialogs
   - Use custom JSON schemas

7. **search_logs**
   - Search confirmation history logs
   - Filter by type, success status, date range, response time
   - Paginated results for large datasets

8. **analyze_logs**
   - Statistical analysis of confirmation history
   - Success rates, response times, trends
   - Grouping by type, time period, etc.

## Installation

```bash
# Install globally
npm install -g @mako10k/mcp-confirm

# Or use with npx
npx @mako10k/mcp-confirm
```

## Development with GitHub Codespaces

This project supports development with GitHub Codespaces:

1. Open this repository on GitHub
2. Click the "Code" button
3. Select the "Codespaces" tab
4. Click "Create codespace on main"
5. The development environment will be set up automatically

For details, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Configuration

### Environment Variables

You can configure the server using environment variables:

- `MCP_CONFIRM_LOG_PATH`: Path to confirmation history log file (default: `.mcp-data/confirmation_history.log`)
- `MCP_CONFIRM_TIMEOUT_MS`: Default timeout for confirmations in milliseconds (default: `180000` = 3 minutes)
  - Minimum: `5000` (5 seconds)
  - Maximum: `1800000` (30 minutes)
  - Invalid values will fall back to default with warning
- `NODE_ENV`: Set to `development` to enable debug logging

### Timeout Configuration Examples

```bash
# Use 5-minute timeout
export MCP_CONFIRM_TIMEOUT_MS=300000

# Use 1-minute timeout  
export MCP_CONFIRM_TIMEOUT_MS=60000

# Use 10-second timeout (minimum enforced)
export MCP_CONFIRM_TIMEOUT_MS=10000
```

### Timeout Behavior

The server uses intelligent timeout settings based on confirmation type:

- **Critical actions** (delete, remove operations): 120 seconds
- **Warning actions**: 90 seconds  
- **Simple yes/no questions**: 30 seconds
- **Rating requests**: 20 seconds (reference only)
- **Other confirmations**: 60 seconds (default)

### Confirmation History Logging

All confirmation interactions are logged to a file for audit purposes. The log includes:

- Timestamp of the request
- Confirmation type
- Full request and response data
- Response time in milliseconds
- Success/failure status
- Error messages (if any)

The log directory (`.mcp-data/`) will be created automatically if it doesn't exist.

### VS Code Integration

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

### Claude Desktop Configuration

Add to your Claude Desktop `config.json`:

#### Windows
Location: `%APPDATA%\Claude\config.json`

#### macOS  
Location: `~/Library/Application Support/Claude/config.json`

#### Linux
Location: `~/.config/claude/config.json`

```json
{
  "mcp": {
    "servers": {
      "mcp-confirm": {
        "command": "npx",
        "args": ["@mako10k/mcp-confirm"],
        "env": {
          "MCP_CONFIRM_LOG_PATH": "~/.mcp-data/confirmation_history.log",
          "MCP_CONFIRM_TIMEOUT_MS": "60000",
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

## Usage Examples

### Basic Confirmation
```javascript
// Before AI executes an action
await confirm_action({
  action: "Delete files",
  impact: "Cannot be restored",
  details: "10 files will be deleted"
});
```

### Intent Clarification
```javascript
// When request is ambiguous
await clarify_intent({
  request_summary: "Want to create a project",
  ambiguity: "Type of project unclear",
  options: ["Node.js project", "Python project", "React app"]
});
```

### Understanding Verification
```javascript
// Before complex tasks
await verify_understanding({
  understanding: "Create web application with user authentication",
  key_points: ["React + Node.js", "JWT authentication", "PostgreSQL database"],
  next_steps: "Create project structure then implement auth system"
});
```

## Technical Specifications

- **Protocol**: Model Context Protocol Elicitation
- **Language**: TypeScript
- **Runtime**: Node.js
- **SDK Version**: @modelcontextprotocol/sdk ^1.0.0

## How It Works

This server implements true MCP Elicitation protocol:

1. Sends `elicitation/create` method to client
2. Defines user input structure with JSON Schema
3. User responds with `accept`, `decline`, or `cancel`
4. On `accept`, receives structured data following schema

This enables reliable communication between AI and users.

## Development

```bash
# Clone repository
git clone https://github.com/mako10k/mcp-confirm.git
cd mcp-confirm

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start

# Quality checks
npm run quality
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Repository

- **GitHub**: https://github.com/mako10k/mcp-confirm
- **npm**: https://www.npmjs.com/package/@mako10k/mcp-confirm
