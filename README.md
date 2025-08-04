# @mako10k/mcp-confirm

AI-ユーザー間の復唱確認プロトコルを実装するMCPサーバーです。LLMが不安になったときに、ユーザーに確認を取るためのツールを提供します。

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

## Installation

```bash
# Install globally
npm install -g @mako10k/mcp-confirm

# Or use with npx
npx @mako10k/mcp-confirm
```

## Configuration

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
        "args": ["@mako10k/mcp-confirm"]
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

## 機能

### 利用可能なツール

1. **ask_yes_no**
   - はい/いいえの確認質問
   - AIが明確化や検証が必要な時に使用

2. **confirm_action**
   - アクション実行前の確認
   - 影響や詳細を含めた確認ダイアログ

3. **clarify_intent**
   - あいまいなリクエストの意図確認
   - 複数の解釈オプションの提示

4. **verify_understanding**
   - AIの理解が正しいかの検証
   - 次のステップの確認

5. **collect_rating**
   - ユーザー満足度の収集
   - AIの回答品質の評価

6. **elicit_custom**
   - カスタム確認ダイアログ
   - 独自のJSONスキーマを使用

## セットアップ

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 実行（グローバルインストール後）
npm install -g @mako10k/mcp-confirm
mcp-confirm

# または npx で直接実行
npx @mako10k/mcp-confirm
```

## VS Code統合

`.vscode/mcp.json`でMCPクライアントとして設定済み：

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

## 使用例

### 基本的な確認
```javascript
// AIがアクションを実行する前
await confirm_action({
  action: "ファイルを削除",
  impact: "復元できません",
  details: "10個のファイルが削除されます"
});
```

### 意図の確認
```javascript
// あいまいなリクエストの場合
await clarify_intent({
  request_summary: "プロジェクトを作成したい",
  ambiguity: "どの種類のプロジェクトか不明",
  options: ["Node.js プロジェクト", "Python プロジェクト", "React アプリ"]
});
```

### 理解の検証
```javascript
// 複雑なタスクの前
await verify_understanding({
  understanding: "Webアプリケーションを作成して、ユーザー認証を実装する",
  key_points: ["React + Node.js", "JWT認証", "PostgreSQLデータベース"],
  next_steps: "プロジェクト構造を作成してから認証システムを実装"
});
```

## 技術仕様

- **プロトコル**: Model Context Protocol Elicitation
- **言語**: TypeScript
- **ランタイム**: Node.js
- **SDKバージョン**: @modelcontextprotocol/sdk ^1.0.0

## プロトコルの仕組み

このサーバーは真のMCP Elicitationプロトコルを実装しており：

1. `elicitation/create`メソッドでクライアントにリクエスト送信
2. JSONスキーマでユーザー入力の構造を定義
3. ユーザーは`accept`、`decline`、`cancel`で応答
4. `accept`の場合、スキーマに従った構造化データを受信

これにより、AIとユーザー間の確実な意思疎通が可能になります。
