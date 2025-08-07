# Development Setup

このプロジェクトはGitHub Codespacesでの開発に最適化されています。

## Quick Start

1. GitHub Codespacesでこのリポジトリを開く
2. 自動的にセットアップが実行されます
3. セットアップ完了後、以下のコマンドが使用可能です：

## Available Commands

```bash
# 開発モード（TypeScriptコンパイル + 実行）
npm run dev

# プロジェクトをビルド
npm run build

# ビルド済みプロジェクトを実行
npm start

# コード品質チェック
npm run lint
npm run format:check

# コード自動修正
npm run lint:fix
npm run format

# 全品質チェック
npm run quality
```

## Development Environment

### Container Configuration

- **Base Image**: `mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye`
- **Node.js**: v20
- **包含機能**: Git, GitHub CLI

### VS Code Extensions

自動的にインストールされる拡張機能：
- Prettier - コードフォーマッター
- ESLint - リンター
- TypeScript拡張
- Markdown拡張
- Path IntelliSense
- Auto Rename Tag

### Environment Variables

開発環境では以下の環境変数が設定されます：
- `NODE_ENV=development`

## Project Structure

```
.
├── .devcontainer/          # Dev Container設定
│   ├── devcontainer.json  # メイン設定
│   └── post-create.sh     # セットアップスクリプト
├── .vscode/               # VS Code設定
│   ├── settings.json      # エディタ設定
│   ├── tasks.json        # タスク定義
│   ├── launch.json       # デバッグ設定
│   └── mcp.json          # MCP設定
├── src/                  # ソースコード
├── dist/                 # ビルド出力
└── .mcp-data/           # ログデータ
```

## Debugging

デバッグ設定が含まれています：
1. F5キーまたは「Run and Debug」パネルから「Debug MCP Elicitation Server」を選択
2. ブレークポイントを設定して実行

## Testing the MCP Server

ローカルでMCPサーバーをテストする場合：

```bash
# サーバーを起動
npm start

# または開発モード
npm run dev
```

## Troubleshooting

### セットアップが失敗した場合

```bash
# 手動でセットアップスクリプトを実行
./.devcontainer/post-create.sh
```

### 依存関係の問題

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ビルドエラー

```bash
# TypeScriptキャッシュをクリア
rm -rf dist/
npx tsc --build --clean
npm run build
```
