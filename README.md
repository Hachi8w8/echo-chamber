## プロジェクト構成

```
echo-chamber/
├── app/
│   ├── actions/              # 各機能のサーバーアクション
│   │   └── prompts/          # プロンプトテンプレート保存場所
│   ├── api-test/             # API動作確認ページ
│   ├── perspective/          # パースペクティブ表示ページ
│   ├── result/               # 結果表示ページ  
│   ├── select/               # テーマ選択ページ
│   ├── start/                # スタートページ
│   └── swipe/                # スワイプページ
│
├── components/
│   ├── ui/                   # 基本UIコンポーネント
│   ├── feature/              # 特定の機能UI
│   │   ├── result/
│   │   ├── select/
│   │   ├── start/
│   │   └── swipe/
│   └── ApiTestForm.tsx       # API動作確認フォーム
│
├── lib/
│   ├── vertex-ai/            # Google Cloud AI API連携
│   │   ├── gemini.ts         # Gemini APIクライアント
│   │   └── veo.ts            # Veo APIクライアント
│   ├── auth.ts               # 認証関連
│   ├── utils.ts              # ユーティリティ関数
│   └── hooks/                # カスタムフック
│
├── types/                    # TypeScript型定義
│
├── tmp/                      # 静的ファイル
│   └── videos/               # 生成した動画の保存場所
│
├── docs/                     # プロジェクトドキュメント
│   └── product_overview.md   # プロダクト概要
│
└── key/                      # API認証キー（Gitでは管理しない）
```

## クローンからサーバー立ち上げまでの手順

1. リポジトリをクローンします。

```bash
git clone <リポジトリのURL>
```

2. 依存関係をインストールします。

```bash
npm install
```

3. 開発サーバーを起動します。

```bash
npm run dev
```

4. ブラウザで[http://localhost:3000](http://localhost:3000)にアクセスして、アプリケーションを確認します。
