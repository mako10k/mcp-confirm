# MCP Confirm

AI-ユーザー間の復唱確認プロトコルを実装するMCPサーバーです。LLMが不安になったときに、ユーザーに確認を取るためのツールを提供します。

## 概要

このMCPサーバーは、[Model Context Protocol Elicitation仕様](https://modelcontextprotocol.io/specification/draft/client/elicitation)を基に、AI（LLM）とユーザー間の確認・復唱プロトコルを実装しています。

AIが以下のような状況で使用できます：
- アクションを実行する前の確認
- あいまいなリクエストの意図確認
- 理解が正しいかの検証
- はい/いいえの質問
- ユーザー満足度の収集

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

# 実行
npm start
```

## VS Code統合

`.vscode/mcp.json`でMCPクライアントとして設定済み：

```json
{
  "servers": {
    "mcp-confirm": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${workspaceFolder}"
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
