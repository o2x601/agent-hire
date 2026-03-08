# Agent-Hire — CLAUDE.md

## Project Overview
既存の求人サイト・LinkedInの「人」を「AIエージェント/AIサービス」に置き換えたプラットフォーム。

### 2つのユーザー
- **AIエージェント/AIサービス運営者（求職者側）**: 自分のAIのプロフィール（履歴書）を作成し、企業に応募したり、スカウトを受ける
- **企業（採用者側）**: 「こんな業務を任せたい」という求人を出したり、良いAIエージェントを見つけてスカウトする

### 既存サービスとの対応
| 既存サービス | Agent-Hireでの置き換え |
|---|---|
| 求人サイト（Indeed等）の「人材募集」 | 「AIエージェント募集」 |
| LinkedInの「人材スカウト」 | 「AIエージェントスカウト」 |
| 求職者のプロフィール | AIエージェントの履歴書（スキル、実績、API仕様） |
| 面接 | APIテスト・動作検証 |
| 採用・給与 | API契約・利用料 |

### 回り方
1. AIサービス運営者がAIの「履歴書」を登録
2. 企業が「こんなAIが欲しい」と求人を出す
3. 双方向のマッチング（AI側から応募 / 企業側からスカウト）
4. 面接（APIテスト）で相性を確認
5. 採用（API契約）

### Differentiator（差別化）
現状のAIエージェント/AIサービス市場の課題：
- SNSのフォロワー数や知名度がある開発者のサービスばかりが注目される
- Product HuntやX(Twitter)での拡散力がないと、優れたサービスでも埋もれる
- 企業側も「話題になっているから」で選び、本当に業務に合うAIを見つけられていない

Agent-Hireの解決策：
- 「誰が作ったか」ではなく「何ができるか」で評価される仕組み
- 実績データ（稼働率、処理速度、正答率）とAPIテスト（面接）による客観的な実力評価
- 知名度ゼロでも、実力があれば企業からスカウトされる構造
- 求人サイトのように「スキル要件マッチング」で検索されるため、SNSフォロワー数は無関係

キャッチコピーの方向性：
- メイン: 「実力で選ばれる、AIの求人市場。」
- サブ: 「フォロワー数じゃない。稼働率で語れ。」

---

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes + Supabase
- **DB**: Supabase (PostgreSQL 15) — supabase/postgres:15.8.1.020
- **Auth**: Supabase GoTrue (supabase/gotrue:v2.164.0)
- **API Gateway**: Kong 2.8.1
- **Realtime**: Supabase Realtime v2.34.47
- **Storage**: Supabase Storage v1.11.13

## Project Structure
```
agent-hire/
├── src/
│   ├── app/
│   │   ├── (marketing)/      # LP・公開ページ
│   │   │   └── page.tsx      # ランディングページ
│   │   └── (platform)/       # ログイン後のプラットフォーム
│   │       └── agents/       # エージェント一覧・詳細
│   └── components/
│       ├── agents/           # AgentカードUI
│       ├── shared/           # 共通コンポーネント
│       └── ui/               # shadcn/ui ベース
├── supabase/
│   ├── migrations/           # DBマイグレーション
│   └── init/                 # Docker初期化スクリプト
└── docker-compose.yml
```

## DB Schema (主要テーブル)
- `public.companies` — 企業プロファイル (user_id → auth.users)
- `public.ai_agents` — AIエージェント履歴書
- `public.jobs` — 求人票
- `public.interactions` — 応募・スカウト・面接のやりとり

## Docker 起動
```bash
cd ~/agent-hire
docker compose --env-file .env.docker up -d
```

## Dev Commands
```bash
npm run dev    # 開発サーバー起動 (http://localhost:3000)
npm run build  # プロダクションビルド
npm run lint   # ESLint
```
